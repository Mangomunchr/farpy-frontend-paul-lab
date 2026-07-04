import { execFile, spawn } from "node:child_process";
import { appendFile, copyFile, mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { promisify } from "node:util";

const DATA_DIR = process.env.FARPY_WEB_RENDER_DATA_DIR
  ? path.resolve(process.env.FARPY_WEB_RENDER_DATA_DIR)
  : null;
const POLL_SECONDS = Number(process.env.FARPY_WORKER_POLL_SECONDS || 5);
const STORE_DIR = path.resolve(process.env.FARPY_JOB_STORE_DIR || (DATA_DIR ? path.join(DATA_DIR, "jobs") : ".farpy-jobs"));
const OUTPUT_DIR = path.resolve(process.env.FARPY_OUTPUT_STORE_DIR || (DATA_DIR ? path.join(DATA_DIR, "outputs") : ".farpy-outputs"));
const RECEIPT_DIR = path.resolve(process.env.FARPY_RECEIPT_STORE_DIR || (DATA_DIR ? path.join(DATA_DIR, "receipts") : ".farpy-receipts"));
const WALLET_DIR = path.resolve(process.env.FARPY_WALLET_STORE_DIR || (DATA_DIR ? path.join(DATA_DIR, "wallet") : ".farpy-wallet"));
const WORK_DIR = path.resolve(process.env.FARPY_WORK_DIR || (DATA_DIR ? path.join(DATA_DIR, "work") : ".farpy-work"));
const STATUS_PATH = path.resolve(process.env.FARPY_WORKER_STATUS_PATH || (DATA_DIR ? path.join(DATA_DIR, "worker-status.json") : ".farpy-worker-status.json"));
const RENDER_TIMEOUT_MS = Number(process.env.FARPY_RENDER_TIMEOUT_MS || 1200000);
const BASE_RENDER_TIMEOUT_SECONDS = Number(process.env.FARPY_BASE_RENDER_TIMEOUT_SECONDS || 600);
const PER_FRAME_RENDER_TIMEOUT_SECONDS = Number(process.env.FARPY_PER_FRAME_RENDER_TIMEOUT_SECONDS || 180);
const SUBMITTED_STALE_MS = Number(process.env.FARPY_SUBMITTED_STALE_MS || 24 * 60 * 60 * 1000);
const RUNNING_ORPHAN_GRACE_MS = Number(process.env.FARPY_RUNNING_ORPHAN_GRACE_MS || 120000);

let processedJobs = 0;

const execFileAsync = promisify(execFile);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const safeName = (name) => path.basename(String(name || "result.zip")).replace(/[^\w.\- ]+/g, "_").trim() || "result.zip";
const jobPath = (jobId) => path.join(STORE_DIR, `${jobId}.json`);
const walletPath = (userId) => path.join(WALLET_DIR, `${createHash("sha256").update(String(userId)).digest("hex")}.jsonl`);
const outputPath = (outputId, filename) => path.join(OUTPUT_DIR, `${outputId}-${safeName(filename)}`);
const receiptPath = (receiptId) => path.join(RECEIPT_DIR, `${receiptId}.json`);
const workOutputDir = (job) => path.join(WORK_DIR, job.job_id, "output");

const blenderCandidates = () => [
  process.env.BLENDER_EXE,
  "C:\\Program Files\\Blender Foundation\\Blender 4.1\\blender.exe",
  "C:\\Program Files\\Blender Foundation\\Blender 4.2\\blender.exe",
  "C:\\Program Files\\Blender Foundation\\Blender 4.3\\blender.exe",
  "C:\\Program Files\\Blender Foundation\\Blender 4.4\\blender.exe",
  "C:\\Program Files\\Blender Foundation\\Blender 4.5\\blender.exe",
  "/usr/local/bin/blender",
  "/usr/bin/blender",
].filter(Boolean);

const locateBlender = () => blenderCandidates().find((candidate) => existsSync(candidate)) || null;

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const byte of buf) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

const dosDateTime = (date = new Date()) => {
  const time = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
  const dosDate = ((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  return { time, date: dosDate };
};

const u16 = (value) => {
  const b = Buffer.alloc(2);
  b.writeUInt16LE(value & 0xffff);
  return b;
};

const u32 = (value) => {
  const b = Buffer.alloc(4);
  b.writeUInt32LE(value >>> 0);
  return b;
};

const createZip = (files) => {
  const localParts = [];
  const centralParts = [];
  let offset = 0;
  const stamp = dosDateTime();

  for (const file of files) {
    const name = Buffer.from(file.name.replace(/\\/g, "/"), "utf8");
    const data = Buffer.isBuffer(file.data) ? file.data : Buffer.from(String(file.data));
    const crc = crc32(data);
    const local = Buffer.concat([
      u32(0x04034b50), u16(20), u16(0), u16(0), u16(stamp.time), u16(stamp.date),
      u32(crc), u32(data.length), u32(data.length), u16(name.length), u16(0), name, data,
    ]);
    localParts.push(local);
    centralParts.push(Buffer.concat([
      u32(0x02014b50), u16(20), u16(20), u16(0), u16(0), u16(stamp.time), u16(stamp.date),
      u32(crc), u32(data.length), u32(data.length), u16(name.length), u16(0), u16(0),
      u16(0), u16(0), u32(0), u32(offset), name,
    ]));
    offset += local.length;
  }

  const central = Buffer.concat(centralParts);
  const end = Buffer.concat([
    u32(0x06054b50), u16(0), u16(0), u16(files.length), u16(files.length),
    u32(central.length), u32(offset), u16(0),
  ]);
  return Buffer.concat([...localParts, central, end]);
};

const listFiles = async (dir, base = dir) => {
  if (!existsSync(dir)) return [];
  const entries = await readdir(dir, { withFileTypes: true });
  const found = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) found.push(...await listFiles(full, base));
    else found.push({ full, relative: path.relative(base, full).replace(/\\/g, "/") });
  }
  return found;
};

const runProcess = (exe, args, cwd, timeoutMs = RENDER_TIMEOUT_MS) => new Promise((resolve) => {
  const child = spawn(exe, args, { cwd, windowsHide: true, detached: process.platform !== "win32" });
  let stdout = "";
  let stderr = "";
  let settled = false;
  let timedOut = false;
  const finish = (result) => {
    if (settled) return;
    settled = true;
    clearTimeout(timer);
    resolve(result);
  };
  const timer = setTimeout(() => {
    timedOut = true;
    stderr += "\nRender timed out.";
    try {
      if (process.platform !== "win32" && child.pid) process.kill(-child.pid, "SIGKILL");
      else child.kill("SIGKILL");
    } catch {
      child.kill("SIGKILL");
    }
  }, timeoutMs);
  child.stdout?.on("data", (chunk) => { stdout += chunk.toString(); });
  child.stderr?.on("data", (chunk) => { stderr += chunk.toString(); });
  child.on("error", (error) => finish({ code: -1, stdout, stderr: `${stderr}${error.message}`, timedOut }));
  child.on("close", (code) => finish({ code: code ?? -1, stdout, stderr, timedOut }));
});

const loadJob = async (file) => JSON.parse(await readFile(file, "utf8"));

const renderTimeoutForJob = (job) => {
  if (Number.isInteger(job.render_timeout_ms) && job.render_timeout_ms > 0) return job.render_timeout_ms;
  const frames = Number.isInteger(job.frame_count) && job.frame_count > 0 ? job.frame_count : 1;
  return (BASE_RENDER_TIMEOUT_SECONDS + PER_FRAME_RENDER_TIMEOUT_SECONDS * frames) * 1000;
};

const statusMeta = (job) => {
  const outputExists = !!job.output_path && existsSync(job.output_path);
  const receiptExists = !!job.receipt_path && existsSync(job.receipt_path);
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
  return {
    status_label: job.status === "failed" ? "Failed" : "Submitted",
    status_message: job.status === "failed"
      ? "Render failed. No charge should finalize without receipt."
      : "Render request accepted. Waiting for worker.",
    next_action: job.status === "failed" ? "Review render" : "Waiting for worker",
    can_start_render: false,
    can_download: false,
    can_view_receipt: false,
  };
};

const saveJob = async (job) => {
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

const appendWalletLedger = async ({ user_id, email, event_id, type, amount_cents, job_id = null }) => {
  await mkdir(WALLET_DIR, { recursive: true });
  const txns = await readWalletTransactions(user_id);
  const existing = txns.find((txn) => String(txn.event_id) === String(event_id));
  if (existing) return { ok: true, duplicate: true, transaction: existing };
  const amount = Number(amount_cents);
  if (!Number.isInteger(amount) || amount < 0) throw new Error("invalid_wallet_amount");
  const current = txns.length ? Number(txns[txns.length - 1].balance_after_cents || 0) : 0;
  const balance_after_cents = current + (type === "debit" ? -amount : amount);
  if (balance_after_cents < 0) throw new Error("insufficient_balance");
  const transaction = {
    user_id,
    email: email || null,
    event_id,
    type,
    amount_cents: amount,
    balance_after_cents,
    job_id,
    stripe_session_id: null,
    payment_intent_id: null,
    created_at: new Date().toISOString(),
  };
  await appendFile(walletPath(user_id), `${JSON.stringify(transaction)}\n`, "utf8");
  return { ok: true, duplicate: false, transaction };
};

const refundWalletDebit = async (job) => {
  const amount = Number(job.wallet_debit_cents || 0);
  if (job.payment_mode !== "wallet" || !job.user_id || !Number.isInteger(amount) || amount <= 0) return null;
  const refund = await appendWalletLedger({
    user_id: job.user_id,
    email: job.email || null,
    event_id: `wallet-refund-${job.job_id}`,
    type: "refund",
    amount_cents: amount,
    job_id: job.job_id,
  });
  return refund.transaction;
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
  job.receipt_id = receiptId;
  job.receipt_path = storedPath;
  job.receipt_created_at = now;
};

const writeWorkerStatus = async () => {
  const jobs = await loadAllJobs();
  const submittedJobs = jobs.filter((job) => job.status === "submitted").length;
  const runningJobs = jobs.filter((job) => job.status === "running").length;
  await writeFile(STATUS_PATH, JSON.stringify({
    ok: true,
    running: true,
    poll_seconds: POLL_SECONDS,
    processed_jobs: processedJobs,
    submitted_jobs: submittedJobs,
    running_jobs: runningJobs,
    heartbeat_at: new Date().toISOString(),
  }, null, 2), "utf8");
};

const failJob = async (job, reason, extra = {}) => {
  const now = new Date().toISOString();
  const refund = await refundWalletDebit(job);
  Object.assign(job, extra, {
    status: "failed",
    failed_at: now,
    completed_at: null,
    updated_at: now,
    failure_reason: reason,
    can_download: false,
    can_view_receipt: false,
  });
  if (refund) {
    job.wallet_refund_cents = refund.amount_cents;
    job.wallet_refund_event_id = refund.event_id;
    job.wallet_refunded_at = refund.created_at;
    job.balance_after_cents = refund.balance_after_cents;
  }
  delete job.output_id;
  delete job.output_filename;
  delete job.output_path;
  delete job.output_sha256;
  delete job.output_size_bytes;
  delete job.output_attached_at;
  delete job.receipt_id;
  delete job.receipt_path;
  delete job.receipt_created_at;
  await saveJob(job);
};

const loadAllJobs = async () => {
  await mkdir(STORE_DIR, { recursive: true });
  const files = (await readdir(STORE_DIR)).filter((name) => name.endsWith(".json"));
  const jobs = [];
  for (const file of files) {
    try {
      jobs.push(await loadJob(path.join(STORE_DIR, file)));
    } catch (error) {
      console.error("job_read_failed", file, error);
    }
  }
  return jobs;
};

const staleAge = (value) => {
  const time = value ? new Date(value).getTime() : 0;
  return Number.isFinite(time) && time > 0 ? Date.now() - time : Infinity;
};

const renderedPngStats = async (job) => {
  try {
    const outputDir = workOutputDir(job);
    const entries = await readdir(outputDir, { withFileTypes: true });
    const pngEntries = entries.filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".png"));
    let newestMtimeMs = 0;
    for (const entry of pngEntries) {
      const info = await stat(path.join(outputDir, entry.name));
      newestMtimeMs = Math.max(newestMtimeMs, info.mtimeMs);
    }
    return { count: pngEntries.length, newestMtimeMs };
  } catch {
    return { count: 0, newestMtimeMs: 0 };
  }
};

const runningOutputIdleMs = (job, pngStats) => {
  if (pngStats.newestMtimeMs > 0) return Date.now() - pngStats.newestMtimeMs;
  return staleAge(job.updated_at || job.started_at);
};

const hasActiveBlenderProcess = async (job) => {
  if (!job.job_id) return false;
  if (process.platform === "win32") return true;
  try {
    const { stdout } = await execFileAsync("pgrep", ["-af", "blender"], { timeout: 2000 });
    return stdout
      .split("\n")
      .some((line) => line.toLowerCase().includes("blender") && line.includes(job.job_id));
  } catch (error) {
    if (error?.code === 1) return false;
    console.error("blender_process_check_failed", job.job_id, error?.message || error);
    return true;
  }
};

const cleanupStaleJobs = async (jobs) => {
  for (const job of jobs) {
    if (job.status === "submitted" && staleAge(job.submitted_at || job.updated_at) > SUBMITTED_STALE_MS) {
      await failJob(job, "Render request expired.");
    }
    if (job.status === "running") {
      const frameCount = Number.isInteger(job.frame_count) && job.frame_count > 0 ? job.frame_count : 1;
      const pngStats = await renderedPngStats(job);
      if (pngStats.count < frameCount) {
        const activeBlender = await hasActiveBlenderProcess(job);
        if (!activeBlender && runningOutputIdleMs(job, pngStats) > RUNNING_ORPHAN_GRACE_MS) {
          await failJob(job, "Render process exited before all frames completed.", {
            rendered_file_count: pngStats.count,
          });
          continue;
        }
      }
      if (staleAge(job.started_at || job.updated_at) > renderTimeoutForJob(job) + 60000) {
        await failJob(job, "Render timed out.");
      }
    }
  }
};

const artifactJobSnapshot = (job) => {
  const snapshot = { ...job };
  delete snapshot.output_path;
  delete snapshot.receipt_path;
  delete snapshot.work_dir;
  delete snapshot.blender_path;
  delete snapshot.download_token;
  delete snapshot.receipt_token;
  if (snapshot.upload) {
    snapshot.upload = { ...snapshot.upload };
    delete snapshot.upload.stored_path;
  }
  return snapshot;
};

const packageOutput = async (job, files, manifest, completedAt) => {
  await mkdir(OUTPUT_DIR, { recursive: true });
  const jobSnapshot = artifactJobSnapshot(job);
  const zip = createZip([
    ...files,
    { name: "job.json", data: JSON.stringify(jobSnapshot, null, 2) },
    { name: "manifest.json", data: JSON.stringify(manifest, null, 2) },
  ]);
  const outputId = `OUT-${randomUUID().slice(0, 8).toUpperCase()}`;
  const outputFilename = `${job.job_id}-result.zip`;
  const storedOutput = outputPath(outputId, outputFilename);
  await writeFile(storedOutput, zip);

  Object.assign(job, {
    status: "complete",
    completed_at: completedAt,
    updated_at: completedAt,
    output_id: outputId,
    output_filename: outputFilename,
    output_path: storedOutput,
    output_sha256: sha256(zip),
    output_size_bytes: zip.length,
    output_attached_at: completedAt,
    rendered_file_count: files.filter((file) => file.name.startsWith("output/")).length,
  });
  await saveReceipt(job);
  await saveJob(job);
  processedJobs += 1;
};

const runDevZipWorker = async (job, workDir, uploaded, uploadInfo, startedAt) => {
  const completedAt = new Date().toISOString();
  const manifest = {
    engine: "dev-zip-worker",
    job_id: job.job_id,
    upload_id: job.upload_id,
    renderer: job.renderer,
    started_at: startedAt,
    completed_at: completedAt,
  };
  Object.assign(job, {
    engine: "dev-zip-worker",
    render_seconds: Math.max(0, (new Date(completedAt).getTime() - new Date(startedAt).getTime()) / 1000),
    work_dir: workDir,
    uploaded_size_bytes: uploadInfo.size,
    uploaded_sha256: sha256(uploaded),
  });
  await packageOutput(job, [], manifest, completedAt);
};

const runBlenderWorker = async (job, workDir, startedAt) => {
  const blenderPath = locateBlender();
  if (!blenderPath) {
    await failJob(job, "Blender executable not found.", {
      engine: "blender",
      blender_path: null,
      blender_exit_code: null,
      render_seconds: 0,
    });
    return;
  }

  const inputPath = path.join(workDir, safeName(job.filename));
  const outputDir = path.join(workDir, "output");
  await mkdir(outputDir, { recursive: true });
  await copyFile(job.upload.stored_path, inputPath);

  const renderStartedAt = new Date().toISOString();
  const frameStart = Number.isInteger(job.frame_start) ? job.frame_start : 1;
  const frameCount = Number.isInteger(job.frame_count) ? job.frame_count : 1;
  const frameEnd = Number.isInteger(job.frame_end) ? job.frame_end : frameStart + frameCount - 1;
  if (frameStart < 1 || frameEnd < frameStart || frameEnd - frameStart + 1 !== frameCount) {
    await failJob(job, "Invalid frame range.", {
      engine: "blender",
      frame_start: frameStart,
      frame_end: frameEnd,
      frame_count: frameCount,
    });
    return;
  }
  const outputPattern = path.join(outputDir, "frame_####");
  const renderTimeoutMs = renderTimeoutForJob(job);
  const result = await runProcess(blenderPath, [
    "-b",
    inputPath,
    "-o",
    outputPattern,
    "-s",
    String(frameStart),
    "-e",
    String(frameEnd),
    "-a",
  ], workDir, renderTimeoutMs);
  const renderCompletedAt = new Date().toISOString();
  const renderSeconds = Math.max(0, (new Date(renderCompletedAt).getTime() - new Date(renderStartedAt).getTime()) / 1000);
  await writeFile(path.join(workDir, "blender.stdout.log"), result.stdout || "", "utf8");
  await writeFile(path.join(workDir, "blender.stderr.log"), result.stderr || "", "utf8");

  if (result.timedOut) {
    Object.assign(job, {
      engine: "blender",
      blender_path: blenderPath,
      blender_exit_code: result.code,
      render_started_at: renderStartedAt,
      render_completed_at: renderCompletedAt,
      render_seconds: renderSeconds,
      render_timeout_ms: renderTimeoutMs,
      render_timeout_seconds: Math.round(renderTimeoutMs / 1000),
      work_dir: workDir,
    });
    await failJob(job, "Render timed out.");
    return;
  }

  const renderedFiles = await listFiles(outputDir);
  const outputFiles = renderedFiles.map((file) => file.relative);
  Object.assign(job, {
    engine: "blender",
    blender_path: blenderPath,
    blender_exit_code: result.code,
    render_started_at: renderStartedAt,
    render_completed_at: renderCompletedAt,
    render_seconds: renderSeconds,
    frame_start: frameStart,
    frame_end: frameEnd,
    frame_count: frameCount,
    rendered_file_count: renderedFiles.length,
    render_timeout_ms: renderTimeoutMs,
    render_timeout_seconds: Math.round(renderTimeoutMs / 1000),
    output_files: outputFiles,
    work_dir: workDir,
  });

  if (result.code !== 0 || renderedFiles.length < frameCount) {
    const reason = result.code !== 0
      ? `Blender exited with code ${result.code}.`
      : "Blender completed without producing every requested frame.";
    await failJob(job, reason);
    return;
  }

  const completedAt = new Date().toISOString();
  const manifest = {
    engine: "blender",
    job_id: job.job_id,
    upload_id: job.upload_id,
    renderer: job.renderer,
    blender_exit_code: result.code,
    render_started_at: renderStartedAt,
    render_completed_at: renderCompletedAt,
    render_seconds: renderSeconds,
    frame_start: frameStart,
    frame_end: frameEnd,
    frame_count: frameCount,
    rendered_file_count: renderedFiles.length,
    render_timeout_ms: renderTimeoutMs,
    render_timeout_seconds: Math.round(renderTimeoutMs / 1000),
    output_files: outputFiles,
  };
  const zipFiles = await Promise.all(renderedFiles.map(async (file) => ({
    name: `output/${file.relative}`,
    data: await readFile(file.full),
  })));
  await packageOutput(job, zipFiles, manifest, completedAt);
};

const processJob = async (file) => {
  const job = await loadJob(file);
  if (job.status !== "submitted") return;
  if (!job.upload_id || !job.upload?.stored_path || !existsSync(job.upload.stored_path)) {
    await failJob(job, "Uploaded file is missing.", { engine: "unknown" });
    return;
  }

  const startedAt = new Date().toISOString();
  job.status = "running";
  job.started_at = startedAt;
  job.updated_at = startedAt;
  await saveJob(job);

  const workDir = path.join(WORK_DIR, job.job_id);
  await mkdir(workDir, { recursive: true });
  const uploaded = await readFile(job.upload.stored_path);
  const uploadInfo = await stat(job.upload.stored_path);
  if (/\.blend$/i.test(job.filename)) {
    await runBlenderWorker(job, workDir, startedAt);
    return;
  }
  await runDevZipWorker(job, workDir, uploaded, uploadInfo, startedAt);
};

const tick = async () => {
  await mkdir(STORE_DIR, { recursive: true });
  await mkdir(WORK_DIR, { recursive: true });
  await writeWorkerStatus();
  const jobs = await loadAllJobs();
  await cleanupStaleJobs(jobs);
  const freshJobs = await loadAllJobs();
  if (freshJobs.some((job) => job.status === "running")) {
    await writeWorkerStatus();
    return;
  }
  const next = freshJobs.find((job) => job.status === "submitted");
  if (next) {
    await processJob(jobPath(next.job_id));
  }
  await writeWorkerStatus();
};

console.log(`Farpy render worker polling every ${POLL_SECONDS}s`);
console.log(`Job store: ${STORE_DIR}`);
console.log(`Work store: ${WORK_DIR}`);
console.log(`Blender: ${locateBlender() || "not found"}`);

while (true) {
  try {
    await tick();
  } catch (error) {
    console.error(error);
  }
  await sleep(POLL_SECONDS * 1000);
}
