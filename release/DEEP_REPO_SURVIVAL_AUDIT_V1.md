# DEEP_REPO_SURVIVAL_AUDIT_V1

Generated: 2026-06-29T01:05:34Z
Mode: read-only audit, except this report file.
Scope inspected: `C:\Users\danki\Desktop\farpy-frontend`, `C:\Users\danki\Desktop\nodemuncher-codex`, release notes, build scripts, smoke/audit scripts, public production probes.

## Executive verdict

No proven P0 launch blocker was found in this audit. Current public Farpy surfaces build and production audit scripts pass. The survival risk is concentrated in P1 durability: fresh paid customer proof still needs operator/payment evidence, NodeMuncher is functional but not yet public-fleet durable, backup restore proof is not present in this repo, and Lightning must remain gated until channel/payment proof is complete.

Freeze recommendation: YES for Farpy customer frontend/backend with current gates. NO for broad public NodeMuncher worker rollout.

## P0

None proven.

Evidence:
- `npm.cmd run build` passed in `farpy-frontend`.
- `npm.cmd run build`, `npm.cmd run build:nodemuncher`, and `npm.cmd run tauri -- build` passed in `nodemuncher-codex`.
- `scripts/production-regression-audit-v1.ps1` returned `VERDICT=GREEN`, `PASS_COUNT=40`, `FAIL_COUNT=0`, `SKIP_COUNT=3`.
- `scripts/production-operations-dashboard-v1.ps1` returned `VERDICT=GREEN`, `PASS_COUNT=26`, `FAIL_COUNT=0`, `SKIP_COUNT=5`.
- `scripts/launch-freeze-v1.ps1` returned `VERDICT=YELLOW_LAUNCHABLE`, `FAIL_TOTAL=0`, `BLOCKERS=0`.
- Live auth/payment gates verified with proper JSON requests: `/checkout` unauth returns `401 auth_required`; `/node/v1/web-render/btcpay/invoice` unauth returns `401 auth_required`.

## P1

1. Fresh customer full paid E2E is not proven from a brand-new account in available evidence.
   Evidence: `release/PRODUCTION_FRESH_ACCOUNT_E2E_V1.md:29` requires a real approved Card top-up, and `release/PRODUCTION_FRESH_ACCOUNT_E2E_V1.md:59` says no operator approval/payment instrument was available. Current launch audits are strong but still not the same as a fresh user paying live from zero.

2. Backend `/checkout` JSON parse is not fail-closed for malformed JSON before the top-up handler.
   Evidence: `scripts/job-api.mjs:2346-2349` parses `JSON.parse(raw.toString("utf8"))` without the local `try/catch` used by the Lightning route at `scripts/job-api.mjs:2359-2365`. Correct JSON unauth returns `401`, so this is not a payment bypass, but malformed public requests can still produce avoidable 500s.

3. NodeMuncher render execution can hang indefinitely on Blender.
   Evidence: `src-tauri/src/main.rs:1091` runs `Start-Process ... -Wait` with no explicit render timeout or watchdog. Network calls have `TimeoutSec` at `src-tauri/src/main.rs:1059`, `1080`, and `1119`, but Blender execution itself has no timeout. This can strand one external node and create support burden.

4. NodeMuncher stores node tokens as local JSON, acceptable for alpha but not durable for public worker scale.
   Evidence: node identity path is `%LOCALAPPDATA%\FarpyNode` in `src-tauri/src/main.rs:548-550`; token is read from JSON at `src-tauri/src/main.rs:692-700` and sent to APIs at `src-tauri/src/main.rs:853-861` and `903-919`. Release note confirms this as alpha-only risk: `release/NODEMUNCHER_TRUST_HARDENING_V1.md:242` says token storage is plain local JSON.

5. NodeMuncher has no public update/signature/rollback mechanism.
   Evidence: `release/NODEMUNCHER_TRUST_HARDENING_V1.md:150` says no production auto-update mechanism is configured; `release/NODEMUNCHER_TRUST_HARDENING_V1.md:258` marks updates fail for public worker. This blocks public fleet durability, not Farpy customer launch.

6. NodeMuncher Tauri CSP is null.
   Evidence: `src-tauri/tauri.nodemuncher.conf.json:26` has `security.csp = null`; the Benchmark config also has `src-tauri/tauri.conf.json:26-27` with `csp: null`. Release note `release/NODEMUNCHER_TRUST_HARDENING_V1.md:246` says acceptable only while internal and should be tightened before public worker release.

7. Backup restore proof is not present in `farpy-frontend/release`.
   Evidence: `Test-Path release\BACKUP_RESTORE_PROOF_V1.md` returned `NO_BACKUP_RESTORE_PROOF`. Many deploy release notes include backups, but a single non-destructive restore proof artifact is not available in this repo.

8. Lightning must stay gated; invoice-to-wallet-credit is not green and node liquidity proof is incomplete.
   Evidence: `src/components/TopUpPage.tsx:20` gates Lightning on `FARPY_LIGHTNING_ENABLED`; `release/LIGHTNING_UI_GATED_V1.md:35` says Lightning should not be publicly enabled until liquidity/channels and invoice -> webhook -> wallet credit smoke are green. Backend hardening exists at `scripts/job-api.mjs:1033-1037`, `1117-1139`, but infrastructure proof is unfinished.

9. Public release/audit scripts still depend on private tokenized evidence for deepest render/download proof.
   Evidence: `scripts/production-regression-audit-v1.ps1` run skipped `FARPY_AUDIT_JOB_STATUS_URL`, `FARPY_AUDIT_DOWNLOAD_URL`, and `FARPY_AUDIT_RECEIPT_URL`. `scripts/launch-freeze-v1.ps1` classifies skips as non-blocking optional evidence, but the deepest proof remains operator-supplied.

10. Historical backup files are present in source tree and can confuse future audits/build mental model.
    Evidence: `src/components/Workspace.tsx.bak.receipt_workspace_ux_20260628T152924Z`, `src/components/ReceiptPage.tsx.bak.receipt_workspace_ux_20260628T152924Z`, and `src/app/globals.css.bak.receipt_workspace_ux_20260628T152924Z` appear in the worktree. Not a build failure, but a one-person rebuild risk.

## P2

1. Stale unused Benchmark page still contains `Coming Soon`.
   Evidence: `src/pages/Earnings.tsx:2` returns `"Earnings | Coming Soon | No backend required"`. The active NodeMuncher UI uses `src-nodemuncher/NodeMuncherApp.tsx:560-600` and shows real completed history/earnings pending states, so this is likely dead/stale code.

2. Benchmark default Tauri identifier does not match product name.
   Evidence: `src-tauri/tauri.conf.json:3-5` has `productName: Farpy Benchmark` and `identifier: com.farpy.nodemuncher`. This is not a launch break but can confuse installers/update identity later.

3. NodeMuncher public downloads are currently checked by Farpy public audits while release notes still describe NodeMuncher as not broadly public.
   Evidence: production regression audit passed NodeMuncher installer URLs, while `release/NODEMUNCHER_TRUST_HARDENING_V1.md:258-260` still marks updates/worker isolation as fail for public worker. Clarify internal-alpha vs public download policy before wider promotion.

4. Backend JSON parsing has several direct `JSON.parse` paths that should be normalized over time.
   Evidence: `scripts/job-api.mjs:2348`, `2376`, `2558`; some routes already have safer parsing (`scripts/job-api.mjs:2359-2365`).

5. Ops dashboard has token entry in frontend state.
   Evidence: `src/components/OpsCommandCenter.tsx:155-160`, `196`, `228`. It does not expose secrets to public by itself, but browser-memory token entry is operator hygiene risk; document usage and avoid screenshots with token visible.

## Survival scorecard

| Domain | Score | Reason |
|---|---:|---|
| Frontend | 8 | Static build passes; public routes/nav/docs are green; product language clearer; minor stale backup files and tokenized URL handling complexity remain. |
| Backend | 8 | Auth gates, token checks, receipts/downloads, ops alerts, and health routes are strong; malformed JSON 500 risk remains on `/checkout`. |
| Payments | 7 | Stripe wallet path is live and audited; Lightning is correctly gated but unfinished; fresh paid account E2E proof still needs operator input. |
| Rendering | 8 | Blender/Octane paths have receipts and frame validation; historical stale job recovery exists; NodeMuncher local Blender timeout gap remains. |
| Receipts/trust | 9 | Delivery receipts, SHA-256, tokenized downloads, human receipt page, and audit scripts are strong. |
| NodeMuncher | 6 | Pair/heartbeat/lease/E2E evidence exists and builds pass; token storage, updater/signing, CSP, render timeout, and public-fleet policy need hardening. |
| Ops/recovery | 7 | Ops dashboard, alerts, audits, and deploy backups exist; no repo-local restore proof artifact found. |
| Retail readiness | 7 | First-user website path is understandable; fresh paid E2E still not fully proven in this audit; Lightning correctly hidden. |
| Maintainability | 6 | A lot works, but large monolithic `scripts/job-api.mjs`, duplicate wallet logic, backup files in tree, and many release-script paths raise one-person rebuild risk. |

## Top 10 risks

1. Fresh live customer payment/render/download from brand-new account remains not proven in available evidence (`release/PRODUCTION_FRESH_ACCOUNT_E2E_V1.md:29`, `:59`).
2. `/checkout` malformed JSON can 500 before auth/top-up handling (`scripts/job-api.mjs:2346-2349`).
3. NodeMuncher Blender execution has no timeout/watchdog (`src-tauri/src/main.rs:1091`).
4. NodeMuncher token is stored as plain local JSON (`src-tauri/src/main.rs:548-550`, `692-700`; `release/NODEMUNCHER_TRUST_HARDENING_V1.md:242`).
5. NodeMuncher lacks update/signature/rollback path (`release/NODEMUNCHER_TRUST_HARDENING_V1.md:150`, `:258`).
6. NodeMuncher/Benchmark Tauri CSP is null (`src-tauri/tauri.nodemuncher.conf.json:26`, `src-tauri/tauri.conf.json:26-27`).
7. No repo-local `BACKUP_RESTORE_PROOF_V1.md` found.
8. Lightning is backend-hardened but infrastructure/payment proof remains incomplete (`src/components/TopUpPage.tsx:20`; `release/LIGHTNING_UI_GATED_V1.md:35`).
9. Monolithic production API concentrates risk in one file (`scripts/job-api.mjs` has auth, wallet, Stripe, BTCPay, ops, NodeMuncher, receipts, downloads).
10. Historical backup files in source tree can mislead future rebuilds (`*.bak.receipt_workspace_ux_20260628T152924Z`).

## Top 10 strengths

1. Public frontend build passes and exports 37 static routes.
2. Benchmark and NodeMuncher builds pass; Tauri build produced MSI and NSIS artifacts.
3. Production regression audit is green: 40 pass, 0 fail.
4. Production ops dashboard audit is green: 26 pass, 0 fail.
5. Launch freeze is `YELLOW_LAUNCHABLE`, with 0 failures and 0 blockers.
6. Wallet debit is server-side and idempotent by event IDs (`scripts/job-api.mjs:653-670`; refunds at `scripts/render-worker.mjs:234-318`).
7. Download and receipt URLs are token-gated (`scripts/job-api.mjs:2537-2558`) and use timing-safe comparisons (`scripts/job-api.mjs:128-132`).
8. BTCPay webhook validates signatures and verifies invoice state before crediting (`scripts/job-api.mjs:1033-1037`, `1117-1139`).
9. Lightning public UI is gated by build flag (`src/components/TopUpPage.tsx:20`, `112-137`).
10. Ops alerting/recovery exists and previous wallet debit incidents were recovered with evidence (`release/FARPY_ALERT_TRIAGE_AND_RECOVERY_V1.md:100-150`).

## What to fix before first 10 users

1. Run and document one fresh paid customer E2E with a brand-new account, real card top-up, wallet credit, render, receipt, ZIP, and account persistence.
2. Wrap `/checkout` body parsing in the same fail-closed invalid JSON handling already used by BTCPay invoice creation.
3. Create or recover `BACKUP_RESTORE_PROOF_V1.md` with a non-destructive restore proof under `/tmp`.
4. Keep `FARPY_LIGHTNING_ENABLED` unset in production until `LIGHTNING_PAYMENT_E2E_V1` is green.
5. Keep NodeMuncher framed as internal/alpha unless the public download policy is intentionally ready.

## What to fix before first 10 NodeMunchers

1. Add a hard Blender execution timeout/watchdog to the desktop render loop.
2. Decide and document secure-enough node token storage for Windows alpha; preferably use OS credential storage before public scale.
3. Add signed update or a documented manual update channel with hashes and rollback.
4. Tighten Tauri CSP for NodeMuncher.
5. Run clean install -> pair -> heartbeat -> lease -> render -> receipt -> uninstall proof on a truly clean Windows account.
6. Prove earnings amount path, not only receipt/queryable history.

## What to defer

- Lightning public launch until channels/liquidity/payment route proof is green.
- NodeMuncher fleet scaling, payouts, auto-yield refinements, updater polish, and public marketing.
- Backend file decomposition/refactor until after revenue unless a concrete defect requires it.
- Cosmetic polish that does not affect payment, render, receipt, download, or support burden.

## Exact next action

Run `PRODUCTION_FRESH_ACCOUNT_E2E_V1` with operator-approved payment input and record the completed job, receipt, download URL, wallet before/after, and SHA reconciliation. If that passes, fix `/checkout` malformed JSON handling next; if it fails, patch only the first application defect.

## Commands run

```powershell
git -C C:\Users\danki\Desktop\farpy-frontend status --short
git -C C:\Users\danki\Desktop\nodemuncher-codex status --short
Set-Location C:\Users\danki\Desktop\farpy-frontend; npm.cmd run build
Set-Location C:\Users\danki\Desktop\nodemuncher-codex; npm.cmd run build
Set-Location C:\Users\danki\Desktop\nodemuncher-codex; npm.cmd run build:nodemuncher
Set-Location C:\Users\danki\Desktop\nodemuncher-codex; npm.cmd run tauri -- build
rg -n "TODO|FIXME|HACK|Coming Soon|payment_required|localhost|0\.0\.0\.0|secret|token|password" ...
rg -n "FARPY_LIGHTNING_ENABLED|btcpay|wallet|refund|safeTokenEqual|heartbeat|lease|claim|complete" ...
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\production-regression-audit-v1.ps1 -OutputPath C:\tmp\production-regression-audit-v1-survival.json
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\production-operations-dashboard-v1.ps1 -OutputPath C:\tmp\production-operations-dashboard-v1-survival.json
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\launch-freeze-v1.ps1 -OutputPath C:\tmp\launch-freeze-v1-survival.json
```

## Build results

| Command | Result |
|---|---|
| `farpy-frontend npm.cmd run build` | PASS |
| `nodemuncher-codex npm.cmd run build` | PASS |
| `nodemuncher-codex npm.cmd run build:nodemuncher` | PASS |
| `nodemuncher-codex npm.cmd run tauri -- build` | PASS |

## Audit result

PASS with P1 findings. No proven P0. Freeze recommendation: YES for Farpy customer launch, NO for broad public NodeMuncher worker release.
