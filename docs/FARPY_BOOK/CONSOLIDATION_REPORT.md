# BOOK_REVIEW_CONSOLIDATION_V1

Status: ACTIVE

Date: 2026-06-30

Mode: Documentation consolidation only. No production code changed.

## Purpose

Consolidate the documents created during Limbo Mode into one de-duplicated launch-risk view.

This report does not delete historical release notes. Release notes remain evidence. Duplicates are removed logically by merging repeated findings into canonical Book findings below.

## Sources Reviewed

Primary Farpy Book sources:

- `docs/FARPY_BOOK/POPULATION_STATUS.md`
- `docs/FARPY_BOOK/RUNBOOK_STATUS.md`
- `docs/FARPY_BOOK/TECH_DEBT_REGISTER.md`
- `docs/FARPY_BOOK/V1_LAUNCH_SCORECARD.md`
- `docs/FARPY_BOOK/RTO_RPO.md`
- `docs/FARPY_BOOK/DATA_FLOW.md`
- `docs/FARPY_BOOK/API_CONTRACT_AUDIT_V1.md`
- `docs/FARPY_BOOK/STATE_MACHINE_AUDIT_V1.md`
- `docs/FARPY_BOOK/CONTROL_PLANE_BOUNDARY_V1.md`
- `docs/FARPY_BOOK/SINGLE_POINT_OF_FAILURE_AUDIT_V2.md`
- `docs/FARPY_BOOK/COPY_LANGUAGE_FREEZE_V1.md`
- `docs/FARPY_BOOK/NAMING_AUDIT_V1.md`
- `docs/FARPY_BOOK/CONFIG_AUDIT_V1.md`
- `docs/FARPY_BOOK/LOGGING_AUDIT_V1.md`
- `docs/FARPY_BOOK/ERROR_MESSAGE_AUDIT_V1.md`

Primary release evidence:

- `release/RETAIL_ALPHA_FINAL_FREEZE_REPORT_V1.md`
- `release/DEEP_REPO_SURVIVAL_AUDIT_V1.md`
- `release/SECURITY_GOLD_AUDIT_V1.md`
- `release/TRUST_CHAIN_AUDIT_V1.md`
- `release/DISASTER_RECOVERY_AUDIT_V1.md`
- `release/FOUNDER_ABSENCE_AUDIT_V1.md`
- `release/FOUNDER_ABSENCE_FIX_V1.md`
- `release/WEB_RENDER_BACKUP_ENCRYPTION_PLAN_V1.md`
- `release/OFFSITE_BACKUP_OPERATOR_APPROVAL_V1.md`
- `release/FARPY_RECOVERY_USB_V1.md`
- `release/NODEMUNCHER_LAUNCH_AUDIT_V1.md`
- `release/BLENDER_ADDON_FINAL_AUDIT_V1.md`
- `release/BENCHMARK_LAUNCH_AUDIT_V1.md`
- `release/OCTANE_READINESS_AUDIT_V1.md`
- `release/SEVEN_FIX_REVIEW_AUDIT_V1.md`

## Consolidated Verdict

Retail alpha: YES, with operator-controlled scope.

Broad public launch: NO.

NodeMuncher broad launch: NO.

Benchmark broad promotion: NO, until product freeze/signing/update path is clearer.

Overall risk posture: YELLOW.

No active P0 was proven by the reviewed documents. The highest-risk work is P1 operational durability: encrypted offsite backup and restore proof, fresh paid customer proof, second-operator access, and NodeMuncher broad-launch hardening.

## Duplicate Findings Removed

| Repeated Finding | Appeared In | Canonical Consolidated Finding |
|---|---|---|
| Offsite encrypted backup is planned but not proven | `DISASTER_RECOVERY_AUDIT_V1`, `FOUNDER_ABSENCE_AUDIT_V1`, `FOUNDER_ABSENCE_FIX_V1`, `WEB_RENDER_BACKUP_ENCRYPTION_PLAN_V1`, `OFFSITE_BACKUP_OPERATOR_APPROVAL_V1`, `SINGLE_POINT_OF_FAILURE_AUDIT_V2`, `RTO_RPO.md`, `TECH_DEBT_REGISTER.md` | P1: implement age-encrypted offsite backup and prove restore on Node B. |
| Full host-loss recovery is unproven | Disaster recovery, founder absence, SPOF, RTO/RPO, runbook status | P1: timed Node B restore/cutover proof is required before broad launch. |
| Fresh paid customer E2E is pending/operator-driven | Paid smoke docs, final freeze, scorecard, tech debt, trust chain | P1: run and record fresh account -> top-up -> package -> receipt -> download proof. |
| NodeMuncher E2E is green but broad public launch is not | NodeMuncher launch, trust hardening, scorecard, tech debt, final freeze | P1: keep controlled alpha; broad launch waits for signing/update/token storage/support/recovery proof. |
| Lightning is not public-ready | Lightning route/channel audits, safe hold/gating, payment rail reports, final freeze | P1 if exposed; P2 while hidden: keep gated until liquidity/payment/webhook/idempotency proof is green. |
| Bitcoin backend proof exists but browser proof is pending | BTCPay checkout fixes, trust chain, payment rail smoke, scorecard | P1: authenticated browser-click Bitcoin checkout proof is still needed. |
| `scripts/job-api.mjs` owns too many critical paths | Code map, tech debt, security audits, API/state audits | P1: add owner checklist/regression harness before refactor; decompose later. |
| Production configs are not fully source-controlled | Config audit, code map, SPOF, founder absence, recovery docs | P1: add redacted Caddy/systemd/env templates and restore-from-source runbook. |
| Support/self-service gaps remain | Support-zero-email, account self-service, runbook status, scorecard | P1: add support request center and runbooks for account/package/billing issues. |
| Receipt/download trust is strong but mismatch recovery is incomplete | Trust chain, runbook status, security audits | P1: write evidence-preserving receipt/output mismatch recovery runbook. |
| Public proof is honest but thin | Trust chain, public proof page, scorecard | P2: populate only from public-safe receipt-derived data when available. |
| Naming/copy drift exists in historical docs | Copy freeze, naming audit, product language docs | P2: canonical customer vocabulary is Package / Render Partner / Delivery Receipt; historical release notes may keep old terms as evidence. |

## Contradictions Identified

| Contradiction | Evidence | Resolution |
|---|---|---|
| “Retail alpha YES” vs “fresh-new-account proof pending” | `RETAIL_ALPHA_FINAL_FREEZE_REPORT_V1.md` says retail alpha yes; scorecard/trust/tech debt mark fresh paid E2E pending. | Not a contradiction if scoped: retail alpha may proceed with operator watch, but fresh paid E2E remains P1 before wider traffic. |
| “Bitcoin backend proof green” vs “authenticated browser-click proof pending” | BTCPay backend route and checkout URL fixes exist; trust chain and scorecard say browser proof pending. | Backend integration is green. Customer-browser proof is still P1. |
| “NodeMuncher E2E green” vs “NodeMuncher broad launch NO” | E2E/watchdog/local install proofs exist; launch/trust audits list signing/update/token/support gaps. | Controlled alpha is green. Broad public NodeMuncher launch remains blocked. |
| “Benchmark public downloads live” vs “Benchmark halted/deferred” | Benchmark download/republish docs are green; final freeze says Benchmark promotion halted/deferred. | Downloads may remain live as utility; marketing/promotion/product freeze remains deferred. |
| “Lightning backend staged” vs “Lightning hidden/gated” | Backend/webhook hardening exists; route/channel audits prove invoices were not payable. | Keep Lightning hidden. Backend readiness does not imply public availability. |
| “No P0” vs “critical SPOFs” | Tech debt says no active P0; SPOF marks Node A/backups/wallet/receipts critical. | Critical SPOF is P1 for retail alpha, P0 for broad launch or if accepting unattended high-volume traffic. |
| “Render Factory” vs “Render Partner” | Older release notes and audits use Render Factory; later World Layer V3/HOMEPAGE_FINAL_POLISH define Render Partner. | Render Partner is canonical for customer-facing copy. Historical docs are allowed to contain old terms as evidence. |
| Add-on ZIP hash differs across milestones | `ADDON_WEBSITE_HANDOFF_V1` references an older hash; `ADDON_PRODUCTION_DEPLOY_V1` references a newer deployed hash. | Latest deployed artifact manifest wins. Add-on artifact ownership remains P1/P2 until a single version manifest is canonical. |

## P0 Findings

None currently proven.

| Finding | Evidence | Current Action |
|---|---|---|
| None proven | Recent security, trust, regression, state, API, and scorecard docs do not identify an active public P0. | Keep P0 empty unless a live auth/payment/render/download/receipt blocker is reproduced. |

## P1 Findings

| Rank | Finding | Evidence | Risk | Required Action |
|---:|---|---|---|---|
| 1 | Encrypted offsite backup and restore proof are not complete. | `WEB_RENDER_BACKUP_ENCRYPTION_PLAN_V1`, `OFFSITE_BACKUP_OPERATOR_APPROVAL_V1`, `RTO_RPO.md`, `SINGLE_POINT_OF_FAILURE_AUDIT_V2.md` | Full Node A loss can lose wallet/jobs/receipts/uploads/outputs beyond local recovery. | Implement age-encrypted backup to Storage Box and prove restore on Node B. |
| 2 | Full host-loss recovery/cutover is unproven. | `DISASTER_RECOVERY_AUDIT_V1`, `FOUNDER_ABSENCE_FIX_V1`, `RTO_RPO.md` | Node A outage remains existential for production. | Perform timed Node B restore/cutover exercise from documented backup. |
| 3 | Fresh paid customer E2E remains pending/operator-driven. | `PAID_BROWSER_SMOKE_PREP_V1`, `TRUST_CHAIN_AUDIT_V1`, `V1_LAUNCH_SCORECARD.md`, `TECH_DEBT_REGISTER.md` | First real paying user could discover a missed auth/payment/render/download bug. | Run and record a fresh account/card top-up/package/receipt/download smoke. |
| 4 | Second-operator access and recovery are not fully proven. | `FOUNDER_ABSENCE_AUDIT_V1`, `FOUNDER_ABSENCE_FIX_V1`, `SINGLE_POINT_OF_FAILURE_AUDIT_V2.md` | Founder absence can stall domains, payments, hosting, restore, keys, and incidents. | Verify a second operator has documented access to registrar/DNS/Stripe/BTCPay/hosting/email/Storage Box/key custody. |
| 5 | `scripts/job-api.mjs` is a monolithic money/render/receipt/security control point. | `CODE_MAP.md`, `TECH_DEBT_REGISTER.md`, API/state/security audits | Small changes can regress wallet, receipt, worker auth, download, or payment paths. | Add CODEOWNERS/change checklist/regression suite around this file before any refactor. |
| 6 | Production worker and infrastructure source of truth is incomplete. | `CODE_MAP.md`, `CONFIG_AUDIT_V1.md`, `TECH_DEBT_REGISTER.md` | Rebuilds may ship stale worker/config logic or depend on production-only memory. | Mirror worker source and redacted Caddy/systemd/env templates into source. |
| 7 | Receipt/output mismatch recovery is not fully runbooked. | `RUNBOOK_STATUS.md`, `TRUST_CHAIN_AUDIT_V1.md` | Customer trust breaks if receipt/download/hash disagree. | Create evidence-preserving runbook for missing receipt, hash mismatch, and ZIP validation failures. |
| 8 | Bitcoin browser-click checkout proof is pending. | `TRUST_CHAIN_AUDIT_V1.md`, payment rail notes, scorecard | Bitcoin may fail in customer browser despite backend proof. | Run authenticated browser proof and record checkout URL/public host/fail-closed behavior. |
| 9 | NodeMuncher is not broad-launch ready. | `NODEMUNCHER_LAUNCH_AUDIT_V1`, `V1_LAUNCH_SCORECARD.md`, `TECH_DEBT_REGISTER.md` | External NodeMunchers could strand work or need founder support. | Keep controlled alpha until signing/update/token storage/CSP/support/recovery proof is green. |
| 10 | Support/self-service gaps remain. | `SUPPORT_ZERO_EMAIL_AUDIT_V1`, `ACCOUNT_SELF_SERVICE_V1`, `RUNBOOK_STATUS.md` | More users will create email/operator load for routine package/account/billing actions. | Add request center/placeholders and clear runbooks before scaling traffic. |
| 11 | Alert delivery to additional operator is not fully proven. | `SINGLE_POINT_OF_FAILURE_AUDIT_V2.md`, `TECH_DEBT_REGISTER.md` | Incidents can be missed if founder is unavailable. | Prove external monitor and ops alerts reach at least one additional operator. |
| 12 | Add-on source/package/version ownership is unclear. | `BLENDER_ADDON_FINAL_AUDIT_V1`, `CODE_MAP.md`, `TECH_DEBT_REGISTER.md` | ZIP/page/SHA can drift; rebuild may depend on memory. | Establish canonical add-on source, package script, manifest, and SHA generation flow. |

## P2 Findings

| Finding | Evidence | Recommended Action |
|---|---|---|
| Farpy Book chapters are still mostly index/placeholders. | Book foundation and population docs | Populate concise canonical summaries while linking release evidence. |
| Public proof page is honest but thin. | `TRUST_CHAIN_AUDIT_V1.md` | Add public-safe receipt-derived counts only when data is real and privacy-safe. |
| Customer-side SHA verification is manual. | Trust chain and receipt docs | Add optional instructions or verifier later. |
| Benchmark signing/update/promotion remains deferred. | Benchmark launch/download docs | Resume when Benchmark becomes active marketing surface. |
| PayPal remains deferred. | Freeze/payment docs | Keep deferred until Stripe/Bitcoin are stable and support load is manageable. |
| Lightning remains gated. | Lightning audits and gating docs | Keep hidden until channel/liquidity/payment/webhook/idempotency proof is green. |
| Historical docs contain old language. | Naming/copy audits | Leave historical release notes intact; keep current public copy canonical. |
| Ops token UX is internal and not elegant. | Security/ops docs | Consider short-lived ops sessions later. |
| Rate-limit proof expansion is incomplete. | Security audits | Add measured rate-limit evidence before broader traffic. |
| Log retention and sanitized offsite logs are not formalized. | Logging audit | Define retention and privacy policy after backup path is green. |

## Canonical Findings By Domain

| Domain | Canonical Status | Canonical Next Action |
|---|---|---|
| Website/customer frontend | Retail alpha ready | Keep copy bounded; run periodic static route/link/sitemap scans. |
| Wallet/payments | Retail alpha ready with proof gaps | Run fresh paid E2E and Bitcoin browser proof. Keep Lightning gated. |
| Rendering | Retail alpha ready for bounded packages | Keep stage limits; maintain worker smoke and failed-package refund proof. |
| Receipts/downloads | Strong trust chain with recovery gap | Add mismatch/missing-receipt runbook and owner URL smoke. |
| Security | No active P0 proven | Continue P1 hardening: rate limits, CSP, CORS, source-controlled config. |
| Backups/recovery | Not broad-launch ready | Implement encrypted offsite backup and prove Node B restore. |
| Operations | Operator-ready with caveats | Add second-operator alert/access proof and consolidate runbooks. |
| NodeMuncher | Controlled alpha only | Do not broad launch until installer signing/update/token/support/recovery are green. |
| Benchmark | Public utility, promotion deferred | Keep truthful downloads; freeze separately before renewed promotion. |
| Blender add-on | Public alpha | Canonicalize source/package/SHA/version workflow. |
| Octane | Alpha-ready within bounded policy | Keep docs synchronized and refresh smoke before broader Octane claims. |

## Book Updates Made

- Added this consolidation report as the canonical de-duplicated Limbo Mode review.
- Added this report to the Farpy Book index.

## Recommended Next 5 Milestones

1. `FRESH_PAID_CUSTOMER_E2E_PROOF_V1`
2. `WEB_RENDER_OFFSITE_BACKUP_IMPLEMENTATION_V1`
3. `NODE_B_RESTORE_CUTOVER_PROOF_V1`
4. `SECOND_OPERATOR_ACCESS_PROOF_V1`
5. `JOB_API_CHANGE_GUARDRAILS_V1`

## Commands Run

```powershell
Get-ChildItem -LiteralPath 'C:\Users\danki\Desktop\farpy-frontend\docs\FARPY_BOOK' -File | Select-Object Name,Length,LastWriteTime
Get-ChildItem -LiteralPath 'C:\Users\danki\Desktop\farpy-frontend\release' -File | Sort-Object LastWriteTime -Descending | Select-Object -First 120 Name,Length,LastWriteTime
Get-Content -LiteralPath 'C:\Users\danki\Desktop\farpy-frontend\docs\FARPY_BOOK\TECH_DEBT_REGISTER.md' -Raw
Get-Content -LiteralPath 'C:\Users\danki\Desktop\farpy-frontend\docs\FARPY_BOOK\V1_LAUNCH_SCORECARD.md' -Raw
Get-Content -LiteralPath 'C:\Users\danki\Desktop\farpy-frontend\release\TRUST_CHAIN_AUDIT_V1.md' -Raw
Get-Content -LiteralPath 'C:\Users\danki\Desktop\farpy-frontend\release\SINGLE_POINT_OF_FAILURE_AUDIT_V2.md' -Raw
Get-Content -LiteralPath 'C:\Users\danki\Desktop\farpy-frontend\docs\FARPY_BOOK\INDEX.md' -Raw
```

No production changes were made.
No secrets were printed.

## Final Recommendation

Freeze recommendation for retail alpha: YES.

Freeze recommendation for broad launch: NO.

Reason: customer-facing product and trust surfaces are strong enough for bounded retail alpha, but recovery/offsite backup proof, second-operator access, and fresh paid customer proof still need closure before broader traffic.
