# OCTANE_READINESS_AUDIT_V1

Date: 2026-06-30

Verdict: YELLOW

Octane is partially production-ready for controlled alpha use, but not ready to be described as fully unattended or broadly proven today. The backend upload, pricing, authenticated worker, ZIP validation, receipt minting, token-gated receipt/download, and failed-wallet refund paths are present. The blockers are a public UI/docs mismatch around Octane frames and missing fresh proof that the remote PR GPU worker is currently online and able to accept a new ORBX render.

## Scope

- ORBX upload path
- Headless Octane worker path
- Receipt and ZIP validation
- Upload and pricing flow
- Failure and refund behavior
- Node requirements
- Error handling
- Output package contract
- Customer wording

## P0

None proven from this audit.

## P1

### 1. Octane public frame policy is inconsistent.

Evidence:

- `src/components/HomeRenderFlow.tsx:65-67` sets frames to `1` when Octane is selected, but the frame input remains enabled.
- `src/components/HomeRenderFlow.tsx:89-91` submits `frame_count`, `frame_start`, and `frame_end` for Octane.
- `src/components/HomeRenderFlow.tsx:262-268` explicitly allows editing the frame count and says `Octane renders each requested frame separately.`
- `src/components/FaqSection.tsx:21-23` says Octane public alpha is still-only.
- `src/components/FaqSection.tsx:53-55` says Octane frame count is locked to 1.
- `src/app/docs/page.tsx:43`, `src/app/docs/page.tsx:47`, and `src/app/docs/page.tsx:63` also say Octane public alpha is still-only / locked to 1.
- `public/llms.txt` and `public/llms-full.txt` say Octane supports still renders only and pricing uses 1 frame.

Impact:

Users can attempt a multi-frame Octane package from the homepage while docs and LLM files say that public Octane is still-only. This is a customer trust and support risk.

Recommended fix:

Choose one policy and make every surface match:

- If public Octane is still-only, disable the Octane frame input at `1` and change the helper copy back to still-only.
- If public Octane multi-frame is enabled, update FAQ, docs, files page, llms.txt, llms-full.txt, and any stage-limit copy to say that Octane renders requested frames sequentially and is best for short ranges.

### 2. Fresh remote Octane worker availability was not proven in this audit.

Evidence:

- Production Node A check: `farpy-web-render-api.service` is active.
- Production Node A check: `farpy-render-worker.service` is inactive.
- Production Node A check: `farpy-web-render-worker.service` is inactive.
- `https://farpy.com/node/v1/web-render/worker/status` returned `{"ok":true,"running":false,"poll_seconds":5,"processed_jobs":1,"submitted_jobs":0,"running_jobs":1,"queue_cap":25}`.
- SSH alias `pr-003` was not resolvable from this shell: `ssh: Could not resolve hostname pr-003`.
- No recent Octane jobs or Octane receipts were found in the last 14 days under the inspected production job/receipt paths.

Impact:

The previous Octane smoke proof remains valuable, but this audit could not prove that an ORBX submitted today will be claimed by the remote GPU node without operator intervention.

Recommended fix:

Run a fresh authenticated ORBX still smoke using the production path:

1. Upload a real ORBX.
2. Price and submit it through normal wallet/payment flow.
3. Confirm remote Octane worker claim with `worker_id=pr-003` or current node ID.
4. Confirm ZIP contains `manifest.json`, `job.json`, `render-log.txt`, and `output/frame_0001.png` or `.exr`.
5. Confirm receipt minted and output SHA matches ZIP.

### 3. Add-on ORBX support copy is ambiguous.

Evidence:

- Extracted add-on source supports existing ORBX upload via `FARPY_OT_upload_existing_orbx` in `farpy_render/__init__.py`, with `renderer="octane"` and frame `1`.
- Extracted add-on source still shows the support copy `Octane .orbx packages should be sent from the Farpy website unless already supported here.`
- `release/BLENDER_ADDON_FINAL_AUDIT_V1.md` already records this ambiguity and recommends precise copy.

Impact:

Artists may not understand whether they can send an existing ORBX from Blender. Automatic ORBX export is not included, but existing ORBX upload is implemented.

Recommended fix:

Use precise copy:

`Existing .orbx files can be sent from this add-on. Automatic Octane ORBX export is not included yet.`

## P2

### 1. Control-plane render worker has a non-Blender dev ZIP fallback, but production Node A services are inactive.

Evidence:

- `scripts/render-worker.mjs:609-613` runs Blender for `.blend`; all other files fall through to `runDevZipWorker`.
- `scripts/render-worker.mjs:455-473` packages uploaded bytes with `engine: "dev-zip-worker"` instead of real rendering.
- Production Node A service check showed `farpy-render-worker.service` inactive.

Impact:

Not an active production blocker from the observed service state, but this fallback is dangerous if a generic local worker is accidentally re-enabled against production jobs. An ORBX must only be processed by the authenticated Octane worker lane.

Recommended fix:

Add an explicit production guard in `scripts/render-worker.mjs` so `.orbx` jobs fail closed or are ignored by the local Blender worker. This should be a small safety patch before anyone re-enables the local worker service.

### 2. Customer wording still contains stale historical "render factory" text in release notes only.

Evidence:

- Current `src`, `public`, and `out` customer-facing scan did not show active `render factory` strings.
- Historical release notes still contain `render factory` references.

Impact:

No customer-facing blocker. Historical release notes are acceptable unless published as current docs.

## What Is Proven

### ORBX upload

- `scripts/job-api.mjs:123-125` infers `renderer="octane"` from `.orbx` or explicit renderer.
- `scripts/job-api.mjs:135` allows `.blend` and `.orbx` only.
- `scripts/job-api.mjs:2544-2578` accepts multipart uploads, stores the upload, creates a job, returns `upload_id`, `job_id`, price, and private tokens.

### Frame contract and pricing

- `scripts/job-api.mjs:185-199` validates frame start/end/count.
- `scripts/job-api.mjs:202-203` requires price to match normal or fast per-frame pricing.
- `scripts/job-api.mjs:205-215` stamps a frame-based timeout policy.

### Worker auth and claim

- `scripts/job-api.mjs:2233-2264` exposes authenticated `POST /node/v1/worker/claim`.
- The worker claim route filters by `x-farpy-renderer` and defaults to Blender only if no renderer is requested.
- `/opt/farpy-node/web-render-http-worker.py:58-65` sends `x-farpy-worker-token`, `x-farpy-worker-id`, and `x-farpy-renderer: octane`.
- `/opt/farpy-node/web-render-http-worker.py:193` skips jobs where `renderer != "octane"`.

### Output ZIP and receipt integrity

- `scripts/job-api.mjs:1615-1633` validates worker ZIPs before completion:
  - non-empty ZIP
  - rendered frame count equals job frame count
  - requires `manifest.json`
  - requires `job.json`
  - requires `render-log.txt`
  - requires `output/frame_####.png` or `.exr`
- `scripts/job-api.mjs:2335-2364` writes the ZIP, records output SHA/size/file count, marks complete, and mints the receipt.
- `scripts/job-api.mjs:798-817` refuses to mint a receipt without an output path and output SHA.
- `scripts/job-api.mjs:2682-2704` token-gates download and receipt endpoints.

### Failure and refund behavior

- `scripts/job-api.mjs:2402-2425` handles authenticated remote worker failure, removes output/receipt fields, calls `refundFailedWalletDebit`, and saves the failed job.
- `scripts/job-api.mjs:416-450` implements idempotent failed wallet debit refunds when there is no delivery artifact.
- `release/FAILED_WALLET_REFUND_FIX_V1.md` proves `JOB-B13C609B` was refunded through this path.

### Node requirements

Production service template exists at `/opt/farpy-node/systemd/farpy-web-render-worker.service`:

- runs as `User=pr-003`
- uses `/usr/bin/env python3 /opt/farpy-node/web-render-http-worker.py`
- uses `FARPY_WEB_RENDER_API_BASE=https://farpy.com/node/v1/web-render`
- loads `/etc/farpy/web-render-worker.env`
- uses `/usr/local/bin/octane "{input}" --no-gui -t "{render_target}" -g 0 -g 1 -s {samples} -o "{output}" -e -v`

Required before calling Octane green:

- PR GPU node SSH/admin route known.
- `farpy-web-render-worker.service` active on the GPU node.
- Octane binary installed at `/usr/local/bin/octane` or configured equivalent.
- Octane license active.
- GPU visible to Octane.
- Worker token configured in protected env.
- Work/log directories writable by `pr-003`.

## Previous Octane Proof From Launch Thread

Historical proof provided in the launch thread:

- Still smoke: `JOB-BFB50143`, `RID-A488C5C1`, `worker=pr-003`, `renderer=octane`, `rendered_file_count=1`, ZIP contained `output/frame_0001.png`.
- Private 2-frame smoke: `JOB-D0289581`, `RID-59990D1A`, `worker=pr-003`, `renderer=octane`, frames `1-2`, `rendered_file_count=2`, two different frame SHA256s.
- Caveat: multi-frame proof was sequential still-frame execution, not timeline seek proof.

This audit did not reproduce those smokes.

## Commands Run

```powershell
Select-String -Path scripts\job-api.mjs -Pattern 'function inferRenderer|function validUploadName|function frameContract|function validateWorkerZip|output/frame_|workerCompleteMatch|workerFailMatch|refundFailedWalletDebit|renderTimeoutForFrames|priceMatchesFrameContract|submit-render|uploads/create|btcpay|octane'
Select-String -Path scripts\render-worker.mjs -Pattern 'runDevZipWorker|runBlenderWorker|function processJob|\.blend|octane|orbx|frame_|timeout|spawn|execFile'
Select-String -Path src\components\*.tsx,src\lib\*.ts,src\app\**\*.tsx -Pattern 'Octane|octane|ORBX|orbx|render factory|render partner|Delivery receipt|Receipt|failed|refund|completed-render|frame'
Get-ChildItem release -Filter *.md
tar -xf public\downloads\Farpy-Blender-Addon-unified.zip -C C:\tmp\farpy-addon-octane-audit
Get-FileHash -Algorithm SHA256 public\downloads\Farpy-Blender-Addon-unified.zip
node --check scripts\job-api.mjs
npm.cmd run build
Invoke-WebRequest https://farpy.com/
Invoke-WebRequest https://farpy.com/docs
Invoke-WebRequest https://farpy.com/faq
Invoke-WebRequest https://farpy.com/files
Invoke-WebRequest https://farpy.com/addon
Invoke-WebRequest https://farpy.com/node/v1/web-render/worker/status
ssh root@farpy.com 'systemctl is-active farpy-web-render-api.service'
ssh root@farpy.com 'systemctl is-active farpy-render-worker.service'
ssh root@farpy.com 'systemctl is-active farpy-web-render-worker.service'
ssh root@farpy.com 'curl -fsS https://farpy.com/node/v1/web-render/worker/status'
ssh root@farpy.com 'ls -la /opt/farpy-web-render/scripts/render-worker.mjs /opt/farpy-web-render/scripts/job-api.mjs'
ssh root@farpy.com 'ls -la /opt/farpy-node/web-render-http-worker.py /opt/farpy-node/systemd/farpy-web-render-worker.service'
ssh pr-003 'hostname'
rg -n "Octane public alpha|still renders only|locked to 1|renders each requested frame separately|frame count is locked|Octane renders each requested frame" src public out
rg -n "render factory|Render factory|Render Factory|factories|factory failed" src public out
```

## Build And Smoke Results

- `node --check scripts\job-api.mjs`: PASS
- `npm.cmd run build`: PASS
- Public route smoke:
  - `/`: 200
  - `/docs`: 200
  - `/faq`: 200
  - `/files`: 200
  - `/addon`: 200
  - `/node/v1/web-render/worker/status`: 200
- PR GPU alias smoke:
  - `ssh pr-003`: FAIL, alias not resolvable from this environment.

## Freeze Recommendation

Octane controlled alpha: YES, with operator awareness.

Broad unattended public Octane launch: NO, until:

1. Public Octane frame policy is made consistent.
2. A fresh production ORBX still smoke is green.
3. Remote PR GPU node access/service status is documented and checkable.
4. Local/control-plane worker has an explicit `.orbx` fail-closed guard if it may ever be re-enabled.

Exact next action:

Fix the Octane public frame policy mismatch first. Then run one fresh authenticated ORBX still smoke and append the job ID, receipt ID, worker ID, ZIP listing, output SHA, and receipt SHA proof.
