# NODEMUNCHER_LEASE_FAILURE_REPORT_V1

Status: IMPLEMENTED
Date: 2026-06-30

## Objective

When NodeMuncher claims a render and local render fails or times out, report failure back to production so the package does not remain stranded in `running` or `leased`.

## Files Changed

- `C:\Users\danki\Desktop\nodemuncher-codex\src-tauri\src\main.rs`
- `C:\Users\danki\Desktop\farpy-frontend\scripts\job-api.mjs`
- `C:\Users\danki\Desktop\farpy-frontend\release\NODEMUNCHER_LEASE_FAILURE_REPORT_V1.md`

## Backend Change

Added authenticated node failure endpoint:

- `POST /node/v1/web-render/nodemuncher/jobs/<job_id>/fail`
- Compatibility matcher also accepts `/node/v1/nodemuncher/jobs/<job_id>/fail`.

The endpoint:

- requires a valid paired node token
- requires the job to be claimed by `nodemuncher`
- requires `job.node_id` to match the authenticated node
- rejects already completed jobs
- is idempotent for already failed jobs
- sets `status=failed`
- records `failure_reason`, `failure_stage`, `failure_code`, `retryable=true`
- removes output and receipt fields
- runs existing failed-wallet-debit refund handling
- does not mint a receipt

The lease payload now includes:

- `fail_url`

Existing `input_url`, `progress_url`, and `complete_url` route matchers were updated to accept the already-issued `/node/v1/web-render/nodemuncher/...` path shape.

## Desktop Change

NodeMuncher now tracks the claimed lease and calls the production fail endpoint before returning local failure for claimed-package failures.

Reported stages include:

- `input_download`
- `render`
- `render_timeout`
- `zip`
- `complete`

The local `render-log.txt` records whether the failure report was attempted and whether it succeeded.

## Behavior Preserved

- No fake completion.
- No receipt on failed render.
- No payout/earning is recorded by the desktop on failure.
- Existing successful completion path remains unchanged.
- Lease auth and node-token behavior remain unchanged.

## Commands Run

- `node --check scripts\job-api.mjs`
- `npm.cmd run build`
- `npm.cmd run build:nodemuncher`
- `cargo check`
- `npm.cmd run tauri:nodemuncher`
- `scp C:\Users\danki\Desktop\farpy-frontend\scripts\job-api.mjs root@farpy.com:/tmp/job-api.mjs.nodemuncher-lease-failure-report-v1.20260630T201657Z`
- `ssh root@farpy.com "cp /opt/farpy-web-render/scripts/job-api.mjs ... && install ... && node --check ... && systemctl restart farpy-web-render-api.service"`

## Validation Result

PASS for local syntax/build/type checks.

Full NodeMuncher Tauri build produced:

- `C:\Users\danki\Desktop\nodemuncher-codex\src-tauri\target\release\farpy-nodemuncher.exe`
- `C:\Users\danki\Desktop\nodemuncher-codex\src-tauri\target\release\bundle\msi\Farpy NodeMuncher_0.1.0_x64_en-US.msi`
- `C:\Users\danki\Desktop\nodemuncher-codex\src-tauri\target\release\bundle\nsis\Farpy NodeMuncher_0.1.0_x64-setup.exe`

## Production Deploy

Deployed `scripts/job-api.mjs` to production.

Backup:

- `/opt/farpy-web-render/scripts/job-api.mjs.bak.nodemuncher_lease_failure_report_v1.20260630T201657Z`

Service:

- `farpy-web-render-api.service`: active

## Production Route Smoke

- Missing node token: `403 {"ok":false,"error":"forbidden"}`
- Invalid node token: `403 {"ok":false,"error":"forbidden"}`
- Valid paired node token with nonexistent job: `404 {"ok":false,"error":"not_found"}`
- Health: `200 {"ok":true,"service":"farpy-job-api",...}`

Valid-node proof used local paired node:

- `NODE-20260509T071411Z-145ab020`

The node token was not printed.

## Remaining Live Proof

One real claimed NodeMuncher package that fails or times out was not forced during this milestone. Expected live proof for the next controlled failure smoke:

- failed local render calls `fail_url`
- job becomes `failed`
- job has `retryable=true`
- no receipt is minted
- no output ZIP is exposed
- no payout/earning is recorded
