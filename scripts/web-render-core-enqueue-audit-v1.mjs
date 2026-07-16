import { spawn } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import process from "node:process";

const root = await mkdtemp(path.join(tmpdir(), "farpy-core-enqueue-audit-"));
const dataDir = path.join(root, "web");
const webJobs = path.join(dataDir, "jobs");
const uploads = path.join(dataDir, "uploads");
const coreJobs = path.join(root, "core-jobs");
const coreUploads = path.join(root, "core-uploads");
const coreOutputs = path.join(root, "core-outputs");
const coreReceipts = path.join(root, "core-receipts");
const queueFile = path.join(coreJobs, "queue.jsonl");
const jobId = "JOB-CORE-ENQUEUE-AUDIT";
const uploadId = "UP-CORE-ENQUEUE-AUDIT";
const port = 19242;

await Promise.all([mkdir(webJobs, { recursive: true }), mkdir(uploads, { recursive: true })]);
const uploadPath = path.join(uploads, `${uploadId}.blend`);
await writeFile(uploadPath, "focused regression fixture\n", "utf8");
const originalJob = {
  ok: true,
  job_id: jobId,
  upload_id: uploadId,
  filename: "audit-scene.blend",
  renderer: "blender",
  status: "queued",
  frame_start: 3,
  frame_end: 5,
  frame_count: 3,
  price_cents: 6,
  payment_status: "captured",
  payment_mode: "wallet",
  wallet_debit_cents: 6,
  balance_after_cents: 994,
  payment_captured_at: "2026-07-13T00:00:00.000Z",
  created_at: "2026-07-13T00:00:00.000Z",
  updated_at: "2026-07-13T00:00:00.000Z",
  upload: { upload_id: uploadId, filename: "audit-scene.blend", stored_path: uploadPath },
  user_id: "audit@example.com",
  email: "audit@example.com",
};
await writeFile(path.join(webJobs, `${jobId}.json`), JSON.stringify(originalJob, null, 2), "utf8");

const child = spawn(process.execPath, [path.resolve("scripts/job-api.mjs")], {
  cwd: path.resolve("."),
  env: {
    ...process.env,
    NODE_ENV: "test",
    FARPY_WEB_RENDER_HOST: "127.0.0.1",
    FARPY_WEB_RENDER_PORT: String(port),
    FARPY_WEB_RENDER_DATA_DIR: dataDir,
    FARPY_CORE_JOB_STORE_DIR: coreJobs,
    FARPY_CORE_QUEUE_FILE: queueFile,
    FARPY_CORE_UPLOAD_STORE_DIR: coreUploads,
    FARPY_CORE_OUTPUT_STORE_DIR: coreOutputs,
    FARPY_CORE_RECEIPT_STORE_DIR: coreReceipts,
    FARPY_CORE_UPLOAD_BASE_URL: "https://audit.invalid/real-upload",
  },
  stdio: ["ignore", "pipe", "pipe"],
});

let stderr = "";
child.stderr.on("data", (chunk) => { stderr += chunk; });
const waitForHealth = async () => {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/health`);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`job API did not start: ${stderr}`);
};

try {
  await waitForHealth();
  const submitUrl = `http://127.0.0.1:${port}/node/v1/jobs/${jobId}/submit-render`;
  const first = await fetch(submitUrl, { method: "POST" });
  const second = await fetch(submitUrl, { method: "POST" });
  if (!first.ok || !second.ok) throw new Error(`submit failed: ${first.status}/${second.status}`);

  const queueIds = (await readFile(queueFile, "utf8")).trim().split(/\r?\n/).filter(Boolean);
  if (queueIds.length !== 1 || queueIds[0] !== jobId) throw new Error(`queue not idempotent: ${JSON.stringify(queueIds)}`);
  const coreJob = JSON.parse(await readFile(path.join(coreJobs, `${jobId}.json`), "utf8"));
  const webJob = JSON.parse(await readFile(path.join(webJobs, `${jobId}.json`), "utf8"));
  const stagedUpload = await readFile(path.join(coreUploads, `${uploadId}.blend`), "utf8");

  if (coreJob.job_id !== jobId) throw new Error("core job ID changed");
  if (coreJob.web_render_upload_path !== uploadPath) throw new Error("source upload path not preserved");
  if (coreJob.engine !== "blender" || coreJob.job?.engine !== "cycles") throw new Error("renderer contract changed");
  if (JSON.stringify(coreJob.frames) !== JSON.stringify([3, 4, 5])) throw new Error("frame range changed");
  if (coreJob.payment_status !== "captured" || coreJob.amount_cents !== 6) throw new Error("payment state changed");
  if (webJob.wallet_debit_cents !== 6 || webJob.balance_after_cents !== 994) throw new Error("wallet debit changed");
  if (stagedUpload !== "focused regression fixture\n") throw new Error("upload staging changed content");

  coreJob.state = "RUNNING";
  coreJob.status = "RUNNING";
  coreJob.claimed_at = "2026-07-13T00:01:00.000Z";
  coreJob.claimed_by = "audit-worker";
  await writeFile(path.join(coreJobs, `${jobId}.json`), JSON.stringify(coreJob, null, 2), "utf8");
  const tracked = await fetch(`http://127.0.0.1:${port}/node/v1/jobs/${jobId}`);
  const trackedJob = await tracked.json();
  if (!tracked.ok || trackedJob.status !== "running") throw new Error(`tracker did not reconcile core claim: ${JSON.stringify(trackedJob)}`);

  coreJob.state = "DONE";
  coreJob.status = "DONE";
  coreJob.frames_done = 3;
  coreJob.rendered_frames = 3;
  coreJob.output_url = `https://audit.invalid/outputs/IT/${jobId}.zip`;
  coreJob.receipt_url = `/receipt-static/${jobId}/index.json`;
  await writeFile(path.join(coreJobs, `${jobId}.json`), JSON.stringify(coreJob, null, 2), "utf8");
  const premature = await fetch(`http://127.0.0.1:${port}/node/v1/jobs/${jobId}`);
  const prematureJob = await premature.json();
  if (!premature.ok || prematureJob.status === "complete") throw new Error(`tracker completed without artifact: ${JSON.stringify(prematureJob)}`);

  const outputDir = path.join(coreOutputs, jobId.slice(-2).toLowerCase());
  await mkdir(outputDir, { recursive: true });
  const outputBytes = Buffer.from("valid focused output fixture\n");
  await writeFile(path.join(outputDir, `${jobId}.zip`), outputBytes);
  await mkdir(coreReceipts, { recursive: true });
  await writeFile(path.join(coreReceipts, `RID-${jobId}.json`), JSON.stringify({
    receipt_id: `RID-${jobId}`,
    job_id: jobId,
    output_sha256: "audit-sha",
    output_url: coreJob.output_url,
    timestamp_utc: "2026-07-13T00:02:30.000Z",
  }), "utf8");
  const completed = await fetch(`http://127.0.0.1:${port}/node/v1/jobs/${jobId}`);
  const completedJob = await completed.json();
  if (!completed.ok || completedJob.status !== "complete") throw new Error(`tracker did not reconcile valid completion: ${JSON.stringify(completedJob)}`);
  const completedStoredJob = JSON.parse(await readFile(path.join(webJobs, `${jobId}.json`), "utf8"));
  if (completedStoredJob.rendered_file_count !== 3 || completedStoredJob.rendered_frame_count !== 3) throw new Error(`rendered counts not reconciled: ${JSON.stringify(completedStoredJob)}`);
  if (!completedStoredJob.output_path || !completedStoredJob.receipt_path) throw new Error("artifact readiness not reconciled");
  if (completedStoredJob.output_sha256 !== "audit-sha" || completedStoredJob.receipt_id !== `RID-${jobId}`) throw new Error("artifact metadata not reconciled");
  if (completedStoredJob.worker_id !== "audit-worker" || completedStoredJob.render_seconds !== 90) throw new Error("worker/duration not reconciled");

  console.log("PASS web render creates one core job with the same ID");
  console.log("PASS repeated submit creates one queue entry");
  console.log("PASS upload path, renderer, frames, and captured payment metadata are preserved");
  console.log("PASS repeated submit does not alter wallet debit metadata");
  console.log("PASS tracker reconciles a core worker claim from submitted to running");
  console.log("PASS core DONE without an artifact does not mark the tracker complete");
  console.log("PASS valid core artifact and receipt reconcile download, counts, node, and duration");
} finally {
  child.kill("SIGTERM");
  await new Promise((resolve) => child.once("exit", resolve));
  await rm(root, { recursive: true, force: true });
}
