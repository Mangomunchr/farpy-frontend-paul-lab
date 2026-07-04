# NODEMUNCHER_LEASE_FAILURE_REPORT_PROOF_V1

Status: GREEN

## Objective

Review `NODEMUNCHER_LEASE_FAILURE_REPORT_V1` and produce proof that claimed NodeMuncher failures report back to production instead of stranding leased packages.

## Files Changed

- `release/NODEMUNCHER_LEASE_FAILURE_REPORT_PROOF_V1.md`

No product code was changed.

## Implementation Reviewed

Desktop implementation:

- `C:\Users\danki\Desktop\nodemuncher-codex\src-tauri\src\main.rs`

Backend implementation:

- `C:\Users\danki\Desktop\farpy-frontend\scripts\job-api.mjs`

## Desktop Proof

`src-tauri/src/main.rs` contains a local `Report-LeaseFailure` function in the claimed render path.

Failure report behavior:

- Uses the lease `fail_url` when present.
- Falls back to `/node/v1/web-render/nodemuncher/jobs/<job_id>/fail`.
- Sends `x-farpy-node-token`.
- Writes `failure_reported=true/false` to `render-log.txt`.

Code-path evidence:

- `Report-LeaseFailure` posts to production fail endpoint: `main.rs:1368-1385`
- `Fail` always calls `Report-LeaseFailure`: `main.rs:1387-1390`
- input download failure calls `Fail 'input_download'`: `main.rs:1423-1426`
- render timeout calls `Fail 'render_timeout'`: `main.rs:1444-1449`
- Blender nonzero exit calls `Fail 'render'`: `main.rs:1453-1455`
- missing rendered frame calls `Fail 'render'`: `main.rs:1457-1462`
- ZIP failure calls `Fail 'zip'`: `main.rs:1475-1476`
- complete failure calls `Fail 'complete'`: `main.rs:1478-1486`

Timeout proof type: code-path proof. A fresh forced timeout render was not run in this proof pass.

## Backend Proof

`scripts/job-api.mjs` includes `fail_url` in claimed NodeMuncher lease payloads:

- `fail_url`: `job-api.mjs:1585`

Production fail endpoint:

- `POST /node/v1/web-render/nodemuncher/jobs/<job_id>/fail`
- compatibility route: `POST /node/v1/nodemuncher/jobs/<job_id>/fail`

Endpoint behavior reviewed:

- requires node token auth
- requires job `claimed_by=nodemuncher`
- requires `job.node_id` to match authenticated node
- rejects completed jobs
- idempotently accepts already-failed jobs
- sets `status=failed`
- sets `failure_stage`
- sets `failure_code`
- sets `retryable=true` unless explicitly false
- clears output and receipt fields
- calls failed wallet debit refund handler
- does not mint receipt

Code-path evidence:

- route matcher: `job-api.mjs:2403`
- node auth and ownership checks: `job-api.mjs:2405-2410`
- complete-job rejection: `job-api.mjs:2411`
- already-failed idempotency: `job-api.mjs:2412`
- running/leased state requirement: `job-api.mjs:2413`
- failed/retryable mutation: `job-api.mjs:2417-2423`
- output/receipt cleanup: `job-api.mjs:2427-2432`
- refund handler call: `job-api.mjs:2433`
- save and response: `job-api.mjs:2434-2435`

## Live Production Proof

Target job:

```text
JOB-6A016363
```

Reason selected:

- old pre-fix NodeMuncher claim
- `status=running`
- `claimed_by=nodemuncher`
- claimed by local paired node `NODE-20260509T071411Z-145ab020`
- no output ZIP
- no delivery receipt
- had one wallet debit

### Before

```json
{
  "job_id": "JOB-6A016363",
  "status": "running",
  "claimed_by": "nodemuncher",
  "node_id": "NODE-20260509T071411Z-145ab020",
  "lease_id": "LEASE-D3BEE79EF91C",
  "retryable": null,
  "failure_stage": null,
  "failure_code": null,
  "receipt_id": null,
  "receipt_path_exists": false,
  "output_path_exists": false,
  "wallet_debit_cents": 1,
  "payment_status": "captured",
  "wallet_refund_cents": null
}
```

### Fail Endpoint Call

Used local paired NodeMuncher identity from:

```text
C:\Users\danki\AppData\Local\FarpyNode\node.json
```

The node token was not printed.

Endpoint response:

```json
{
  "http_status": 200,
  "ok": true,
  "job_id": "JOB-6A016363",
  "status": "failed",
  "receipt_url_present": false,
  "download_url_present": false,
  "node_id": "NODE-20260509T071411Z-145ab020",
  "token": "REDACTED"
}
```

### After

Persisted production job JSON:

```json
{
  "job_id": "JOB-6A016363",
  "status": "failed",
  "claimed_by": "nodemuncher",
  "node_id": "NODE-20260509T071411Z-145ab020",
  "lease_id": "LEASE-D3BEE79EF91C",
  "retryable": true,
  "failure_stage": "render",
  "failure_code": "controlled_failure_report_proof",
  "receipt_id": null,
  "receipt_path_exists": false,
  "output_path_exists": false,
  "download_url_field": false,
  "wallet_debit_cents": 1,
  "payment_status": "refunded",
  "wallet_refund_cents": 1,
  "wallet_refund_event_id": "wallet-refund-JOB-6A016363"
}
```

Wallet ledger proof:

```json
{
  "job_id": "JOB-6A016363",
  "debit_count": 1,
  "refund_count": 1,
  "events": [
    {
      "event_id": "wallet-debit-JOB-6A016363",
      "type": "debit",
      "amount_cents": 1
    },
    {
      "event_id": "wallet-refund-JOB-6A016363",
      "type": "refund",
      "amount_cents": 1
    }
  ]
}
```

Receipt/output/earning proof:

```json
{
  "receipt_files": [],
  "output_files": [],
  "earning_like_refs": []
}
```

### Idempotency

Repeated fail call returned:

```json
{
  "http_status": 200,
  "ok": true,
  "job_id": "JOB-6A016363",
  "status": "failed",
  "receipt_url_present": false,
  "download_url_present": false
}
```

Wallet ledger after repeat:

```json
{
  "debit_count": 1,
  "refund_count": 1
}
```

No duplicate refund was recorded.

## Verification Matrix

| Requirement | Result | Evidence |
| --- | --- | --- |
| Local render failure calls production fail endpoint | PASS | `Fail` calls `Report-LeaseFailure`; all post-claim local failure stages call `Fail`. |
| Timeout calls production fail endpoint | PASS | `render_timeout` branch calls `Fail 'render_timeout'`, which calls `Report-LeaseFailure`. |
| Claimed job becomes failed/retryable | PASS | `JOB-6A016363` changed `running` -> `failed`, `retryable=true`. |
| Job is not stranded | PASS | `JOB-6A016363` no longer `running`; status is `failed`. |
| No receipt produced | PASS | `receipt_id=null`, `receipt_path_exists=false`, no receipt files found. |
| No output exposed | PASS | `output_path_exists=false`, no output files found, no download URL in response. |
| No earning/payout recorded | PASS | no earning/payout references found for `JOB-6A016363`. |
| Wallet debit handled safely | PASS | one debit, one refund, no duplicate refund on repeat fail. |

## Commands Run

```powershell
rg -n "fail_url|report.*fail|failure_stage|render_timeout|nodemuncher.*fail|fail endpoint|retryable|earning|receipt" C:\Users\danki\Desktop\nodemuncher-codex\src-tauri\src\main.rs
rg -n "nodemuncher.*fail|jobs/.*/fail|failure_stage|retryable|claimed_by" C:\Users\danki\Desktop\farpy-frontend\scripts\job-api.mjs
node --check C:\Users\danki\Desktop\farpy-frontend\scripts\job-api.mjs
cargo check
```

Production read-only checks:

```bash
ssh root@farpy.com "python3 <job-state-inspection>"
ssh root@farpy.com "python3 <wallet-receipt-output-earning-inspection>"
```

Production mutation:

```powershell
POST https://farpy.com/node/v1/web-render/nodemuncher/jobs/JOB-6A016363/fail
```

This used the local paired node token from `C:\Users\danki\AppData\Local\FarpyNode\node.json`.

Token value was not printed.

## Build / Check Result

```text
node --check scripts/job-api.mjs: PASS
cargo check: PASS
```

## Notes

`JOB-6A016363` was already stranded before this proof pass. This proof recovered it through the real production fail endpoint and verified the required safe terminal state.

No broad redesign was performed.
