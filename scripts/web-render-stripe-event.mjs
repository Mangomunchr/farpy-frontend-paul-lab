import { existsSync } from "node:fs";
import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";

const DATA_DIR = process.env.FARPY_WEB_RENDER_DATA_DIR
  ? path.resolve(process.env.FARPY_WEB_RENDER_DATA_DIR)
  : path.resolve("/var/lib/farpy-web-render");
const JOB_DIR = path.resolve(process.env.FARPY_JOB_STORE_DIR || path.join(DATA_DIR, "jobs"));
const STRIPE_EVENT_DIR = path.resolve(process.env.FARPY_WEB_RENDER_STRIPE_EVENT_DIR || path.join(DATA_DIR, "stripe-events"));
const WALLET_DIR = path.resolve(process.env.FARPY_WALLET_STORE_DIR || path.join(DATA_DIR, "wallet"));
const WALLET_TOPUP_AMOUNTS = [1000, 2500, 5000, 10000];

const readStdin = () =>
  new Promise((resolve, reject) => {
    const chunks = [];
    process.stdin.on("data", (chunk) => chunks.push(chunk));
    process.stdin.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    process.stdin.on("error", reject);
  });

const statusMeta = (job) => {
  const outputExists = !!job.output_path && existsSync(job.output_path);
  const receiptExists = !!job.receipt_path && existsSync(job.receipt_path);
  if (job.status === "queued") {
    return {
      status_label: "Queued",
      status_message: job.payment_status === "captured"
        ? "Payment captured. Ready to submit render."
        : "Upload stored. Payment required before render.",
      next_action: job.payment_status === "captured" ? "Start render" : "Pay before render",
      can_start_render: job.payment_status === "captured",
      can_download: false,
      can_view_receipt: false,
    };
  }
  if (job.status === "complete") {
    return {
      status_label: "Complete",
      status_message: "Render complete.",
      next_action: outputExists || receiptExists ? "Download available files" : "No output files available",
      can_start_render: false,
      can_download: outputExists,
      can_view_receipt: receiptExists,
    };
  }
  return {
    can_start_render: false,
    can_download: outputExists,
    can_view_receipt: receiptExists,
  };
};

const walletPath = (userId) => path.join(WALLET_DIR, `${createHash("sha256").update(String(userId)).digest("hex")}.jsonl`);

const readWalletTransactions = async (userId) => {
  const file = walletPath(userId);
  if (!existsSync(file)) return [];
  const raw = await readFile(file, "utf8");
  return raw.split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
};

const appendWalletLedger = async ({ user_id, email, event_id, type, amount_cents, stripe_session_id, payment_intent_id }) => {
  await mkdir(WALLET_DIR, { recursive: true });
  const txns = await readWalletTransactions(user_id);
  if (txns.some((txn) => String(txn.event_id) === String(event_id))) return { duplicate: true };
  if (stripe_session_id && txns.some((txn) => String(txn.stripe_session_id || "") === String(stripe_session_id))) return { duplicate: true };
  const current = txns.length ? Number(txns[txns.length - 1].balance_after_cents || 0) : 0;
  const amount = Number(amount_cents);
  if (!Number.isInteger(amount) || amount < 0) throw new Error("invalid_wallet_amount");
  const transaction = {
    user_id,
    email: email || null,
    event_id,
    type,
    amount_cents: amount,
    balance_after_cents: type === "debit" ? current - amount : current + amount,
    job_id: null,
    stripe_session_id: stripe_session_id || null,
    payment_intent_id: payment_intent_id || null,
    created_at: new Date().toISOString(),
  };
  if (transaction.balance_after_cents < 0) throw new Error("insufficient_balance");
  await appendFile(walletPath(user_id), `${JSON.stringify(transaction)}\n`, "utf8");
  return { duplicate: false, transaction };
};

const main = async () => {
  const raw = await readStdin();
  const event = JSON.parse(raw);
  if (event.type !== "checkout.session.completed") {
    console.log("WEB_RENDER_STRIPE_SKIP type=" + String(event.type || ""));
    return;
  }

  const session = event.data?.object || {};
  const metadata = session.metadata || {};
  if (metadata.purpose === "wallet_topup") {
    if (session.status !== "complete" || session.payment_status !== "paid") {
      throw new Error("session_not_paid_complete");
    }
    const eventId = String(event.id || "");
    if (!/^evt_[A-Za-z0-9_]+$/.test(eventId)) throw new Error("invalid_event_id");
    const userId = String(metadata.user_id || "").trim().toLowerCase();
    const email = String(metadata.email || "").trim().toLowerCase() || null;
    const amount = Number(metadata.amount_cents);
    const actual = Number(session.amount_total);
    if (!userId) throw new Error("missing_user_id");
    if (!WALLET_TOPUP_AMOUNTS.includes(amount) || actual !== amount) throw new Error("amount_mismatch");

    await mkdir(STRIPE_EVENT_DIR, { recursive: true });
    const eventPath = path.join(STRIPE_EVENT_DIR, `${eventId}.json`);
    try {
      await writeFile(eventPath, JSON.stringify({
        event_id: eventId,
        purpose: "wallet_topup",
        user_id: userId,
        checkout_session_id: session.id || null,
        processed_at: new Date().toISOString(),
      }, null, 2), { encoding: "utf8", flag: "wx" });
    } catch (error) {
      if (error?.code === "EEXIST") {
        console.log(`WALLET_STRIPE_DUPLICATE event_id=${eventId} session_id=${session.id || ""}`);
        return;
      }
      throw error;
    }

    const credited = await appendWalletLedger({
      user_id: userId,
      email,
      event_id: eventId,
      type: "credit",
      amount_cents: amount,
      stripe_session_id: session.id || null,
      payment_intent_id: session.payment_intent || null,
    });
    console.log(`WALLET_STRIPE_CREDIT user_id=${userId} session_id=${session.id || ""} amount_cents=${amount} duplicate=${credited.duplicate}`);
    return;
  }
  if (metadata.purpose !== "web_render_job") {
    console.log("WEB_RENDER_STRIPE_SKIP purpose=" + String(metadata.purpose || ""));
    return;
  }
  if (session.status !== "complete" || session.payment_status !== "paid") {
    throw new Error("session_not_paid_complete");
  }

  const jobId = String(metadata.job_id || "");
  if (!/^JOB-[A-Z0-9]+$/.test(jobId)) throw new Error("invalid_job_id");
  const eventId = String(event.id || "");
  if (!/^evt_[A-Za-z0-9_]+$/.test(eventId)) throw new Error("invalid_event_id");
  const jobPath = path.join(JOB_DIR, `${jobId}.json`);
  if (!existsSync(jobPath)) throw new Error("job_not_found");
  console.log(`WEB_RENDER_STRIPE_SESSION_COMPLETED job_id=${jobId} session_id=${session.id || ""}`);

  const job = JSON.parse(await readFile(jobPath, "utf8"));
  const expected = Number(job.price_cents);
  const actual = Number(session.amount_total);
  const metadataPrice = Number(metadata.price_cents);
  if (!Number.isInteger(expected) || expected <= 0) throw new Error("job_missing_price");
  if (actual !== expected || metadataPrice !== expected) throw new Error("amount_mismatch");
  if (String(session.id || "") !== String(job.checkout_session_id || "")) {
    throw new Error("checkout_session_mismatch");
  }

  await mkdir(STRIPE_EVENT_DIR, { recursive: true });
  const eventPath = path.join(STRIPE_EVENT_DIR, `${eventId}.json`);
  try {
    await writeFile(eventPath, JSON.stringify({
      event_id: eventId,
      job_id: jobId,
      checkout_session_id: session.id || null,
      processed_at: new Date().toISOString(),
    }, null, 2), { encoding: "utf8", flag: "wx" });
  } catch (error) {
    if (error?.code === "EEXIST") {
      console.log(`WEB_RENDER_STRIPE_DUPLICATE event_id=${eventId} job_id=${jobId}`);
      return;
    }
    throw error;
  }

  if (job.payment_status === "captured") {
    console.log(`WEB_RENDER_STRIPE_DUPLICATE event_id=${eventId} job_id=${jobId}`);
    return;
  }

  const now = new Date().toISOString();
  job.payment_status = "captured";
  job.payment_intent_id = session.payment_intent || job.payment_intent_id || null;
  job.payment_captured_at = now;
  job.updated_at = now;
  Object.assign(job, statusMeta(job));
  await writeFile(jobPath, JSON.stringify(job, null, 2), "utf8");

  if (job.receipt_path && existsSync(job.receipt_path)) {
    const receipt = JSON.parse(await readFile(job.receipt_path, "utf8"));
    receipt.cost_cents = expected;
    receipt.payment_status = "captured";
    receipt.payment_intent_id = job.payment_intent_id;
    receipt.payment_mode = job.payment_mode || receipt.payment_mode || "direct_checkout";
    receipt.wallet_debit_cents = job.wallet_debit_cents || receipt.wallet_debit_cents || null;
    receipt.balance_after_cents = Number.isInteger(job.balance_after_cents) ? job.balance_after_cents : receipt.balance_after_cents || null;
    await writeFile(job.receipt_path, JSON.stringify(receipt, null, 2), "utf8");
  }

  console.log(`WEB_RENDER_STRIPE_CAPTURED job_id=${jobId} session_id=${job.checkout_session_id}`);
};

main().catch((error) => {
  console.error("WEB_RENDER_STRIPE_FAIL " + (error?.message || error));
  process.exit(1);
});
