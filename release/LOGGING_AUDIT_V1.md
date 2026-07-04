# LOGGING_AUDIT_V1

Status: YELLOW

Mode: audit only. No code changes, no backend changes, no production mutation.

Date: 2026-06-30

## Scope

Reviewed logging and log-like output in:

- `scripts/job-api.mjs`
- `scripts/web-render-stripe-event.mjs`
- Farpy audit/smoke scripts
- NodeMuncher / Benchmark Tauri source in `src-tauri/src/main.rs`
- NodeMuncher smoke scripts and recent release notes

## Summary

Farpy has useful operational breadcrumbs for payment, wallet, receipt, worker, benchmark, and NodeMuncher flows. The best logs are structured around `job_id`, `event_id`, `session_id`, `invoice_id`, `node_id`, and `lease_id`.

The main issues are:

- Some logs include sensitive or customer-identifying data, especially `user_id`, full `session_id`, local file paths, and smoke-script email output.
- Some error logs lack enough request/job context to debug production incidents quickly.
- Some complete/fail/receipt paths depend on persisted job JSON more than explicit log lines, so operator reconstruction is possible but slower.
- Some logs are too verbose or too raw for long-term production retention, especially startup store paths and invalid JSON body excerpts in benchmark API.

Overall verdict: YELLOW. No proven P0 log leak was found in the inspected source, but several P1 hardening items should be done before broad scale.

## Findings

| Area | Evidence | Classification | Risk | Recommendation |
| --- | --- | --- | --- | --- |
| Stripe wallet credit logs | `scripts/job-api.mjs:901`, `scripts/web-render-stripe-event.mjs:138` log `user_id`, `session_id`, `amount_cents` | Sensitive data | `user_id` and Stripe session IDs are correlatable payment/customer identifiers. | Keep `amount_cents`; hash or truncate `user_id`; log only short `session_id` suffix/prefix or event id. |
| Stripe render capture logs | `scripts/job-api.mjs:941`, `984`; `scripts/web-render-stripe-event.mjs:155`, `208` log `job_id` and full `session_id`/checkout session id | Sensitive-ish data | Session IDs are not secret like API keys, but should be treated as payment provider identifiers. | Prefer `job_id`, `event_id`, and redacted `session_id=session_...last6`. |
| BTCPay credit logs | `scripts/job-api.mjs:1281` logs `user_id`, `invoice_id`, `rail`, `amount_cents`, duplicate flag | Sensitive data | Invoice IDs and user IDs can link customer payment history in logs. | Redact/hash `user_id`; keep invoice id only if logs are protected/retention-bound. |
| BTCPay invoice failure logs | `scripts/job-api.mjs:1126` logs status, code, message, rail | Good context | Redacted and useful; no token/API key shown. | Keep, but ensure BTCPay messages cannot include customer email/metadata before logging raw message. |
| Job read failure | `scripts/job-api.mjs:234` logs `job_read_failed`, file path, full error object | Sensitive path / missing job context | Absolute paths can expose host layout; file path may be enough but `job_id` is better. | Log `job_id` derived from filename plus error message/code; avoid full absolute path unless debug mode. |
| Ops receipt/wallet read failures | `scripts/job-api.mjs:1793`, `1812` log file path and error object | Sensitive path | Exposes production storage layout and may not include user-safe correlation id. | Log file basename/hash and error code; keep full path only in local debug. |
| Top-level job API catch | `scripts/job-api.mjs:2761` logs full error object | Missing context / possible sensitive data | Full error stack may include request path, body-derived strings, local path, or provider details. | Include safe request id, method, pathname, job_id if parsed; avoid logging body/cookies/tokens. |
| Startup server logs | `scripts/job-api.mjs:2770-2774` log host/port and store paths | Sensitive path / operationally useful | Helpful during startup but reveals filesystem layout in `journalctl`. | Keep for internal service logs, or gate full store paths behind `FARPY_VERBOSE_STARTUP_LOGS=1`. |
| Node pair store failures | `scripts/job-api.mjs:1465`, `1512` log error and file path | Sensitive path / missing node context | Useful, but should avoid full path and include safe store source. | Log source type and error code; do not log node tokens or pair codes. |
| NodeMuncher startup recovery | `src-tauri/src/main.rs:739`, `855`, `888`, `903`, `960-962`, `1572` append local recovery logs | Good context, some path exposure | Captures decisions with `job_id`, status, remote error; local `work_dir` path appears in structured decision object. | Keep `job_id`, `lease_id`, `node_id`, decision, remote error. Avoid full `work_dir` in user-facing export; okay in local debug file. |
| NodeMuncher render log | `src-tauri/src/main.rs:1382`, `1384`, `1448`, `1473` writes `render-log.txt` with `node_id`, `job_id`, `lease_id`, rendered file count, timeout reason | Good context | This is exactly what support needs for render proof; no token observed. | Keep. Add Blender exit code/stderr excerpt size-limited if not already included elsewhere. |
| NodeMuncher curl fail call | `src-tauri/src/main.rs:797` passes `x-farpy-node-token` as process argument to `curl.exe` | Sensitive process exposure | Token is not printed, but command-line args can be visible to local process inspection during call. | Prefer native HTTP client or stdin config long term; document local alpha risk. |
| Benchmark runtime instrumentation | `src-tauri/src/main.rs:204`, `249`, `250`, `265`, `267` logs `BENCHMARK_STARTED`, `BLENDER_PATH`, process start/exit, finish status | Useful but path-sensitive | Local Blender path is not a secret, but can expose username/installation path in captured logs. | Keep for local support; do not upload automatically without user consent. |
| Benchmark API invalid JSON | `scripts/public-leaderboard-api.cjs:704` logs first 200 bytes of invalid body | Sensitive data | A malformed request could include email/token-like data and be logged. | Replace body excerpt with byte count, content-type, request id, and parse error. |
| Smoke script auth probes | `scripts/nodemuncher-public-e2e-smoke.mjs:71-77` logs authenticated user id, email, wallet email, balance | Sensitive data | This is intentionally operator-facing but should not be pasted into public logs unredacted. | Redact email/user id by default; require `FARPY_SMOKE_VERBOSE_IDENTITY=1` for full identity. |
| Audit scripts URL redaction | `scripts/production-operations-dashboard-v1.ps1:14` redacts token/secret/key/session/cookie query params | Existing protection | Good pattern for future scripts. | Reuse this redaction helper across all PowerShell audit/smoke scripts. |

## Sensitive Data

### Found

- `user_id` in Stripe and BTCPay wallet logs.
- Full Stripe checkout/session IDs in payment logs.
- `invoice_id` in BTCPay credit logs.
- Local filesystem paths in startup and read-failure logs.
- Smoke-script emails and wallet balances.
- Possible invalid request body excerpt in benchmark leaderboard API.

### Not Found In Inspected Source

- No direct logging of `STRIPE_SECRET`, `BTCPAY_API_KEY`, `BTCPAY_WEBHOOK_SECRET`, `FARPY_OPS_TOKEN`, or node token values in normal server logs.
- NodeMuncher UI status reports `token_present`, not token value.
- Startup recovery release notes explicitly say node token was not printed.

## Missing Context

| Flow | Current State | Missing Context |
| --- | --- | --- |
| Generic job API exceptions | Full error object logged at top-level catch | request id, method, pathname, remote address class, safe `job_id` if route contains one |
| Upload failures | Errors returned and stored, but logging is not clearly structured | `upload_id`, `job_id`, file extension, size, failure code |
| Submit/payment gate | Job state persists enough data, but logs are sparse outside Stripe webhook | `job_id`, previous status, next status, payment mode, price cents |
| Receipt mint failure | Ops alerts exist; direct mint failure log context not clearly visible in scanned output | `job_id`, `receipt_id` if allocated, output sha present/missing, output path basename |
| Download failures | Not clearly logged in scanned source | `job_id`, token-valid/invalid without token value, byte count, range/no range |
| Worker claim/complete/fail | Job JSON is authoritative; source scan did not show concise CLAIM/COMPLETE/FAIL logs in `job-api.mjs` | `job_id`, `node_id`/`worker_id`, `lease_id`, renderer, frame count, rendered count, result status |
| Ops alerts | Summary exists; alert generation likely computed from state | structured alert creation/resolution logs with alert id/source |

## Missing Job IDs

P1 gaps:

- `job_read_failed` currently logs file path rather than a clean `job_id`.
- Top-level exception logging does not guarantee `job_id` extraction from URL.
- Upload/create errors may occur before a `job_id` exists; they should use `upload_id` or `request_id`.
- Receipt/read/wallet ops errors log files but not always correlated to `job_id` or `user_id_hash`.

No critical completed-render path without persisted `job_id` was proven.

## Missing Node IDs

Good:

- NodeMuncher local `render-log.txt` includes `node_id`, `job_id`, and `lease_id`.
- Startup recovery decisions include `node_id`.
- Node status surfaces use `node_id` while avoiding token display.

Gaps:

- Server-side worker claim/complete/fail logs are not visibly standardized as `CLAIM`, `COMPLETE`, `JOB_ERROR` records in the scanned `job-api.mjs` output.
- PR/remote worker and NodeMuncher paths should use the same field names: `node_id`, `worker_id`, `lease_id`, `renderer`, `job_id`.

## Missing Receipt IDs

Good:

- Receipt JSON and public job state persist `receipt_id`.
- Receipt/download audit docs include token redaction and canonical URL handling.

Gaps:

- Stripe capture logs use `job_id` and session IDs, but do not include `receipt_id` when an already-complete job receipt is updated.
- Worker complete logs, if present, were not easy to identify in the source scan. Completion should log `job_id`, `receipt_id`, `output_sha256_prefix`, `rendered_file_count`, and `zip_sha256_prefix`.
- Receipt read failures in ops log file path, not `receipt_id`.

## Excessive Logs

- Startup logs print all store paths every service start.
- Benchmark runtime prints local Blender path to stderr.
- Benchmark API invalid JSON body excerpt logs request content.
- Audit/smoke scripts can print many route checks and evidence URLs; this is useful, but should consistently redact tokenized URLs.

## Insufficient Logs

- Upload/create failure path lacks a concise structured log.
- Job status transition logs are not consistently visible as one-line records.
- Download/receipt token failure counts are not visibly logged in a privacy-safe way.
- Worker complete/fail logs should be standardized across PR workers and NodeMuncher.
- Wallet refund/reversal decisions should log idempotency decision with `job_id` and `event_id`, not customer identifiers.
- Alert creation/resolution should log alert id and source condition, not only expose ops summary.

## Recommended Logging Contract

Use one-line structured log events. Redact or hash customer/payment identifiers.

Required common fields:

- `event`
- `ts`
- `request_id`
- `job_id` when known
- `upload_id` when known
- `receipt_id` when known
- `node_id` / `worker_id` / `lease_id` for worker flows
- `status_from`
- `status_to`
- `error_code`
- `duration_ms`

Do not log:

- cookies
- bearer tokens
- node tokens
- download tokens
- receipt tokens
- raw provider API keys
- raw webhook signatures
- full request bodies
- full customer email unless explicitly operator-only and redacted by default

Preferred redactions:

- `email_hash=sha256(lowercase_email)`
- `user_id_hash=sha256(user_id)`
- `session_id=cs_...last6`
- `invoice_id=first8...last6` if needed
- `output_sha256_prefix=first12`

## Priority

### P0

None proven.

No inspected source showed normal production logs printing raw secrets such as Stripe secret keys, BTCPay API keys, webhook secrets, ops token, or node tokens.

### P1

1. Redact `user_id`, email, full Stripe session IDs, and BTCPay invoice IDs in logs and smoke output.
2. Remove invalid-body excerpts from benchmark API logs.
3. Standardize worker lifecycle logs: `CLAIMED`, `RUNNING`, `PROGRESS`, `COMPLETE`, `FAIL`, `REFUND`.
4. Add request/job/upload/receipt context to generic exception logs.
5. Avoid full absolute paths in production logs unless verbose debug mode is enabled.

### P2

1. Adopt a shared redaction helper for PowerShell and Node scripts.
2. Add a `request_id` to every API response/log line.
3. Add log-retention rules by category: access, payment, job lifecycle, debug.
4. Add operator runbook section for where logs live and what each event means.

## Commands Run

```powershell
rg -n "console\.|console\.log|console\.error|console\.warn|logger|log\(|LOG_|journal|render-log|access\.log|error\(|warn\(|println!|eprintln!|tracing|debug|info|audit|secret|token|cookie|email|receipt|job_id|node_id|worker_id|receipt_id" C:\Users\danki\Desktop\farpy-frontend\src C:\Users\danki\Desktop\farpy-frontend\scripts C:\Users\danki\Desktop\farpy-frontend\release -S --glob '!out/**' --glob '!node_modules/**'
```

```powershell
rg -n "console\.|console\.log|console\.error|console\.warn|logger|log\(|LOG_|journal|render-log|access\.log|error\(|warn\(|println!|eprintln!|tracing|debug|info|audit|secret|token|cookie|email|receipt|job_id|node_id|worker_id|receipt_id" C:\Users\danki\Desktop\nodemuncher-codex\src C:\Users\danki\Desktop\nodemuncher-codex\src-tauri C:\Users\danki\Desktop\nodemuncher-codex\scripts C:\Users\danki\Desktop\nodemuncher-codex\release -S --glob '!target/**' --glob '!node_modules/**'
```

```powershell
Select-String -Path C:\Users\danki\Desktop\farpy-frontend\scripts\job-api.mjs -Pattern "console\.log|console\.error|console\.warn|render-log|cookie|token|email|job_id|node_id|worker_id|receipt_id|INVOICE|BTCPAY|STRIPE|FAIL|COMPLETE|CLAIM|HEARTBEAT|OPS|UPLOAD|WALLET" -Context 0,1 | Select-Object -First 220
```

```powershell
Select-String -Path C:\Users\danki\Desktop\nodemuncher-codex\src-tauri\src\main.rs -Pattern "println!|eprintln!|log|render-log|node_token|x-farpy-node-token|job_id|node_id|lease_id|receipt_id|error|fail|timeout|Command|Blender" -Context 0,1 | Select-Object -First 220
```

```powershell
Select-String -Path C:\Users\danki\Desktop\farpy-frontend\scripts\web-render-stripe-event.mjs,C:\Users\danki\Desktop\farpy-frontend\scripts\*.ps1,C:\Users\danki\Desktop\farpy-frontend\scripts\*.mjs -Pattern "console\.log|console\.error|Write-Host|Write-Output|token|cookie|email|secret|job_id|node_id|receipt_id|download_token|receipt_token|STRIPE|BTCPAY|WALLET|FAIL|ERROR" -Context 0,0 | Select-Object -First 220
```

```powershell
rg -n "console\.(log|error|warn)|eprintln!|println!|Write-Host|Write-Output|append_startup_recovery_log|render-log" C:\Users\danki\Desktop\farpy-frontend\scripts\job-api.mjs C:\Users\danki\Desktop\farpy-frontend\scripts\web-render-stripe-event.mjs C:\Users\danki\Desktop\farpy-frontend\scripts\*.ps1 C:\Users\danki\Desktop\nodemuncher-codex\src-tauri\src\main.rs C:\Users\danki\Desktop\nodemuncher-codex\scripts\*.mjs C:\Users\danki\Desktop\nodemuncher-codex\scripts\*.cjs -S
```

Note: the final compact `rg` command returned useful matches but exited nonzero because several wildcard path arguments were passed literally by PowerShell.

## Files Changed

- `release/LOGGING_AUDIT_V1.md`

## Final Verdict

YELLOW.

Logging is operationally useful and no raw production secret logging was proven. The main launch-hardening work is redaction and standardization: reduce customer/payment identifiers, remove body excerpts, add consistent job/node/receipt context, and keep raw paths/provider IDs out of normal production logs.
