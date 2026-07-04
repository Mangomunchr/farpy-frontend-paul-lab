import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const DATA_DIR = process.env.FARPY_WEB_RENDER_DATA_DIR
  ? path.resolve(process.env.FARPY_WEB_RENDER_DATA_DIR)
  : path.resolve("/var/lib/farpy-web-render");
const JOB_DIR = path.resolve(process.env.FARPY_JOB_STORE_DIR || path.join(DATA_DIR, "jobs"));
const STRIPE_SECRET = process.env.STRIPE_SECRET || process.env.STRIPE_SECRET_KEY || "";

const arg = (name) => {
  const index = process.argv.indexOf(name);
  return index === -1 ? "" : String(process.argv[index + 1] || "");
};

const fail = (message) => {
  console.error(`RECONCILE_STRIPE_WEB_RENDER_FAIL ${message}`);
  process.exit(1);
};

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

const updateReceiptCaptured = async (job) => {
  if (!job.receipt_path || !existsSync(job.receipt_path)) return false;
  const receipt = JSON.parse(await readFile(job.receipt_path, "utf8"));
  receipt.cost_cents = job.price_cents;
  receipt.payment_status = "captured";
  receipt.payment_intent_id = job.payment_intent_id;
  await writeFile(job.receipt_path, JSON.stringify(receipt, null, 2), "utf8");
  return true;
};

const main = async () => {
  const sessionId = arg("--session");
  if (!/^cs_(test|live)_[A-Za-z0-9]+/.test(sessionId)) fail("missing_or_invalid_session");
  if (!STRIPE_SECRET) fail("missing_STRIPE_SECRET");

  const response = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, {
    headers: { authorization: `Bearer ${STRIPE_SECRET}` },
  });
  const session = await response.json().catch(() => null);
  if (!response.ok || !session?.id) {
    const status = response.status || "unknown";
    const stripeCode = session?.error?.code || session?.error?.type || "unknown";
    fail(`stripe_session_fetch_failed status=${status} stripe_error=${stripeCode}`);
  }

  const metadata = session.metadata || {};
  if (session.status !== "complete") fail("session_not_complete");
  if (session.payment_status !== "paid") fail("session_not_paid");
  if (metadata.purpose !== "web_render_job") fail("wrong_purpose");

  const jobId = String(metadata.job_id || "");
  if (!/^JOB-[A-Z0-9]+$/.test(jobId)) fail("missing_job_id");
  const jobPath = path.join(JOB_DIR, `${jobId}.json`);
  if (!existsSync(jobPath)) fail("job_not_found");

  const job = JSON.parse(await readFile(jobPath, "utf8"));
  const expected = Number(job.price_cents);
  const actual = Number(session.amount_total);
  if (!Number.isInteger(expected) || expected <= 0) fail("job_missing_price");
  if (actual !== expected) fail(`amount_mismatch expected=${expected} actual=${actual}`);
  if (String(session.id) !== String(job.checkout_session_id || "")) fail("checkout_session_mismatch");

  if (job.payment_status === "captured") {
    console.log(JSON.stringify({
      ok: true,
      result: "already_captured",
      job_id: jobId,
      payment_status: job.payment_status,
      payment_intent_id: job.payment_intent_id,
      can_start_render: statusMeta(job).can_start_render,
    }, null, 2));
    return;
  }

  const now = new Date().toISOString();
  job.payment_status = "captured";
  job.payment_intent_id = session.payment_intent || job.payment_intent_id || null;
  job.payment_captured_at = now;
  job.updated_at = now;
  Object.assign(job, statusMeta(job));
  const receipt_updated = await updateReceiptCaptured(job);
  await writeFile(jobPath, JSON.stringify(job, null, 2), "utf8");

  console.log(`WEB_RENDER_STRIPE_CAPTURED job_id=${jobId} session_id=${session.id}`);
  console.log(JSON.stringify({
    ok: true,
    result: "captured",
    job_id: jobId,
    upload_id: metadata.upload_id || job.upload_id || null,
    checkout_session_id: session.id,
    payment_intent_id: job.payment_intent_id,
    price_cents: job.price_cents,
    amount_total: session.amount_total,
    payment_status: job.payment_status,
    can_start_render: statusMeta(job).can_start_render,
    receipt_updated,
  }, null, 2));
};

main().catch((error) => fail(error?.message || String(error)));
