import { existsSync } from "node:fs";
import { mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const BASE = process.env.FARPY_NODE_BASE || "http://127.0.0.1:19102/node/v1";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "out");

const log = (label, value) => {
  const text = typeof value === "string" ? value : JSON.stringify(value);
  console.log(`${label}: ${text}`);
};

const fail = (message) => {
  console.error(`SMOKE_FAIL: ${message}`);
  process.exit(1);
};

async function jsonFetch(pathname, init) {
  const response = await fetch(`${BASE}${pathname}`, init);
  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    fail(`${pathname} did not return JSON: ${text.slice(0, 200)}`);
  }
  if (!response.ok) fail(`${pathname} failed ${response.status}: ${text}`);
  return json;
}

async function main() {
  if (!existsSync(OUT_DIR)) fail("out directory does not exist. Run npm run build first.");

  const health = await jsonFetch("/health");
  log("API_HEALTH", health);
  if (!health.ok) fail("API health was not ok.");

  const worker = await jsonFetch("/worker/status");
  log("WORKER_STATUS", worker);
  if (!worker.ok || !worker.running) fail("Worker is not running.");

  const tempDir = await mkdtemp(path.join(os.tmpdir(), "farpy-smoke-"));
  const filePath = path.join(tempDir, "smoke.orbx");
  await writeFile(filePath, "farpy service smoke bytes", "utf8");

  const form = new FormData();
  const blob = new Blob([await import("node:fs/promises").then((fs) => fs.readFile(filePath))]);
  form.append("file", blob, "smoke.orbx");

  const upload = await jsonFetch("/uploads/create", { method: "POST", body: form });
  log("UPLOAD", upload);
  if (!upload.ok || !upload.job_id || !upload.upload_id) fail("Upload did not return job/upload ids.");

  const submit = await jsonFetch(`/jobs/${encodeURIComponent(upload.job_id)}/submit-render`, { method: "POST" });
  log("SUBMIT", submit);
  if (submit.status !== "submitted") fail("Submit did not set submitted status.");

  let finalJob = null;
  for (let i = 0; i < 12; i += 1) {
    await new Promise((resolve) => setTimeout(resolve, 2500));
    const job = await jsonFetch(`/jobs/${encodeURIComponent(upload.job_id)}`);
    log(`POLL_${i}`, job);
    if (job.status === "complete" || job.status === "failed") {
      finalJob = job;
      break;
    }
  }
  if (!finalJob) fail("Job did not reach complete or failed.");

  if (finalJob.status === "complete") {
    if (!finalJob.can_download || !finalJob.can_view_receipt) {
      fail("Complete job did not expose download and receipt.");
    }
    const download = await fetch(`${BASE}/jobs/${encodeURIComponent(upload.job_id)}/download`);
    if (!download.ok) fail(`Download failed ${download.status}.`);
    const bytes = await download.arrayBuffer();
    log("DOWNLOAD_BYTES", bytes.byteLength);
    if (bytes.byteLength === 0) fail("Download returned empty file.");

    const receipt = await jsonFetch(`/jobs/${encodeURIComponent(upload.job_id)}/receipt`);
    log("RECEIPT", receipt);
    if (receipt.job_id !== upload.job_id || receipt.upload_id !== upload.upload_id) {
      fail("Receipt does not reference the created job/upload.");
    }
  }

  console.log("SERVICE_SMOKE_GREEN");
}

main().catch((error) => fail(error.stack || error.message));
