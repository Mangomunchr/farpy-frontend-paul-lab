# BOOK_POPULATION_AUDIT_V1

Status: DOCUMENTED
Date: 2026-06-30
Mode: Documentation population audit only. No code, API, backend, production, or deploy changes.

## Objective

Populate the Farpy Book from existing release notes by identifying, for every chapter:

- canonical release notes
- missing documentation
- duplicate documentation
- recommended consolidation

This document does not rewrite history and does not copy release-note bodies into book chapters.

## Overall Status

The Farpy Book has complete navigation and chapter placeholders. Existing release notes are rich enough to populate most chapters, but the source set is fragmented across many milestone-specific notes. The next documentation pass should consolidate only summaries into the Book and keep release notes as immutable evidence.

## Population Rules

- Release notes remain the source evidence.
- Book chapters should summarize current truth and link to evidence.
- Historical release notes should not be rewritten.
- Contradictions should be resolved in Book chapters by naming current truth and linking to both historical and current evidence.
- Do not duplicate command logs, raw proofs, hashes, or deployment transcripts unless a Book chapter explicitly needs a short excerpt.

## Chapter Population Matrix

| Chapter | Population Status | Canonical Release Notes | Missing Documentation | Duplicate / Overlapping Documentation | Recommended Consolidation |
| --- | --- | --- | --- | --- | --- |
| `00_EXECUTIVE_SUMMARY.md` | READY_TO_POPULATE | [RETAIL_ALPHA_FINAL_FREEZE_REPORT_V1.md](../../release/RETAIL_ALPHA_FINAL_FREEZE_REPORT_V1.md), [FARPY_V1_FINAL_CHECKLIST.md](../../release/FARPY_V1_FINAL_CHECKLIST.md), [RETAIL_ALPHA_FREEZE_REPORT_V1.md](../../release/RETAIL_ALPHA_FREEZE_REPORT_V1.md), [LAUNCH_FREEZE_V1.md](../../release/LAUNCH_FREEZE_V1.md) | One short non-optimistic current launch-state summary. | Multiple freeze reports repeat launch posture. | Make this chapter the one-page current truth: controlled retail alpha yes, broad launch no, NodeMuncher broad launch no. Link to all freeze reports. |
| `01_ARCHITECTURE.md` | READY_TO_POPULATE | [CONTROL_PLANE_BOUNDARY_V1.md](../../release/CONTROL_PLANE_BOUNDARY_V1.md), [FARPY_INFRA_ROLE_FREEZE_V1.md](../../release/FARPY_INFRA_ROLE_FREEZE_V1.md), [API_CONTRACT_AUDIT_V1.md](../../release/API_CONTRACT_AUDIT_V1.md) | Diagram of Customer Plane / Control Plane / Render Plane / Worker Plane / Backup Plane / Monitoring Plane. | Boundary and infra role docs overlap but at different levels. | Use `CONTROL_PLANE_BOUNDARY_V1` for logical planes and `FARPY_INFRA_ROLE_FREEZE_V1` for host roles. |
| `02_CUSTOMER_JOURNEY.md` | READY_TO_POPULATE | [FIRST_RENDER_EXPERIENCE_AUDIT_V1.md](../../release/FIRST_RENDER_EXPERIENCE_AUDIT_V1.md), [FIRST_RENDER_GREEN_RECHECK_V1.md](../../release/FIRST_RENDER_GREEN_RECHECK_V1.md), [PAID_BROWSER_SMOKE_PREP_V1.md](../../release/PAID_BROWSER_SMOKE_PREP_V1.md), [FRESH_CUSTOMER_E2E_SMOKE_V1.md](../../release/FRESH_CUSTOMER_E2E_SMOKE_V1.md), [COPY_LANGUAGE_FREEZE_V1.md](../../release/COPY_LANGUAGE_FREEZE_V1.md) | Fresh paid browser E2E result remains pending/operator-driven. | First-render audits, fixes, deploy notes, and product language notes overlap. | Consolidate to one customer path: landing -> sign in -> wallet -> upload -> workspace -> download -> receipt -> account history. Keep proof gaps explicit. |
| `03_RENDER_PIPELINE.md` | READY_TO_POPULATE | [STATE_MACHINE_AUDIT_V1.md](../../release/STATE_MACHINE_AUDIT_V1.md), [PACKAGE_FAILURE_RECOVERY_V1.md](../../release/PACKAGE_FAILURE_RECOVERY_V1.md), [FAILED_WALLET_REFUND_FIX_V1.md](../../release/FAILED_WALLET_REFUND_FIX_V1.md), [WEB_RENDER_INVALID_JSON_FIX_V1.md](../../release/WEB_RENDER_INVALID_JSON_FIX_V1.md) | One current sequence diagram from upload to receipt. Fresh proof for `jobs/create` malformed JSON deployment should be linked if available later. | Failure/recovery and refund notes overlap around failed packages. | Use `STATE_MACHINE_AUDIT_V1` as canonical lifecycle source; fold failure/refund notes into subsections. |
| `04_NODEMUNCHER.md` | PARTIAL | [NODEMUNCHER_FRESH_INSTALL_V1.md](../../release/NODEMUNCHER_FRESH_INSTALL_V1.md), [NODEMUNCHER_LEASE_FAILURE_REPORT_V1.md](../../release/NODEMUNCHER_LEASE_FAILURE_REPORT_V1.md), [RETAIL_ALPHA_FINAL_FREEZE_REPORT_V1.md](../../release/RETAIL_ALPHA_FINAL_FREEZE_REPORT_V1.md) | Final NodeMuncher launch audit, startup recovery proof, earnings/history proof, public installer/signing/update status in one place. | NodeMuncher history is spread across task conversation and a few release notes; not every milestone has a release note in this repo. | Make this chapter controlled-alpha only. Do not imply broad public worker readiness. Add missing release notes before deeper population. |
| `05_BLENDER_ADDON.md` | READY_TO_POPULATE | [BLENDER_ADDON_FINAL_AUDIT_V1.md](../../release/BLENDER_ADDON_FINAL_AUDIT_V1.md), [BLENDER_ADDON_POLISH_V1.md](../../release/BLENDER_ADDON_POLISH_V1.md), [ADDON_INSTALL_SMOKE_V1.md](../../release/ADDON_INSTALL_SMOKE_V1.md), [ADDON_WEBSITE_HANDOFF_V1.md](../../release/ADDON_WEBSITE_HANDOFF_V1.md), [ADDON_PRODUCTION_DEPLOY_V1.md](../../release/ADDON_PRODUCTION_DEPLOY_V1.md) | Real external Blender upload smoke result. Clarified auth/session/token explanation. | Add-on polish, website handoff, install smoke, deploy, and final audit overlap. | Consolidate into install/use/troubleshooting/current limitations. Keep ZIP hashes in release notes, not chapter body. |
| `06_BENCHMARK.md` | READY_TO_POPULATE | [BENCHMARK_DISTRIBUTION_AUDIT_V1.md](../../release/BENCHMARK_DISTRIBUTION_AUDIT_V1.md), [BENCHMARK_PUBLIC_DOWNLOADS_V1.md](../../release/BENCHMARK_PUBLIC_DOWNLOADS_V1.md), [BENCHMARK_PUBLIC_DEPLOY_VERIFY_V1.md](../../release/BENCHMARK_PUBLIC_DEPLOY_VERIFY_V1.md), [BENCHMARK_PUBLIC_REPUBLISH_BLENDER_REQUIRED_V1.md](../../release/BENCHMARK_PUBLIC_REPUBLISH_BLENDER_REQUIRED_V1.md), [BENCHMARK_PUBLIC_REPUBLISH_RUNTIME_FIX_V1.md](../../release/BENCHMARK_PUBLIC_REPUBLISH_RUNTIME_FIX_V1.md) | Benchmark launch audit exists by task request but no file was observed in the release list. Current promotion posture should be stated. | Public downloads, runtime fixes, deploy verification, and distribution audit repeat artifact URLs and hashes. | Keep one current Benchmark status section; link to artifact release notes for hashes and smoke evidence. |
| `07_RECEIPTS.md` | READY_TO_POPULATE | [TRUST_CHAIN_AUDIT_V1.md](../../release/TRUST_CHAIN_AUDIT_V1.md), [FARPY_RECEIPT_CLARITY_V1.md](../../release/FARPY_RECEIPT_CLARITY_V1.md), [AUDIT_CANONICAL_RECEIPT_DOWNLOAD_URLS_V1.md](../../release/AUDIT_CANONICAL_RECEIPT_DOWNLOAD_URLS_V1.md), [JOB_STATUS_TOKEN_DISCLOSURE_FIX_V1.md](../../release/JOB_STATUS_TOKEN_DISCLOSURE_FIX_V1.md) | Owner private receipt/download proof is pending. Receipt mismatch recovery runbook is missing. | Trust chain and receipt UI notes overlap around SHA-256 and tokenized URLs. | Make `TRUST_CHAIN_AUDIT_V1` canonical. Use receipt UI notes only for page behavior. |
| `08_WALLET.md` | READY_TO_POPULATE | [FAILED_WALLET_REFUND_FIX_V1.md](../../release/FAILED_WALLET_REFUND_FIX_V1.md), [TOPUP_BITCOIN_ONCHAIN_RESTORE_V1.md](../../release/TOPUP_BITCOIN_ONCHAIN_RESTORE_V1.md), [BTCPAY_PUBLIC_CHECKOUT_URL_V1.md](../../release/BTCPAY_PUBLIC_CHECKOUT_URL_V1.md), [LIGHTNING_UI_GATED_V1.md](../../release/LIGHTNING_UI_GATED_V1.md), [LIGHTNING_FOUNDATION_REPAIR_V1.md](../../release/LIGHTNING_FOUNDATION_REPAIR_V1.md) | Fresh Stripe paid E2E proof, authenticated Bitcoin browser-click proof, BTCPay on-chain paid-to-wallet proof. | Lightning repair/audit/safe-hold docs are numerous and historical. | Split wallet into active rails and gated/deferred rails. State Card and Bitcoin on-chain separately; Lightning hidden/gated. |
| `09_SECURITY.md` | READY_TO_POPULATE | [SECURITY_GOLD_AUDIT_V1.md](../../release/SECURITY_GOLD_AUDIT_V1.md), [FARPY_SECURITY_ATTACK_SURFACE_AUDIT_V1.md](../../release/FARPY_SECURITY_ATTACK_SURFACE_AUDIT_V1.md), [PROD_ENV_SECRET_PERMISSION_HARDENING_V1.md](../../release/PROD_ENV_SECRET_PERMISSION_HARDENING_V1.md), [WORKER_AUTH_NO_QUERY_TOKEN_V1.md](../../release/WORKER_AUTH_NO_QUERY_TOKEN_V1.md), [PRICE_ROUTE_MALFORMED_JSON_FAIL_CLOSED_V1.md](../../release/PRICE_ROUTE_MALFORMED_JSON_FAIL_CLOSED_V1.md) | Current status of HSTS, CORS, legacy output routes, rate-limit proof, and `jobs/create` malformed JSON. | Attack surface audit predates several fixes; Security Gold summarizes newer truth. | Make `SECURITY_GOLD_AUDIT_V1` canonical current status; preserve older audit as historical baseline. |
| `10_BACKUPS.md` | PARTIAL | [WEB_RENDER_BACKUP_ENCRYPTION_PLAN_V1.md](../../release/WEB_RENDER_BACKUP_ENCRYPTION_PLAN_V1.md), [OFFSITE_BACKUP_OPERATOR_APPROVAL_V1.md](../../release/OFFSITE_BACKUP_OPERATOR_APPROVAL_V1.md), [FARPY_RECOVERY_USB_V1.md](../../release/FARPY_RECOVERY_USB_V1.md), [FOUNDER_ABSENCE_FIX_V1.md](../../release/FOUNDER_ABSENCE_FIX_V1.md) | Encrypted offsite implementation and offsite restore proof. Key ownership proof once generated. | Backup approval, encryption plan, recovery USB, and founder absence all describe overlapping backup state. | Keep the chapter brutally simple: same-host proof green, USB green, encrypted offsite blocked. |
| `11_DISASTER_RECOVERY.md` | PARTIAL | [DISASTER_RECOVERY_AUDIT_V1.md](../../release/DISASTER_RECOVERY_AUDIT_V1.md), [FOUNDER_ABSENCE_AUDIT_V1.md](../../release/FOUNDER_ABSENCE_AUDIT_V1.md), [FOUNDER_ABSENCE_FIX_V1.md](../../release/FOUNDER_ABSENCE_FIX_V1.md), [SINGLE_POINT_OF_FAILURE_AUDIT_V2.md](../../release/SINGLE_POINT_OF_FAILURE_AUDIT_V2.md) | Full host-loss restore proof from offsite backup. Non-founder recovery access proof. | DR audit and founder absence audit overlap heavily. | Use `DISASTER_RECOVERY_AUDIT_V1` for technical restore sequence; use founder absence docs for people/access risk. |
| `12_DEPLOYMENT.md` | READY_TO_POPULATE | [LAUNCH_ARTIFACT_FREEZE_V1.md](../../release/LAUNCH_ARTIFACT_FREEZE_V1.md), [FIRST_RENDER_GREEN_DEPLOY_V1.md](../../release/FIRST_RENDER_GREEN_DEPLOY_V1.md), [HOMEPAGE_PACKAGE_LABEL_FLOW_DEPLOY_V1.md](../../release/HOMEPAGE_PACKAGE_LABEL_FLOW_DEPLOY_V1.md), [WORKSPACE_PRODUCTION_DEPLOY_V3.md](../../release/WORKSPACE_PRODUCTION_DEPLOY_V3.md), [ADDON_PRODUCTION_DEPLOY_V1.md](../../release/ADDON_PRODUCTION_DEPLOY_V1.md) | One current deployment runbook with backup, static overlay, Caddy validation, and rollback commands. | Many deploy notes repeat static backup/deploy/probe patterns. | Consolidate into standard deploy checklist; keep per-release deploy notes as audit evidence. |
| `13_API.md` | READY_TO_POPULATE | [API_CONTRACT_AUDIT_V1.md](../../release/API_CONTRACT_AUDIT_V1.md), [PRODUCTION_REGRESSION_AUDIT_V1.md](../../release/PRODUCTION_REGRESSION_AUDIT_V1.md), [PUBLIC_USER_SMOKE_V1.md](../../release/PUBLIC_USER_SMOKE_V1.md), [PLATFORM_REGRESSION_SUITE_V1.md](../../release/PLATFORM_REGRESSION_SUITE_V1.md) | Formal per-endpoint schemas and retry/idempotency docs remain incomplete. | API contract audit overlaps with security and regression suite. | Use API audit as source. Add concise endpoint families only, not full tables, unless requested later. |
| `14_STATE_MACHINES.md` | READY_TO_POPULATE | [STATE_MACHINE_AUDIT_V1.md](../../release/STATE_MACHINE_AUDIT_V1.md), [FAILED_WALLET_REFUND_FIX_V1.md](../../release/FAILED_WALLET_REFUND_FIX_V1.md), [NODEMUNCHER_LEASE_FAILURE_REPORT_V1.md](../../release/NODEMUNCHER_LEASE_FAILURE_REPORT_V1.md), [TRUST_CHAIN_AUDIT_V1.md](../../release/TRUST_CHAIN_AUDIT_V1.md) | Formal diagram files for job/wallet/receipt/node. | State machine, trust chain, and refund docs overlap around failure/refund/receipt transitions. | Make this chapter a short canonical map from conceptual states to persisted fields. |
| `15_INFRASTRUCTURE.md` | READY_TO_POPULATE | [FARPY_INFRA_ROLE_FREEZE_V1.md](../../release/FARPY_INFRA_ROLE_FREEZE_V1.md), [CONTROL_PLANE_BOUNDARY_V1.md](../../release/CONTROL_PLANE_BOUNDARY_V1.md), [BTCPAY_HOST_ACCESS_AUDIT_V1.md](../../release/BTCPAY_HOST_ACCESS_AUDIT_V1.md), [FARPY_OPERATIONS_COMMAND_CENTER_V1.md](../../release/FARPY_OPERATIONS_COMMAND_CENTER_V1.md) | Current DNS/domain registrar proof, host inventory with access paths, non-founder access status. | Infra role freeze overlaps architecture and DR. | Make infrastructure physical/host-focused; keep architecture logical/plane-focused. |
| `16_OPERATIONS.md` | READY_TO_POPULATE | [FARPY_OPERATIONS_COMMAND_CENTER_V1.md](../../release/FARPY_OPERATIONS_COMMAND_CENTER_V1.md), [FARPY_PRODUCTION_ALERTING_V1.md](../../release/FARPY_PRODUCTION_ALERTING_V1.md), [FARPY_ALERT_TRIAGE_AND_RECOVERY_V1.md](../../release/FARPY_ALERT_TRIAGE_AND_RECOVERY_V1.md), [FARPY_DAILY_FUNNEL_DASHBOARD_V1.md](../../release/FARPY_DAILY_FUNNEL_DASHBOARD_V1.md), [PRODUCTION_OPERATIONS_DASHBOARD_V1.md](../../release/PRODUCTION_OPERATIONS_DASHBOARD_V1.md) | Additional operator alert delivery proof. Current ops dashboard screenshots/status if desired. | Ops dashboard and production operations dashboard overlap. Alerting and triage docs overlap. | Consolidate into daily operator checklist: health, alerts, jobs, payments, storage, receipts, backups. |
| `17_LAUNCH_CHECKLIST.md` | READY_TO_POPULATE | [FARPY_V1_FINAL_CHECKLIST.md](../../release/FARPY_V1_FINAL_CHECKLIST.md), [RETAIL_ALPHA_FINAL_FREEZE_REPORT_V1.md](../../release/RETAIL_ALPHA_FINAL_FREEZE_REPORT_V1.md), [LAUNCH_FREEZE_V1.md](../../release/LAUNCH_FREEZE_V1.md), [PRODUCTION_REGRESSION_AUDIT_V1.md](../../release/PRODUCTION_REGRESSION_AUDIT_V1.md) | None for current checklist. Future updates should append, not overwrite launch truth. | Multiple freeze/checklist docs overlap. | Make this chapter a pointer to `FARPY_V1_FINAL_CHECKLIST.md` plus a one-line current verdict. |
| `18_GLOSSARY.md` | READY_TO_POPULATE | [COPY_LANGUAGE_FREEZE_V1.md](../../release/COPY_LANGUAGE_FREEZE_V1.md), [WORLD_LAYER_V3_RENDER_PARTNER.md](../../release/WORLD_LAYER_V3_RENDER_PARTNER.md), [STATE_MACHINE_AUDIT_V1.md](../../release/STATE_MACHINE_AUDIT_V1.md) | None for initial glossary. Later glossary should include backend-to-customer translation table. | World language and copy freeze overlap. | Use `COPY_LANGUAGE_FREEZE_V1` as canonical; keep world-layer notes as historical implementation trail. |

## Missing Documentation Summary

| Missing document / proof | Affected chapters | Status |
| --- | --- | --- |
| Fresh-new-account paid Stripe/card E2E proof | Customer Journey, Wallet, Launch Checklist | BLOCKED / operator input required |
| Authenticated Bitcoin browser-click checkout proof | Wallet, Customer Journey, Launch Checklist | BLOCKED / operator input required |
| Authenticated owner receipt/download private URL proof | Receipts, Security, Launch Checklist | BLOCKED / operator input required |
| Encrypted offsite backup implementation and restore proof | Backups, Disaster Recovery, Company/Operations | BLOCKED / operator approval required |
| Additional operator alert delivery proof | Operations, Disaster Recovery | BLOCKED / operator setup required |
| Domain registrar and auto-renew proof | Infrastructure, Disaster Recovery | BLOCKED / operator access required |
| Stripe/BTCPay non-founder recovery access proof | Payments, Disaster Recovery, Company | BLOCKED / operator access required |
| Fresh current ORBX Octane smoke | Render Pipeline, Octane, Customer Journey | BLOCKED / PR GPU worker/operator proof required |
| NodeMuncher startup recovery final proof | NodeMuncher, State Machines | IN_PROGRESS / release note not present in repo |
| Formal endpoint schemas | API | IN_PROGRESS |
| Standard deploy runbook | Deployment | IN_PROGRESS |
| Formal receipt mismatch recovery runbook | Receipts, Operations | IN_PROGRESS |

## Duplicate Documentation Summary

| Duplicate cluster | Files involved | Consolidation target |
| --- | --- | --- |
| Launch/freeze status | `LAUNCH_FREEZE_V1`, `RETAIL_ALPHA_FREEZE_REPORT_V1`, `RETAIL_ALPHA_FINAL_FREEZE_REPORT_V1`, `FARPY_V1_FINAL_CHECKLIST` | `00_EXECUTIVE_SUMMARY.md`, `17_LAUNCH_CHECKLIST.md` |
| Homepage/product language | `FARPY_HOMEPAGE_FIRST_MINUTE_V1`, `FARPY_TRUST_STRIP_V1`, `FARPY_PRODUCT_LANGUAGE_V1` if present, `COPY_LANGUAGE_FREEZE_V1`, `WORLD_LAYER_V3_RENDER_PARTNER`, homepage deploy notes | `02_CUSTOMER_JOURNEY.md`, `18_GLOSSARY.md` |
| Workspace/receipt UI | `WORKSPACE_PACKAGE_TRACKING_V3`, `WORKSPACE_PRODUCTION_DEPLOY_V3`, `FARPY_RECEIPT_CLARITY_V1`, `RECEIPT_WORKSPACE_UX_POLISH_V1`, `PACKAGE_FAILURE_RECOVERY_V1` | `02_CUSTOMER_JOURNEY.md`, `07_RECEIPTS.md` |
| Payment rails | Stripe/topup notes, BTCPay notes, Lightning safe-hold/gated/route-hint notes | `08_WALLET.md` |
| Security audits/fixes | `FARPY_SECURITY_ATTACK_SURFACE_AUDIT_V1`, `SECURITY_GOLD_AUDIT_V1`, token/malformed/env fixes | `09_SECURITY.md` |
| Backup/recovery/founder absence | `DISASTER_RECOVERY_AUDIT_V1`, `FOUNDER_ABSENCE_AUDIT_V1`, `FOUNDER_ABSENCE_FIX_V1`, `WEB_RENDER_BACKUP_ENCRYPTION_PLAN_V1`, `FARPY_RECOVERY_USB_V1` | `10_BACKUPS.md`, `11_DISASTER_RECOVERY.md` |
| Benchmark distribution/runtime | Benchmark audit/download/deploy/republish notes | `06_BENCHMARK.md` |
| Add-on package/install/deploy | Add-on polish/handoff/install/deploy/final audit | `05_BLENDER_ADDON.md` |
| Operations dashboards/alerts/funnel | Ops dashboard, ops token, production alerting, alert triage, funnel dashboard | `16_OPERATIONS.md` |

## Consolidation Order

Recommended order for future Book population:

1. `17_LAUNCH_CHECKLIST.md`: summarize current go/no-go truth from `FARPY_V1_FINAL_CHECKLIST.md`.
2. `00_EXECUTIVE_SUMMARY.md`: summarize controlled retail alpha posture.
3. `02_CUSTOMER_JOURNEY.md`: summarize first package flow and pending paid-user proof.
4. `08_WALLET.md`: separate active rails, gated rails, blocked rails.
5. `07_RECEIPTS.md`: summarize receipt/download trust chain and pending owner proof.
6. `09_SECURITY.md`: summarize current P0/P1/P2 from `SECURITY_GOLD_AUDIT_V1`.
7. `10_BACKUPS.md` and `11_DISASTER_RECOVERY.md`: state the same-host/offsite boundary clearly.
8. Product-specific chapters: NodeMuncher, Add-on, Benchmark, Octane/render pipeline.

## Acceptance Check

- Every Book chapter has a population row: PASS.
- Canonical release notes are listed: PASS.
- Missing documentation is identified: PASS.
- Duplicate documentation is identified: PASS.
- Consolidation recommendations are included: PASS.
- No release-note history was rewritten: PASS.
- No production code or configuration changed: PASS.

## Commands Run

```powershell
Get-ChildItem -LiteralPath docs\FARPY_BOOK -Filter *.md | Sort-Object Name
Get-ChildItem -LiteralPath release -Filter *.md | Sort-Object Name
Get-Content docs\FARPY_BOOK\INDEX.md
Get-Content docs\FARPY_BOOK\00_EXECUTIVE_SUMMARY.md
Get-Content docs\FARPY_BOOK\17_LAUNCH_CHECKLIST.md
```

## Files Changed

- `docs/FARPY_BOOK/POPULATION_STATUS.md`
