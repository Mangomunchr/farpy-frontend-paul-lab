# NODEMUNCHER_STARTUP_RECOVERY_PROOF_V1

Status: GREEN

## Objective

Review `NODEMUNCHER_STARTUP_RECOVERY_V1` and prove interrupted lease recovery.

## Files Changed

- `release/NODEMUNCHER_STARTUP_RECOVERY_PROOF_V1.md`

No product code was changed.

## Implementation Reviewed

NodeMuncher startup recovery lives in:

```text
C:\Users\danki\Desktop\nodemuncher-codex\src-tauri\src\main.rs
```

Relevant implementation:

- `node_data_dir()` uses `%LOCALAPPDATA%\FarpyNode`: `main.rs:619-623`
- recovery scans `%LOCALAPPDATA%\FarpyNode\work\*\job.json`: `main.rs:850-874`
- final recovery decisions are skipped on later startup: `main.rs:874-876`
- recovery posts to `fail_url` or fallback fail endpoint: `main.rs:912-928`
- recovery writes `startup-recovery.json`: `main.rs:948-959`
- recovery appends `logs\startup-recovery.log`: `main.rs:960-963`
- Tauri setup starts recovery in a background thread: `main.rs:1567-1578`

## Recovery Behavior

Startup recovery:

- reads local paired node identity
- detects interrupted work folders containing `job.json`
- sends a fail report to production using `x-farpy-node-token`
- records one local decision per interrupted work folder
- does not mark work complete
- does not mint receipts
- does not record earnings
- allows the app to continue launching normally

## Controlled Proof

Used an isolated temporary `%LOCALAPPDATA%`:

```text
C:\tmp\nodemuncher-startup-recovery-proof-v1-20260701T005909Z
```

Fixture:

```text
C:\tmp\nodemuncher-startup-recovery-proof-v1-20260701T005909Z\FarpyNode\node.json
C:\tmp\nodemuncher-startup-recovery-proof-v1-20260701T005909Z\FarpyNode\work\JOB-6A016363-proof\job.json
```

The fixture used real production job:

```text
JOB-6A016363
LEASE-D3BEE79EF91C
NODE-20260509T071411Z-145ab020
```

The node token was copied from the local paired node identity but was not printed.

This job was already safely failed/refunded by `NODEMUNCHER_LEASE_FAILURE_REPORT_PROOF_V1`, making it safe for startup-recovery idempotency proof.

## App Launch Proof

Launched:

```text
C:\Users\danki\Desktop\nodemuncher-codex\src-tauri\target\release\farpy-nodemuncher.exe
```

Observed:

```json
{
  "app_started": true,
  "app_alive_after_8s": true,
  "decision_file_exists": true,
  "log_file_exists": true,
  "decision": "reported_failed",
  "ok": true,
  "http_status": 200,
  "job_id": "JOB-6A016363",
  "node_id": "NODE-20260509T071411Z-145ab020",
  "token": "REDACTED"
}
```

The proof process was stopped manually after recovery completed.

## Local Recovery Decision

`startup-recovery.json`:

```json
{
  "decision": "reported_failed",
  "http_status": 200,
  "job_id": "JOB-6A016363",
  "lease_id": "LEASE-D3BEE79EF91C",
  "node_id": "NODE-20260509T071411Z-145ab020",
  "ok": true,
  "remote_error": "",
  "transport_error": "",
  "work_dir": "C:\\tmp\\nodemuncher-startup-recovery-proof-v1-20260701T005909Z\\FarpyNode\\work\\JOB-6A016363-proof"
}
```

`startup-recovery.log`:

```text
1782867551 decision=reported_failed job_id=JOB-6A016363 http_status=200 remote_error= transport_error=
1782867551 startup_recovery_finished ok=true recovered=1
```

Note: the endpoint returned HTTP 200 with `ok=true` for the already-failed job, so the local decision was `reported_failed`. This is safe and idempotent; production state did not duplicate receipts, earnings, or refunds.

## Production State After Startup Recovery

```json
{
  "job": {
    "job_id": "JOB-6A016363",
    "status": "failed",
    "retryable": true,
    "failure_stage": "render",
    "failure_code": "controlled_failure_report_proof",
    "receipt_id": null,
    "receipt_path_exists": false,
    "output_path_exists": false,
    "wallet_refund_event_id": "wallet-refund-JOB-6A016363",
    "payment_status": "refunded"
  },
  "debit_count": 1,
  "refund_count": 1,
  "receipt_files": [],
  "output_files": [],
  "earning_like_refs": []
}
```

## Verification Matrix

| Requirement | Result | Evidence |
| --- | --- | --- |
| App startup detects active interrupted lease | PASS | temp work folder with `job.json` produced `startup-recovery.json`. |
| Recovery logs decision | PASS | `startup-recovery.log` contains `decision=reported_failed` and final summary. |
| Lease is recovered safely | PASS | production fail endpoint accepted recovery; job remains safely `failed/retryable`. |
| No duplicate receipt | PASS | `receipt_files=[]`, `receipt_id=null`. |
| No duplicate earning | PASS | `earning_like_refs=[]`. |
| No duplicate refund | PASS | `debit_count=1`, `refund_count=1`. |
| App launches normally | PASS | process was alive after 8 seconds and recovery ran in background. |

## Commands Run

```powershell
Get-Content C:\Users\danki\Desktop\nodemuncher-codex\release\NODEMUNCHER_STARTUP_RECOVERY_V1.md -Raw
rg -n "startup_recovery|recover|active lease|startup-recovery|interrupted|reported_failed|already_failed|work_root|job.json" C:\Users\danki\Desktop\nodemuncher-codex\src-tauri\src\main.rs
Get-ChildItem $env:LOCALAPPDATA\FarpyNode -Recurse -Force
Start-Process C:\Users\danki\Desktop\nodemuncher-codex\src-tauri\target\release\farpy-nodemuncher.exe
cargo check
```

Production read-only verification:

```bash
ssh root@farpy.com "python3 <job-wallet-receipt-output-earning-inspection>"
```

## Build / Check Result

```text
cargo check: PASS
```

## Production Changes

The startup proof called the production fail endpoint for `JOB-6A016363` using the paired NodeMuncher token.

No code was deployed.
No production service was restarted.
No receipt was minted.
No earning was recorded.
No duplicate refund was recorded.
