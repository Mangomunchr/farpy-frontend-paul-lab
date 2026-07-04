# TECH_DEBT_REGISTER

Status: ACTIVE

Date: 2026-06-30

Mode: Audit/register only. No production code changed.

## Purpose

Inventory Farpy technical debt and rank it by launch and durability risk.

Priority definitions:

- P0: must fix before accepting normal customer traffic.
- P1: should fix before broader launch or before handing operations to another person.
- P2: can wait until after controlled retail alpha, but should remain visible.

Complexity estimates:

- Low: single file or docs/script-only.
- Medium: contained implementation with tests/smoke.
- High: cross-service, production migration, external system, or requires operator credentials.

## Summary

No current P0 technical debt was proven in this pass.

The highest-risk P1 debt is operational durability, not the visible product: offsite encrypted backup proof, fresh paid customer proof, `scripts/job-api.mjs` concentration, production worker source mirroring, and NodeMuncher public-readiness gaps.

## P0

None currently proven.

| Item | Evidence | Risk | User Impact | Complexity | Recommended Action |
| --- | --- | --- | --- | --- | --- |
| None proven | Recent launch/security/regression audits did not identify a remaining active P0. | Low | None immediate | N/A | Keep P0 empty unless a live payment/render/download/security blocker is reproduced. |

## P1

| Item | Area | Evidence | Risk | User Impact | Complexity | Recommended Action |
| --- | --- | --- | --- | --- | --- | --- |
| Fresh paid customer E2E remains operator-driven / not continuously proven | Payments / Customer Journey | `release/PRODUCTION_FRESH_ACCOUNT_E2E_V1.md`, `release/PAID_BROWSER_SMOKE_PREP_V1.md`, `docs/FARPY_BOOK/POPULATION_STATUS.md` list paid proof as pending/operator input. | High | A launch could miss a real auth/payment/render/download defect until first customer. | Medium | Run one fresh account -> card top-up -> package -> receipt -> download smoke and add it to the recurring suite where safe. |
| Encrypted offsite backup implementation and restore proof are plan-only | Backups / Disaster Recovery | `release/WEB_RENDER_BACKUP_ENCRYPTION_PLAN_V1.md`, `release/OFFSITE_BACKUP_OPERATOR_APPROVAL_V1.md`, `docs/FARPY_BOOK/RUNBOOK_STATUS.md` say offsite push/restore proof is blocked. | High | Node A loss can lose current uploads/jobs/receipts/wallet data beyond same-host recovery. | High | Implement age-encrypted backup push to Storage Box and restore proof on Node B with operator approval. |
| `scripts/job-api.mjs` is a monolithic critical backend file | Backend / Wallet / Receipts / Security | `docs/FARPY_BOOK/CODE_MAP.md` flags it as owning auth, uploads, pricing, checkout, wallet, jobs, receipts, worker endpoints, ops, BTCPay, Stripe. | High | Small patches can accidentally affect money, receipts, worker auth, or downloads. | Medium | Add owner checklist and regression suite around money/receipt/security paths before refactoring. Decompose only after stable tests exist. |
| Production worker source is not clearly mirrored as canonical source | Worker / Octane | `docs/FARPY_BOOK/CODE_MAP.md` notes `/opt/farpy-node/web-render-http-worker.py` is production-critical but not obvious in local source. | High | Rebuild/restore can ship stale or missing worker logic. | Medium | Mirror worker source into repo under `worker/` or `deploy/worker/`, with systemd unit and smoke commands. |
| Production-only infrastructure config is not fully source-controlled | Infrastructure | `docs/FARPY_BOOK/CODE_MAP.md` notes Caddy, `/etc/farpy`, systemd drop-ins, and backup jobs are referenced by release notes but not fully represented as redacted source config. | High | Recovery/rollback depends on operator memory and production access. | Medium | Add redacted Caddy/systemd/env templates and a “restore config from source” runbook. |
| No formal `CODEOWNERS` / subsystem ownership file | Maintainability | `docs/FARPY_BOOK/CODE_MAP.md` found no `CODEOWNERS` or `OWNERS`. | Medium | High-risk code can be edited without the right review path. | Low | Add `CODEOWNERS` or `docs/FARPY_BOOK/OWNERSHIP.md` mapping frontend/backend/money/receipts/worker/security/infra. |
| Runtime/generated/backup files live near source | Maintainability / Release Hygiene | `.farpy-*`, `.next`, `out`, `node_modules`, backup component files, and local runtime data were observed during scans. | Medium | Audits become noisy; stale code/copy can be mistaken as active. | Low | Move `*.bak.*` out of `src/`; ensure generated/runtime folders are ignored and excluded from source scans. |
| NodeMuncher broad-public readiness gaps remain | NodeMuncher | `release/NODEMUNCHER_LAUNCH_AUDIT_V1.md`, `release/NODEMUNCHER_TRUST_HARDENING_V1.md`, `release/DEEP_REPO_SURVIVAL_AUDIT_V1.md`. | High for public NodeMuncher; low for controlled alpha | External NodeMunchers may strand jobs, fail updates, or need founder support. | High | Keep controlled alpha only until signing/update path, friend install, earnings/history proof, and recovery behavior are green. |
| NodeMuncher token storage is alpha-grade local JSON | NodeMuncher / Security | `release/DEEP_REPO_SURVIVAL_AUDIT_V1.md` and NodeMuncher source references note local JSON persistence. | Medium | A compromised local user profile can steal node identity. | Medium | Move to OS credential storage or encrypt-at-rest with clear recovery behavior before broad public worker launch. |
| NodeMuncher update/signature/rollback path is missing | NodeMuncher / Release | `release/NODEMUNCHER_LAUNCH_AUDIT_V1.md`, `release/NODEMUNCHER_TRUST_HARDENING_V1.md`. | Medium | Broken builds require manual reinstall; external fleet cannot be patched quickly. | High | Add signed installer/update strategy or hash-verified manual update runbook before broad launch. |
| NodeMuncher and Benchmark Tauri CSP is loose/null | Security / Desktop | `release/DEEP_REPO_SURVIVAL_AUDIT_V1.md` flags `security.csp = null`. | Medium | Desktop attack surface is wider than necessary. | Medium | Tighten CSP after confirming Tauri asset loading and local file behavior. |
| Add-on canonical editable source path is unclear | Addon / Release | `docs/FARPY_BOOK/CODE_MAP.md`; ZIP is in `public/downloads`, source was not obvious in frontend inventory. | Medium | Rebuilding the add-on depends on memory and can desync ZIP/SHA/page copy. | Medium | Document or move canonical add-on source into repo; add package script and SHA generation. |
| Authenticated owner private URL proof remains manual | Receipts / Security | `docs/FARPY_BOOK/POPULATION_STATUS.md`, `release/OWNER_STATUS_PRIVATE_URL_PROOF_V1` requested but no canonical proof in scanned list. | Medium | Token redaction fix could regress owner workspace/download UX unnoticed. | Low | Add a safe owner-cookie smoke script that redacts secrets and verifies URL presence/status. |
| Bitcoin on-chain browser-click payment proof remains pending | Wallet / Payments | `docs/FARPY_BOOK/POPULATION_STATUS.md`, `release/TRUST_CHAIN_AUDIT_V1.md`. | Medium | Bitcoin rail may fail in browser despite backend proof. | Medium | Run authenticated browser click proof and record checkout URL, metadata, and fail-closed behavior. |
| Lightning remains gated due to infrastructure/liquidity proof | Payments / Infrastructure | `release/LIGHTNING_NODE_BOOTSTRAP_V1.md`, `release/LIGHTNING_UI_GATED_V1.md`, `release/SINGLE_POINT_OF_FAILURE_AUDIT_V2.md`. | Medium while hidden; high if exposed | Users would receive unpayable invoices if accidentally exposed. | High | Keep gated. Complete channel/liquidity/payment/webhook/idempotency proof before re-enable. |
| Alert delivery to additional operator not fully proven | Operations | `docs/FARPY_BOOK/POPULATION_STATUS.md`, `release/SINGLE_POINT_OF_FAILURE_AUDIT_V2.md`. | Medium | Founder absence or missed alerts can extend outage/customer impact. | Medium | Configure external alert recipient and prove delivery from production monitor/ops alert. |
| Domain/DNS/registrar recovery proof is incomplete | Infrastructure / Founder Absence | `docs/FARPY_BOOK/POPULATION_STATUS.md`, `release/SINGLE_POINT_OF_FAILURE_AUDIT_V2.md`. | High | Domain/TLS/DNS incident can make all services unreachable. | Medium | Document registrar, DNS provider, 2FA recovery, auto-renew, and second-operator access. |
| Stripe/BTCPay non-founder access recovery is incomplete | Payments / Founder Absence | `docs/FARPY_BOOK/POPULATION_STATUS.md`, `release/SINGLE_POINT_OF_FAILURE_AUDIT_V2.md`. | High | Payment incident/refund/webhook repair can stall. | Medium | Verify secondary operator dashboard/API recovery without exposing secrets in docs. |
| Support/self-service gaps remain for account/package deletion/cancel flows | Support / Privacy | `docs/FARPY_BOOK/RUNBOOK_STATUS.md`, `release/ACCOUNT_SELF_SERVICE_V1.md`, `release/SUPPORT_ZERO_EMAIL_AUDIT_V1.md`. | Medium | Users must email support for common lifecycle actions. | Medium | Add support request center/placeholders and runbooks before higher traffic. |
| Receipt/output mismatch recovery runbook is incomplete | Receipts / Ops | `docs/FARPY_BOOK/RUNBOOK_STATUS.md` lists receipt missing and ZIP hash mismatch recovery as NO. | High if it occurs | Customer trust issue; download may need disabling/preservation. | Medium | Create evidence-preserving recovery runbook and operator checklist. |

## P2

| Item | Area | Evidence | Risk | User Impact | Complexity | Recommended Action |
| --- | --- | --- | --- | --- | --- | --- |
| Farpy Book chapters are mostly index placeholders | Documentation | `docs/FARPY_BOOK/README.md`, `docs/FARPY_BOOK/POPULATION_STATUS.md`. | Low | New operator must read many release notes. | Medium | Populate chapters with concise summaries and links, without duplicating history. |
| Release documentation is fragmented across many milestone files | Documentation / Operations | `docs/FARPY_BOOK/POPULATION_STATUS.md`. | Low | Slower onboarding and incident response. | Medium | Consolidate canonical runbooks in Farpy Book while keeping release notes as evidence. |
| Public proof depth is limited | Trust / Marketing | `release/TRUST_CHAIN_AUDIT_V1.md`. | Low for alpha | Customers may need more trust before paying. | Medium | Add public-safe aggregate proof only when data source is real and privacy-safe. |
| Customer-side SHA verification is manual | Receipts / UX | `release/TRUST_CHAIN_AUDIT_V1.md`. | Low | Advanced users can verify, normal users may not. | Medium | Add optional local hash instructions or client-side verifier later. |
| Ops token is entered in frontend state | Operations / Security Hygiene | `release/SECURITY_GOLD_AUDIT_V1.md`, `src/components/OpsCommandCenter.tsx`. | Low if `/ops` remains internal | Screenshot/browser-extension leakage risk for operators. | Medium | Consider short-lived server-side ops sessions later. |
| Benchmark installer signing/update path is deferred | Benchmark / Release | `release/BENCHMARK_LAUNCH_AUDIT_V1.md`. | Medium for wider promotion | SmartScreen/trust friction and manual updates. | High | Defer until Benchmark promotion resumes. |
| Benchmark public product state is halted/deferred | Benchmark | `release/RETAIL_ALPHA_FINAL_FREEZE_REPORT_V1.md`, `release/BENCHMARK_LAUNCH_AUDIT_V1.md`. | Low for Farpy retail alpha | Benchmark users may encounter stale promotion/update path. | Medium | Keep download truthful; resume with dedicated Benchmark freeze milestone. |
| Stale/dead UI code remains in NodeMuncher/Benchmark repo | NodeMuncher / Benchmark | `release/DEEP_REPO_SURVIVAL_AUDIT_V1.md` mentions stale `Coming Soon` path. | Low | Confusing for maintainers if mistaken as active. | Low | Remove or label dead code after current release line stabilizes. |
| Public artifact ownership is mixed under `public/downloads/` | Release / Product Ops | `docs/FARPY_BOOK/CODE_MAP.md`. | Low to medium | Wrong artifact/SHA can be published during hurried release. | Low | Split artifact manifest by product or add a release artifact index. |
| Local scripts default to localhost in several places | Developer Experience | `scripts/service-smoke.mjs`, `scripts/prod-web-render-smoke.mjs`, NodeMuncher/Benchmark dev configs. | Low | Operator confusion if wrong env target is assumed. | Low | Keep defaults but require explicit `--prod` or env display in scripts. |
| Copy/naming freeze still has minor drift | Frontend / Docs | `release/NAMING_AUDIT_V1.md`. | Low | Slight confusion, not a broken flow. | Low | Replace remaining lane/job wording with package/delivery terms. |
| Add-on update/version check is manual | Addon | `release/BLENDER_ADDON_FINAL_AUDIT_V1.md`. | Low | Users may run old ZIP. | Medium | Add static latest-version JSON or visible checksum note later. |
| PayPal remains deferred | Payments | Retail/freeze reports. | Low | Some users cannot use preferred rail. | High | Defer until Stripe/Bitcoin/card flows are boringly stable. |
| Octane readiness depends on controlled infrastructure proof | Octane | `release/OCTANE_READINESS_AUDIT_V1.md`. | Medium if marketed too broadly | ORBX users may need operator confidence. | High | Keep bounded copy; refresh Octane smoke before promoting larger jobs. |

## Debt By Domain

| Domain | Debt Level | Notes |
| --- | --- | --- |
| Frontend | Medium | UI is launchable; cleanup needed for stale backups, naming drift, and self-service gaps. |
| Backend | Medium-High | Behavior is proven, but `scripts/job-api.mjs` is too central and needs owner gates/tests before refactor. |
| Payments | Medium | Stripe/card live; Bitcoin needs browser proof; Lightning gated; PayPal deferred. |
| Rendering | Medium | Core flow green; remote worker source mirroring and Octane proof freshness need attention. |
| Receipts | Medium | Trust chain strong; mismatch/missing-receipt recovery runbook needs formalization. |
| NodeMuncher | High | Controlled alpha okay; broad public launch blocked by update/signing/token/CSP/recovery/user-support debt. |
| Benchmark | Medium | Public utility works, but signing/update/promotion and artifact ownership are deferred. |
| Addon | Medium | ZIP/page/install smoke good; source/update/auth clarity need better canonical ownership. |
| Security | Medium | Recent P0/P1 fixes strong; CORS/rate-limit/operator-token/desktop CSP improvements remain. |
| Infrastructure | High | Offsite encrypted backup, restore proof, second-operator access, and source-controlled config are the big remaining durability debts. |

## Immediate Next Actions

1. Prove fresh paid customer E2E.
2. Implement encrypted offsite backup + restore proof.
3. Add a CODEOWNERS/ownership file and protected change checklist for `scripts/job-api.mjs`.
4. Mirror production worker and infrastructure config into source with secrets redacted.
5. Keep NodeMuncher controlled alpha until update/signing/token/CSP/recovery debt is reduced.

## Commands Run

```powershell
rg -n "TODO|FIXME|HACK|temporary|workaround|deprecated|Coming Soon|localhost|127\.0\.0\.1|\.bak\.|not implemented|placeholder|manual|operator|blocked|unproven" C:\Users\danki\Desktop\farpy-frontend\src C:\Users\danki\Desktop\farpy-frontend\scripts C:\Users\danki\Desktop\farpy-frontend\deploy C:\Users\danki\Desktop\farpy-frontend\docs\FARPY_BOOK C:\Users\danki\Desktop\farpy-frontend\release -S --glob '!node_modules/**' --glob '!out/**'
```

```powershell
rg -n "TODO|FIXME|HACK|temporary|workaround|deprecated|Coming Soon|localhost|127\.0\.0\.1|\.bak\.|not implemented|placeholder|manual|operator|blocked|unproven" C:\Users\danki\Desktop\nodemuncher-codex\src C:\Users\danki\Desktop\nodemuncher-codex\src-nodemuncher C:\Users\danki\Desktop\nodemuncher-codex\src-tauri C:\Users\danki\Desktop\nodemuncher-codex\scripts C:\Users\danki\Desktop\nodemuncher-codex\release -S --glob '!node_modules/**' --glob '!target/**' --glob '!dist/**' --glob '!dist-nodemuncher/**'
```

```powershell
Get-Content -LiteralPath 'C:\Users\danki\Desktop\farpy-frontend\docs\FARPY_BOOK\CODE_MAP.md' -Raw
Get-Content -LiteralPath 'C:\Users\danki\Desktop\farpy-frontend\release\DEEP_REPO_SURVIVAL_AUDIT_V1.md' -Raw
```
