# CONTROL_PLANE_BOUNDARY_V1

Status: DOCUMENTED
Date: 2026-06-30
Mode: Documentation only, no code/config changes

## Objective

Document Farpy architectural boundaries and classify every major component into planes:

- Control Plane
- Data Plane
- Render Plane
- Customer Plane
- Worker Plane
- Backup Plane
- Monitoring Plane

Each plane defines:

- responsibilities
- forbidden responsibilities
- future scaling notes

## Authoritative Host Roles

This boundary document follows `FARPY_INFRA_ROLE_FREEZE_V1`:

- Node A: production control plane only. Website, APIs, wallet, auth, jobs, uploads, receipts.
- Node B: warm standby, restore tests, synthetic monitoring, canary deploys.
- Node C: payments / BTCPay, future render worker migration target. Avoid mixing heavy rendering with payments long term.
- Storage Box: encrypted backup destination.
- IONOS VPS: external synthetic monitor only.

## Plane Summary

| Plane | Primary Purpose | Current Components | Must Not Do |
| --- | --- | --- | --- |
| Control Plane | Decide, authorize, price, schedule, record state | Node A `job-api.mjs`, auth/session, wallet, job lifecycle, Caddy routing, ops summary | Render customer frames, store private backup keys, run GPU workloads |
| Data Plane | Hold customer and render artifacts | `/var/lib/farpy-web-render`, `/var/lib/farpy`, uploads, outputs, receipts, wallet JSONL | Decide scheduling/payment policy, execute render binaries |
| Render Plane | Execute render commands and produce artifacts | Blender local/remote execution paths, Octane PR-003 lane, future render partner machines | Own wallet state, mint arbitrary receipts, bypass payment |
| Customer Plane | Human UI and public-facing static surfaces | `farpy.com`, Next static export, workspace, receipt, account, topup, addon, benchmark pages | Hold secrets, mutate wallet directly, expose private tokens publicly |
| Worker Plane | Authenticated external supply protocol | NodeMuncher pair/heartbeat/lease/claim/input/progress/complete/fail endpoints and desktop app | Accept query tokens, claim unpaid jobs, fabricate completion without ZIP validation |
| Backup Plane | Preserve recoverability | `/var/backups/farpy`, Storage Box, recovery USB, future age-encrypted snapshots, Node B restore tests | Serve production traffic, hold unencrypted offsite customer data |
| Monitoring Plane | Detect and report failure | `/node/v1/ops/summary`, production audit scripts, funnel reports, IONOS synthetic checks | Mutate production state except explicit alert acknowledgement endpoints |

## Control Plane

### Responsibilities

- Authenticate customer and worker requests.
- Own job lifecycle transitions: upload, priced, payment-ready, submitted, leased/running, complete, failed/refunded.
- Enforce wallet/payment gates before render execution.
- Mint delivery receipts only after validated output artifacts exist.
- Enforce token-gated download and receipt access.
- Maintain authoritative wallet ledger state.
- Serve read-only public benchmark and status APIs.
- Expose operator summary/alerts behind ops token.
- Route public HTTPS traffic through Caddy/reverse proxy.

### Current Components

- Node A production API service: `scripts/job-api.mjs` / `/opt/farpy-web-render/scripts/job-api.mjs`.
- Caddy routing for `farpy.com`, `api.farpy.com`, and proxied `/node/*` routes.
- Auth/session and Google OAuth callback handling.
- Wallet topup and checkout endpoints.
- Stripe webhook and BTCPay webhook handlers.
- Job JSON state, receipt minting, download token checks, NodeMuncher lease APIs.
- Ops summary and alert generation.

### Forbidden Responsibilities

- Running customer render workloads on the control plane as a normal operating model.
- Using global worker tokens for public NodeMuncher nodes.
- Storing private backup decryption keys for offsite backups.
- Serving plaintext backup archives publicly or from web roots.
- Manually mutating wallet balances outside audited ledger events.
- Treating monitoring/audit scripts as source of truth for wallet or receipt state.

### Future Scaling Notes

- Split control APIs into smaller services only after schemas and state transitions are stable.
- Keep payment/wallet state strongly serialized before increasing concurrent render volume.
- Move render execution entirely out of Node A as render supply grows.
- Introduce durable queue/storage only with explicit migration and rollback plan.
- Keep public API compatibility stable; add versioned endpoints before breaking clients.

## Data Plane

### Responsibilities

- Store uploaded `.blend` and `.orbx` packages.
- Store generated output ZIPs and render artifacts.
- Store job metadata, receipts, wallet ledger JSONL, Stripe/BTCPay event records, and account/auth state.
- Preserve SHA-256 evidence for inputs/outputs.
- Provide deterministic state for restore tests and audit scripts.

### Current Components

- `/var/lib/farpy-web-render` for jobs, uploads, outputs, receipts, wallet/payment-related web-render state.
- `/var/lib/farpy` for account/auth and legacy/adjacent production state.
- `RECEIPT_DIR`, `WALLET_DIR`, `UPLOAD_DIR`, `OUTPUT_DIR`, and job store paths configured by environment or defaults in `scripts/job-api.mjs`.

### Forbidden Responsibilities

- Executing render commands.
- Deciding if a job is paid or eligible.
- Accepting unauthenticated writes from workers or customers.
- Holding offsite backup plaintext after the encrypted backup flow is implemented.
- Mixing production data with synthetic/test artifacts without clear markers.

### Future Scaling Notes

- Separate hot job state from large artifact storage when output volume grows.
- Add object storage only after tokenized download semantics are preserved.
- Keep receipt artifacts immutable once minted, except explicit reconciliations documented in release notes.
- Add periodic integrity scans comparing receipt SHA, output file SHA, and job JSON.

## Render Plane

### Responsibilities

- Execute Blender and Octane render commands in constrained, supported ways.
- Produce real output frames and ZIP artifacts.
- Report progress, completion, or failure truthfully.
- Fail closed on missing frames, timeout, invalid ZIP, or process crash.
- Keep render logs useful for customer support and ops diagnosis.

### Current Components

- Blender render path used by web-render jobs and NodeMuncher.
- Octane remote worker lane on PR-003 / future GPU render partner nodes.
- ZIP validation expectations: `manifest.json`, `job.json`, `render-log.txt`, `output/frame_####.*`.
- Benchmark desktop uses local Blender but is outside production render plane.

### Forbidden Responsibilities

- Debiting wallet or crediting earnings directly.
- Minting receipts without control-plane validation.
- Rendering unpaid/unsubmitted jobs.
- Completing jobs without a real artifact.
- Running arbitrary commands outside supported renderer contracts.
- Using control plane Node A as a general render worker.

### Future Scaling Notes

- Render partners should be replaceable and stateless apart from local temporary work dirs.
- Add renderer capabilities explicitly instead of broad arbitrary command support.
- Keep per-renderer timeout policies documented and enforce them locally and server-side.
- Move Octane away from payment host Node C long term if it ever migrates there.

## Customer Plane

### Responsibilities

- Explain Farpy simply and truthfully.
- Let customers sign in, top up, upload packages, pay/send packages, track status, download ZIPs, and view delivery receipts.
- Preserve public-safe proof and benchmark surfaces.
- Keep disabled/deferred rails clearly gated.
- Render advanced technical details without exposing secrets.

### Current Components

- Next/static frontend under `src/app` and `src/components`.
- Homepage package-label flow.
- `/signin`, `/account`, `/topup`, `/workspace`, `/receipt`, `/status`, `/addon`, `/downloads`, `/proof`, `/benchmark/*`.
- Blender add-on website handoff and download ZIP.
- Public docs/legal/refunds/privacy/terms pages.

### Forbidden Responsibilities

- Storing API secrets, worker tokens, or backup keys in client code.
- Crediting wallet client-side.
- Fabricating progress, render partner telemetry, public proof counts, or receipts.
- Exposing private receipt/download tokens in public pages or sitemap.
- Advertising Lightning, PayPal, broad NodeMuncher launch, or scale claims before proof is GREEN.

### Future Scaling Notes

- Keep the customer plane as static/read-mostly where possible.
- Use feature flags for payment rails and controlled-alpha surfaces.
- Continue separating simple customer language from advanced verification details.
- Add self-service support forms only when backed by honest non-mutating intake or clearly labeled placeholders.

## Worker Plane

### Responsibilities

- Pair NodeMuncher nodes using real node identity and token persistence.
- Heartbeat to production with valid node token.
- Peek/claim eligible paid submitted jobs.
- Download assigned input only with node token authorization.
- Execute render loop locally.
- Upload completion ZIP or report failure.
- Preserve earnings/history proof from authoritative backend responses.

### Current Components

- NodeMuncher desktop app and Tauri/Rust/React code in `nodemuncher-codex`.
- Safe NodeMuncher lease APIs under `/node/v1/nodemuncher/lease/*`.
- Node input/progress/complete/fail routes under `/node/v1/.../nodemuncher/jobs/*`.
- Worker token routes for PR-003 Octane lane under `/node/v1/worker/*`.
- Heartbeat route on `api.farpy.com/node/heartbeat`.

### Forbidden Responsibilities

- Accepting tokens from query strings.
- Claiming unpaid, unpriced, completed, or already-running jobs.
- Completing jobs without ZIP validation.
- Generating fake frames or fake receipts.
- Receiving global production worker tokens intended for another lane.
- Holding customer wallet/payment authority.

### Future Scaling Notes

- Public NodeMuncher launch requires signing, auto-update, installer trust, crash recovery, render watchdog, clear logs, and earnings/history proof.
- Capability matching should stay explicit per renderer and hardware class.
- Lease recovery/release/fail behavior must remain idempotent before fleet growth.
- Add rate limits and abuse controls before broad public worker signup.

## Backup Plane

### Responsibilities

- Preserve recoverability of configs, services, app code, job data, wallet data, receipts, uploads, and output metadata/artifacts where feasible.
- Keep offsite backups encrypted before leaving Node A.
- Prove restore on Node B or another non-production target.
- Maintain recovery USB/runbooks for operator continuity.

### Current Components

- Same-host snapshots under `/var/backups/farpy`.
- Recovery USB materials under `Farpy-Recovery/` from `FARPY_RECOVERY_USB_V1`.
- Storage Box as encrypted offsite destination.
- Node B as warm standby/restore-test host.
- `WEB_RENDER_BACKUP_ENCRYPTION_PLAN_V1` recommends `age` before offsite push.

### Forbidden Responsibilities

- Uploading plaintext production archives offsite as a normal process.
- Storing private `age` identity on Storage Box.
- Restoring over live production paths without stopping affected services and preserving current state.
- Treating backup creation as proof without restore verification.
- Serving backup files from public web roots.

### Future Scaling Notes

- Implement encrypted snapshot creation/push/restore-proof scripts as separate milestones.
- Keep retention on encrypted snapshot directories, not a single mirrored latest directory.
- Add periodic restore proof and checksum verification.
- Add Node C/BTCPay backup plane separately if payments host remains independent.

## Monitoring Plane

### Responsibilities

- Detect broken public routes, API failures, stale workers, stuck jobs, wallet debit without completion, receipt mismatches, ZIP validation failures, disk pressure, and synthetic traffic regressions.
- Provide operator dashboards and reports without exposing secrets.
- Run external synthetic monitoring from Node B / IONOS.
- Produce read-only audit evidence.

### Current Components

- `/node/v1/ops/summary` with token-gated private ops data.
- `/ops` internal dashboard.
- Alert generation in `scripts/job-api.mjs`.
- `scripts/production-regression-audit-v1.ps1`.
- `scripts/production-operations-dashboard-v1.ps1`.
- `scripts/regression/platform-regression-suite-v1.ps1`.
- Funnel report timer and `/opt/farpy/reports` production reports.
- IONOS external monitor role.

### Forbidden Responsibilities

- Mutating jobs, wallets, receipts, or payments from monitoring checks.
- Printing tokens, cookies, env secrets, or private URLs unredacted.
- Marking fake GREEN when private proof inputs are missing.
- Acknowledging alerts without resolving the underlying condition.
- Running load/destructive tests from routine monitoring.

### Future Scaling Notes

- Add alert delivery to multiple operators.
- Keep public-safe monitoring separate from ops-token private metrics.
- Add SLO-style summaries only after route and job telemetry is stable.
- Keep dashboard read-only; mutation/recovery actions should remain explicit runbooks.

## Cross-Plane Rules

1. Customer Plane may request actions, but Control Plane decides authorization and state changes.
2. Worker Plane may render and report, but Control Plane validates artifacts and mints receipts.
3. Render Plane may produce files, but Data Plane stores authoritative artifacts and hashes.
4. Backup Plane may copy and encrypt state, but must not alter live service state.
5. Monitoring Plane may observe and alert, but must not silently repair money/render state.
6. Payment providers are external dependencies; Control Plane must verify webhooks and idempotency before wallet changes.
7. Public proof must derive from public-safe receipts/artifacts or say `No public proof yet`.

## Boundary Risks To Watch

| Risk | Boundary Violation | Current Mitigation | Needed Discipline |
| --- | --- | --- | --- |
| Control plane accidentally becomes render host | Control Plane / Render Plane mix | Rule: Node A production control plane only | Keep render workers off Node A except explicit emergency/proof work |
| Monitoring mutates production | Monitoring Plane / Control Plane mix | Audit scripts are read-only by design | Keep recovery scripts separate and manually invoked |
| Worker fabricates completion | Worker Plane / Control Plane trust leak | ZIP/frame validation and receipt minting server-side | Maintain strict complete validation |
| Customer sees fake proof | Customer Plane / Monitoring Plane confusion | Public proof says `No public proof yet` when unavailable | Only populate from receipt-derived public-safe data |
| Offsite plaintext exposure | Backup Plane / Data Plane leak | Encryption plan created | Implement `age` before offsite push |
| Payment host mixed with render | Node C role confusion | Node C payments/future render migration caveat | Avoid heavy rendering on payments host long term |

## Commands Run

Read-only inspection only:

```powershell
rg -n "Node A|Node B|Node C|control plane|worker|Storage Box|monitoring|BTCPay|Caddy|systemd|render|wallet|receipt|upload|backup|ops|NodeMuncher|Benchmark" release scripts src -S
```

No code changes were made.
No production changes were made.
No secrets were printed.
