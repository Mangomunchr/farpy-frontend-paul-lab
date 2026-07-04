# FAILED_WALLET_REFUND_FIX_V1

## Status

PASS with one verification note: existing successful receipt/download token verification was not re-run against an arbitrary completed customer job because that would access private customer artifacts. The API health check passed, receipt/download code paths were not changed, and JOB-B13C609B was safely refunded through the authenticated worker failure path.

## Files Changed

- `scripts/job-api.mjs`
- `src/components/Workspace.tsx`
- `release/FAILED_WALLET_REFUND_FIX_V1.md`

## Policy Implemented

Failed wallet-funded web-render jobs now return the completed-render charge when no delivery artifact exists.

Refund eligibility:

- job `status` is `failed`
- job has a wallet debit amount
- payment mode is wallet or unset legacy wallet debit
- job has no output ZIP on disk
- job has no delivery receipt on disk
- deterministic refund event does not already exist

Refund event:

- `event_id`: `wallet-refund-<job_id>`
- `type`: `refund`
- `source`: `failed_web_render_no_delivery`
- amount equals `wallet_debit_cents`

Job fields stamped after refund:

- `payment_status=refunded`
- `wallet_refund_cents`
- `wallet_refund_event_id`
- `wallet_refunded_at`
- `payment_refunded_at`
- updated `balance_after_cents`

The path is idempotent: rerunning the same failure transition reuses the existing deterministic refund event and does not append a second refund.

## Root Cause

The local `scripts/render-worker.mjs` already had a refund helper for local worker failures, but production remote-worker failures are handled by `scripts/job-api.mjs` at:

- `POST /node/v1/worker/jobs/:job_id/fail`

That production fail route set the job to `failed`, removed output/receipt fields, and saved the job without reversing a prior wallet debit. JOB-B13C609B followed that remote-worker path, so the wallet debit remained without a delivery artifact.

## JOB-B13C609B Backfill Proof

Before:

- `status=failed`
- `payment_status=captured`
- `wallet_debit_cents=1`
- no output ZIP found
- no delivery receipt found
- no refund/reversal event found

Backfill method:

- deployed patched `scripts/job-api.mjs`
- restarted `farpy-web-render-api.service`
- replayed the authenticated worker fail endpoint for `JOB-B13C609B`
- did not print worker token
- removed temporary backfill helper after execution

After first replay:

```json
{
  "ok": true,
  "job_id": "JOB-B13C609B",
  "status": "failed",
  "payment_status": "refunded",
  "wallet_debit_cents": 1,
  "wallet_refund_cents": 1,
  "wallet_refund_event_id": "wallet-refund-JOB-B13C609B",
  "balance_after_cents": 3504,
  "can_download": false,
  "can_view_receipt": false
}
```

Idempotency replay returned the same refund event and same balance.

Ledger verification:

```json
{
  "job_id": "JOB-B13C609B",
  "status": "failed",
  "payment_status": "refunded",
  "wallet_debit_cents": 1,
  "wallet_refund_cents": 1,
  "wallet_refund_event_id": "wallet-refund-JOB-B13C609B",
  "balance_after_cents": 3504,
  "debit_event_count": 1,
  "refund_event_count": 1,
  "can_download": false,
  "can_view_receipt": false
}
```

## User-Facing Copy

Updated failed package copy:

- `This render factory encountered a problem. No completed delivery was produced.`
- `Try again and Farpy will route your package to another available render factory.`
- `If no delivery receipt was created, the completed-render charge is returned.`
- Button: `Send package again`

## Commands Run

- `rg -n "wallet_debit|wallet-debit|refund|reversal|payment_status|fail|failed|complete|receipt|ledger|balance_after" scripts src -g "*.mjs" -g "*.js" -g "*.ts" -g "*.tsx"`
- `Get-Content -LiteralPath scripts\job-api.mjs ...`
- `node --check scripts\job-api.mjs`
- `npm.cmd run build`
- `ssh root@farpy.com "cp /opt/farpy-web-render/scripts/job-api.mjs /opt/farpy-web-render/scripts/job-api.mjs.bak.failed-wallet-refund-"`
- `scp scripts/job-api.mjs root@farpy.com:/opt/farpy-web-render/scripts/job-api.mjs`
- `ssh root@farpy.com "node --check /opt/farpy-web-render/scripts/job-api.mjs"`
- `ssh root@farpy.com "systemctl restart farpy-web-render-api.service; systemctl is-active farpy-web-render-api.service"`
- `powershell -NoProfile -ExecutionPolicy Bypass -File C:\tmp\farpy-refund-backfill.ps1`
- `scp C:\tmp\farpy-refund-backfill.py root@farpy.com:/tmp/farpy-refund-backfill.py`
- `ssh root@farpy.com "python3 /tmp/farpy-refund-backfill.py"`
- `ssh root@farpy.com "python3 /tmp/farpy-refund-backfill.py"`
- `curl.exe -sS -i https://farpy.com/node/v1/web-render/jobs/JOB-B13C609B`
- `curl.exe -sS -i https://farpy.com/node/v1/web-render/health`
- `ssh root@farpy.com "rm -f /tmp/farpy-refund-backfill.py"`
- `Remove-Item -LiteralPath C:\tmp\farpy-refund-backfill.py,C:\tmp\farpy-refund-backfill.ps1 -Force -ErrorAction SilentlyContinue`

## Validation

- Local `node --check scripts\job-api.mjs`: PASS
- Local `npm.cmd run build`: PASS
- Production `node --check /opt/farpy-web-render/scripts/job-api.mjs`: PASS
- Production service restart: PASS, `farpy-web-render-api.service` active
- Production health: PASS, `GET /node/v1/web-render/health` returned 200
- JOB-B13C609B backfill: PASS
- JOB-B13C609B idempotency replay: PASS
- JOB-B13C609B output/receipt exposure: PASS, `can_download=false`, `can_view_receipt=false`
- Existing receipt/download private-token verification: NOT RUN against arbitrary completed customer job due privacy guardrail.

## Rollback

Production backup:

- `/opt/farpy-web-render/scripts/job-api.mjs.bak.failed-wallet-refund-`

Rollback command:

```bash
cp /opt/farpy-web-render/scripts/job-api.mjs.bak.failed-wallet-refund- /opt/farpy-web-render/scripts/job-api.mjs
systemctl restart farpy-web-render-api.service
```

