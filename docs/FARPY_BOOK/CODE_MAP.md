# CODE_MAP

Status: YELLOW

Date: 2026-06-30

Mode: Audit only. No production code changed.

## Purpose

Map Farpy code by likely ownership area and identify files with no obvious ownership.

This is not a human ownership assignment. It is a code responsibility map for handoff, review routing, and launch maintenance.

## Ownership Signals Found

- No `CODEOWNERS` file found in the scanned active repo roots.
- No `OWNERS` file found in the scanned active repo roots.
- `C:\Users\danki\Desktop\farpy-frontend\AGENTS.md` contains framework guidance, but no subsystem ownership.
- `C:\Users\danki\Desktop\nodemuncher-codex\AGENTS.md` contains product guardrails for NodeMuncher / Benchmark, but no named ownership.
- Ownership is currently implied by path, filename, and release notes.

## Repositories Scanned

- `C:\Users\danki\Desktop\farpy-frontend`
- `C:\Users\danki\Desktop\nodemuncher-codex`

Generated/vendor/runtime directories were observed and should not be treated as source ownership:

- `node_modules/`
- `.next/`
- `out/`
- `dist/`
- `dist-nodemuncher/`
- `src-tauri/target/`
- `.farpy-*` local runtime data

## Code Map

### Frontend

Likely owner area: Customer Plane / Web Frontend.

Primary files:

- `src/app/page.tsx`
- `src/app/layout.tsx`
- `src/app/globals.css`
- `src/app/pricing/page.tsx`
- `src/app/topup/page.tsx`
- `src/app/workspace/page.tsx`
- `src/app/workspace/[id]/page.tsx`
- `src/app/receipt/page.tsx`
- `src/app/account/page.tsx`
- `src/app/signin/page.tsx`
- `src/app/signup/page.tsx`
- `src/app/status/page.tsx`
- `src/app/addon/page.tsx`
- `src/app/downloads/page.tsx`
- `src/app/faq/page.tsx`
- `src/app/docs/page.tsx`
- `src/app/contact/page.tsx`
- `src/app/privacy/page.tsx`
- `src/app/terms/page.tsx`
- `src/app/refunds/page.tsx`
- `src/app/security/page.tsx`
- `src/app/acceptable-use/page.tsx`
- `src/app/dmca/page.tsx`
- `src/components/HomeRenderFlow.tsx`
- `src/components/Workspace.tsx`
- `src/components/ReceiptPage.tsx`
- `src/components/AccountPage.tsx`
- `src/components/TopUpPage.tsx`
- `src/components/AuthPage.tsx`
- `src/components/AddonPage.tsx`
- `src/components/PublicProofPage.tsx`
- `src/components/OpsCommandCenter.tsx`
- `src/components/JourneyTimeline.tsx`
- `src/components/SiteNav.tsx`
- `src/components/SiteFooter.tsx`
- `src/lib/worldLanguage.ts`
- `src/lib/webRenderApi.ts`
- `src/lib/useRenderJob.ts`
- `src/lib/downloadRender.ts`
- `src/lib/proofs.ts`
- `src/lib/renderStore.ts`
- `src/lib/types.ts`

No obvious ownership:

- `src/components/Workspace.tsx.bak.receipt_workspace_ux_20260628T152924Z`
- `src/components/ReceiptPage.tsx.bak.receipt_workspace_ux_20260628T152924Z`
- `src/app/globals.css.bak.receipt_workspace_ux_20260628T152924Z`

Reason: backup files live beside active source and can be mistaken for maintained code.

Recommended ownership:

- Assign one frontend owner for customer-facing pages.
- Move backup files out of `src/` or delete after archiving.
- Treat `src/lib/worldLanguage.ts` as the canonical vocabulary owner.

### Backend

Likely owner area: Control Plane / API.

Primary files:

- `scripts/job-api.mjs`
- `scripts/prod-web-render-smoke.mjs`
- `scripts/service-smoke.mjs`
- `scripts/service-status.ps1`
- `scripts/start-local-services.ps1`
- `scripts/stop-local-services.ps1`
- `deploy/systemd/farpy-web-render-api.service`

No obvious ownership:

- `scripts/job-api.mjs`

Reason: this single file appears to own several critical domains at once: auth/session, uploads, pricing, checkout, wallet, jobs, receipts, worker endpoints, ops summary, BTCPay, Stripe, and security behavior.

Recommended ownership:

- Assign `scripts/job-api.mjs` to Backend / Money / Receipts joint review.
- Require explicit review for any patch touching wallet mutation, receipt minting, download URL creation, webhook handling, or worker completion.

### Worker

Likely owner area: Render Plane / Worker Plane.

Primary files:

- `scripts/render-worker.mjs`
- `deploy/systemd/farpy-web-render-worker.service`
- `scripts/prod-web-render-smoke.mjs`
- `C:\Users\danki\Desktop\nodemuncher-codex\scripts\nodemuncher-public-e2e-smoke.mjs`
- `C:\Users\danki\Desktop\nodemuncher-codex\src-tauri\src\main.rs`
- `C:\Users\danki\Desktop\nodemuncher-codex\src-nodemuncher\NodeMuncherApp.tsx`

External production file referenced by release notes but not clearly owned in local source:

- `/opt/farpy-node/web-render-http-worker.py`

No obvious ownership:

- Worker fail/report semantics are split between backend endpoints, local NodeMuncher code, and remote production worker scripts.

Recommended ownership:

- Assign one worker owner for claim/download/render/package/complete/fail behavior.
- Keep remote worker source mirrored in repo if it is production-critical.

### Wallet

Likely owner area: Money / Ledger.

Primary files:

- `scripts/job-api.mjs`
- `scripts/web-render-stripe-event.mjs`
- `scripts/reconcile-stripe-web-render-session.mjs`
- `src/components/TopUpPage.tsx`
- `src/components/AccountPage.tsx`
- `src/app/topup/page.tsx`
- `src/app/account/page.tsx`
- `scripts/fresh-customer-e2e-smoke-v1.ps1`
- `scripts/public-user-smoke-v1.ps1`

No obvious ownership:

- Wallet behavior is not isolated into a wallet-specific backend module.
- Stripe, BTCPay, wallet ledger, account history, and refund/reversal behavior appear coupled through `scripts/job-api.mjs` and adjacent scripts.

Recommended ownership:

- Assign a Money owner.
- Require review for wallet debit, credit, refund, top-up, webhook, and account-history changes.

### Receipts

Likely owner area: Trust Chain / Delivery Proof.

Primary files:

- `scripts/job-api.mjs`
- `src/components/ReceiptPage.tsx`
- `src/components/RawReceiptToggle.tsx`
- `src/components/PricingReceipt.tsx`
- `src/lib/proofs.ts`
- `src/lib/downloadRender.ts`
- `src/lib/zip.ts`
- `src/app/receipt/page.tsx`
- `src/app/proof/page.tsx`
- `src/app/proof/[slug]/page.tsx`

Runtime/data locations observed locally:

- `.farpy-receipts/`
- `.farpy-outputs/`

No obvious ownership:

- Receipt generation, output ZIP validation, and tokenized receipt/download URLs are cross-cutting.

Recommended ownership:

- Assign a Receipt/Trust owner.
- Treat receipt fields, output SHA-256, ZIP validation, and tokenized download/receipt URLs as protected contracts.

### Benchmark

Likely owner area: Benchmark Product.

Primary files:

- `C:\Users\danki\Desktop\nodemuncher-codex\src\pages\Benchmark.tsx`
- `C:\Users\danki\Desktop\nodemuncher-codex\src\core\benchmarkRunner.ts`
- `C:\Users\danki\Desktop\nodemuncher-codex\src\core\leaderboardClient.ts`
- `C:\Users\danki\Desktop\nodemuncher-codex\scripts\public-leaderboard-api.cjs`
- `C:\Users\danki\Desktop\nodemuncher-codex\scripts\generate-benchmark-sitemap.cjs`
- `C:\Users\danki\Desktop\nodemuncher-codex\public\benchmark\index.html`
- `C:\Users\danki\Desktop\nodemuncher-codex\public\benchmark\leaderboard\index.html`
- `C:\Users\danki\Desktop\nodemuncher-codex\public\benchmark\latest\index.html`
- `C:\Users\danki\Desktop\nodemuncher-codex\public\benchmark\search\index.html`
- `C:\Users\danki\Desktop\nodemuncher-codex\public\benchmark\result\index.html`
- `C:\Users\danki\Desktop\nodemuncher-codex\public\benchmark\gpu\index.html`
- `C:\Users\danki\Desktop\nodemuncher-codex\public\benchmark\compare\index.html`
- `C:\Users\danki\Desktop\nodemuncher-codex\src-tauri\tauri.conf.json`
- `public/downloads/farpy-benchmark-windows-amd64.exe`
- `public/downloads/farpy-benchmark-windows-amd64.exe.sha256`
- `public/downloads/farpy-benchmark-windows-amd64.msi`
- `public/downloads/farpy-benchmark-windows-amd64.msi.sha256`

No obvious ownership:

- Benchmark artifacts are published from the frontend repo while app source lives in `nodemuncher-codex`.

Recommended ownership:

- Assign one Benchmark release owner responsible for desktop code, installer artifacts, public download links, and leaderboard API compatibility.

### NodeMuncher

Likely owner area: Worker Product / Desktop Worker.

Primary files:

- `C:\Users\danki\Desktop\nodemuncher-codex\src-nodemuncher\NodeMuncherApp.tsx`
- `C:\Users\danki\Desktop\nodemuncher-codex\src-nodemuncher\NodeMuncherApp.css`
- `C:\Users\danki\Desktop\nodemuncher-codex\src-nodemuncher\main.tsx`
- `C:\Users\danki\Desktop\nodemuncher-codex\src-tauri\src\main.rs`
- `C:\Users\danki\Desktop\nodemuncher-codex\src-tauri\tauri.nodemuncher.conf.json`
- `C:\Users\danki\Desktop\nodemuncher-codex\vite.nodemuncher.config.ts`
- `C:\Users\danki\Desktop\nodemuncher-codex\scripts\prepare-nodemuncher-dist.cjs`
- `C:\Users\danki\Desktop\nodemuncher-codex\scripts\nodemuncher-public-e2e-smoke.mjs`
- `C:\Users\danki\Desktop\nodemuncher-codex\src\core\pairingFlow.ts`
- `C:\Users\danki\Desktop\nodemuncher-codex\src\core\historyStore.ts`
- `C:\Users\danki\Desktop\nodemuncher-codex\src\db\pairing.sql`
- `C:\Users\danki\Desktop\nodemuncher-codex\src\db\schema.sql`
- `public/downloads/nodemuncher-windows-amd64.exe`
- `public/downloads/nodemuncher-windows-amd64.exe.sha256`
- `public/downloads/nodemuncher-windows-amd64.msi`
- `public/downloads/nodemuncher-windows-amd64.msi.sha256`
- `public/downloads/nodemuncher-macos-aarch64.dmg`
- `public/downloads/nodemuncher-macos-aarch64.dmg.sha256`

No obvious ownership:

- NodeMuncher code shares repo and Tauri infrastructure with Benchmark.
- Public artifacts are staged in the Farpy frontend repo.

Recommended ownership:

- Assign one NodeMuncher owner for pairing, token persistence, heartbeat, lease, render execution, fail reporting, installer artifacts, and uninstall behavior.
- Keep Benchmark and NodeMuncher release ownership separate even when they share Tauri files.

### Addon

Likely owner area: Blender Add-on / Customer Upload Handoff.

Primary files and artifacts:

- `src/components/AddonPage.tsx`
- `src/app/addon/page.tsx`
- `public/downloads/Farpy-Blender-Addon-unified.zip`
- `public/downloads/Farpy-Blender-Addon-unified.zip.sha256`
- `scripts/blender-addon-production-audit-v1.ps1`
- `release/BLENDER_ADDON_POLISH_V1.md`
- `release/ADDON_WEBSITE_HANDOFF_V1.md`
- `release/ADDON_INSTALL_SMOKE_V1.md`
- `release/ADDON_PRODUCTION_DEPLOY_V1.md`

No obvious ownership:

- The shipped add-on ZIP is present, but its canonical editable source was not obvious in the scanned Farpy frontend file list.

Recommended ownership:

- Assign one Add-on owner.
- Document the canonical source path for the ZIP.
- Require SHA sidecar update whenever the ZIP changes.

### Security

Likely owner area: Security / Trust / Abuse Resistance.

Primary files:

- `scripts/job-api.mjs`
- `deploy/systemd/farpy-web-render-api.service`
- `deploy/systemd/farpy-web-render-worker.service`
- `src/app/security/page.tsx`
- `src/app/privacy/page.tsx`
- `src/app/terms/page.tsx`
- `src/app/acceptable-use/page.tsx`
- `src/app/dmca/page.tsx`
- `release/FARPY_SECURITY_ATTACK_SURFACE_AUDIT_V1.md`
- `release/SECURITY_GOLD_AUDIT_V1.md`
- `release/JOB_STATUS_TOKEN_DISCLOSURE_FIX_V1.md`
- `release/WORKER_AUTH_NO_QUERY_TOKEN_V1.md`
- `release/PROD_ENV_SECRET_PERMISSION_HARDENING_V1.md`
- `release/PRICE_ROUTE_MALFORMED_JSON_FAIL_CLOSED_V1.md`
- `release/WEB_RENDER_INVALID_JSON_FIX_V1.md`

No obvious ownership:

- Security fixes are documented as release notes, but security-critical code is spread across backend, frontend, systemd, and worker code.

Recommended ownership:

- Assign a Security reviewer for every change touching auth, tokens, cookies, webhook signatures, wallet mutation, download/receipt URLs, worker auth, and upload paths.

### Infrastructure

Likely owner area: Ops / Deployment / Recovery.

Primary files:

- `deploy/systemd/farpy-web-render-api.service`
- `deploy/systemd/farpy-web-render-worker.service`
- `scripts/production-regression-audit-v1.ps1`
- `scripts/production-operations-dashboard-v1.ps1`
- `scripts/launch-freeze-v1.ps1`
- `scripts/nodemuncher-fresh-install-v1.ps1`
- `scripts/service-status.ps1`
- `scripts/service-smoke.mjs`
- `docs/FARPY_BOOK/10_BACKUPS.md`
- `docs/FARPY_BOOK/11_DISASTER_RECOVERY.md`
- `docs/FARPY_BOOK/12_DEPLOYMENT.md`
- `docs/FARPY_BOOK/15_INFRASTRUCTURE.md`
- `docs/FARPY_BOOK/16_OPERATIONS.md`
- `release/FARPY_INFRA_ROLE_FREEZE_V1.md`
- `release/DISASTER_RECOVERY_AUDIT_V1.md`
- `release/WEB_RENDER_BACKUP_ENCRYPTION_PLAN_V1.md`
- `release/FARPY_RECOVERY_USB_V1.md`
- `release/OFFSITE_BACKUP_OPERATOR_APPROVAL_V1.md`
- `release/FOUNDER_ABSENCE_FIX_V1.md`

No obvious ownership:

- Caddy configuration, `/etc/farpy` env files, production-only systemd drop-ins, and offsite backup jobs are referenced by release notes but are not fully represented as source-controlled config in the scanned repo.

Recommended ownership:

- Assign an Infrastructure owner.
- Mirror production Caddy and systemd drop-ins into a protected source-controlled `deploy/` tree with redacted secret values.

## Cross-Cutting Files With Highest Ownership Risk

| File | Why Ownership Is Unclear | Recommended Owner |
| --- | --- | --- |
| `scripts/job-api.mjs` | Backend, wallet, payment, receipt, upload, worker, ops, BTCPay, Stripe, and security behavior converge in one file. | Backend + Money + Security joint owner |
| `scripts/render-worker.mjs` | Worker execution and package completion behavior. | Worker owner |
| `/opt/farpy-node/web-render-http-worker.py` | Production-critical Octane/remote worker path referenced in release notes but not obvious in local source tree. | Worker owner |
| `src/components/Workspace.tsx` | Customer package state, payment action, failed state, download, receipt, and advanced details. | Frontend + Receipts owner |
| `src/components/TopUpPage.tsx` | Customer money UI, Stripe/Bitcoin rail visibility, auth/error states. | Frontend + Money owner |
| `src/components/ReceiptPage.tsx` | Receipt proof display and download trust chain. | Receipts owner |
| `public/downloads/*` | Public release artifacts for Add-on, Benchmark, and NodeMuncher live together. | Release owner per product |
| `C:\Users\danki\Desktop\nodemuncher-codex\src-tauri\src\main.rs` | Shared desktop native surface for Benchmark and NodeMuncher behavior. | Desktop owner |
| `C:\Users\danki\Desktop\nodemuncher-codex\src-nodemuncher\NodeMuncherApp.tsx` | Pairing, heartbeat, lease, execution, status, earnings/history UI. | NodeMuncher owner |
| `C:\Users\danki\Desktop\nodemuncher-codex\src\core\benchmarkRunner.ts` | Benchmark Blender execution, timeout, score flow. | Benchmark owner |

## Immediate Ownership Gaps

1. There is no formal `CODEOWNERS` file.
2. Backend money/receipt/security responsibilities are concentrated in `scripts/job-api.mjs`.
3. Add-on editable source path is not obvious from the frontend inventory, even though the ZIP is published.
4. Production worker source is referenced by release notes but not clearly mirrored in repo source.
5. Runtime/generated directories live near source and make ownership scans noisy.
6. Public artifact ownership is mixed across products under `public/downloads/`.

## Recommended Next Actions

1. Add a root `CODEOWNERS` or `docs/FARPY_BOOK/OWNERSHIP.md` mapping these areas to named maintainers.
2. Create a protected checklist for `scripts/job-api.mjs` changes: Money, Receipt, Security, Worker.
3. Move source-adjacent backup files out of active `src/` paths.
4. Document the canonical Blender add-on source path.
5. Mirror production-only worker and infrastructure config into source control with secrets redacted.
