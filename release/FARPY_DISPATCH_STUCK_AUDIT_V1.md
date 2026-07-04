# FARPY_DISPATCH_STUCK_AUDIT_V1

Date: 2026-07-01

Target job: `JOB-0C9C1F27`

File: `blender-3.5-splash.blend`

Mode: audit only. No production behavior changed.

## Result

Root cause found:

`JOB-0C9C1F27` is not actually in dispatcher/render-partner territory yet. It is still pre-submit and pre-payment-capture.

Backend truth:

- `status=queued`
- `payment_status=priced`
- `price_cents=1`
- authenticated account is attached
- owner wallet has sufficient balance
- no wallet debit happened for this job
- no payment capture happened for this job
- no `submitted_at`
- no render start
- no output ZIP
- no receipt

The visible workspace state is misleading because the Journey Timeline can show the `Dispatcher` step active for a `queued` job even when payment has not been captured and the package has not been submitted.

## Job State

Production job file:

- `/var/lib/farpy-web-render/jobs/JOB-0C9C1F27.json`

Redacted job fields inspected:

```json
{
  "job_id": "JOB-0C9C1F27",
  "upload_id": "UP-2549C737",
  "status": "queued",
  "payment_status": "priced",
  "price_cents": 1,
  "wallet_debit_cents": null,
  "balance_after_cents": null,
  "filename": "blender-3.5-splash.blend",
  "renderer": "blender",
  "frame_start": 5,
  "frame_end": 5,
  "frame_count": 1,
  "created_at": "2026-07-02T01:39:37.636Z",
  "updated_at": "2026-07-02T01:39:37.830Z",
  "user_id": "<redacted>",
  "email": "<redacted>",
  "payment_intent_id": null,
  "payment_captured_at": null
}
```

Upload metadata:

```json
{
  "upload_id": "UP-2549C737",
  "filename": "blender-3.5-splash.blend",
  "size_bytes": 7685702,
  "sha256": "5f27c41cf828ca15ffd06fc3ad3d971343f6af4a29828c834252229a26dce395",
  "stored_path": "/var/lib/farpy-web-render/uploads/UP-2549C737.blend"
}
```

Upload file:

- Exists
- Readable
- Size: `7.4M`

## Public API Evidence

Correct public-safe status route:

```text
GET https://farpy.com/node/v1/web-render/jobs/JOB-0C9C1F27
```

Response:

```json
{
  "ok": true,
  "job_id": "JOB-0C9C1F27",
  "status": "queued",
  "renderer": "blender",
  "frame_start": 5,
  "frame_end": 5,
  "frame_count": 1,
  "created_at": "2026-07-02T01:39:37.636Z",
  "updated_at": "2026-07-02T01:39:37.830Z"
}
```

Incorrect guessed routes returned `404`:

- `/node/v1/jobs/JOB-0C9C1F27`
- `/node/v1/jobs/JOB-0C9C1F27/status`
- `/node/v1/web-render/jobs/JOB-0C9C1F27/status`

## Wallet / Payment Gate

Wallet ledger summary for the redacted attached user:

- Wallet file exists.
- Transaction count: `53`
- Current balance: `3505` cents.
- Job price: `1` cent.
- Balance is sufficient.
- No ledger entry exists for `JOB-0C9C1F27`.

Recent wallet events show other debits/refunds, but none for this job.

Conclusion:

- This is not an insufficient-balance case.
- Money was not charged.
- Wallet debit did not happen because submit/start was not completed for this job.

Backend submit behavior from `scripts/job-api.mjs`:

- `submitRender()` requires `payment_status === "captured"` before the job is dispatched.
- For wallet-backed jobs, submit/start is the moment that appends the wallet debit and sets `payment_status="captured"`.
- Only then does it set `status="submitted"`.

This job never reached that path.

## Scheduler / Dispatcher

Production queue summary:

```text
JOB_STATUS_COUNTS {'queued': 38, 'complete': 46, 'failed': 16}
PAYMENT_STATUS_COUNTS {'checkout_created': 3, 'captured': 54, 'unpriced': 14, 'priced': 25, None: 1, 'refunded': 2, 'paid': 1}
SUBMITTED_CAPTURED_BLENDER 0
RUNNING_BLENDER 0
```

This job is not eligible for dispatch because it is:

- `status=queued`
- `payment_status=priced`

No scheduler/lease should take it in this state.

No recent API/worker logs were found for:

- `JOB-0C9C1F27`
- `UP-2549C737`
- `payment_required`
- `WALLET`
- `STRIPE`
- `CAPTURED`
- `DEBIT`

## Worker / Render Partner

Node A worker service:

```text
farpy-web-render-api.service: active
farpy-web-render-worker.service: inactive
```

Worker service status:

```text
Active: inactive (dead)
Drop-In:
  00-nodea-render-forbidden.conf
  99-nodea-no-restart.conf
```

Worker status file:

```json
{
  "ok": true,
  "running": true,
  "poll_seconds": 5,
  "processed_jobs": 1,
  "submitted_jobs": 1,
  "running_jobs": 0,
  "heartbeat_at": "2026-06-23T07:12:13.209Z"
}
```

Interpretation:

- The worker-status file is stale and should not be treated as live proof.
- Node A rendering is intentionally disabled by systemd drop-ins.
- This is a separate operational concern for future submitted jobs.
- It is not the first blocker for `JOB-0C9C1F27`, because the job has not been paid/captured/submitted.

## Frontend Display Comparison

Frontend files inspected:

- `src/components/Workspace.tsx`
- `src/components/JourneyTimeline.tsx`
- `src/lib/worldLanguage.ts`

Relevant frontend behavior:

- `worldLanguage.ts` maps `queued` to `Package received`.
- `Workspace.tsx` marks the Journey Timeline `dispatcher` step active whenever a job exists, has a package, is not complete, and is not failed.
- That means a pre-payment queued job can show `Dispatcher` in progress.
- `Workspace.tsx` separately shows `Payment required` when `payment_status !== "captured"`.

This creates the observed confusing state:

- Package received
- Dispatcher in progress
- Payment required

Backend truth is simpler:

- Package received.
- Payment/start has not completed.
- Dispatcher has not started.

## Money / Output / Receipt

Money charged:

- No completed render charge found for `JOB-0C9C1F27`.
- No wallet debit found.
- No payment capture found.

Render started:

- No.

Output exists:

- No output file found for `JOB-0C9C1F27` or `UP-2549C737`.

Receipt exists:

- No receipt file found for `JOB-0C9C1F27`.

## Files / Services Inspected

Production files:

- `/var/lib/farpy-web-render/jobs/JOB-0C9C1F27.json`
- `/var/lib/farpy-web-render/uploads/UP-2549C737.blend`
- `/var/lib/farpy-web-render/wallet/<redacted>.jsonl`
- `/var/lib/farpy-web-render/outputs`
- `/var/lib/farpy-web-render/receipts`
- `/var/lib/farpy-web-render/worker-status.json`

Production services:

- `farpy-web-render-api.service`
- `farpy-web-render-worker.service`

Local source inspected:

- `scripts/job-api.mjs`
- `src/components/Workspace.tsx`
- `src/components/JourneyTimeline.tsx`
- `src/lib/worldLanguage.ts`

## Safe Fix Recommendation

Do not change scheduler or worker behavior for this job.

Recommended UI/status fix, separate milestone:

1. For `queued + payment_status !== captured`, keep the Journey Timeline before Dispatcher:
   - `Package received`: complete
   - `Payment`: active, or show payment/start action as the active step
   - `Dispatcher`: upcoming
2. Do not show `Dispatcher` active until the job is `submitted`, `running`, `complete`, or has a render partner assignment.
3. If authenticated wallet balance can cover the price, show the primary action as:
   - `Send package`
   - helper: `Your wallet will be charged $0.01 when you send this package.`
4. If authenticated wallet balance cannot be loaded, show:
   - `Checking wallet...`
   instead of `Payment required`.
5. If unauthenticated, show:
   - `Sign in to pay`

Recommended operational follow-up:

- Separately review whether `farpy-web-render-worker.service` should remain inactive on Node A and whether current render partners are expected to be external NodeMunchers only.
- Do not restart Node A worker as part of this job audit; Node A has explicit `render-forbidden` and `no-restart` drop-ins.

## Commands Run

```powershell
Invoke-WebRequest https://farpy.com/node/v1/web-render/jobs/JOB-0C9C1F27
Invoke-WebRequest https://farpy.com/workspace/JOB-0C9C1F27
ssh farpy "find /var/lib/farpy-web-render /var/lib/farpy ..."
ssh farpy "journalctl -u farpy-web-render-api.service -u farpy-web-render-worker.service ..."
ssh farpy "systemctl is-active farpy-web-render-api.service"
ssh farpy "systemctl status farpy-web-render-worker.service --no-pager"
ssh farpy "<redacted Python job JSON summary>"
ssh farpy "<redacted Python wallet ledger summary>"
rg "Dispatcher|Payment required|can_start_render|payment_status" src/components src/lib
```

FARPY_DISPATCH_STUCK_AUDIT_V1 = ROOT_CAUSE_FOUND
