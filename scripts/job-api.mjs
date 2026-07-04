import { createServer } from "node:http";
import { execFile } from "node:child_process";
import { appendFile, mkdir, readFile, readdir, stat, statfs, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { createReadStream } from "node:fs";
import path from "node:path";
import { createHash, createHmac, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";

const DATA_DIR = process.env.FARPY_WEB_RENDER_DATA_DIR
  ? path.resolve(process.env.FARPY_WEB_RENDER_DATA_DIR)
  : null;
const PORT = Number(process.env.FARPY_WEB_RENDER_PORT || process.env.FARPY_JOB_API_PORT || 19102);
const HOST = process.env.FARPY_WEB_RENDER_HOST || process.env.FARPY_JOB_API_HOST || "127.0.0.1";
const STORE_DIR = path.resolve(process.env.FARPY_JOB_STORE_DIR || (DATA_DIR ? path.join(DATA_DIR, "jobs") : ".farpy-jobs"));
const UPLOAD_DIR = path.resolve(process.env.FARPY_UPLOAD_STORE_DIR || (DATA_DIR ? path.join(DATA_DIR, "uploads") : ".farpy-uploads"));
const OUTPUT_DIR = path.resolve(process.env.FARPY_OUTPUT_STORE_DIR || (DATA_DIR ? path.join(DATA_DIR, "outputs") : ".farpy-outputs"));
const RECEIPT_DIR = path.resolve(process.env.FARPY_RECEIPT_STORE_DIR || (DATA_DIR ? path.join(DATA_DIR, "receipts") : ".farpy-receipts"));
const WALLET_DIR = path.resolve(process.env.FARPY_WALLET_STORE_DIR || (DATA_DIR ? path.join(DATA_DIR, "wallet") : ".farpy-wallet"));
const WORK_DIR = path.resolve(process.env.FARPY_WORK_DIR || (DATA_DIR ? path.join(DATA_DIR, "work") : ".farpy-work"));
const WORKER_STATUS_PATH = path.resolve(process.env.FARPY_WORKER_STATUS_PATH || (DATA_DIR ? path.join(DATA_DIR, "worker-status.json") : ".farpy-worker-status.json"));
const NODE_PAIR_STORE_FILE = process.env.FARPY_NODE_PAIR_STORE_FILE ? path.resolve(process.env.FARPY_NODE_PAIR_STORE_FILE) : "";
const NODE_PAIR_STORE_DIR = path.resolve(process.env.FARPY_NODE_PAIR_STORE_DIR || process.env.FARPY_NODE_STORE_DIR || (DATA_DIR ? path.join(DATA_DIR, "nodes") : ".farpy-nodes"));
const NODE_PAIR_SQLITE = process.env.FARPY_NODE_PAIR_SQLITE ? path.resolve(process.env.FARPY_NODE_PAIR_SQLITE) : "";
const MAX_UPLOAD_MB = Number(process.env.MAX_UPLOAD_MB || process.env.FARPY_MAX_UPLOAD_MB || 100);
const MAX_BODY_BYTES = Number(process.env.FARPY_UPLOAD_MAX_BYTES || MAX_UPLOAD_MB * 1024 * 1024);
const QUEUE_CAP = Number(process.env.FARPY_QUEUE_CAP || 25);
const STRIPE_SECRET = process.env.STRIPE_SECRET || process.env.STRIPE_SECRET_KEY || "";
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";
const BTCPAY_URL = (process.env.BTCPAY_URL || "").replace(/\/+$/, "");
const BTCPAY_PUBLIC_URL = (process.env.BTCPAY_PUBLIC_URL || "").replace(/\/+$/, "");
const BTCPAY_STORE_ID = process.env.BTCPAY_STORE_ID || "";
const BTCPAY_API_KEY = process.env.BTCPAY_API_KEY || "";
const BTCPAY_WEBHOOK_SECRET = process.env.BTCPAY_WEBHOOK_SECRET || "";
const BTCPAY_EVENT_DIR = path.resolve(process.env.FARPY_BTCPAY_EVENT_DIR || (DATA_DIR ? path.join(DATA_DIR, "btcpay-events") : ".farpy-btcpay-events"));
const OPS_TOKEN = process.env.FARPY_OPS_TOKEN || process.env.FARPY_WEB_RENDER_OPS_TOKEN || "";
const PUBLIC_SITE_URL = (process.env.FARPY_PUBLIC_SITE_URL || "https://farpy.com").replace(/\/+$/, "");
const IS_PRODUCTION = process.env.NODE_ENV === "production";
const STRIPE_EVENT_DIR = path.resolve(process.env.FARPY_WEB_RENDER_STRIPE_EVENT_DIR || (DATA_DIR ? path.join(DATA_DIR, "stripe-events") : ".farpy-stripe-events"));
const WALLET_TOPUP_AMOUNTS = [1000, 2500, 5000, 10000];
const LIGHTNING_TOPUP_TIERS = Object.freeze({ usd_1: 100, usd_5: 500, usd_10: 1000 });
const BITCOIN_TOPUP_TIERS = Object.freeze({ usd_10: 1000, usd_25: 2500, usd_50: 5000, usd_100: 10000 });
const BASE_RENDER_TIMEOUT_SECONDS = Number(process.env.FARPY_BASE_RENDER_TIMEOUT_SECONDS || 600);
const PER_FRAME_RENDER_TIMEOUT_SECONDS = Number(process.env.FARPY_PER_FRAME_RENDER_TIMEOUT_SECONDS || 180);
const OPS_ALERT_ACK_PATH = path.resolve(process.env.FARPY_OPS_ALERT_ACK_PATH || (DATA_DIR ? path.join(DATA_DIR, "ops-alert-acks.json") : ".farpy-ops-alert-acks.json"));
const OPS_SUBMITTED_STUCK_MS = Number(process.env.FARPY_OPS_SUBMITTED_STUCK_MS || 5 * 60 * 1000);
const OPS_WORKER_STALE_MS = Number(process.env.FARPY_OPS_WORKER_STALE_MS || 60 * 1000);
const OPS_QUEUE_WARN_THRESHOLD = Number(process.env.FARPY_OPS_QUEUE_WARN_THRESHOLD || Math.max(1, Math.floor(QUEUE_CAP * 0.8)));
const OPS_DISK_WARN_PERCENT = Number(process.env.FARPY_OPS_DISK_WARN_PERCENT || 90);
const OPS_INODE_WARN_PERCENT = Number(process.env.FARPY_OPS_INODE_WARN_PERCENT || 90);

const send = (res, status, body) => {
  const json = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type,x-filename,authorization,x-farpy-node-token,x-farpy-node-id,x-farpy-ops-token,btcpay-sig",
  });
  res.end(json);
};

const sendFile = async (res, job) => {
  const fileStat = await stat(job.output_path);
  res.writeHead(200, {
    "content-type": "application/zip",
    "content-length": fileStat.size,
    "content-disposition": `attachment; filename="${safeName(job.output_filename || "result.zip")}"`,
    "x-farpy-output-sha256": job.output_sha256 || "",
    "x-farpy-job-id": job.job_id,
    "cache-control": "no-store",
  });
  createReadStream(job.output_path).pipe(res);
};

const readRawBody = (req) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    let tooLarge = false;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        tooLarge = true;
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      if (tooLarge) {
        const error = new Error("upload_too_large");
        error.code = "UPLOAD_TOO_LARGE";
        reject(error);
        return;
      }
      resolve(Buffer.concat(chunks));
    });
    req.on("error", reject);
  });

const validateOriginalName = (name) => {
  const raw = String(name || "");
  if (
    !raw
    || raw.includes("\0")
    || /[\x00-\x1F\x7F]/.test(raw)
    || raw.includes("../")
    || raw.includes("..\\")
    || raw.includes("/")
    || raw.includes("\\")
  ) {
    return false;
  }
  return true;
};

const safeName = (name) => {
  if (!validateOriginalName(name)) return "";
  const base = path.basename(String(name || "upload.blend")).replace(/[^\w.\- ]+/g, "_").trim();
  return base || "upload.blend";
};

const inferRenderer = (filename, renderer) => {
  if (renderer === "octane" || /\.orbx$/i.test(filename)) return "octane";
  return "blender";
};

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const secretToken = () => randomBytes(32).toString("hex");
const safeTokenEqual = (a, b) => {
  const left = Buffer.from(String(a || ""));
  const right = Buffer.from(String(b || ""));
  return left.length > 0 && left.length === right.length && timingSafeEqual(left, right);
};
const validUploadName = (filename) => /\.(blend|orbx)$/i.test(filename);

const parseCookies = (header) => {
  const out = {};
  for (const part of String(header || "").split(";")) {
    const index = part.indexOf("=");
    if (index === -1) continue;
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (!key) continue;
    try {
      out[key] = decodeURIComponent(value);
    } catch {
      out[key] = value;
    }
  }
  return out;
};

const authFromRequest = (req) => {
  const user = String(parseCookies(req.headers.cookie).farpy_user || "").trim().toLowerCase();
  if (!user) return {};
  return {
    user_id: user,
    email: user.includes("@") ? user : null,
  };
};

const requireAuth = (req) => {
  const auth = authFromRequest(req);
  return auth.user_id ? { ok: true, ...auth } : { ok: false, status: 401, error: "auth_required" };
};

const isAuthenticatedOwner = (req, job) => {
  const auth = authFromRequest(req);
  const ownerId = String(job?.user_id || "").trim().toLowerCase();
  return !!auth.user_id && !!ownerId && auth.user_id === ownerId;
};

const jobPath = (jobId) => path.join(STORE_DIR, `${jobId}.json`);
const walletPath = (userId) => path.join(WALLET_DIR, `${createHash("sha256").update(String(userId)).digest("hex")}.jsonl`);
const uploadPath = (uploadId, filename) => {
  const ext = path.extname(safeName(filename)).toLowerCase();
  return path.join(UPLOAD_DIR, `${uploadId}${ext === ".orbx" ? ".orbx" : ".blend"}`);
};
const outputPath = (outputId, filename) => path.join(OUTPUT_DIR, `${outputId}-${safeName(filename)}`);
const receiptPath = (receiptId) => path.join(RECEIPT_DIR, `${receiptId}.json`);

const frameContract = (body = {}, fallback = {}) => {
  const frameCount = Number(body.frame_count ?? body.frames_to_render ?? fallback.frame_count ?? 1);
  const frameStart = Number(body.frame_start ?? fallback.frame_start ?? 1);
  const frameEnd = Number(body.frame_end ?? fallback.frame_end ?? (Number.isInteger(frameCount) ? frameStart + frameCount - 1 : 1));
  if (
    !Number.isInteger(frameStart)
    || !Number.isInteger(frameEnd)
    || !Number.isInteger(frameCount)
    || frameStart < 1
    || frameEnd < frameStart
    || frameCount < 1
    || frameCount > 100000
    || frameEnd - frameStart + 1 !== frameCount
  ) {
    return null;
  }
  return { frame_start: frameStart, frame_end: frameEnd, frame_count: frameCount };
};

const priceMatchesFrameContract = (price, frames) =>
  price === frames.frame_count || price === frames.frame_count * 2;

const renderTimeoutForFrames = (frameCount) => {
  const frames = Number.isInteger(frameCount) && frameCount > 0 ? frameCount : 1;
  const seconds = BASE_RENDER_TIMEOUT_SECONDS + PER_FRAME_RENDER_TIMEOUT_SECONDS * frames;
  return {
    render_timeout_seconds: seconds,
    render_timeout_ms: seconds * 1000,
    render_timeout_policy: {
      base_timeout_seconds: BASE_RENDER_TIMEOUT_SECONDS,
      per_frame_timeout_seconds: PER_FRAME_RENDER_TIMEOUT_SECONDS,
      frame_count: frames,
    },
  };
};

const loadJob = async (jobId) => {
  const file = jobPath(jobId);
  if (!existsSync(file)) return null;
  return JSON.parse(await readFile(file, "utf8"));
};

const listJobs = async () => {
  await mkdir(STORE_DIR, { recursive: true });
  const { readdir } = await import("node:fs/promises");
  const files = (await readdir(STORE_DIR)).filter((name) => name.endsWith(".json"));
  const jobs = [];
  for (const file of files) {
    try {
      jobs.push(JSON.parse(await readFile(path.join(STORE_DIR, file), "utf8")));
    } catch (error) {
      console.error("job_read_failed", file, error);
    }
  }
  return jobs;
};

const queueCounts = async () => {
  const jobs = await listJobs();
  const submitted = jobs.filter((job) => job.status === "submitted").length;
  const running = jobs.filter((job) => job.status === "running").length;
  return { submitted, running, queued: submitted + running };
};

const ensureQueueRoom = async () => {
  const counts = await queueCounts();
  return counts.queued >= QUEUE_CAP
    ? { ok: false, status: 429, error: "queue_full", counts }
    : { ok: true, counts };
};

const saveJob = async (job) => {
  await mkdir(STORE_DIR, { recursive: true });
  Object.assign(job, statusMeta(job));
  await writeFile(jobPath(job.job_id), JSON.stringify(job, null, 2), "utf8");
};

const readWalletTransactions = async (userId) => {
  const file = walletPath(userId);
  if (!existsSync(file)) return [];
  const raw = await readFile(file, "utf8");
  return raw
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
};

const walletBalance = async (userId) => {
  const txns = await readWalletTransactions(userId);
  return txns.length ? Number(txns[txns.length - 1].balance_after_cents || 0) : 0;
};

const publicWalletTransactions = (txns) => txns.slice(-25).reverse().map((txn) => ({
  event_id: txn.event_id,
  type: txn.type,
  amount_cents: txn.amount_cents,
  balance_after_cents: txn.balance_after_cents,
  job_id: txn.job_id || null,
  stripe_session_id: txn.stripe_session_id || null,
  payment_intent_id: txn.payment_intent_id || null,
  lightning_invoice_id: txn.lightning_invoice_id || null,
  payment_hash: txn.payment_hash || null,
  wallet_event_id: txn.wallet_event_id || txn.event_id || null,
  source: txn.source || null,
  created_at: txn.created_at,
}));

const publicAccountRenders = async (userId) => {
  const jobs = await listJobs();
  return jobs
    .filter((job) => String(job.user_id || "").toLowerCase() === String(userId || "").toLowerCase())
    .sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")))
    .slice(0, 25)
    .map((job) => ({
      job_id: job.job_id,
      upload_id: job.upload_id,
      filename: job.filename,
      status: job.status,
      status_label: statusMeta(job).status_label,
      price_cents: job.price_cents,
      payment_status: job.payment_status,
      payment_mode: job.payment_mode || null,
      created_at: job.created_at,
      completed_at: job.completed_at,
      can_download: !!job.output_path && existsSync(job.output_path),
      can_view_receipt: !!job.receipt_path && existsSync(job.receipt_path),
      download_url: job.output_path && existsSync(job.output_path)
        ? `/node/v1/web-render/jobs/${encodeURIComponent(job.job_id)}/download?token=${encodeURIComponent(job.download_token || "")}`
        : null,
      receipt_url: job.receipt_path && existsSync(job.receipt_path)
        ? `/node/v1/web-render/jobs/${encodeURIComponent(job.job_id)}/receipt?token=${encodeURIComponent(job.receipt_token || "")}`
        : null,
    }));
};

const countRenderedPngs = async (job) => {
  const frameCount = Number.isInteger(job.frame_count) && job.frame_count > 0 ? job.frame_count : 1;
  const candidates = [
    path.join(WORK_DIR, job.job_id, "output"),
    job.work_dir ? path.join(job.work_dir, "output") : null,
  ].filter(Boolean);
  for (const dir of candidates) {
    try {
      const entries = await readdir(dir, { withFileTypes: true });
      const count = entries.filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".png")).length;
      return Math.min(frameCount, count);
    } catch {
      // Try the next known work directory shape.
    }
  }
  if (job.status === "complete" && Number.isInteger(job.rendered_file_count)) {
    return Math.min(frameCount, Number(job.rendered_file_count));
  }
  if (Number.isInteger(job.rendered_frame_count)) {
    return Math.min(frameCount, Math.max(0, Number(job.rendered_frame_count)));
  }
  return null;
};

const withProgress = async (job) => {
  const frameCount = Number.isInteger(job.frame_count) && job.frame_count > 0 ? job.frame_count : 1;
  const counted = job.status === "running" || job.status === "complete"
    ? await countRenderedPngs(job)
    : null;
  const renderedFrameCount = counted == null ? null : Math.min(frameCount, Math.max(0, counted));
  return {
    ...job,
    frame_count: frameCount,
    rendered_frame_count: renderedFrameCount,
    progress_percent: renderedFrameCount == null ? null : Math.min(100, Math.max(0, Math.round((renderedFrameCount / frameCount) * 100))),
  };
};

const appendWalletLedger = async ({
  user_id,
  email,
  event_id,
  type,
  amount_cents,
  job_id = null,
  stripe_session_id = null,
  payment_intent_id = null,
  lightning_invoice_id = null,
  payment_hash = null,
  source = null,
}) => {
  await mkdir(WALLET_DIR, { recursive: true });
  const txns = await readWalletTransactions(user_id);
  if (txns.some((txn) => String(txn.event_id) === String(event_id))) {
    return { ok: true, duplicate: true, transaction: txns.find((txn) => String(txn.event_id) === String(event_id)) };
  }
  if (stripe_session_id && txns.some((txn) => String(txn.stripe_session_id || "") === String(stripe_session_id))) {
    return { ok: true, duplicate: true, transaction: txns.find((txn) => String(txn.stripe_session_id || "") === String(stripe_session_id)) };
  }
  if (lightning_invoice_id && txns.some((txn) => String(txn.lightning_invoice_id || "") === String(lightning_invoice_id))) {
    return { ok: true, duplicate: true, transaction: txns.find((txn) => String(txn.lightning_invoice_id || "") === String(lightning_invoice_id)) };
  }
  const amount = Number(amount_cents);
  if (!Number.isInteger(amount) || amount < 0) throw new Error("invalid_wallet_amount");
  const current = txns.length ? Number(txns[txns.length - 1].balance_after_cents || 0) : 0;
  const delta = type === "debit" ? -amount : amount;
  const balance_after_cents = current + delta;
  if (balance_after_cents < 0) {
    const error = new Error("insufficient_balance");
    error.code = "INSUFFICIENT_BALANCE";
    throw error;
  }
  const transaction = {
    user_id,
    email: email || null,
    event_id,
    type,
    amount_cents: amount,
    balance_after_cents,
    job_id,
    stripe_session_id,
    payment_intent_id,
    lightning_invoice_id,
    payment_hash,
    wallet_event_id: event_id,
    source,
    created_at: new Date().toISOString(),
  };
  await appendFile(walletPath(user_id), `${JSON.stringify(transaction)}\n`, "utf8");
  return { ok: true, duplicate: false, transaction };
};

const hasDeliveryArtifact = (job) =>
  Boolean(
    (job?.output_path && existsSync(job.output_path))
    || (job?.receipt_path && existsSync(job.receipt_path))
  );

const refundFailedWalletDebit = async (job) => {
  if (!job || job.status !== "failed") return null;
  if (!job.user_id) return null;
  const amount = Number(job.wallet_debit_cents || 0);
  if (!Number.isInteger(amount) || amount <= 0) return null;
  if (job.payment_mode && job.payment_mode !== "wallet") return null;
  if (hasDeliveryArtifact(job)) return null;

  const eventId = `wallet-refund-${job.job_id}`;
  const existing = await readWalletTransactions(job.user_id);
  const already = existing.find((txn) => String(txn.event_id) === eventId);
  if (already) {
    job.wallet_refund_cents = already.amount_cents;
    job.wallet_refund_event_id = already.event_id;
    job.wallet_refunded_at = already.created_at;
    job.balance_after_cents = already.balance_after_cents;
    job.payment_status = "refunded";
    job.payment_refunded_at = job.payment_refunded_at || already.created_at;
    return already;
  }

  const refund = await appendWalletLedger({
    user_id: job.user_id,
    email: job.email || null,
    event_id: eventId,
    type: "refund",
    amount_cents: amount,
    job_id: job.job_id,
    source: "failed_web_render_no_delivery",
  });
  job.wallet_refund_cents = refund.transaction.amount_cents;
  job.wallet_refund_event_id = refund.transaction.event_id;
  job.wallet_refunded_at = refund.transaction.created_at;
  job.balance_after_cents = refund.transaction.balance_after_cents;
  job.payment_status = "refunded";
  job.payment_refunded_at = refund.transaction.created_at;
  return refund.transaction;
};

const saveUpload = async ({ filename, bytes }) => {
  await mkdir(UPLOAD_DIR, { recursive: true });
  const uploadId = `UP-${randomUUID().slice(0, 8).toUpperCase()}`;
  const storedPath = uploadPath(uploadId, filename);
  await writeFile(storedPath, bytes);
  return {
    upload_id: uploadId,
    filename,
    size_bytes: bytes.length,
    sha256: sha256(bytes),
    stored_path: storedPath,
  };
};

const saveOutput = async ({ filename, bytes }) => {
  await mkdir(OUTPUT_DIR, { recursive: true });
  const outputId = `OUT-${randomUUID().slice(0, 8).toUpperCase()}`;
  const storedPath = outputPath(outputId, filename);
  await writeFile(storedPath, bytes);
  return {
    output_id: outputId,
    output_filename: safeName(filename),
    output_path: storedPath,
    output_sha256: sha256(bytes),
    output_size_bytes: bytes.length,
    output_attached_at: new Date().toISOString(),
  };
};

const saveReceipt = async (job) => {
  await mkdir(RECEIPT_DIR, { recursive: true });
  const receiptId = `RID-${randomUUID().slice(0, 8).toUpperCase()}`;
  const now = new Date().toISOString();
  const captured = job.payment_status === "captured";
  const receipt = {
    receipt_id: receiptId,
    job_id: job.job_id,
    upload_id: job.upload_id,
    output_id: job.output_id,
    filename: job.filename,
    output_filename: job.output_filename,
    input_sha256: job.upload?.sha256 || null,
    output_sha256: job.output_sha256,
    output_size_bytes: job.output_size_bytes,
    renderer: job.renderer,
    status: job.status,
    frame_start: job.frame_start || 1,
    frame_end: job.frame_end || job.frame_count || 1,
    frame_count: job.frame_count || 1,
    rendered_file_count: job.rendered_file_count || 0,
    created_at: job.created_at,
    receipt_created_at: now,
    cost_cents: captured && Number.isInteger(job.price_cents) ? job.price_cents : 0,
    payment_status: captured ? "captured" : "not_charged",
    payment_intent_id: captured ? job.payment_intent_id || null : null,
    payment_mode: job.payment_mode || (job.wallet_debit_cents ? "wallet" : "direct_checkout"),
    wallet_debit_cents: job.wallet_debit_cents || null,
    balance_after_cents: Number.isInteger(job.balance_after_cents) ? job.balance_after_cents : null,
    payout_status: "not_applicable_dev",
  };
  const storedPath = receiptPath(receiptId);
  await writeFile(storedPath, JSON.stringify(receipt, null, 2), "utf8");
  return {
    receipt,
    receipt_id: receiptId,
    receipt_path: storedPath,
    receipt_created_at: now,
  };
};

const createJob = async (body) => {
  const filename = typeof body.filename === "string" && body.filename.trim()
    ? safeName(body.filename)
    : "untitled.blend";
  const renderer = inferRenderer(filename, body.renderer);
  const frames = frameContract(body);
  if (!frames) throw new Error("invalid_frame_range");
  const now = new Date().toISOString();
  const job = {
    ok: true,
    job_id: `JOB-${randomUUID().slice(0, 8).toUpperCase()}`,
    upload_id: body.upload_id || null,
    filename,
    renderer,
    status: "queued",
    ...frames,
    price_cents: Number.isInteger(body.price_cents) ? body.price_cents : null,
    payment_status: Number.isInteger(body.price_cents) ? "priced" : "unpriced",
    payment_intent_id: null,
    payment_authorized_at: null,
    payment_captured_at: null,
    payment_failed_at: null,
    payment_mode: body.payment_mode || null,
    wallet_debit_cents: null,
    balance_after_cents: null,
    download_token: body.download_token || secretToken(),
    receipt_token: body.receipt_token || secretToken(),
    created_at: now,
    updated_at: now,
    upload: body.upload || null,
    user_id: body.user_id || null,
    email: body.email || null,
    nodemuncher_smoke: body.nodemuncher_smoke === true ? true : undefined,
  };
  await saveJob(job);
  return job;
};

const statusMeta = (job) => {
  const outputExists = !!job.output_path && existsSync(job.output_path);
  const receiptExists = !!job.receipt_path && existsSync(job.receipt_path);
  const paymentCaptured = job.payment_status === "captured";
  const hasAuthenticatedWallet = !!job.user_id && Number.isInteger(job.price_cents) && job.price_cents > 0;

  if (job.status === "submitted") {
    return {
      status_label: "Submitted",
      status_message: "Render request accepted. Waiting for worker.",
      next_action: "Waiting for worker",
      can_start_render: false,
      can_download: false,
      can_view_receipt: false,
    };
  }
  if (job.status === "running") {
    return {
      status_label: "Running",
      status_message: "Render running.",
      next_action: "Wait for render",
      can_start_render: false,
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
  if (job.status === "failed") {
    return {
      status_label: "Failed",
      status_message: "Render failed. No charge should finalize without receipt.",
      next_action: "Review render",
      can_start_render: false,
      can_download: false,
      can_view_receipt: false,
    };
  }
  return {
    status_label: "Queued",
    status_message: paymentCaptured
      ? "Payment captured. Ready to submit render."
      : hasAuthenticatedWallet
        ? "Upload stored. Wallet balance will be charged when render starts."
      : "Upload stored. Payment required before render.",
    next_action: paymentCaptured || hasAuthenticatedWallet ? "Start render" : "Pay before render",
    can_start_render: paymentCaptured || hasAuthenticatedWallet,
    can_download: false,
    can_view_receipt: false,
  };
};

const publicJob = (job, options = {}) => {
  const payload = {
    ok: true,
    job_id: job.job_id,
    upload_id: job.upload_id,
    status: job.status,
    ...statusMeta(job),
    created_at: job.created_at,
    submitted_at: job.submitted_at,
    updated_at: job.updated_at,
    filename: job.filename,
    renderer: job.renderer,
    render_request_id: job.render_request_id,
    started_at: job.started_at,
    completed_at: job.completed_at,
    engine: job.engine,
    render_seconds: job.render_seconds,
    failure_reason: job.failure_reason,
    failed_at: job.failed_at,
    blender_exit_code: job.blender_exit_code,
    render_started_at: job.render_started_at,
    render_completed_at: job.render_completed_at,
    output_files: job.output_files,
    frame_start: job.frame_start || 1,
    frame_end: job.frame_end || job.frame_count || 1,
    frame_count: job.frame_count || 1,
    rendered_frame_count: Number.isInteger(job.rendered_frame_count) ? job.rendered_frame_count : null,
    rendered_file_count: job.rendered_file_count || 0,
    progress_percent: Number.isInteger(job.progress_percent) ? job.progress_percent : null,
    render_timeout_seconds: job.render_timeout_seconds,
    render_timeout_ms: job.render_timeout_ms,
    render_timeout_policy: job.render_timeout_policy,
    price_cents: job.price_cents,
    payment_status: job.payment_status || "unpriced",
    payment_intent_id: job.payment_intent_id,
    checkout_session_id: job.checkout_session_id,
    checkout_created_at: job.checkout_created_at,
    payment_authorized_at: job.payment_authorized_at,
    payment_captured_at: job.payment_captured_at,
    payment_failed_at: job.payment_failed_at,
    payment_mode: job.payment_mode,
    wallet_debit_cents: job.wallet_debit_cents,
    wallet_refund_cents: job.wallet_refund_cents,
    wallet_refund_event_id: job.wallet_refund_event_id,
    wallet_refunded_at: job.wallet_refunded_at,
    balance_after_cents: job.balance_after_cents,
    output_id: job.output_id,
    output_filename: job.output_filename,
    output_sha256: job.output_sha256,
    output_size_bytes: job.output_size_bytes,
    output_attached_at: job.output_attached_at,
    receipt_id: job.receipt_id,
    receipt_created_at: job.receipt_created_at,
  };
  if (options.includePrivateUrls) {
    payload.download_url = job.output_path && existsSync(job.output_path)
      ? `/node/v1/web-render/jobs/${encodeURIComponent(job.job_id)}/download?token=${encodeURIComponent(job.download_token || "")}`
      : null;
    payload.receipt_url = job.receipt_path && existsSync(job.receipt_path)
      ? `/node/v1/web-render/jobs/${encodeURIComponent(job.job_id)}/receipt?token=${encodeURIComponent(job.receipt_token || "")}`
      : null;
  }
  return payload;
};

const publicJobSafeStatus = (job) => ({
  ok: true,
  job_id: job.job_id,
  status: job.status,
  renderer: job.renderer,
  frame_start: job.frame_start || 1,
  frame_end: job.frame_end || job.frame_count || 1,
  frame_count: job.frame_count || 1,
  created_at: job.created_at,
  submitted_at: job.submitted_at,
  updated_at: job.updated_at,
  completed_at: job.completed_at,
});

const ensureUploadedFile = (job) => {
  if (!job.upload_id) return { ok: false, status: 400, error: "missing_upload_id" };
  const storedPath = job.upload?.stored_path;
  if (!storedPath || !existsSync(storedPath)) {
    return { ok: false, status: 400, error: "uploaded_file_missing" };
  }
  return { ok: true };
};

const submitRender = async (jobId, auth = {}) => {
  const job = await loadJob(jobId);
  if (!job) return { ok: false, status: 404, error: "job_not_found" };
  if (!job.user_id && auth.user_id && job.payment_status !== "captured") {
    job.user_id = auth.user_id;
    job.email = auth.email || null;
  }
  if (["submitted", "running", "complete"].includes(job.status)) {
    return { ok: true, job };
  }
  if (job.payment_status !== "captured") {
    if (job.user_id && Number.isInteger(job.price_cents) && job.price_cents > 0) {
      let debit;
      try {
        debit = await appendWalletLedger({
          user_id: job.user_id,
          email: job.email || null,
          event_id: `wallet-debit-${job.job_id}`,
          type: "debit",
          amount_cents: job.price_cents,
          job_id: job.job_id,
        });
      } catch (error) {
        if (error?.code === "INSUFFICIENT_BALANCE") {
          return { ok: false, status: 402, error: "insufficient_balance" };
        }
        throw error;
      }
      job.payment_status = "captured";
      job.payment_mode = "wallet";
      job.wallet_debit_cents = job.price_cents;
      job.balance_after_cents = debit.transaction.balance_after_cents;
      job.payment_captured_at = debit.transaction.created_at;
      job.payment_intent_id = null;
    } else {
      return { ok: false, status: 402, error: "payment_required" };
    }
  }

  if (job.payment_status !== "captured") {
    return { ok: false, status: 402, error: "payment_required" };
  }

  const uploadCheck = ensureUploadedFile(job);
  if (!uploadCheck.ok) return uploadCheck;

  const now = new Date().toISOString();
  job.status = "submitted";
  job.submitted_at = now;
  job.updated_at = now;
  Object.assign(job, renderTimeoutForFrames(job.frame_count || 1));
  job.renderer = inferRenderer(job.filename, job.renderer);
  job.render_request_id = job.render_request_id || `RREQ-${randomUUID().slice(0, 8).toUpperCase()}`;
  await saveJob(job);
  return { ok: true, job };
};

const markJob = async (jobId, status) => {
  const job = await loadJob(jobId);
  if (!job) return { ok: false, status: 404, error: "job_not_found" };
  const now = new Date().toISOString();
  job.status = status;
  job.updated_at = now;
  if (status === "running") job.running_at = job.running_at || now;
  if (status === "complete") job.completed_at = job.completed_at || now;
  if (status === "failed") job.failed_at = job.failed_at || now;
  if (status === "failed") await refundFailedWalletDebit(job);
  await saveJob(job);
  return { ok: true, job };
};

const attachOutput = async (jobId, outputInput) => {
  const job = await loadJob(jobId);
  if (!job) return { ok: false, status: 404, error: "job_not_found" };
  if (!outputInput.bytes.length) return { ok: false, status: 400, error: "empty_output" };

  const output = await saveOutput(outputInput);
  const now = new Date().toISOString();
  Object.assign(job, output, { updated_at: now });
  if (job.status === "running" || job.status === "submitted") {
    job.status = "complete";
    job.completed_at = job.completed_at || now;
  }
  await saveJob(job);
  return { ok: true, job };
};

const mintReceipt = async (jobId) => {
  const job = await loadJob(jobId);
  if (!job) return { ok: false, status: 404, error: "job_not_found" };
  if (!job.output_path || !existsSync(job.output_path)) {
    return { ok: false, status: 400, error: "output_not_found" };
  }
  if (!job.output_sha256) {
    return { ok: false, status: 400, error: "missing_output_sha256" };
  }

  const minted = await saveReceipt(job);
  Object.assign(job, {
    receipt_id: minted.receipt_id,
    receipt_path: minted.receipt_path,
    receipt_created_at: minted.receipt_created_at,
    updated_at: minted.receipt_created_at,
  });
  await saveJob(job);
  return { ok: true, job, receipt: minted.receipt };
};

const priceJob = async (jobId, body) => {
  const job = await loadJob(jobId);
  if (!job) return { ok: false, status: 404, error: "job_not_found" };
  const frames = frameContract(body, job);
  if (!frames) {
    return { ok: false, status: 400, error: "invalid_frame_range" };
  }
  const price = Number(body.price_cents);
  if (!Number.isInteger(price) || price < 0) {
    return { ok: false, status: 400, error: "invalid_price_cents" };
  }
  if (!priceMatchesFrameContract(price, frames)) {
    return { ok: false, status: 400, error: "price_frame_mismatch" };
  }
  Object.assign(job, frames);
  job.price_cents = price;
  job.payment_status = "priced";
  job.updated_at = new Date().toISOString();
  await saveJob(job);
  return { ok: true, job };
};

const updateReceiptCaptured = async (job) => {
  const receipt = JSON.parse(await readFile(job.receipt_path, "utf8"));
  receipt.cost_cents = job.price_cents;
  receipt.payment_status = "captured";
  receipt.payment_intent_id = job.payment_intent_id;
  receipt.payment_mode = job.payment_mode || receipt.payment_mode || "direct_checkout";
  receipt.wallet_debit_cents = job.wallet_debit_cents || receipt.wallet_debit_cents || null;
  receipt.balance_after_cents = Number.isInteger(job.balance_after_cents) ? job.balance_after_cents : receipt.balance_after_cents || null;
  await writeFile(job.receipt_path, JSON.stringify(receipt, null, 2), "utf8");
};

const finalizeWalletTopupSession = async (event, session) => {
  if (event.type !== "checkout.session.completed") {
    return { ok: true, ignored: true, reason: "event_type" };
  }
  const metadata = session.metadata || {};
  if (metadata.purpose !== "wallet_topup") {
    return { ok: true, ignored: true, reason: "purpose" };
  }
  if (session.status !== "complete" || session.payment_status !== "paid") {
    return { ok: false, status: 400, error: "session_not_paid_complete" };
  }
  const eventId = String(event.id || "");
  if (!/^evt_[A-Za-z0-9_]+$/.test(eventId)) return { ok: false, status: 400, error: "invalid_event_id" };
  const userId = String(metadata.user_id || "").trim().toLowerCase();
  const email = String(metadata.email || "").trim().toLowerCase() || null;
  const amount = Number(metadata.amount_cents);
  const actual = Number(session.amount_total);
  if (!userId) return { ok: false, status: 400, error: "missing_user_id" };
  if (!WALLET_TOPUP_AMOUNTS.includes(amount) || actual !== amount) {
    return { ok: false, status: 400, error: "amount_mismatch" };
  }

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
      return { ok: true, duplicate: true };
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
  console.log(`WALLET_STRIPE_CREDIT user_id=${userId} session_id=${session.id || ""} amount_cents=${amount}`);
  return { ok: true, duplicate: credited.duplicate, transaction: credited.transaction };
};

const stripeSignatureValid = (payload, signatureHeader) => {
  if (!STRIPE_WEBHOOK_SECRET || !signatureHeader) return false;
  const parts = String(signatureHeader).split(",").reduce((acc, item) => {
    const [key, value] = item.split("=");
    if (!acc[key]) acc[key] = [];
    acc[key].push(value);
    return acc;
  }, {});
  const timestamp = parts.t?.[0];
  const signatures = parts.v1 || [];
  if (!timestamp || signatures.length === 0) return false;
  const signedPayload = `${timestamp}.${payload.toString("utf8")}`;
  const expected = createHmac("sha256", STRIPE_WEBHOOK_SECRET).update(signedPayload).digest("hex");
  return signatures.some((signature) => safeTokenEqual(signature, expected));
};

const finalizeStripeCheckoutSession = async (event, session) => {
  if (event.type !== "checkout.session.completed") {
    return { ok: true, ignored: true, reason: "event_type" };
  }
  const metadata = session.metadata || {};
  if (metadata.purpose === "wallet_topup") {
    return finalizeWalletTopupSession(event, session);
  }
  if (metadata.purpose !== "web_render_job") {
    return { ok: true, ignored: true, reason: "purpose" };
  }
  if (session.status !== "complete" || session.payment_status !== "paid") {
    return { ok: false, status: 400, error: "session_not_paid_complete" };
  }

  const jobId = String(metadata.job_id || "");
  if (!/^JOB-[A-Z0-9]+$/.test(jobId)) return { ok: false, status: 400, error: "invalid_job_id" };
  const eventId = String(event.id || "");
  if (!/^evt_[A-Za-z0-9_]+$/.test(eventId)) return { ok: false, status: 400, error: "invalid_event_id" };

  console.log(`WEB_RENDER_STRIPE_SESSION_COMPLETED job_id=${jobId} session_id=${session.id || ""}`);
  const job = await loadJob(jobId);
  if (!job) return { ok: false, status: 404, error: "job_not_found" };

  const expected = Number(job.price_cents);
  const actual = Number(session.amount_total);
  if (!Number.isInteger(expected) || expected <= 0) return { ok: false, status: 400, error: "job_missing_price" };
  if (actual !== expected) return { ok: false, status: 400, error: "amount_mismatch" };
  if (String(session.id || "") !== String(job.checkout_session_id || "")) {
    return { ok: false, status: 400, error: "checkout_session_mismatch" };
  }

  await mkdir(STRIPE_EVENT_DIR, { recursive: true });
  const eventPath = path.join(STRIPE_EVENT_DIR, `${eventId}.json`);
  try {
    await writeFile(eventPath, JSON.stringify({
      event_id: eventId,
      job_id: jobId,
      checkout_session_id: session.id,
      processed_at: new Date().toISOString(),
    }, null, 2), { encoding: "utf8", flag: "wx" });
  } catch (error) {
    if (error?.code === "EEXIST") {
      console.log(`WEB_RENDER_STRIPE_DUPLICATE event_id=${eventId} job_id=${jobId}`);
      return { ok: true, duplicate: true, job };
    }
    throw error;
  }

  if (job.payment_status === "captured") {
    console.log(`WEB_RENDER_STRIPE_DUPLICATE event_id=${eventId} job_id=${jobId}`);
    return { ok: true, already_captured: true, job };
  }

  const now = new Date().toISOString();
  job.payment_status = "captured";
  job.payment_intent_id = session.payment_intent || job.payment_intent_id || null;
  job.payment_captured_at = now;
  job.updated_at = now;
  if (job.receipt_path && existsSync(job.receipt_path)) {
    await updateReceiptCaptured(job);
  }
  await saveJob(job);
  console.log(`WEB_RENDER_STRIPE_CAPTURED job_id=${jobId} session_id=${job.checkout_session_id}`);
  return { ok: true, job };
};

const createStripeCheckoutSession = async (jobId) => {
  const job = await loadJob(jobId);
  if (!job) return { ok: false, status: 404, error: "job_not_found" };
  if (!Number.isInteger(job.price_cents) || job.price_cents <= 0) {
    return { ok: false, status: 400, error: "missing_price_cents" };
  }
  if (job.payment_status === "captured") {
    return { ok: false, status: 400, error: "payment_already_captured" };
  }
  if (!STRIPE_SECRET) {
    return { ok: false, status: 503, error: "stripe_not_configured" };
  }

  const params = new URLSearchParams();
  params.set("mode", "payment");
  params.set("client_reference_id", job.job_id);
  const workspaceUrl = `${PUBLIC_SITE_URL}/workspace?job_id=${encodeURIComponent(job.job_id)}&download_token=${encodeURIComponent(job.download_token || "")}&receipt_token=${encodeURIComponent(job.receipt_token || "")}`;
  params.set("success_url", `${workspaceUrl}&paid=1`);
  params.set("cancel_url", `${workspaceUrl}&cancel=1`);
  params.set("line_items[0][quantity]", "1");
  params.set("line_items[0][price_data][currency]", "usd");
  params.set("line_items[0][price_data][unit_amount]", String(job.price_cents));
  params.set("line_items[0][price_data][product_data][name]", `Farpy render ${job.job_id}`);
  params.set("metadata[purpose]", "web_render_job");
  params.set("metadata[job_id]", job.job_id);
  params.set("metadata[upload_id]", job.upload_id || "");
  params.set("metadata[price_cents]", String(job.price_cents));

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      authorization: `Bearer ${STRIPE_SECRET}`,
      "content-type": "application/x-www-form-urlencoded",
    },
    body: params,
  });
  const session = await response.json().catch(() => null);
  if (!response.ok || !session?.id || !session?.url) {
    return {
      ok: false,
      status: 502,
      error: "stripe_checkout_failed",
    };
  }

  const now = new Date().toISOString();
  job.checkout_session_id = session.id;
  job.payment_status = "checkout_created";
  job.checkout_created_at = now;
  job.updated_at = now;
  await saveJob(job);
  return { ok: true, job, checkout_url: session.url };
};

const createWalletTopupSession = async (req, body) => {
  const auth = requireAuth(req);
  if (!auth.ok) return auth;
  const amount = Number(body.amount_cents);
  if (!WALLET_TOPUP_AMOUNTS.includes(amount)) {
    return { ok: false, status: 400, error: "invalid_topup_amount" };
  }
  if (!STRIPE_SECRET) {
    return { ok: false, status: 503, error: "stripe_not_configured" };
  }

  const params = new URLSearchParams();
  params.set("mode", "payment");
  params.set("client_reference_id", auth.user_id);
  params.set("success_url", `${PUBLIC_SITE_URL}/account?topup=success`);
  params.set("cancel_url", `${PUBLIC_SITE_URL}/topup?cancel=1`);
  params.set("line_items[0][quantity]", "1");
  params.set("line_items[0][price_data][currency]", "usd");
  params.set("line_items[0][price_data][unit_amount]", String(amount));
  params.set("line_items[0][price_data][product_data][name]", `Farpy balance ${amount / 100}`);
  params.set("metadata[purpose]", "wallet_topup");
  params.set("metadata[user_id]", auth.user_id);
  params.set("metadata[email]", auth.email || "");
  params.set("metadata[amount_cents]", String(amount));

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      authorization: `Bearer ${STRIPE_SECRET}`,
      "content-type": "application/x-www-form-urlencoded",
    },
    body: params,
  });
  const session = await response.json().catch(() => null);
  if (!response.ok || !session?.id || !session?.url) {
    return { ok: false, status: 502, error: "stripe_checkout_failed" };
  }
  return {
    ok: true,
    checkout_session_id: session.id,
    checkout_url: session.url,
    amount_cents: amount,
  };
};
const btcpayConfigured = () => Boolean(BTCPAY_URL && BTCPAY_STORE_ID && BTCPAY_API_KEY && BTCPAY_WEBHOOK_SECRET);

const btcpayInvoiceUrl = (invoiceId = "") => {
  const base = `${BTCPAY_URL}/api/v1/stores/${encodeURIComponent(BTCPAY_STORE_ID)}/invoices`;
  return invoiceId ? `${base}/${encodeURIComponent(invoiceId)}` : base;
};

const publicBtcpayCheckoutUrl = (checkoutLink, invoiceId = "") => {
  const fallback = `${BTCPAY_URL}/i/${encodeURIComponent(invoiceId)}`;
  const raw = String(checkoutLink || fallback);
  if (!BTCPAY_PUBLIC_URL) return raw;
  try {
    const source = new URL(raw, BTCPAY_URL || BTCPAY_PUBLIC_URL);
    const publicBase = new URL(BTCPAY_PUBLIC_URL);
    source.protocol = publicBase.protocol;
    source.hostname = publicBase.hostname;
    source.port = publicBase.port;
    return source.toString();
  } catch {
    return raw;
  }
};

const btcpayApiRequest = async (pathOrUrl, options = {}) => {
  const response = await fetch(pathOrUrl.startsWith("http") ? pathOrUrl : `${BTCPAY_URL}${pathOrUrl}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      authorization: `token ${BTCPAY_API_KEY}`,
    },
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) : {};
  return { response, body };
};

const logBtcpayInvoiceCreateFailure = (response, invoice, rail) => {
  const status = Number(response?.status || 0);
  const code = String(invoice?.code || invoice?.errorCode || invoice?.error || invoice?.title || "").slice(0, 120);
  const message = String(invoice?.message || invoice?.detail || "").replace(/\s+/g, " ").slice(0, 240);
  console.warn(`BTCPAY_INVOICE_CREATE_FAILED rail=${rail || ""} status=${status} code=${code} message=${message}`);
};

const btcpayWebhookSignatureValid = (payload, signatureHeader) => {
  if (!BTCPAY_WEBHOOK_SECRET || !signatureHeader) return false;
  const expected = createHmac("sha256", BTCPAY_WEBHOOK_SECRET).update(payload).digest("hex");
  const got = String(signatureHeader).replace(/^sha256=/i, "").trim();
  return safeTokenEqual(got, expected);
};

const btcpayStatusIsSettled = (invoice) => String(invoice?.status || "").toLowerCase() === "settled";
const btcpayStatusIsTerminalUnpaid = (invoice) => ["expired", "invalid"].includes(String(invoice?.status || "").toLowerCase());

const centsFromBtcpayAmount = (amount) => {
  const n = Number(amount);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100);
};

const extractBtcpayPaymentHash = (invoice) => {
  const payments = Array.isArray(invoice?.payments) ? invoice.payments : [];
  for (const payment of payments) {
    const details = payment?.details || {};
    const hash = details.paymentHash || details.payment_hash || payment.paymentHash || payment.payment_hash || null;
    if (hash) return String(hash);
  }
  return null;
};

const createBtcpayTopupInvoice = async (req, body, config) => {
  const auth = requireAuth(req);
  if (!auth.ok) return auth;
  if (!btcpayConfigured()) return { ok: false, status: 503, error: "btcpay_not_configured" };

  const tier = String(body.tier || body.amount_tier || "").trim().toLowerCase();
  const amount = config.tiers[tier];
  if (!amount) return { ok: false, status: 400, error: config.invalidTierError };

  const topupId = `TOPUP-BTCPAY-${randomUUID().slice(0, 12).toUpperCase()}`;
  const payload = {
    amount: (amount / 100).toFixed(2),
    currency: "USD",
    metadata: {
      purpose: config.purpose,
      topup_id: topupId,
      user_id: auth.user_id,
      email: auth.email || "",
      amount_cents: String(amount),
      rail: config.rail,
    },
    checkout: {
      redirectURL: `${PUBLIC_SITE_URL}/account?topup=${encodeURIComponent(config.rail)}`,
      expirationMinutes: 15,
      paymentMethods: config.paymentMethods,
    },
  };

  const { response, body: invoice } = await btcpayApiRequest(btcpayInvoiceUrl(), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok || !invoice?.id) {
    logBtcpayInvoiceCreateFailure(response, invoice, config.rail);
    return { ok: false, status: 502, error: "btcpay_invoice_create_failed" };
  }

  return {
    ok: true,
    provider: "btcpay",
    rail: config.rail,
    tier,
    amount_cents: amount,
    invoice_id: invoice.id,
    expiration_time: invoice.expirationTime || null,
    expiration_at: invoice.expirationTime ? new Date(Number(invoice.expirationTime) * 1000).toISOString() : null,
    checkout_url: publicBtcpayCheckoutUrl(invoice.checkoutLink || invoice.url, invoice.id),
  };
};

const createLightningTopupInvoice = (req, body) => createBtcpayTopupInvoice(req, body, {
  rail: "lightning",
  purpose: "wallet_topup_lightning",
  tiers: LIGHTNING_TOPUP_TIERS,
  invalidTierError: "invalid_lightning_tier",
  paymentMethods: ["BTC-LightningNetwork"],
});

const createBitcoinTopupInvoice = (req, body) => createBtcpayTopupInvoice(req, body, {
  rail: "bitcoin",
  purpose: "wallet_topup_bitcoin",
  tiers: BITCOIN_TOPUP_TIERS,
  invalidTierError: "invalid_bitcoin_tier",
  paymentMethods: ["BTC-CHAIN"],
});

const finalizeBtcpayWebhook = async (event) => {
  const type = String(event.type || "");
  if (!type) return { ok: false, status: 400, error: "missing_event_type" };

  const invoiceId = String(event.invoiceId || event.invoice?.id || event.data?.id || "");
  if (!invoiceId) return { ok: false, status: 400, error: "missing_invoice_id" };

  const eventStoreId = String(event.storeId || event.invoice?.storeId || event.data?.storeId || "");
  if (eventStoreId && eventStoreId !== BTCPAY_STORE_ID) return { ok: false, status: 400, error: "unknown_store" };

  const { response, body: invoice } = await btcpayApiRequest(btcpayInvoiceUrl(invoiceId), { method: "GET" });
  if (!response.ok || !invoice?.id) return { ok: false, status: 502, error: "btcpay_invoice_verify_failed" };
  if (String(invoice.storeId || "") !== BTCPAY_STORE_ID) return { ok: false, status: 400, error: "unknown_store" };

  if (btcpayStatusIsTerminalUnpaid(invoice)) {
    return { ok: true, ignored: true, reason: String(invoice.status || "unpaid_terminal") };
  }
  if (!btcpayStatusIsSettled(invoice)) {
    return { ok: true, ignored: true, reason: "invoice_not_settled", invoice_status: invoice.status || null };
  }

  const metadata = invoice.metadata || {};
  const purpose = String(metadata.purpose || "");
  const rail = String(metadata.rail || (purpose === "wallet_topup_lightning" ? "lightning" : purpose === "wallet_topup_bitcoin" ? "bitcoin" : ""));
  if (!["wallet_topup_lightning", "wallet_topup_bitcoin"].includes(purpose)) return { ok: true, ignored: true, reason: "purpose" };

  const userId = String(metadata.user_id || "").trim().toLowerCase();
  const email = String(metadata.email || "").trim().toLowerCase() || null;
  const amount = Number(metadata.amount_cents);
  const invoiceAmount = centsFromBtcpayAmount(invoice.amount);
  if (!userId) return { ok: false, status: 400, error: "missing_user_id" };
  if (![...Object.values(LIGHTNING_TOPUP_TIERS), ...Object.values(BITCOIN_TOPUP_TIERS)].includes(amount)) return { ok: false, status: 400, error: "invalid_amount" };
  if (invoiceAmount !== amount) return { ok: false, status: 400, error: "amount_mismatch" };

  const walletEventId = `btcpay-invoice-${invoiceId}`;
  const credited = await appendWalletLedger({
    user_id: userId,
    email,
    event_id: walletEventId,
    type: "credit",
    amount_cents: amount,
    lightning_invoice_id: invoiceId,
    payment_hash: extractBtcpayPaymentHash(invoice),
    source: `btcpay_${rail}`,
  });

  await mkdir(BTCPAY_EVENT_DIR, { recursive: true });
  const eventPath = path.join(BTCPAY_EVENT_DIR, `${invoiceId}.json`);
  if (!existsSync(eventPath)) {
    await writeFile(eventPath, JSON.stringify({
      invoice_id: invoiceId,
      wallet_event_id: walletEventId,
      user_id: userId,
      amount_cents: amount,
      duplicate: credited.duplicate,
      processed_at: new Date().toISOString(),
    }, null, 2), "utf8");
  }

  console.log(`WALLET_BTCPAY_CREDIT user_id=${userId} invoice_id=${invoiceId} rail=${rail} amount_cents=${amount} duplicate=${credited.duplicate ? "1" : "0"}`);
  return { ok: true, duplicate: credited.duplicate, transaction: credited.transaction };
};

const authorizePaymentDev = async (jobId) => {
  const job = await loadJob(jobId);
  if (!job) return { ok: false, status: 404, error: "job_not_found" };
  if (!Number.isInteger(job.price_cents) || job.price_cents < 0) {
    return { ok: false, status: 400, error: "missing_price_cents" };
  }
  const now = new Date().toISOString();
  job.payment_status = "authorized";
  job.payment_intent_id = job.payment_intent_id || `DEVPI-${randomUUID().slice(0, 8).toUpperCase()}`;
  job.payment_authorized_at = now;
  job.updated_at = now;
  await saveJob(job);
  return { ok: true, job };
};

const capturePaymentDev = async (jobId) => {
  const job = await loadJob(jobId);
  if (!job) return { ok: false, status: 404, error: "job_not_found" };
  if (job.payment_status !== "authorized") {
    return { ok: false, status: 400, error: "payment_not_authorized" };
  }
  if (!job.receipt_path || !existsSync(job.receipt_path)) {
    return { ok: false, status: 400, error: "receipt_required" };
  }
  const now = new Date().toISOString();
  job.payment_status = "captured";
  job.payment_captured_at = now;
  job.updated_at = now;
  await updateReceiptCaptured(job);
  await saveJob(job);
  return { ok: true, job };
};

const failPaymentDev = async (jobId) => {
  const job = await loadJob(jobId);
  if (!job) return { ok: false, status: 404, error: "job_not_found" };
  const now = new Date().toISOString();
  job.payment_status = "failed";
  job.payment_failed_at = now;
  job.updated_at = now;
  await saveJob(job);
  return { ok: true, job };
};

const headerFilename = (headers) => {
  const raw = headers["x-filename"];
  if (typeof raw === "string" && raw.trim()) return safeName(decodeURIComponent(raw));
  return "upload.blend";
};

const parseMultipart = (contentType, body) => {
  const boundary = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i)?.[1]
    || contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i)?.[2];
  if (!boundary) throw new Error("Missing multipart boundary");

  const boundaryBytes = Buffer.from(`--${boundary}`);
  const headerBreak = Buffer.from("\r\n\r\n");
  let cursor = body.indexOf(boundaryBytes);
  const result = {};

  while (cursor !== -1) {
    const nextStart = cursor + boundaryBytes.length;
    if (body.slice(nextStart, nextStart + 2).toString() === "--") break;

    let partStart = nextStart;
    if (body.slice(partStart, partStart + 2).toString() === "\r\n") partStart += 2;
    const headerEnd = body.indexOf(headerBreak, partStart);
    if (headerEnd === -1) break;

    const headers = body.slice(partStart, headerEnd).toString("utf8");
    const disposition = headers.match(/content-disposition:[^\r\n]*/i)?.[0] || "";
    const filename = disposition.match(/filename="([^"]+)"/i)?.[1];
    const name = disposition.match(/name="([^"]+)"/i)?.[1];

    const dataStart = headerEnd + headerBreak.length;
    let dataEnd = body.indexOf(Buffer.from(`\r\n--${boundary}`), dataStart);
    if (dataEnd === -1) dataEnd = body.length;

    if (filename || name === "file") {
      result.filename = safeName(filename || "upload.blend");
      result.bytes = body.slice(dataStart, dataEnd);
    } else if (name) {
      result[name] = body.slice(dataStart, dataEnd).toString("utf8").trim();
    }

    cursor = body.indexOf(boundaryBytes, dataEnd);
  }

  if (result.bytes) return result;
  throw new Error("No file part found");
};

const parseUploadRequest = async (req) => {
  const body = await readRawBody(req);
  const contentType = String(req.headers["content-type"] || "");
  if (contentType.includes("multipart/form-data")) {
    return parseMultipart(contentType, body);
  }
  return {
    filename: headerFilename(req.headers),
    bytes: body,
    renderer: req.headers["x-renderer"],
    frame_start: req.headers["x-frame-start"],
    frame_end: req.headers["x-frame-end"],
    frame_count: req.headers["x-frame-count"],
  };
};

const workerTokenOk = (req, url) => {
  const want = String(process.env.FARPY_WEB_RENDER_WORKER_TOKEN || "");
  const auth = String(req.headers.authorization || "");
  const bearer = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
  const got = String(
    req.headers["x-farpy-worker-token"]
    || req.headers["x-farpy-worker"]
    || bearer
    || ""
  );
  return !!want && safeTokenEqual(got, want);
};

const jsonBodyOrEmpty = async (req) => {
  const raw = await readRawBody(req).catch(() => Buffer.alloc(0));
  if (!raw.length) return {};
  try {
    return JSON.parse(raw.toString("utf8"));
  } catch {
    return {};
  }
};

const nodeTokenFromRequest = (req) => {
  const auth = String(req.headers.authorization || "");
  const bearer = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
  return String(req.headers["x-farpy-node-token"] || bearer || "").trim();
};

const flattenNodeRecords = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.flatMap(flattenNodeRecords);
  if (typeof value !== "object") return [];
  const direct = [value];
  for (const key of ["nodes", "pairs", "records", "items", "data"]) {
    if (Array.isArray(value[key])) direct.push(...value[key].flatMap(flattenNodeRecords));
  }
  return direct;
};

const execFileJson = (command, args, options = {}) => new Promise((resolve, reject) => {
  execFile(command, args, { timeout: 5000, ...options }, (error, stdout) => {
    if (error) return reject(error);
    try {
      resolve(JSON.parse(String(stdout || "{}").trim() || "{}"));
    } catch (parseError) {
      reject(parseError);
    }
  });
});

const findPairedNodeInSqlite = async (token) => {
  if (!NODE_PAIR_SQLITE || !existsSync(NODE_PAIR_SQLITE) || !token) return null;
  const script = `
import json, os, sqlite3, sys
path = sys.argv[1]
token = os.environ.get("FARPY_NODE_TOKEN_LOOKUP", "")
if not token:
    print("{}")
    raise SystemExit(0)
con = sqlite3.connect(path)
con.row_factory = sqlite3.Row
row = con.execute("select node_id, created_at, last_seen from nodes where node_token = ? limit 1", (token,)).fetchone()
print(json.dumps(dict(row) if row else {}))
`;
  try {
    const result = await execFileJson("python3", ["-c", script, NODE_PAIR_SQLITE], {
      env: { ...process.env, FARPY_NODE_TOKEN_LOOKUP: token },
    });
    const nodeId = String(result.node_id || "").slice(0, 120);
    return nodeId ? { node_id: nodeId, email: null, status: "paired" } : null;
  } catch (error) {
    console.error("node_pair_sqlite_lookup_failed", error);
    return null;
  }
};
const readNodeRecordFile = async (file) => {
  const raw = await readFile(file, "utf8");
  const trimmed = raw.trim();
  if (!trimmed) return [];
  try {
    return flattenNodeRecords(JSON.parse(trimmed));
  } catch {
    return trimmed
      .split(/\r?\n/)
      .filter(Boolean)
      .flatMap((line) => {
        try { return flattenNodeRecords(JSON.parse(line)); } catch { return []; }
      });
  }
};

const listNodeRecordFiles = async (dir, depth = 0) => {
  if (!existsSync(dir) || depth > 2) return [];
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
  const files = [];
  for (const entry of entries) {
    const child = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await listNodeRecordFiles(child, depth + 1));
    if (entry.isFile() && /\.(json|jsonl)$/i.test(entry.name)) files.push(child);
  }
  return files;
};

const findPairedNodeByToken = async (token) => {
  if (!token) return null;
  const sqliteNode = await findPairedNodeInSqlite(token);
  if (sqliteNode) return sqliteNode;
  const files = [];
  if (NODE_PAIR_STORE_FILE && existsSync(NODE_PAIR_STORE_FILE)) files.push(NODE_PAIR_STORE_FILE);
  files.push(...await listNodeRecordFiles(NODE_PAIR_STORE_DIR));
  const seen = new Set();
  for (const file of files) {
    if (seen.has(file)) continue;
    seen.add(file);
    let records = [];
    try {
      records = await readNodeRecordFile(file);
    } catch (error) {
      console.error("node_pair_store_read_failed", file, error);
      continue;
    }
    for (const record of records) {
      const nodeToken = String(record.node_token || record.nodeToken || record.token || "");
      if (!safeTokenEqual(token, nodeToken)) continue;
      const status = String(record.status || "").toLowerCase();
      const paired = record.paired === true || ["paired", "active", "confirmed", "ready"].includes(status);
      const expiresAt = record.expires_at || record.expiresAt || record.expired_at || record.expiredAt;
      const expired = expiresAt ? Date.now() > new Date(expiresAt).getTime() : false;
      const nodeId = String(record.node_id || record.nodeId || record.id || "").slice(0, 120);
      if (!paired || expired || !nodeId) return null;
      return {
        node_id: nodeId,
        email: record.email || null,
        status: status || "paired",
      };
    }
  }
  return null;
};

const requireNodeTokenAuth = async (req) => {
  const token = nodeTokenFromRequest(req);
  const node = await findPairedNodeByToken(token);
  return node ? { ok: true, node } : { ok: false };
};

const leaseIdFor = (job, nodeId) => `LEASE-${sha256(`${job.job_id}:${nodeId}`).slice(0, 12).toUpperCase()}`;

const normalizeLeaseRenderer = (body, req, url) => String(
  body.renderer || req.headers["x-farpy-renderer"] || url.searchParams.get("renderer") || "blender"
).toLowerCase();

const wantsNodeMuncherSmoke = (body, req, url) => {
  const value = body.nodemuncher_smoke
    ?? body.node_muncher_smoke
    ?? req.headers["x-farpy-nodemuncher-smoke"]
    ?? url.searchParams.get("nodemuncher_smoke")
    ?? url.searchParams.get("node_muncher_smoke");
  return value === true || value === 1 || ["1", "true", "yes"].includes(String(value || "").toLowerCase());
};

const isNodeLeaseEligible = (job, renderer) => {
  if (!job || job.status !== "submitted") return false;
  if (job.nodemuncher_smoke !== true) return false;
  if (job.payment_status !== "captured") return false;
  if (!Number.isInteger(job.price_cents) || job.price_cents < 0) return false;
  const jobRenderer = String(job.renderer || "blender").toLowerCase();
  if (renderer && jobRenderer !== renderer) return false;
  if (!job.upload || !job.upload.stored_path || !existsSync(job.upload.stored_path)) return false;
  return true;
};

const nodeLeaseJob = (job) => ({
  job_id: job.job_id,
  upload_id: job.upload_id,
  filename: job.filename,
  renderer: job.renderer || "blender",
  status: job.status,
  payment_status: job.payment_status || "unpriced",
  price_cents: job.price_cents,
  frame_start: job.frame_start || 1,
  frame_end: job.frame_end || job.frame_count || 1,
  frame_count: job.frame_count || 1,
  lease_id: job.lease_id || null,
  node_id: job.node_id || null,
  claimed_at: job.claimed_at || null,
  claimed_by: job.claimed_by || null,
  render_request_id: job.render_request_id || null,
  input_url: job.status === "running" || job.status === "leased" ? `/node/v1/web-render/nodemuncher/jobs/${encodeURIComponent(job.job_id)}/input` : null,
  progress_url: job.status === "running" || job.status === "leased" ? `/node/v1/web-render/nodemuncher/jobs/${encodeURIComponent(job.job_id)}/progress` : null,
  complete_url: job.status === "running" || job.status === "leased" ? `/node/v1/web-render/nodemuncher/jobs/${encodeURIComponent(job.job_id)}/complete` : null,
  fail_url: job.status === "running" || job.status === "leased" ? `/node/v1/web-render/nodemuncher/jobs/${encodeURIComponent(job.job_id)}/fail` : null,
});

const sortedSubmittedJobs = async () => (await listJobs())
  .sort((a, b) => String(a.submitted_at || a.updated_at || "").localeCompare(String(b.submitted_at || b.updated_at || "")));
const zipEntryNames = (bytes) => {
  const names = [];
  let offset = 0;
  while (offset <= bytes.length - 30) {
    if (bytes.readUInt32LE(offset) !== 0x04034b50) {
      offset += 1;
      continue;
    }
    const compressedSize = bytes.readUInt32LE(offset + 18);
    const nameLength = bytes.readUInt16LE(offset + 26);
    const extraLength = bytes.readUInt16LE(offset + 28);
    const nameStart = offset + 30;
    const nameEnd = nameStart + nameLength;
    if (nameEnd > bytes.length) break;
    names.push(bytes.slice(nameStart, nameEnd).toString("utf8").replace(/\\/g, "/"));
    offset = nameEnd + extraLength + compressedSize;
  }
  return names;
};

const expectedFrameNames = (job) => {
  const start = Number.isInteger(job.frame_start) ? job.frame_start : 1;
  const count = Number.isInteger(job.frame_count) && job.frame_count > 0 ? job.frame_count : 1;
  return Array.from({ length: count }, (_, index) => `output/frame_${String(start + index).padStart(4, "0")}`);
};

const validateWorkerZip = (job, bytes, renderedCount) => {
  if (!Buffer.isBuffer(bytes) || bytes.length === 0) return { ok: false, error: "empty_output" };
  if (bytes.readUInt32LE(0) !== 0x04034b50) return { ok: false, error: "output_not_zip" };
  const frameCount = Number.isInteger(job.frame_count) && job.frame_count > 0 ? job.frame_count : 1;
  if (!Number.isInteger(renderedCount) || renderedCount !== frameCount) {
    return { ok: false, error: "rendered_frame_count_mismatch" };
  }
  const names = zipEntryNames(bytes);
  if (!names.includes("manifest.json") || !names.includes("job.json") || !names.includes("render-log.txt")) {
    return { ok: false, error: "zip_manifest_missing" };
  }
  const outputNames = names.filter((name) => /^output\/frame_\d{4}\.(png|exr)$/i.test(name));
  const present = new Set(outputNames.map((name) => name.replace(/\.(png|exr)$/i, "")));
  const missing = expectedFrameNames(job).filter((name) => !present.has(name));
  if (missing.length) {
    return { ok: false, error: "zip_missing_frames", missing };
  }
  return { ok: true, names, output_files: outputNames };
};

const opsTokenOk = (req) => {
  if (!OPS_TOKEN) return false;
  const provided = req.headers["x-farpy-ops-token"]
    || String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  return safeTokenEqual(provided, OPS_TOKEN);
};

const isoTime = (value) => {
  const time = value ? new Date(value).getTime() : NaN;
  return Number.isFinite(time) ? time : null;
};

const isTodayUtc = (value) => {
  const time = isoTime(value);
  return time !== null && new Date(time).toISOString().slice(0, 10) === new Date().toISOString().slice(0, 10);
};

const centsSum = (items) => items.reduce((sum, item) => {
  const amount = Number(item.amount_cents ?? item.cost_cents ?? 0);
  return Number.isFinite(amount) ? sum + Math.abs(amount) : sum;
}, 0);

const averageSeconds = (items, startKey, endKey) => {
  const values = items
    .map((item) => {
      const start = isoTime(item[startKey]);
      const end = isoTime(item[endKey]);
      return start !== null && end !== null && end >= start ? (end - start) / 1000 : null;
    })
    .filter((value) => value !== null);
  if (!values.length) return null;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
};

const directoryBytes = async (dir) => {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    let total = 0;
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) total += await directoryBytes(full);
      if (entry.isFile()) {
        try {
          total += (await stat(full)).size;
        } catch {}
      }
    }
    return total;
  } catch {
    return null;
  }
};

const countRecentZips = async () => {
  try {
    const entries = await readdir(OUTPUT_DIR, { withFileTypes: true });
    const since = Date.now() - 24 * 60 * 60 * 1000;
    let count = 0;
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.toLowerCase().endsWith(".zip")) continue;
      try {
        if ((await stat(path.join(OUTPUT_DIR, entry.name))).mtimeMs >= since) count += 1;
      } catch {}
    }
    return count;
  } catch {
    return null;
  }
};

const diskStats = async () => {
  try {
    const fs = await statfs(DATA_DIR || STORE_DIR);
    const blockSize = Number(fs.bsize);
    const totalBlocks = Number(fs.blocks);
    const freeBlocks = Number(fs.bavail);
    const totalInodes = Number(fs.files);
    const freeInodes = Number(fs.ffree);
    const totalBytes = Number.isFinite(totalBlocks) && Number.isFinite(blockSize) ? totalBlocks * blockSize : null;
    const freeBytes = Number.isFinite(freeBlocks) && Number.isFinite(blockSize) ? freeBlocks * blockSize : null;
    const usedPercent = totalBytes && freeBytes !== null ? Math.round(((totalBytes - freeBytes) / totalBytes) * 1000) / 10 : null;
    const inodeUsedPercent = totalInodes && Number.isFinite(freeInodes) ? Math.round(((totalInodes - freeInodes) / totalInodes) * 1000) / 10 : null;
    return {
      total_bytes: totalBytes,
      free_bytes: freeBytes,
      disk_used_percent: usedPercent,
      total_inodes: Number.isFinite(totalInodes) ? totalInodes : null,
      free_inodes: Number.isFinite(freeInodes) ? freeInodes : null,
      inode_used_percent: inodeUsedPercent,
    };
  } catch {
    return null;
  }
};

const diskFreeBytes = async () => (await diskStats())?.free_bytes ?? null;

const loadAckedAlertIds = async () => {
  if (!existsSync(OPS_ALERT_ACK_PATH)) return new Set();
  try {
    const parsed = JSON.parse(await readFile(OPS_ALERT_ACK_PATH, "utf8"));
    const ids = Array.isArray(parsed?.acknowledged_alert_ids) ? parsed.acknowledged_alert_ids : [];
    return new Set(ids.map((id) => String(id || "")).filter(Boolean));
  } catch {
    return new Set();
  }
};

const saveAckedAlertIds = async (ids) => {
  await mkdir(path.dirname(OPS_ALERT_ACK_PATH), { recursive: true });
  await writeFile(OPS_ALERT_ACK_PATH, JSON.stringify({
    acknowledged_alert_ids: [...ids].sort(),
    updated_at: new Date().toISOString(),
  }, null, 2), "utf8");
};

const alertId = (...parts) => parts
  .map((part) => String(part || "unknown").toLowerCase().replace(/[^a-z0-9_.-]+/g, "-").replace(/^-+|-+$/g, ""))
  .filter(Boolean)
  .join(":")
  .slice(0, 180);

const makeAlert = (acked, { id, severity = "warn", category, message, created_at, source }) => ({
  id,
  severity,
  category,
  message,
  created_at: created_at || new Date().toISOString(),
  resolved: acked.has(id),
  source,
});

const alertHealthStatus = (alerts) => {
  const active = alerts.filter((alert) => !alert.resolved);
  if (active.some((alert) => alert.severity === "critical")) return "RED";
  if (active.some((alert) => alert.severity === "warn")) return "YELLOW";
  return "GREEN";
};

const readWorkerStatusFile = async () => {
  if (!existsSync(WORKER_STATUS_PATH)) return null;
  try {
    return JSON.parse(await readFile(WORKER_STATUS_PATH, "utf8"));
  } catch {
    return null;
  }
};

const readAllReceipts = async () => {
  try {
    await mkdir(RECEIPT_DIR, { recursive: true });
    const files = (await readdir(RECEIPT_DIR)).filter((name) => name.endsWith(".json"));
    const receipts = [];
    for (const file of files) {
      try {
        receipts.push(JSON.parse(await readFile(path.join(RECEIPT_DIR, file), "utf8")));
      } catch (error) {
        console.error("ops_receipt_read_failed", file, error);
      }
    }
    return receipts;
  } catch {
    return [];
  }
};

const readAllWalletTransactions = async () => {
  try {
    await mkdir(WALLET_DIR, { recursive: true });
    const files = (await readdir(WALLET_DIR)).filter((name) => name.endsWith(".jsonl"));
    const transactions = [];
    for (const file of files) {
      try {
        const lines = (await readFile(path.join(WALLET_DIR, file), "utf8")).split(/\r?\n/).filter(Boolean);
        for (const line of lines) transactions.push(JSON.parse(line));
      } catch (error) {
        console.error("ops_wallet_read_failed", file, error);
      }
    }
    return transactions;
  } catch {
    return [];
  }
};

const safeOpsJob = (job) => ({
  job_id: job.job_id,
  upload_id: job.upload_id || null,
  filename: job.filename || null,
  renderer: job.renderer || null,
  status: job.status || null,
  payment_status: job.payment_status || null,
  price_cents: Number.isFinite(Number(job.price_cents)) ? Number(job.price_cents) : null,
  frame_count: Number.isFinite(Number(job.frame_count)) ? Number(job.frame_count) : null,
  rendered_file_count: Number.isFinite(Number(job.rendered_file_count)) ? Number(job.rendered_file_count) : null,
  worker_id: job.worker_id || job.node_id || null,
  created_at: job.created_at || null,
  submitted_at: job.submitted_at || null,
  started_at: job.started_at || null,
  completed_at: job.completed_at || null,
  failed_at: job.failed_at || null,
  updated_at: job.updated_at || null,
  render_seconds: Number.isFinite(Number(job.render_seconds)) ? Number(job.render_seconds) : null,
  output_filename: job.output_filename || null,
  output_size_bytes: Number.isFinite(Number(job.output_size_bytes)) ? Number(job.output_size_bytes) : null,
  output_sha256: job.output_sha256 || null,
  receipt_id: job.receipt_id || null,
  failure_reason: job.failure_reason || null,
});

const safeOpsReceipt = (receipt) => ({
  receipt_id: receipt.receipt_id,
  job_id: receipt.job_id,
  upload_id: receipt.upload_id || null,
  filename: receipt.filename || null,
  renderer: receipt.renderer || null,
  frame_count: Number.isFinite(Number(receipt.frame_count)) ? Number(receipt.frame_count) : null,
  cost_cents: Number.isFinite(Number(receipt.cost_cents)) ? Number(receipt.cost_cents) : null,
  payment_status: receipt.payment_status || null,
  output_sha256: receipt.output_sha256 || null,
  output_size_bytes: Number.isFinite(Number(receipt.output_size_bytes)) ? Number(receipt.output_size_bytes) : null,
  receipt_created_at: receipt.receipt_created_at || receipt.created_at || null,
});

const workerSummaryFromStatus = (workerStatus, jobs) => {
  const activeJobs = jobs.filter((job) => job.status === "running");
  const ids = new Set(activeJobs.map((job) => job.worker_id || job.node_id).filter(Boolean));
  if (workerStatus?.worker_id) ids.add(workerStatus.worker_id);
  const workers = Array.isArray(workerStatus?.workers) ? workerStatus.workers : [];
  for (const worker of workers) if (worker?.worker_id) ids.add(worker.worker_id);
  const octane = new Set(activeJobs.filter((job) => job.renderer === "octane").map((job) => job.worker_id || job.node_id).filter(Boolean));
  const blender = new Set(activeJobs.filter((job) => (job.renderer || "blender") === "blender").map((job) => job.worker_id || job.node_id).filter(Boolean));
  return {
    blender_workers_online: blender.size || null,
    octane_workers_online: octane.size || null,
    known_worker_ids: [...ids],
    last_heartbeat: workerStatus?.heartbeat_at || workerStatus?.updated_at || null,
    worker_version: workerStatus?.version || workerStatus?.worker_version || null,
    gpu_count: Number.isFinite(Number(workerStatus?.gpu_count)) ? Number(workerStatus.gpu_count) : null,
    active_jobs: activeJobs.length,
    raw_status_available: !!workerStatus,
  };
};

const buildOpsSummary = async () => {
  const jobs = await listJobs();
  const progressJobs = await Promise.all(jobs.map((job) => withProgress(job).catch(() => job)));
  const receipts = await readAllReceipts();
  const walletTransactions = await readAllWalletTransactions();
  const workerStatus = await readWorkerStatusFile();
  const ackedAlerts = await loadAckedAlertIds();
  const fsStats = await diskStats();
  const completedToday = progressJobs.filter((job) => job.status === "complete" && isTodayUtc(job.completed_at || job.updated_at));
  const failedToday = progressJobs.filter((job) => job.status === "failed" && isTodayUtc(job.failed_at || job.updated_at));
  const receiptsToday = receipts.filter((receipt) => isTodayUtc(receipt.receipt_created_at || receipt.created_at));
  const txnsToday = walletTransactions.filter((txn) => isTodayUtc(txn.created_at));
  const receiptByJob = new Map(receipts.map((receipt) => [receipt.job_id, receipt]));
  const now = Date.now();
  const queueDepth = progressJobs.filter((job) => ["submitted", "running", "leased"].includes(job.status)).length;
  const submittedStuckJobs = progressJobs.filter((job) => {
    if (job.status !== "submitted") return false;
    const submitted = isoTime(job.submitted_at || job.updated_at);
    return submitted !== null && now - submitted > OPS_SUBMITTED_STUCK_MS;
  });
  const runningTimedOutJobs = progressJobs.filter((job) => {
    if (job.status !== "running") return false;
    const started = isoTime(job.started_at || job.updated_at);
    const timeoutMs = Number(job.render_timeout_ms || (job.render_timeout_seconds ? job.render_timeout_seconds * 1000 : 2 * 60 * 60 * 1000));
    return started !== null && now - started > timeoutMs;
  });
  const completionWithoutReceipt = progressJobs.filter((job) => job.status === "complete" && (!job.receipt_path || !existsSync(job.receipt_path)));
  const walletDebitWithoutCompletion = progressJobs.filter((job) => {
    if (!Number.isFinite(Number(job.wallet_debit_cents)) || Number(job.wallet_debit_cents) <= 0) return false;
    if (["complete", "failed"].includes(job.status)) return false;
    const debited = isoTime(job.payment_captured_at || job.submitted_at || job.updated_at || job.created_at);
    const timeoutMs = Number(job.render_timeout_ms || (job.render_timeout_seconds ? job.render_timeout_seconds * 1000 : 2 * 60 * 60 * 1000));
    return debited !== null && now - debited > timeoutMs;
  });
  const receiptMismatch = progressJobs.filter((job) => {
    const receipt = receiptByJob.get(job.job_id);
    return receipt && job.output_sha256 && receipt.output_sha256 && receipt.output_sha256 !== job.output_sha256;
  });
  const zipValidationFailure = progressJobs.filter((job) => job.status === "failed" && /zip|frame|validation/i.test(String(job.failure_reason || job.error || "")));
  const failedUploads = progressJobs.filter((job) => job.status === "failed" && /upload|input file|missing input|input route/i.test(String(job.failure_reason || job.error || "")));
  const workerHeartbeatAt = isoTime(workerStatus?.heartbeat_at || workerStatus?.updated_at);
  const workerAlertRelevant = queueDepth > 0 || progressJobs.some((job) => job.status === "running");
  const workerOffline = !workerStatus || workerHeartbeatAt === null;
  const workerStale = workerHeartbeatAt !== null && now - workerHeartbeatAt > OPS_WORKER_STALE_MS;
  const alerts = [
    ...submittedStuckJobs.map((job) => makeAlert(ackedAlerts, {
      id: alertId("job_submitted_stuck", job.job_id),
      severity: "warn",
      category: "render",
      message: `Job ${job.job_id} has been submitted for more than 5 minutes.`,
      created_at: job.submitted_at || job.updated_at || job.created_at,
      source: "job-api",
    })),
    ...runningTimedOutJobs.map((job) => makeAlert(ackedAlerts, {
      id: alertId("job_running_timeout", job.job_id),
      severity: "critical",
      category: "render",
      message: `Job ${job.job_id} is running beyond its configured timeout.`,
      created_at: job.started_at || job.updated_at || job.created_at,
      source: "job-api",
    })),
    ...failedUploads.map((job) => makeAlert(ackedAlerts, {
      id: alertId("failed_upload", job.job_id),
      severity: "warn",
      category: "upload",
      message: `Upload/input failure detected for job ${job.job_id}.`,
      created_at: job.failed_at || job.updated_at || job.created_at,
      source: "job-api",
    })),
    ...completionWithoutReceipt.map((job) => makeAlert(ackedAlerts, {
      id: alertId("receipt_generation_failure", job.job_id),
      severity: "critical",
      category: "receipt",
      message: `Completed job ${job.job_id} does not have a receipt file.`,
      created_at: job.completed_at || job.updated_at || job.created_at,
      source: "job-api",
    })),
    ...walletDebitWithoutCompletion.map((job) => makeAlert(ackedAlerts, {
      id: alertId("wallet_debit_without_completion", job.job_id),
      severity: "critical",
      category: "wallet",
      message: `Wallet debit exists for job ${job.job_id}, but no completion after timeout.`,
      created_at: job.payment_captured_at || job.submitted_at || job.updated_at || job.created_at,
      source: "job-api",
    })),
    ...(workerAlertRelevant && workerOffline ? [makeAlert(ackedAlerts, {
      id: alertId("worker_offline", "status-file"),
      severity: "critical",
      category: "worker",
      message: "Worker status is unavailable.",
      created_at: new Date().toISOString(),
      source: "worker-status",
    })] : []),
    ...(workerAlertRelevant && workerStale ? [makeAlert(ackedAlerts, {
      id: alertId("worker_heartbeat_stale", workerStatus?.worker_id || "worker"),
      severity: "critical",
      category: "worker",
      message: `Worker heartbeat is stale for ${workerStatus?.worker_id || "worker"}.`,
      created_at: workerStatus?.heartbeat_at || workerStatus?.updated_at,
      source: "worker-status",
    })] : []),
    ...(queueDepth >= OPS_QUEUE_WARN_THRESHOLD ? [makeAlert(ackedAlerts, {
      id: alertId("queue_depth_over_threshold", queueDepth),
      severity: queueDepth >= QUEUE_CAP ? "critical" : "warn",
      category: "queue",
      message: `Queue depth is ${queueDepth}, threshold is ${OPS_QUEUE_WARN_THRESHOLD}.`,
      created_at: new Date().toISOString(),
      source: "job-api",
    })] : []),
    ...(fsStats?.disk_used_percent !== null && fsStats?.disk_used_percent >= OPS_DISK_WARN_PERCENT ? [makeAlert(ackedAlerts, {
      id: alertId("disk_usage_high", Math.floor(fsStats.disk_used_percent)),
      severity: fsStats.disk_used_percent >= 95 ? "critical" : "warn",
      category: "storage",
      message: `Disk usage is ${fsStats.disk_used_percent}%.`,
      created_at: new Date().toISOString(),
      source: "statfs",
    })] : []),
    ...(fsStats?.inode_used_percent !== null && fsStats?.inode_used_percent >= OPS_INODE_WARN_PERCENT ? [makeAlert(ackedAlerts, {
      id: alertId("inode_usage_high", Math.floor(fsStats.inode_used_percent)),
      severity: fsStats.inode_used_percent >= 95 ? "critical" : "warn",
      category: "storage",
      message: `Inode usage is ${fsStats.inode_used_percent}%.`,
      created_at: new Date().toISOString(),
      source: "statfs",
    })] : []),
    ...receiptMismatch.map((job) => makeAlert(ackedAlerts, {
      id: alertId("receipt_mismatch", job.job_id),
      severity: "critical",
      category: "receipt",
      message: `Receipt/output SHA mismatch for job ${job.job_id}.`,
      created_at: job.updated_at || job.completed_at || job.created_at,
      source: "job-api",
    })),
    ...zipValidationFailure.map((job) => makeAlert(ackedAlerts, {
      id: alertId("zip_validation_failure", job.job_id),
      severity: "critical",
      category: "render",
      message: `ZIP validation failure for job ${job.job_id}.`,
      created_at: job.failed_at || job.updated_at || job.created_at,
      source: "job-api",
    })),
  ].sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
  const activeAlerts = alerts.filter((alert) => !alert.resolved);
  const health_status = alertHealthStatus(alerts);
  return {
    ok: true,
    generated_at: new Date().toISOString(),
    health_status,
    system: {
      api_status: "ok",
      overall_status: health_status,
      jobs_api: "ok",
      worker_status_path_exists: existsSync(WORKER_STATUS_PATH),
      data_dir: DATA_DIR ? "configured" : "local-default",
    },
    render: {
      jobs_queued: progressJobs.filter((job) => ["queued", "submitted", "leased"].includes(job.status)).length,
      jobs_rendering: progressJobs.filter((job) => job.status === "running").length,
      jobs_completed_today: completedToday.length,
      failed_today: failedToday.length,
      average_render_time_seconds: averageSeconds(completedToday, "started_at", "completed_at")
        ?? averageSeconds(completedToday, "render_started_at", "render_completed_at"),
      average_queue_wait_seconds: averageSeconds(progressJobs.filter((job) => job.started_at), "submitted_at", "started_at"),
    },
    nodes: workerSummaryFromStatus(workerStatus, progressJobs),
    financial: {
      wallet_debits_today_cents: centsSum(txnsToday.filter((txn) => txn.type === "debit")),
      wallet_credits_today_cents: centsSum(txnsToday.filter((txn) => ["credit", "refund", "adjustment"].includes(txn.type))),
      revenue_today_cents: centsSum(receiptsToday.filter((receipt) => receipt.payment_status === "captured")),
      receipts_minted_today: receiptsToday.length,
    },
    storage: {
      upload_storage_bytes: await directoryBytes(UPLOAD_DIR),
      output_storage_bytes: await directoryBytes(OUTPUT_DIR),
      free_disk_bytes: fsStats?.free_bytes ?? null,
      disk_used_percent: fsStats?.disk_used_percent ?? null,
      free_inodes: fsStats?.free_inodes ?? null,
      inode_used_percent: fsStats?.inode_used_percent ?? null,
      recent_zip_count: await countRecentZips(),
    },
    recent: {
      jobs: progressJobs
        .sort((a, b) => String(b.updated_at || b.created_at || "").localeCompare(String(a.updated_at || a.created_at || "")))
        .slice(0, 20)
        .map(safeOpsJob),
      receipts: receipts
        .sort((a, b) => String(b.receipt_created_at || b.created_at || "").localeCompare(String(a.receipt_created_at || a.created_at || "")))
        .slice(0, 20)
        .map(safeOpsReceipt),
      failures: progressJobs
        .filter((job) => job.status === "failed")
        .sort((a, b) => String(b.failed_at || b.updated_at || "").localeCompare(String(a.failed_at || a.updated_at || "")))
        .slice(0, 20)
        .map(safeOpsJob),
    },
    alerts,
    alert_counts: {
      critical: activeAlerts.filter((alert) => alert.severity === "critical").length,
      warn: activeAlerts.filter((alert) => alert.severity === "warn").length,
      info: activeAlerts.filter((alert) => alert.severity === "info").length,
      active: activeAlerts.length,
      resolved: alerts.length - activeAlerts.length,
    },
  };
};

const parseOutputRequest = async (req) => {
  const body = await readRawBody(req);
  const contentType = String(req.headers["content-type"] || "");
  if (contentType.includes("application/json")) {
    const parsed = body.length ? JSON.parse(body.toString("utf8")) : {};
    const filename = safeName(parsed.filename || "result.zip");
    const bytes = Buffer.from(String(parsed.content_base64 || ""), "base64");
    return { filename, bytes };
  }
  return {
    filename: headerFilename(req.headers).replace(/^upload\.blend$/i, "result.zip"),
    bytes: body,
  };
};

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://${req.headers.host || `${HOST}:${PORT}`}`);
    const pathname = url.pathname.replace(/\/+$/, "");

    if (req.method === "OPTIONS") {
      return send(res, 204, {});
    }

    if (req.method === "GET" && (pathname === "/node/v1/health" || pathname === "/health")) {
      return send(res, 200, { ok: true, service: "farpy-job-api", ts: new Date().toISOString() });
    }

    if (req.method === "GET" && pathname === "/node/v1/worker/status") {
      const counts = await queueCounts();
      if (!existsSync(WORKER_STATUS_PATH)) {
        return send(res, 200, {
          ok: true,
          running: false,
          poll_seconds: 5,
          processed_jobs: 0,
          submitted_jobs: counts.submitted,
          running_jobs: counts.running,
          queue_cap: QUEUE_CAP,
        });
      }
      const status = JSON.parse(await readFile(WORKER_STATUS_PATH, "utf8"));
      const heartbeatAt = status.heartbeat_at ? new Date(status.heartbeat_at).getTime() : 0;
      const running = Number.isFinite(heartbeatAt) && Date.now() - heartbeatAt < 15000;
      return send(res, 200, {
        ok: true,
        running,
        poll_seconds: status.poll_seconds || 5,
        processed_jobs: status.processed_jobs || 0,
        submitted_jobs: counts.submitted,
        running_jobs: counts.running,
        queue_cap: QUEUE_CAP,
      });
    }

    if (req.method === "GET" && pathname === "/node/v1/ops/summary") {
      if (!OPS_TOKEN) return send(res, 404, { ok: false, error: "not_found" });
      if (!opsTokenOk(req)) return send(res, 403, { ok: false, error: "forbidden" });
      return send(res, 200, await buildOpsSummary());
    }

    if (req.method === "POST" && pathname === "/node/v1/ops/alerts/ack") {
      if (!OPS_TOKEN) return send(res, 404, { ok: false, error: "not_found" });
      if (!opsTokenOk(req)) return send(res, 403, { ok: false, error: "forbidden" });
      const raw = await readRawBody(req);
      let body = {};
      try {
        body = raw.length ? JSON.parse(raw.toString("utf8")) : {};
      } catch {
        return send(res, 400, { ok: false, error: "invalid_json" });
      }
      const ids = Array.isArray(body.ids) ? body.ids.map((id) => String(id || "").trim()).filter(Boolean) : [];
      if (!ids.length) return send(res, 400, { ok: false, error: "missing_alert_ids" });
      const acked = await loadAckedAlertIds();
      for (const id of ids) acked.add(id);
      await saveAckedAlertIds(acked);
      return send(res, 200, { ok: true, acknowledged: ids.length });
    }

    if (pathname === "/node/v1/nodemuncher/lease/peek" && req.method === "POST") {
      const auth = await requireNodeTokenAuth(req);
      if (!auth.ok) return send(res, 403, { ok: false, error: "forbidden" });
      const body = await jsonBodyOrEmpty(req);
      const renderer = normalizeLeaseRenderer(body, req, url);
      const requestedJobId = String(body.job_id || url.searchParams.get("job_id") || "").trim();
      const jobs = await sortedSubmittedJobs();
      const job = jobs.find((candidate) => {
        if (requestedJobId && candidate.job_id !== requestedJobId) return false;
        return isNodeLeaseEligible(candidate, renderer);
      });
      return send(res, 200, {
        ok: true,
        node_id: auth.node.node_id,
        job: job ? nodeLeaseJob(job) : null,
      });
    }

    if (pathname === "/node/v1/nodemuncher/lease/claim" && req.method === "POST") {
      const auth = await requireNodeTokenAuth(req);
      if (!auth.ok) return send(res, 403, { ok: false, error: "forbidden" });
      const body = await jsonBodyOrEmpty(req);
      const renderer = normalizeLeaseRenderer(body, req, url);
      const requestedJobId = String(body.job_id || url.searchParams.get("job_id") || "").trim();
      const jobs = await sortedSubmittedJobs();
      const alreadyClaimed = (await listJobs()).find((candidate) => {
        if (requestedJobId && candidate.job_id !== requestedJobId) return false;
        return candidate.claimed_by === "nodemuncher"
          && candidate.node_id === auth.node.node_id
          && (candidate.status === "running" || candidate.status === "leased");
      });
      if (alreadyClaimed) {
        return send(res, 200, {
          ok: true,
          node_id: auth.node.node_id,
          idempotent: true,
          job: nodeLeaseJob(alreadyClaimed),
        });
      }
      const job = jobs.find((candidate) => {
        if (requestedJobId && candidate.job_id !== requestedJobId) return false;
        return isNodeLeaseEligible(candidate, renderer);
      });
      if (!job) {
        if (requestedJobId) {
          const requested = await loadJob(requestedJobId);
          if (requested && requested.status === "submitted" && requested.payment_status !== "captured") {
            return send(res, 402, { ok: false, error: "payment_required" });
          }
          return send(res, 409, { ok: false, error: "job_not_claimable" });
        }
        return send(res, 200, { ok: true, node_id: auth.node.node_id, job: null });
      }
      const now = new Date().toISOString();
      job.status = "running";
      job.node_id = auth.node.node_id;
      job.worker_id = auth.node.node_id;
      job.lease_id = job.lease_id || leaseIdFor(job, auth.node.node_id);
      job.claimed_at = job.claimed_at || now;
      job.claimed_by = "nodemuncher";
      job.started_at = job.started_at || now;
      job.updated_at = now;
      await saveJob(job);
      return send(res, 200, {
        ok: true,
        node_id: auth.node.node_id,
        job: nodeLeaseJob(job),
      });
    }
    if (pathname === "/node/v1/worker/claim" && req.method === "POST") {
      if (!workerTokenOk(req, url)) return send(res, 404, { ok: false, error: "not_found" });
      const wantRenderer = String(req.headers["x-farpy-renderer"] || url.searchParams.get("renderer") || "").toLowerCase();
      const workerId = String(req.headers["x-farpy-worker-id"] || url.searchParams.get("worker_id") || "unknown").slice(0, 80);
      const jobs = (await listJobs()).sort((a, b) => String(a.submitted_at || a.updated_at || "").localeCompare(String(b.submitted_at || b.updated_at || "")));
      const job = jobs.find((candidate) => {
        if (candidate.status !== "submitted") return false;
        if (candidate.nodemuncher_smoke === true) return false;
        const renderer = String(candidate.renderer || "").toLowerCase();
        return wantRenderer ? renderer === wantRenderer : renderer === "blender";
      });
      if (!job) return send(res, 200, { ok: true, job: null });
      job.status = "running";
      job.started_at = job.started_at || new Date().toISOString();
      job.updated_at = job.started_at;
      job.worker_id = workerId;
      await saveJob(job);
      return send(res, 200, {
        ok: true,
        job: {
          job_id: job.job_id,
          upload_id: job.upload_id,
          filename: job.filename,
          renderer: job.renderer,
          frame_start: job.frame_start || 1,
          frame_end: job.frame_end || job.frame_count || 1,
          frame_count: job.frame_count || 1,
          samples: job.samples || 16,
          render_target: job.render_target || "Render target",
          download_upload_url: `/node/v1/worker/jobs/${encodeURIComponent(job.job_id)}/input`,
        },
      });
    }

    const workerInputMatch = pathname.match(/^\/node\/v1\/worker\/jobs\/([^/]+)\/input$/);
    if (workerInputMatch && req.method === "GET") {
      if (!workerTokenOk(req, url)) return send(res, 404, { ok: false, error: "not_found" });
      const job = await loadJob(decodeURIComponent(workerInputMatch[1]));
      if (!job || !job.upload || !job.upload.stored_path || !existsSync(job.upload.stored_path)) {
        return send(res, 404, { ok: false, error: "not_found" });
      }
      res.writeHead(200, {
        "content-type": "application/octet-stream",
        "cache-control": "no-store",
        "x-farpy-job-id": job.job_id,
        "x-farpy-renderer": job.renderer || "",
      });
      return createReadStream(job.upload.stored_path).pipe(res);
    }

    const nodeInputMatch = pathname.match(/^\/node\/v1\/(?:web-render\/)?nodemuncher\/jobs\/([^/]+)\/input$/);
    if (nodeInputMatch && req.method === "GET") {
      const auth = await requireNodeTokenAuth(req);
      if (!auth.ok) return send(res, 403, { ok: false, error: "forbidden" });
      const job = await loadJob(decodeURIComponent(nodeInputMatch[1]));
      if (!job || job.claimed_by !== "nodemuncher" || job.node_id !== auth.node.node_id) {
        return send(res, 404, { ok: false, error: "not_found" });
      }
      if (!job.upload || !job.upload.stored_path || !existsSync(job.upload.stored_path)) {
        return send(res, 404, { ok: false, error: "not_found" });
      }
      res.writeHead(200, {
        "content-type": "application/octet-stream",
        "cache-control": "no-store",
        "x-farpy-job-id": job.job_id,
        "x-farpy-renderer": job.renderer || "",
      });
      return createReadStream(job.upload.stored_path).pipe(res);
    }

    const nodeProgressMatch = pathname.match(/^\/node\/v1\/(?:web-render\/)?nodemuncher\/jobs\/([^/]+)\/progress$/);
    if (nodeProgressMatch && req.method === "POST") {
      const auth = await requireNodeTokenAuth(req);
      if (!auth.ok) return send(res, 403, { ok: false, error: "forbidden" });
      const job = await loadJob(decodeURIComponent(nodeProgressMatch[1]));
      if (!job || job.claimed_by !== "nodemuncher" || job.node_id !== auth.node.node_id) {
        return send(res, 404, { ok: false, error: "not_found" });
      }
      if (job.status !== "running" && job.status !== "leased") {
        return send(res, 409, { ok: false, error: "job_not_running" });
      }
      const body = await jsonBodyOrEmpty(req);
      const frameCount = Number.isInteger(job.frame_count) && job.frame_count > 0 ? job.frame_count : 1;
      const rawCount = Number(
        body.rendered_frame_count
        ?? body.rendered_file_count
        ?? req.headers["x-farpy-rendered-frame-count"]
        ?? req.headers["x-farpy-rendered-file-count"]
        ?? url.searchParams.get("rendered_frame_count")
      );
      if (!Number.isInteger(rawCount) || rawCount < 0) {
        return send(res, 400, { ok: false, error: "invalid_rendered_frame_count" });
      }
      const rendered = Math.min(frameCount, rawCount);
      job.rendered_frame_count = rendered;
      job.rendered_file_count = Math.max(Number(job.rendered_file_count || 0), rendered);
      job.progress_percent = Math.min(100, Math.max(0, Math.round((rendered / frameCount) * 100)));
      job.updated_at = new Date().toISOString();
      await saveJob(job);
      return send(res, 200, publicJob(await withProgress(job)));
    }

    const workerCompleteMatch = pathname.match(/^\/node\/v1\/worker\/jobs\/([^/]+)\/complete$/);
    if (workerCompleteMatch && req.method === "POST") {
      if (!workerTokenOk(req, url)) return send(res, 404, { ok: false, error: "not_found" });
      const job = await loadJob(decodeURIComponent(workerCompleteMatch[1]));
      if (!job) return send(res, 404, { ok: false, error: "not_found" });
      if (job.status !== "running" && job.status !== "submitted") return send(res, 409, { ok: false, error: "job_not_running" });
      const raw = await readRawBody(req);
      const renderedCount = Number(req.headers["x-farpy-rendered-file-count"] || url.searchParams.get("rendered_file_count"));
      const validation = validateWorkerZip(job, raw, renderedCount);
      if (!validation.ok) return send(res, 400, { ok: false, error: validation.error });
      await mkdir(OUTPUT_DIR, { recursive: true });
      const out = path.join(OUTPUT_DIR, `${job.job_id}.zip`);
      await writeFile(out, raw);
      const now = new Date().toISOString();
      job.status = "complete";
      job.output_path = out;
      job.output_filename = `${job.job_id}.zip`;
      job.output_sha256 = sha256(raw);
      job.output_size_bytes = raw.length;
      job.output_attached_at = now;
      job.rendered_file_count = renderedCount;
      job.rendered_frame_count = renderedCount;
      job.output_files = validation.output_files;
      job.render_completed_at = now;
      job.completed_at = now;
      job.updated_at = now;
      job.worker_id = String(req.headers["x-farpy-worker-id"] || job.worker_id || "unknown").slice(0, 80);
      await saveJob(job);
      const minted = await mintReceipt(job.job_id);
      return send(res, 200, publicJob(minted.job));
    }

    const nodeCompleteMatch = pathname.match(/^\/node\/v1\/(?:web-render\/)?nodemuncher\/jobs\/([^/]+)\/complete$/);
    if (nodeCompleteMatch && req.method === "POST") {
      const auth = await requireNodeTokenAuth(req);
      if (!auth.ok) return send(res, 403, { ok: false, error: "forbidden" });
      const job = await loadJob(decodeURIComponent(nodeCompleteMatch[1]));
      if (!job || job.claimed_by !== "nodemuncher" || job.node_id !== auth.node.node_id) {
        return send(res, 404, { ok: false, error: "not_found" });
      }
      if (job.status !== "running" && job.status !== "leased") return send(res, 409, { ok: false, error: "job_not_running" });
      const raw = await readRawBody(req);
      const renderedCount = Number(req.headers["x-farpy-rendered-file-count"] || url.searchParams.get("rendered_file_count"));
      const validation = validateWorkerZip(job, raw, renderedCount);
      if (!validation.ok) return send(res, 400, { ok: false, error: validation.error });
      await mkdir(OUTPUT_DIR, { recursive: true });
      const out = path.join(OUTPUT_DIR, `${job.job_id}.zip`);
      await writeFile(out, raw);
      const now = new Date().toISOString();
      job.status = "complete";
      job.output_path = out;
      job.output_filename = `${job.job_id}.zip`;
      job.output_sha256 = sha256(raw);
      job.output_size_bytes = raw.length;
      job.output_attached_at = now;
      job.rendered_file_count = renderedCount;
      job.rendered_frame_count = renderedCount;
      job.output_files = validation.output_files;
      job.render_completed_at = now;
      job.completed_at = now;
      job.updated_at = now;
      job.worker_id = auth.node.node_id;
      await saveJob(job);
      const minted = await mintReceipt(job.job_id);
      return send(res, 200, publicJob(minted.job));
    }

    const nodeFailMatch = pathname.match(/^\/node\/v1\/(?:web-render\/)?nodemuncher\/jobs\/([^/]+)\/fail$/);
    if (nodeFailMatch && req.method === "POST") {
      const auth = await requireNodeTokenAuth(req);
      if (!auth.ok) return send(res, 403, { ok: false, error: "forbidden" });
      const job = await loadJob(decodeURIComponent(nodeFailMatch[1]));
      if (!job || job.claimed_by !== "nodemuncher" || job.node_id !== auth.node.node_id) {
        return send(res, 404, { ok: false, error: "not_found" });
      }
      if (job.status === "complete") return send(res, 409, { ok: false, error: "job_already_complete" });
      if (job.status === "failed") return send(res, 200, publicJob(job));
      if (job.status !== "running" && job.status !== "leased") return send(res, 409, { ok: false, error: "job_not_running" });
      const raw = await readRawBody(req).catch(() => Buffer.alloc(0));
      let body = {};
      try { body = raw.length ? JSON.parse(raw.toString("utf8")) : {}; } catch {}
      const now = new Date().toISOString();
      job.status = "failed";
      job.failure_reason = String(body.failure_reason || body.error || "NodeMuncher render failed.").slice(0, 300);
      job.failure_stage = String(body.stage || body.failure_stage || "render").slice(0, 80);
      job.failure_code = String(body.failure_code || body.code || job.failure_stage || "nodemuncher_render_failed").slice(0, 80);
      job.retryable = body.retryable === false ? false : true;
      job.failed_at = now;
      job.completed_at = null;
      job.updated_at = now;
      job.worker_id = auth.node.node_id;
      delete job.output_path;
      delete job.output_sha256;
      delete job.output_size_bytes;
      delete job.receipt_id;
      delete job.receipt_path;
      delete job.receipt_created_at;
      await refundFailedWalletDebit(job);
      await saveJob(job);
      return send(res, 200, publicJob(job));
    }

    const workerFailMatch = pathname.match(/^\/node\/v1\/worker\/jobs\/([^/]+)\/fail$/);
    if (workerFailMatch && req.method === "POST") {
      if (!workerTokenOk(req, url)) return send(res, 404, { ok: false, error: "not_found" });
      const job = await loadJob(decodeURIComponent(workerFailMatch[1]));
      if (!job) return send(res, 404, { ok: false, error: "not_found" });
      const raw = await readRawBody(req).catch(() => Buffer.alloc(0));
      let body = {};
      try { body = raw.length ? JSON.parse(raw.toString("utf8")) : {}; } catch {}
      const now = new Date().toISOString();
      job.status = "failed";
      job.failure_reason = String(body.failure_reason || body.error || "Remote worker failed render.").slice(0, 300);
      job.failed_at = now;
      job.completed_at = null;
      job.updated_at = now;
      job.worker_id = String(req.headers["x-farpy-worker-id"] || job.worker_id || "unknown").slice(0, 80);
      delete job.output_path;
      delete job.output_sha256;
      delete job.output_size_bytes;
      delete job.receipt_id;
      delete job.receipt_path;
      delete job.receipt_created_at;
      await refundFailedWalletDebit(job);
      await saveJob(job);
      return send(res, 200, publicJob(job));
    }

    if (req.method === "GET" && (pathname === "/v1/wallet/balance" || pathname === "/node/v1/wallet/balance")) {
      const auth = requireAuth(req);
      if (!auth.ok) return send(res, auth.status, { ok: false, error: auth.error });
      return send(res, 200, {
        ok: true,
        authenticated: true,
        user_id: auth.user_id,
        email: auth.email,
        balance_cents: await walletBalance(auth.user_id),
      });
    }

    if (req.method === "GET" && (pathname === "/v1/wallet/transactions" || pathname === "/node/v1/wallet/transactions")) {
      const auth = requireAuth(req);
      if (!auth.ok) return send(res, auth.status, { ok: false, error: auth.error });
      const txns = await readWalletTransactions(auth.user_id);
      return send(res, 200, {
        ok: true,
        user_id: auth.user_id,
        email: auth.email,
        balance_cents: txns.length ? txns[txns.length - 1].balance_after_cents : 0,
        transactions: publicWalletTransactions(txns),
      });
    }

    if (req.method === "GET" && (pathname === "/v1/account/renders" || pathname === "/node/v1/account/renders")) {
      const auth = requireAuth(req);
      if (!auth.ok) return send(res, auth.status, { ok: false, error: auth.error });
      return send(res, 200, {
        ok: true,
        user_id: auth.user_id,
        email: auth.email,
        renders: await publicAccountRenders(auth.user_id),
      });
    }

    if (req.method === "POST" && (pathname === "/checkout" || pathname === "/v1/wallet/topup/session" || pathname === "/node/v1/wallet/topup/session")) {
      let body = {};
      try {
        const raw = await readRawBody(req);
        body = raw.length ? JSON.parse(raw.toString("utf8")) : {};
      } catch {
        return send(res, 400, { ok: false, error: "invalid_json" });
      }
      const result = await createWalletTopupSession(req, body);
      if (!result.ok) return send(res, result.status, { ok: false, error: result.error });
      return send(res, 200, result);
    }
    if (req.method === "POST" && (
      pathname === "/v1/wallet/topup/btcpay/invoice"
      || pathname === "/node/v1/wallet/topup/btcpay/invoice"
      || pathname === "/node/v1/btcpay/invoice"
      || pathname === "/btcpay/invoice"
    )) {
      let body = {};
      try {
        const raw = await readRawBody(req);
        body = raw.length ? JSON.parse(raw.toString("utf8")) : {};
      } catch {
        return send(res, 400, { ok: false, error: "invalid_json" });
      }
      const result = await createLightningTopupInvoice(req, body);
      if (!result.ok) return send(res, result.status, { ok: false, error: result.error });
      return send(res, 200, result);
    }
    if (req.method === "POST" && (
      pathname === "/v1/wallet/topup/btcpay/bitcoin-invoice"
      || pathname === "/node/v1/wallet/topup/btcpay/bitcoin-invoice"
      || pathname === "/node/v1/btcpay/bitcoin-invoice"
      || pathname === "/btcpay/bitcoin-invoice"
    )) {
      let body = {};
      try {
        const raw = await readRawBody(req);
        body = raw.length ? JSON.parse(raw.toString("utf8")) : {};
      } catch {
        return send(res, 400, { ok: false, error: "invalid_json" });
      }
      const result = await createBitcoinTopupInvoice(req, body);
      if (!result.ok) return send(res, result.status, { ok: false, error: result.error });
      return send(res, 200, result);
    }

    if (req.method === "POST" && (pathname === "/node/v1/btcpay/webhook" || pathname === "/btcpay/webhook")) {
      const raw = await readRawBody(req);
      if (!btcpayWebhookSignatureValid(raw, req.headers["btcpay-sig"])) {
        return send(res, 400, { ok: false, error: "invalid_signature" });
      }
      const event = JSON.parse(raw.toString("utf8"));
      const result = await finalizeBtcpayWebhook(event);
      if (!result.ok) return send(res, result.status, { ok: false, error: result.error });
      return send(res, 200, {
        ok: true,
        ignored: !!result.ignored,
        duplicate: !!result.duplicate,
        reason: result.reason || null,
      });
    }

    if (req.method === "POST" && pathname === "/node/v1/jobs/create") {
      const queue = await ensureQueueRoom();
      if (!queue.ok) return send(res, queue.status, { ok: false, error: queue.error });
      const raw = await readRawBody(req);
      let body = {};
      try {
        body = raw.length ? JSON.parse(raw.toString("utf8")) : {};
      } catch {
        return send(res, 400, { ok: false, error: "invalid_json" });
      }
      if (body.filename && (!safeName(body.filename) || !validUploadName(safeName(body.filename)))) {
        return send(res, 400, { ok: false, error: "unsupported_file_type" });
      }
      const job = await createJob({ ...body, ...(wantsNodeMuncherSmoke(body, req, url) ? { nodemuncher_smoke: true } : {}), ...authFromRequest(req) });
      return send(res, 200, {
        ok: true,
        job_id: job.job_id,
        download_token: job.download_token,
        receipt_token: job.receipt_token,
      });
    }

    if (req.method === "POST" && pathname === "/node/v1/uploads/create") {
      const queue = await ensureQueueRoom();
      if (!queue.ok) return send(res, queue.status, { ok: false, error: queue.error });
      const uploadInput = await parseUploadRequest(req);
      if (!uploadInput.bytes.length) return send(res, 400, { ok: false, error: "empty_upload" });
      if (!uploadInput.filename || !validUploadName(uploadInput.filename)) {
        return send(res, 400, { ok: false, error: "unsupported_file_type" });
      }

      const upload = await saveUpload(uploadInput);
      const frames = frameContract(uploadInput) || frameContract({});
      const price = frames.frame_count;
      const job = await createJob({
        filename: upload.filename,
        renderer: inferRenderer(upload.filename, uploadInput.renderer),
        upload_id: upload.upload_id,
        upload,
        ...frames,
        price_cents: price,
        ...(wantsNodeMuncherSmoke(uploadInput, req, url) ? { nodemuncher_smoke: true } : {}),
        ...authFromRequest(req),
      });

      return send(res, 200, {
        ok: true,
        upload_id: upload.upload_id,
        filename: upload.filename,
        size_bytes: upload.size_bytes,
        sha256: upload.sha256,
        job_id: job.job_id,
        price_cents: job.price_cents,
        payment_status: job.payment_status,
        download_token: job.download_token,
        receipt_token: job.receipt_token,
      });
    }

    const submitMatch = pathname.match(/^\/node\/v1\/jobs\/([^/]+)\/submit-render$/);
    if (req.method === "POST" && submitMatch) {
      const result = await submitRender(decodeURIComponent(submitMatch[1]), authFromRequest(req));
      if (!result.ok) return send(res, result.status, { ok: false, error: result.error });
      return send(res, 200, publicJob(result.job));
    }

    const markMatch = pathname.match(/^\/node\/v1\/jobs\/([^/]+)\/mark-(running|complete|failed)$/);
    if (req.method === "POST" && markMatch) {
      if (IS_PRODUCTION) return send(res, 404, { ok: false, error: "not_found" });
      const result = await markJob(decodeURIComponent(markMatch[1]), markMatch[2]);
      if (!result.ok) return send(res, result.status, { ok: false, error: result.error });
      return send(res, 200, publicJob(result.job));
    }

    const attachOutputMatch = pathname.match(/^\/node\/v1\/jobs\/([^/]+)\/attach-output$/);
    if (req.method === "POST" && attachOutputMatch) {
      if (IS_PRODUCTION) return send(res, 404, { ok: false, error: "not_found" });
      const outputInput = await parseOutputRequest(req);
      const result = await attachOutput(decodeURIComponent(attachOutputMatch[1]), outputInput);
      if (!result.ok) return send(res, result.status, { ok: false, error: result.error });
      return send(res, 200, publicJob(result.job));
    }

    const mintReceiptMatch = pathname.match(/^\/node\/v1\/jobs\/([^/]+)\/mint-receipt$/);
    if (req.method === "POST" && mintReceiptMatch) {
      if (IS_PRODUCTION) return send(res, 404, { ok: false, error: "not_found" });
      const result = await mintReceipt(decodeURIComponent(mintReceiptMatch[1]));
      if (!result.ok) return send(res, result.status, { ok: false, error: result.error });
      return send(res, 200, publicJob(result.job));
    }

    const priceMatch = pathname.match(/^\/node\/v1\/jobs\/([^/]+)\/price$/);
    if (req.method === "POST" && priceMatch) {
      const raw = await readRawBody(req);
      let body = {};
      try {
        body = raw.length ? JSON.parse(raw.toString("utf8")) : {};
      } catch {
        return send(res, 400, { ok: false, error: "invalid_json" });
      }
      const result = await priceJob(decodeURIComponent(priceMatch[1]), body);
      if (!result.ok) return send(res, result.status, { ok: false, error: result.error });
      return send(res, 200, publicJob(result.job));
    }

    const checkoutMatch = pathname.match(/^\/node\/v1\/jobs\/([^/]+)\/create-checkout-session$/);
    if (req.method === "POST" && checkoutMatch) {
      const auth = requireAuth(req);
      if (!auth.ok) return send(res, auth.status, { ok: false, error: auth.error });
      const result = await createStripeCheckoutSession(decodeURIComponent(checkoutMatch[1]));
      if (!result.ok) return send(res, result.status, { ok: false, error: result.error });
      return send(res, 200, {
        ok: true,
        job_id: result.job.job_id,
        checkout_session_id: result.job.checkout_session_id,
        checkout_url: result.checkout_url,
        payment_status: result.job.payment_status,
      });
    }

    if (req.method === "POST" && (pathname === "/node/v1/stripe/webhook" || pathname === "/stripe/webhook")) {
      const raw = await readRawBody(req);
      if (!stripeSignatureValid(raw, req.headers["stripe-signature"])) {
        return send(res, 400, { ok: false, error: "invalid_signature" });
      }
      const event = JSON.parse(raw.toString("utf8"));
      const result = await finalizeStripeCheckoutSession(event, event.data?.object || {});
      if (!result.ok) return send(res, result.status, { ok: false, error: result.error });
      return send(res, 200, {
        ok: true,
        ignored: !!result.ignored,
        duplicate: !!result.duplicate,
        already_captured: !!result.already_captured,
      });
    }

    const authPaymentMatch = pathname.match(/^\/node\/v1\/jobs\/([^/]+)\/authorize-payment-dev$/);
    if (req.method === "POST" && authPaymentMatch) {
      if (IS_PRODUCTION) return send(res, 404, { ok: false, error: "not_found" });
      const result = await authorizePaymentDev(decodeURIComponent(authPaymentMatch[1]));
      if (!result.ok) return send(res, result.status, { ok: false, error: result.error });
      return send(res, 200, publicJob(result.job));
    }

    const capturePaymentMatch = pathname.match(/^\/node\/v1\/jobs\/([^/]+)\/capture-payment-dev$/);
    if (req.method === "POST" && capturePaymentMatch) {
      if (IS_PRODUCTION) return send(res, 404, { ok: false, error: "not_found" });
      const result = await capturePaymentDev(decodeURIComponent(capturePaymentMatch[1]));
      if (!result.ok) return send(res, result.status, { ok: false, error: result.error });
      return send(res, 200, publicJob(result.job));
    }

    const failPaymentMatch = pathname.match(/^\/node\/v1\/jobs\/([^/]+)\/fail-payment-dev$/);
    if (req.method === "POST" && failPaymentMatch) {
      if (IS_PRODUCTION) return send(res, 404, { ok: false, error: "not_found" });
      const result = await failPaymentDev(decodeURIComponent(failPaymentMatch[1]));
      if (!result.ok) return send(res, result.status, { ok: false, error: result.error });
      return send(res, 200, publicJob(result.job));
    }

    const downloadMatch = pathname.match(/^\/node\/v1\/jobs\/([^/]+)\/download$/);
    if (req.method === "GET" && downloadMatch) {
      const job = await loadJob(decodeURIComponent(downloadMatch[1]));
      if (!job || !safeTokenEqual(url.searchParams.get("token"), job.download_token)) {
        return send(res, 404, { ok: false, error: "not_found" });
      }
      if (!job.output_path || !existsSync(job.output_path)) {
        return send(res, 404, { ok: false, error: "not_found" });
      }
      return sendFile(res, job);
    }

    const receiptMatch = pathname.match(/^\/node\/v1\/jobs\/([^/]+)\/receipt$/);
    if (req.method === "GET" && receiptMatch) {
      const job = await loadJob(decodeURIComponent(receiptMatch[1]));
      if (!job || !safeTokenEqual(url.searchParams.get("token"), job.receipt_token)) {
        return send(res, 404, { ok: false, error: "not_found" });
      }
      if (!job.receipt_path || !existsSync(job.receipt_path)) {
        return send(res, 404, { ok: false, error: "not_found" });
      }
      const receipt = JSON.parse(await readFile(job.receipt_path, "utf8"));
      return send(res, 200, receipt);
    }

    const match = pathname.match(/^\/node\/v1\/jobs\/([^/]+)$/);
    if (req.method === "GET" && match) {
      const job = await loadJob(decodeURIComponent(match[1]));
      if (!job) return send(res, 404, { ok: false, error: "job_not_found" });
      const progressed = await withProgress(job);
      if (!isAuthenticatedOwner(req, job)) {
        return send(res, 200, publicJobSafeStatus(progressed));
      }
      return send(res, 200, publicJob(progressed, { includePrivateUrls: true }));
    }

    return send(res, 404, { ok: false, error: "not_found" });
  } catch (error) {
    console.error(error);
    if (error?.code === "UPLOAD_TOO_LARGE") {
      return send(res, 413, { ok: false, error: "upload_too_large" });
    }
    return send(res, 500, { ok: false, err: "internal_error" });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Farpy Job API listening on http://${HOST}:${PORT}`);
  console.log(`Job store: ${STORE_DIR}`);
  console.log(`Upload store: ${UPLOAD_DIR}`);
  console.log(`Output store: ${OUTPUT_DIR}`);
  console.log(`Receipt store: ${RECEIPT_DIR}`);
});



