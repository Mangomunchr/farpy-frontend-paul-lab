const ORIGIN = process.env.FARPY_WEB_RENDER_ORIGIN || "http://127.0.0.1:19102";
const API = `${ORIGIN}/node/v1`;

const log = (label, value) => console.log(`${label}: ${typeof value === "string" ? value : JSON.stringify(value)}`);
const fail = (message) => {
  console.error(`PROD_SMOKE_FAIL: ${message}`);
  process.exit(1);
};

async function jsonFetch(url, init) {
  const response = await fetch(url, init);
  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    fail(`${url} did not return JSON: ${text.slice(0, 200)}`);
  }
  if (!response.ok) fail(`${url} failed ${response.status}: ${text}`);
  return json;
}

async function main() {
  const health = await jsonFetch(`${ORIGIN}/health`);
  log("HEALTH", health);
  if (!health.ok) fail("health was not ok");

  const worker = await jsonFetch(`${API}/worker/status`);
  log("WORKER_STATUS", worker);
  if (!worker.ok || !worker.running) fail("worker is not running");

  const form = new FormData();
  form.append("file", new Blob([Buffer.from("farpy prod web render smoke")]), "prod-smoke.orbx");
  const upload = await jsonFetch(`${API}/uploads/create`, { method: "POST", body: form });
  log("UPLOAD", upload);
  if (!upload.job_id || !upload.upload_id) fail("upload did not return ids");

  const submit = await jsonFetch(`${API}/jobs/${encodeURIComponent(upload.job_id)}/submit-render`, { method: "POST" });
  log("SUBMIT", submit);
  if (submit.status !== "submitted") fail("submit did not return submitted status");

  let finalJob = null;
  for (let i = 0; i < 18; i += 1) {
    await new Promise((resolve) => setTimeout(resolve, 2500));
    const job = await jsonFetch(`${API}/jobs/${encodeURIComponent(upload.job_id)}`);
    log(`POLL_${i}`, job);
    if (job.status === "complete" || job.status === "failed") {
      finalJob = job;
      break;
    }
  }
  if (!finalJob) fail("job did not complete or fail");

  if (finalJob.status === "complete") {
    const download = await fetch(`${API}/jobs/${encodeURIComponent(upload.job_id)}/download`);
    if (!download.ok) fail(`download failed ${download.status}`);
    const bytes = await download.arrayBuffer();
    log("DOWNLOAD", {
      bytes: bytes.byteLength,
      sha256: download.headers.get("x-farpy-output-sha256"),
      job_id: download.headers.get("x-farpy-job-id"),
    });
    if (bytes.byteLength === 0) fail("download was empty");

    const receipt = await jsonFetch(`${API}/jobs/${encodeURIComponent(upload.job_id)}/receipt`);
    log("RECEIPT", receipt);
    if (receipt.job_id !== upload.job_id || receipt.upload_id !== upload.upload_id) {
      fail("receipt ids did not match");
    }
  }

  console.log("PROD_WEB_RENDER_SMOKE_GREEN");
}

main().catch((error) => fail(error.stack || error.message));
