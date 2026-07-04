# PACKAGE_FAILURE_RECOVERY_V1

## Status

UI copy: PASS

Billing proof: BLOCKER - JOB-B13C609B has no completed receipt or download, but the inspected wallet ledger shows a 1 cent wallet debit and no matching refund/reversal event.

## Files Changed

- `src/components/Workspace.tsx`
- `release/PACKAGE_FAILURE_RECOVERY_V1.md`

## Commands Run

- `rg -n "Render factory failed during rendering|Retry|No completed delivery|Verification Details|classifyFailure|failureInfo|classifiedFailure" src/components/Workspace.tsx`
- `git status --short`
- `Get-Content -LiteralPath src\components\Workspace.tsx | Select-Object -Skip 200 -First 35`
- `Get-Content -LiteralPath src\components\Workspace.tsx | Select-Object -Skip 630 -First 50`
- `curl.exe -sS -i https://farpy.com/node/v1/web-render/jobs/JOB-B13C609B`
- `ssh root@farpy.com 'cat /var/lib/farpy-web-render/jobs/JOB-B13C609B.json'`
- `ssh root@farpy.com 'find /var/lib/farpy-web-render -maxdepth 4 -name "*JOB-B13C609B*" -ls'`
- `ssh root@farpy.com 'ls -la /var/lib/farpy-web-render/outputs /var/lib/farpy-web-render/receipts'`
- `ssh root@farpy.com 'grep -R "JOB-B13C609B" /var/lib/farpy-web-render/wallet /var/lib/farpy 2>/dev/null'`
- `ssh root@farpy.com 'journalctl --grep JOB-B13C609B --no-pager -n 200'`
- `npm.cmd run build`
- `rg -n "Render factory failed during rendering" src\components\Workspace.tsx out`
- `rg -n "This render factory encountered a problem|Try again and Farpy will route your package|Send package again|Verification Details" src\components\Workspace.tsx out`

## Root-Cause Findings

Known production status payload:

- `job_id`: `JOB-B13C609B`
- `filename`: `blender-4.0-splash.blend`
- `renderer`: `blender`
- `status`: `failed`
- `frame_count`: `1`
- `created_at`: `2026-06-30T07:41:03.051Z`
- `submitted_at`: `2026-06-30T07:41:11.872Z`
- `started_at`: `2026-06-30T07:41:12.135Z`
- `failed_at`: `2026-06-30T07:41:42.024Z`
- `worker_id`: `pr-001-g0`
- `failure_reason`: `Remote worker failed render.`

The control-plane job JSON proves the package failed during remote render execution. No Blender stderr/stdout for this job was found in the inspected control-plane logs. `journalctl --grep JOB-B13C609B` returned no entries. The exact Blender/runtime error is not proven from the available control-plane evidence and likely requires PR-001 worker-local logs.

## Output And Receipt Proof

- No `JOB-B13C609B.zip` was found under `/var/lib/farpy-web-render/outputs`.
- No receipt referencing `JOB-B13C609B` was found in the inspected receipt/wallet grep.
- Job JSON has `can_download=false`.
- Job JSON has `can_view_receipt=false`.
- Public unauthenticated status does not expose private download or receipt URLs.

## Money Behavior

The job JSON and wallet ledger show:

- `payment_status`: `captured`
- `payment_mode`: `wallet`
- `wallet_debit_cents`: `1`
- `balance_after_cents`: `3503`
- wallet event: `wallet-debit-JOB-B13C609B`

No matching wallet refund/reversal event for `JOB-B13C609B` was found in the inspected wallet logs. This means the customer-facing copy must be careful: no completed delivery was produced, but automatic refund/reversal behavior for this failed wallet-funded package is not proven by the inspected evidence.

## Before / After Copy

Before:

- `Render factory failed during rendering.`
- Button: `Retry`
- No visible next-step sentence.

After:

- `This render factory encountered a problem. No completed delivery was produced.`
- `Try again and Farpy will route your package to another available render factory.`
- `If no receipt was created, no completed render charge was applied.`
- Button: `Send package again`

## Test Result

PASS:

- `npm.cmd run build` completed successfully.
- Built output contains the new failed-package copy.
- Built output contains `Send package again`.
- Built output keeps `Verification Details`.
- `Render factory failed during rendering` is absent from `src/components/Workspace.tsx` and `out`.
- No backend/API changes were made.

Remaining blocker:

- The failed wallet-funded job appears to have a 1 cent wallet debit without a proven refund/reversal in the inspected ledger. This should be handled as a billing recovery follow-up before telling users that all failed wallet-funded packages are automatically neutralized.
