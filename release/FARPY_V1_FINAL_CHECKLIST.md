# FARPY_V1_FINAL_CHECKLIST

Status: DOCUMENTED
Date: 2026-06-30
Mode: Launch checklist only. No code, API, backend, production, or deploy changes.

## Status Legend

- `NOT_STARTED`: no implementation/proof found.
- `IN_PROGRESS`: implementation exists or plan exists, but proof is incomplete.
- `BLOCKED`: cannot proceed without operator input, external dependency, access, funding, certificate, infrastructure, or explicit approval.
- `GREEN`: implemented and verified for the stated scope.

## Launch Scope Truth

| Scope | Status | Current truth |
| --- | --- | --- |
| Controlled retail alpha | GREEN | Supported by current freeze reports for bounded small packages, card payments, package tracking, ZIP downloads, and delivery receipts. |
| Broad public launch | BLOCKED | Blocked by remaining payment/operator proofs, offsite restore proof, broader rate-limit/security hardening, signing/update gaps, and operational scale proof. |
| Broad public NodeMuncher launch | BLOCKED | Controlled alpha only. Signing/update/fleet onboarding/earnings proof and friend-install proof remain incomplete. |
| Lightning public launch | BLOCKED | UI is hidden/gated. Liquidity/channel/payment-to-wallet proof is not green. |
| PayPal public launch | NOT_STARTED | Deferred and not exposed. |

---

## Engineering

| Item | Status | Current truth | Evidence |
| --- | --- | --- | --- |
| Homepage package-label flow | GREEN | Package -> Output -> Frames -> Delivery -> Summary flow implemented and deployed. | `HOMEPAGE_PACKAGE_LABEL_FLOW_DEPLOY_V1`, `HOMEPAGE_FINAL_POLISH_DEPLOY_V1` |
| Mobile homepage readiness | GREEN | Mobile homepage overflow/header/CTA issues addressed and deployed. | `MOBILE_HOMEPAGE_DEPLOY_V1` |
| Workspace package tracker | GREEN | Workspace uses Journey Timeline/package tracker language and completed actions. | `WORKSPACE_PACKAGE_TRACKING_V3`, `WORKSPACE_PRODUCTION_DEPLOY_V3` |
| Receipt page clarity | GREEN | Delivery receipt page improved while preserving IDs/hashes/raw JSON. | `FARPY_RECEIPT_CLARITY_V1`, `RECEIPT_WORKSPACE_UX_POLISH_V1` |
| Account page compression/self-service | GREEN | Balance, package history, wallet history, refunds, support links present. | `ACCOUNT_PAGE_CLEANUP_V1`, `ACCOUNT_SELF_SERVICE_V1` |
| Checkout malformed JSON fail-closed | GREEN | `/checkout` malformed JSON returns 400, valid unauth returns 401. | `CHECKOUT_MALFORMED_JSON_FAIL_CLOSED_V1`, `RETAIL_ALPHA_FINAL_FREEZE_REPORT_V1` |
| Price malformed JSON fail-closed | GREEN | Price route malformed JSON fixed. | `PRICE_ROUTE_MALFORMED_JSON_FAIL_CLOSED_V1`, `RETAIL_ALPHA_FINAL_FREEZE_REPORT_V1` |
| Web-render jobs/create malformed JSON | IN_PROGRESS | Fix milestone exists; final deploy/proof not confirmed in this checklist evidence. | `WEB_RENDER_INVALID_JSON_FIX_V1`, `SECURITY_GOLD_AUDIT_V1` |
| Platform regression suite | IN_PROGRESS | Suite scaffold exists; broader live/private checks still require env/operator inputs. | `PLATFORM_REGRESSION_SUITE_V1` |
| State machine documentation | GREEN | Job/wallet/receipt/node transitions audited and documented. | `STATE_MACHINE_AUDIT_V1` |
| API contract documentation | IN_PROGRESS | API audit exists; route aliases/schema/rate/idempotency docs remain incomplete. | `API_CONTRACT_AUDIT_V1` |
| Copy language freeze | GREEN | Canonical customer vocabulary documented. | `COPY_LANGUAGE_FREEZE_V1` |

---

## Operations

| Item | Status | Current truth | Evidence |
| --- | --- | --- | --- |
| Ops command center | GREEN | Internal read-only ops page/API exists with token gate and populated summary fields. | `FARPY_OPERATIONS_COMMAND_CENTER_V1`, `FARPY_OPS_TOKEN_AND_DATA_V1` |
| Production alert generation | IN_PROGRESS | Alerting exists; recent triage reduced/managed alerts, but active alert posture must be monitored. | `FARPY_PRODUCTION_ALERTING_V1`, `FARPY_ALERT_TRIAGE_AND_RECOVERY_V1` |
| Daily funnel dashboard | GREEN | Hourly funnel report created and corrected to use live traffic source. | `FARPY_DAILY_FUNNEL_DASHBOARD_V1`, `FARPY_ANALYTICS_TRUTH_AUDIT_V1` |
| Synthetic monitoring | IN_PROGRESS | Synthetic monitor repaired; additional operator alert delivery not proven. | `FOUNDER_ABSENCE_FIX_V1` |
| External monitoring via IONOS | IN_PROGRESS | Role assigned; proof details not included in checklist evidence. | `FARPY_INFRA_ROLE_FREEZE_V1` |
| Failed guard services cleanup | GREEN | Obsolete failed guard timers retired or monitoring repaired. | `FOUNDER_ABSENCE_FIX_V1` |
| Production regression audit | GREEN | Public routes/audits green after canonical URL and downloads trailing slash fixes. | `PRODUCTION_REGRESSION_AUDIT_V1`, `AUDIT_CANONICAL_RECEIPT_DOWNLOAD_URLS_V1`, `DOWNLOADS_TRAILING_SLASH_FIX_V1` |
| Public user smoke automation | IN_PROGRESS | Smoke scripts/checklists exist; real fresh paid browser proof remains pending/operator-driven. | `PUBLIC_USER_SMOKE_V1`, `PAID_BROWSER_SMOKE_PREP_V1`, `FRESH_CUSTOMER_E2E_SMOKE_V1` |

---

## Security

| Item | Status | Current truth | Evidence |
| --- | --- | --- | --- |
| Job status private URL disclosure fix | GREEN | Unauth job status no longer exposes tokenized download/receipt URLs. | `JOB_STATUS_TOKEN_DISCLOSURE_FIX_V1`, `RETAIL_ALPHA_FINAL_FREEZE_REPORT_V1` |
| Worker query-token auth removal | GREEN | Worker/node tokens not accepted from query strings. | `WORKER_AUTH_NO_QUERY_TOKEN_V1`, `RETAIL_ALPHA_FINAL_FREEZE_REPORT_V1` |
| Env file permission hardening | GREEN | Sensitive envs moved/hardened; systemd inline secret exposure reduced. | `PROD_ENV_SECRET_PERMISSION_HARDENING_V1`, `RETAIL_ALPHA_FINAL_FREEZE_REPORT_V1` |
| Direct backend port exposure | GREEN | Direct backend port exposure removed/verified through proxy path. | backend freeze/security reports |
| Baseline security headers | GREEN | Baseline headers added. | backend freeze/security reports |
| HSTS on `farpy.com` | IN_PROGRESS | Security Gold audit still lists missing HSTS on main site. | `SECURITY_GOLD_AUDIT_V1` |
| Legacy static output routes | IN_PROGRESS | Security Gold audit lists legacy `/outputs/*` and `/render-output/*` Caddy route risk. | `SECURITY_GOLD_AUDIT_V1` |
| Broad CORS tightening | IN_PROGRESS | API CORS remains broad; credentials not observed but policy is not tight. | `SECURITY_GOLD_AUDIT_V1` |
| Rate-limit proof | IN_PROGRESS | Upload/body caps exist; broad auth/upload/topup/pair/heartbeat/lease rate limits not fully proven. | `SECURITY_GOLD_AUDIT_V1`, `API_CONTRACT_AUDIT_V1` |
| OAuth redirect final path | GREEN | `/real/` fallback corrected to `/account`; Google button restored. | `GOOGLE_OAUTH_RESTORE_V1`, `GOOGLE_OAUTH_RETURN_PATH_FIX_V1` |
| Security overall for retail alpha | GREEN | Retail alpha allowed with P1 hardening queued. | `RETAIL_ALPHA_FINAL_FREEZE_REPORT_V1`, `SECURITY_GOLD_AUDIT_V1` |
| Security overall for broad launch | BLOCKED | HSTS/CORS/rate-limit/static-output/hardening proof remain incomplete. | `SECURITY_GOLD_AUDIT_V1` |

---

## Backups

| Item | Status | Current truth | Evidence |
| --- | --- | --- | --- |
| Same-host current data backup | GREEN | Current `/var/lib/farpy-web-render` and `/var/lib/farpy` snapshot created. | `FOUNDER_ABSENCE_FIX_V1` |
| Same-host restore proof | GREEN | Same-host restore proof exists under `/tmp/farpy-restore-proof`. | `FOUNDER_ABSENCE_FIX_V1` |
| Offsite backup push | BLOCKED | Explicit operator approval required before production data leaves Node A. | `OFFSITE_BACKUP_OPERATOR_APPROVAL_V1`, `FOUNDER_ABSENCE_FIX_V1` |
| Offsite restore proof | BLOCKED | Cannot be proven until encrypted/offsite push is approved and run. | `DISASTER_RECOVERY_AUDIT_V1`, `WEB_RENDER_BACKUP_ENCRYPTION_PLAN_V1` |
| Backup encryption implementation | NOT_STARTED | Plan exists; scripts/keys/upload/restore proof not implemented. | `WEB_RENDER_BACKUP_ENCRYPTION_PLAN_V1` |
| Recovery USB | GREEN | Offline recovery USB material created. | `FARPY_RECOVERY_USB_V1` |
| Full host-loss recovery | BLOCKED | Not proven without current encrypted offsite backup and restore. | `DISASTER_RECOVERY_AUDIT_V1`, `FOUNDER_ABSENCE_FIX_V1` |

---

## Infrastructure

| Item | Status | Current truth | Evidence |
| --- | --- | --- | --- |
| Infrastructure role map | GREEN | Node A/B/C/Storage Box/IONOS roles frozen. | `FARPY_INFRA_ROLE_FREEZE_V1` |
| Node A production control plane | GREEN | Role frozen as production control plane. | `FARPY_INFRA_ROLE_FREEZE_V1` |
| Node B standby/restore/synthetic monitoring | IN_PROGRESS | Role frozen; restore/offsite proof path still incomplete. | `FARPY_INFRA_ROLE_FREEZE_V1`, `FOUNDER_ABSENCE_FIX_V1` |
| Node C payments/BTCPay | IN_PROGRESS | BTCPay exists and invoice creation works; Lightning connectivity remains blocked. | `LIGHTNING_NODE_CONFIG_AUDIT_V1`, `LIGHTNING_NODE_BOOTSTRAP_V1` |
| Storage Box encrypted backup destination | BLOCKED | Destination exists conceptually; encrypted offsite backup not yet pushed/proven. | `WEB_RENDER_BACKUP_ENCRYPTION_PLAN_V1` |
| Caddy/static routing | GREEN | Main public routes deployed and fixed; `/real` compatibility redirect exists. | deploy/freeze notes, `DOWNLOADS_TRAILING_SLASH_FIX_V1` |
| Public proof page | IN_PROGRESS | Public proof route/data exists, but core live proof depth is limited. | `FARPY_PUBLIC_PROOF_PAGE_V1`, `TRUST_CHAIN_AUDIT_V1` |

---

## Payments

| Item | Status | Current truth | Evidence |
| --- | --- | --- | --- |
| Stripe/card UI | GREEN | Card visible/default and fail-closed. | `RETAIL_ALPHA_FINAL_FREEZE_REPORT_V1`, `PAYMENT_RAILS_FINAL_SMOKE_V1` |
| Stripe checkout auth gate | GREEN | Unauth checkout returns clean auth error; malformed JSON fixed. | `WORKSPACE_AUTH_GATE_V1`, `CHECKOUT_AUTH_ERROR_CLEANUP_V1`, `CHECKOUT_MALFORMED_JSON_FAIL_CLOSED_V1` |
| Stripe webhook idempotency/signature | GREEN | Signature and idempotency documented/audited. | `API_CONTRACT_AUDIT_V1`, `SECURITY_GOLD_AUDIT_V1` |
| Fresh-new-account Stripe paid E2E | BLOCKED | Operator/browser payment proof still pending. | `RETAIL_ALPHA_FINAL_FREEZE_REPORT_V1`, `FRESH_NEW_ACCOUNT_E2E_PROOF_V1`, `PAID_BROWSER_SMOKE_PREP_V1` |
| Bitcoin on-chain UI | GREEN | Bitcoin visible/restored; checkout URL fixed to public BTCPay URL. | `TOPUP_BITCOIN_ONCHAIN_RESTORE_V1`, `BTCPAY_PUBLIC_CHECKOUT_URL_V1`, `BTCPAY_INVOICE_CREATE_FAILURE_FIX_V1` |
| Authenticated Bitcoin browser-click checkout proof | BLOCKED | Listed as pending operator proof. | `RETAIL_ALPHA_FINAL_FREEZE_REPORT_V1` |
| Lightning UI | GREEN | Hidden/gated by default. | `LIGHTNING_UI_GATED_V1`, `LIGHTNING_SAFE_HOLD_UX_CLARITY_V1` |
| Lightning liquidity/payment proof | BLOCKED | Core Lightning has zero peers/channels; route hints/payment proof not green. | `LIGHTNING_ROUTE_HINT_AUDIT_V1`, `LIGHTNING_NODE_BOOTSTRAP_V1` |
| PayPal | NOT_STARTED | Deferred and not shown. | `RETAIL_ALPHA_FINAL_FREEZE_REPORT_V1` |
| Failed wallet-funded render refund | GREEN | Idempotent refund/reversal path implemented and JOB-B13C609B fixed. | `FAILED_WALLET_REFUND_FIX_V1` |
| Card-funded failed-render refund automation | IN_PROGRESS | Policy/support path exists; automatic proof less complete than wallet-funded path. | `TRUST_CHAIN_AUDIT_V1`, `STATE_MACHINE_AUDIT_V1` |

---

## Receipts

| Item | Status | Current truth | Evidence |
| --- | --- | --- | --- |
| Receipt generation after valid output | GREEN | Worker/NodeMuncher complete validates ZIP/frame count before receipt mint. | `TRUST_CHAIN_AUDIT_V1`, `API_CONTRACT_AUDIT_V1` |
| Token-gated receipt URL | GREEN | Receipt endpoints require token; job status URL disclosure fixed. | `JOB_STATUS_TOKEN_DISCLOSURE_FIX_V1`, `TRUST_CHAIN_AUDIT_V1` |
| SHA-256 receipt/display | GREEN | Receipt page exposes SHA-256 and raw JSON/verification details. | `FARPY_RECEIPT_CLARITY_V1`, `TRUST_CHAIN_AUDIT_V1` |
| Owner private receipt/download proof | BLOCKED | Authenticated owner proof remains pending operator input. | `RETAIL_ALPHA_FINAL_FREEZE_REPORT_V1`, `OWNER_STATUS_PRIVATE_URL_PROOF_V1` |
| Public proof with real receipt counts | IN_PROGRESS | Page exists but live public proof depth is limited/honest. | `TRUST_CHAIN_AUDIT_V1`, `FARPY_PUBLIC_PROOF_PAGE_V1` |
| Receipt mismatch recovery runbook | IN_PROGRESS | Alert exists; formal recovery transition remains a gap. | `STATE_MACHINE_AUDIT_V1`, `TRUST_CHAIN_AUDIT_V1` |

---

## Benchmark

| Item | Status | Current truth | Evidence |
| --- | --- | --- | --- |
| Public Benchmark downloads | GREEN | Windows EXE/MSI public URLs and SHA sidecars verified. | `BENCHMARK_PUBLIC_REPUBLISH_RUNTIME_FIX_V1` |
| Benchmark installer runtime fix | GREEN | Public install smoke completed; no CMD popup; Run Test completes. | `BENCHMARK_PUBLIC_REPUBLISH_RUNTIME_FIX_V1` |
| Benchmark requires local Blender 4.x | GREEN | UX made requirement explicit; runtime download hidden failure addressed. | `BENCHMARK_PUBLIC_REPUBLISH_BLENDER_REQUIRED_V1` |
| Benchmark leaderboard/API | GREEN | Public benchmark API/pages implemented and audited. | benchmark release notes, `API_CONTRACT_AUDIT_V1` |
| Benchmark macOS/Linux installers | NOT_STARTED | No real artifacts advertised. | `BENCHMARK_DISTRIBUTION_AUDIT_V1`, `BENCHMARK_PUBLIC_DOWNLOADS_V1` |
| Benchmark promotion | BLOCKED | Final freeze says Benchmark promotion deferred. | `RETAIL_ALPHA_FINAL_FREEZE_REPORT_V1` |

---

## NodeMuncher

| Item | Status | Current truth | Evidence |
| --- | --- | --- | --- |
| Pairing | GREEN | Pairing/persistence/heartbeat path implemented in prior milestones. | NodeMuncher release notes, `NODEMUNCHER_FRESH_INSTALL_V1` |
| Heartbeat auth fail-closed | GREEN | Missing token rejected; query-token fallback removed. | `WORKER_AUTH_NO_QUERY_TOKEN_V1`, NodeMuncher audits |
| Lease peek/claim API | GREEN | Node-token authenticated lease routes exist. | `API_CONTRACT_AUDIT_V1` |
| NodeMuncher E2E | GREEN | Final freeze records NodeMuncher E2E green. | `RETAIL_ALPHA_FINAL_FREEZE_REPORT_V1` |
| NodeMuncher watchdog | GREEN | Watchdog marked green in final freeze. | `RETAIL_ALPHA_FINAL_FREEZE_REPORT_V1` |
| NodeMuncher local install | GREEN | Local install marked green in final freeze. | `RETAIL_ALPHA_FINAL_FREEZE_REPORT_V1` |
| Lease failure report endpoint | IN_PROGRESS | Implemented/deployed and route-smoked; real failed claimed package proof remains pending. | `NODEMUNCHER_LEASE_FAILURE_REPORT_V1` |
| Startup recovery | IN_PROGRESS | Milestone requested; no final release note found in current repo listing. | absence of `NODEMUNCHER_STARTUP_RECOVERY_V1.md` in release list |
| Earnings/history UI | IN_PROGRESS | E2E proof exists but broad earnings/history launch confidence remains not final. | NodeMuncher audit history |
| Broad public NodeMuncher launch | BLOCKED | Signing/update/broad onboarding/public scale deferred. | `RETAIL_ALPHA_FINAL_FREEZE_REPORT_V1` |
| NodeMuncher public downloads | BLOCKED | NodeMuncher marked internal alpha, not public download. | `BENCHMARK_PUBLIC_DEPLOY_VERIFY_V1`, `downloads` release notes |

---

## Addon

| Item | Status | Current truth | Evidence |
| --- | --- | --- | --- |
| Add-on ZIP deployed | GREEN | `/addon`, ZIP, sidecar, hash live and verified. | `ADDON_PRODUCTION_DEPLOY_V1` |
| Add-on install/enable smoke | GREEN | Blender 4.1 install/enable passed. | `ADDON_INSTALL_SMOKE_V1`, `BLENDER_ADDON_FINAL_AUDIT_V1` |
| Add-on copy polish | GREEN | Farpy Render Delivery/package language applied. | `BLENDER_ADDON_POLISH_V1`, `ADDON_WEBSITE_HANDOFF_V1` |
| Add-on auth clarity | IN_PROGRESS | Audit found API token/session model confusing; clarity milestone exists but final proof not confirmed here. | `BLENDER_ADDON_FINAL_AUDIT_V1` |
| Real external Blender upload smoke | BLOCKED | Requires operator/user runtime smoke; not fully proven in final audit. | `BLENDER_ADDON_FINAL_AUDIT_V1` |
| Add-on version/update path | IN_PROGRESS | Static version; no update check. | `BLENDER_ADDON_FINAL_AUDIT_V1` |

---

## Octane

| Item | Status | Current truth | Evidence |
| --- | --- | --- | --- |
| Backend Octane receipt/ZIP path | GREEN | Authenticated worker, ZIP validation, receipt mint path exist. | `OCTANE_READINESS_AUDIT_V1`, prior Octane milestones |
| Historical Octane still smoke | GREEN | Prior still render proof exists. | Octane release history |
| Historical Octane 2-frame private smoke | GREEN | Prior 2-frame proof exists with caveat: sequential still-frame execution. | Octane release history |
| Public Octane frame policy sync | IN_PROGRESS | Audit found still-only vs multi-frame contradiction; sync milestone exists. | `OCTANE_READINESS_AUDIT_V1`, `OCTANE_FRAME_POLICY_SYNC_V1` |
| Fresh current ORBX production smoke | BLOCKED | PR GPU worker availability not proven in latest Octane audit. | `OCTANE_READINESS_AUDIT_V1` |
| Broad unattended Octane launch | BLOCKED | Needs fresh ORBX smoke, PR worker visibility, and frame policy consistency. | `OCTANE_READINESS_AUDIT_V1` |

---

## Marketing

| Item | Status | Current truth | Evidence |
| --- | --- | --- | --- |
| Homepage first-minute clarity | GREEN | First-time visitor copy/CTA/customer path improved and deployed. | `FARPY_HOMEPAGE_FIRST_MINUTE_V1`, `FIRST_RENDER_FRICTION_DEPLOY_V1`, `HOMEPAGE_PACKAGE_LABEL_FLOW_DEPLOY_V1` |
| Trust strip | GREEN | Receipt-backed/SHA-256/Wallet/No subscription strip exists. | `FARPY_TRUST_STRIP_V1`, `HOMEPAGE_FINAL_POLISH_DEPLOY_V1` |
| Stage limits copy | GREEN | Early access/small package limits documented. | `FARPY_STAGE_LIMITS_COPY_V1` |
| Product language/world layer | GREEN | Package/render partner/delivery receipt language live. | `FARPY_PRODUCT_LANGUAGE_V1`, `WORLD_LAYER_V3_RENDER_PARTNER`, `COPY_LANGUAGE_FREEZE_V1` |
| External tester smoke pack | GREEN | Checklist created for testers/operators. | `EXTERNAL_USER_SMOKE_PACK_V1` |
| Demo video | NOT_STARTED | User listed as future task; no release note found. | no `DEMO_VIDEO_V1.md` found |
| Broad launch campaign | BLOCKED | Broad public launch is no-go. | `RETAIL_ALPHA_FINAL_FREEZE_REPORT_V1` |

---

## Legal

| Item | Status | Current truth | Evidence |
| --- | --- | --- | --- |
| Terms page | GREEN | Terms route/copy exists. | `src/app/terms/page.tsx`, launch audits |
| Privacy page | GREEN | Privacy route/copy exists. | `src/app/privacy/page.tsx`, launch audits |
| Refund policy | GREEN | Refund route/copy exists and wallet refund behavior documented. | `src/app/refunds/page.tsx`, `FAILED_WALLET_REFUND_FIX_V1` |
| Acceptable use | GREEN | Acceptable use route/copy exists. | `src/app/acceptable-use/page.tsx` |
| DMCA/contact | GREEN | DMCA/contact routes/copy exist. | `src/app/dmca/page.tsx`, `src/app/contact/page.tsx` |
| Copy-language legal alignment | IN_PROGRESS | Legal pages still contain some job-first language; not a legal blocker, but copy freeze recommends package-first wording. | `COPY_LANGUAGE_FREEZE_V1` |
| Formal external legal review | NOT_STARTED | No proof found in release notes. | release-note audit |

---

## Company

| Item | Status | Current truth | Evidence |
| --- | --- | --- | --- |
| Infrastructure ownership map | GREEN | Node roles and migration rules documented. | `FARPY_INFRA_ROLE_FREEZE_V1` |
| Founder-absence survival | BLOCKED | Improved, but full-host-loss/offsite/operator-access proofs remain incomplete. | `FOUNDER_ABSENCE_FIX_V1`, `FOUNDER_ABSENCE_AUDIT_V1` |
| Additional operator alert delivery | BLOCKED | Not proven. | `FOUNDER_ABSENCE_FIX_V1` |
| Domain registrar/auto-renew proof | BLOCKED | Not proven. | `FOUNDER_ABSENCE_FIX_V1` |
| Stripe/BTCPay non-founder recovery access | BLOCKED | Not proven. | `FOUNDER_ABSENCE_FIX_V1` |
| Support zero-email audit | IN_PROGRESS | Audit exists; support forms/placeholders requested separately, not all implemented here. | `SUPPORT_ZERO_EMAIL_AUDIT_V1`, `ACCOUNT_SELF_SERVICE_V1` |
| Company compliance/readiness beyond launch docs | NOT_STARTED | No separate company compliance proof found. | release-note audit |

---

## Certifications

| Item | Status | Current truth | Evidence |
| --- | --- | --- | --- |
| Windows code signing / EV certificate | BLOCKED | Waiting for external certificate/vendor validation. | user task list, final freeze deferred items |
| macOS signing/notarization | NOT_STARTED | Deferred/not supported for current public artifacts. | `RETAIL_ALPHA_FINAL_FREEZE_REPORT_V1`, Benchmark/addon reports |
| NodeMuncher signing/update path | BLOCKED | Deferred; broad NodeMuncher launch no-go. | `RETAIL_ALPHA_FINAL_FREEZE_REPORT_V1` |
| Benchmark signing trust | IN_PROGRESS | Public Windows installers work, but signing warnings/certification remain not fully resolved. | Benchmark release notes, certification deferred items |
| Blender add-on marketplace certification | NOT_STARTED | No claim or proof; add-on is direct ZIP. | `ADDON_PRODUCTION_DEPLOY_V1`, `BLENDER_ADDON_FINAL_AUDIT_V1` |
| Security/compliance certification | NOT_STARTED | No third-party audit/certification proof found. | release-note audit |

---

## Current Blockers

| Blocker | Status | Blocks |
| --- | --- | --- |
| Fresh-new-account paid Stripe/card E2E proof | BLOCKED | Broad retail confidence; not controlled alpha. |
| Authenticated Bitcoin browser-click checkout proof | BLOCKED | Bitcoin public confidence. |
| Authenticated owner private receipt/download URL proof | BLOCKED | Final private URL regression confidence. |
| Encrypted offsite backup implementation + offsite restore proof | BLOCKED | Full host-loss recovery and founder-absence YELLOW/GREEN. |
| Lightning channels/liquidity/payment proof | BLOCKED | Lightning public launch. |
| PR Octane worker fresh ORBX proof | BLOCKED | Broad unattended Octane confidence. |
| EV/code-signing validation | BLOCKED | Installer trust/certification. |
| Additional operator alert delivery | BLOCKED | Founder-absence resilience. |
| Domain auto-renew/registrar proof | BLOCKED | Founder-absence resilience. |

## Current Green Core

| Core | Status |
| --- | --- |
| Customer-facing frontend for controlled alpha | GREEN |
| Card topup/checkout fail-closed posture | GREEN |
| Package upload/workspace/download/receipt surfaces | GREEN |
| Receipt/SHA/token-gated trust chain for completed packages | GREEN |
| Failed wallet-funded no-delivery refund path | GREEN |
| Benchmark Windows public installer/download/hash/runtime fix | GREEN |
| Blender add-on package/download/install smoke | GREEN |
| NodeMuncher controlled-alpha E2E/watchdog/local install | GREEN |
| Ops command center and basic alerting | GREEN/IN_PROGRESS |

## Final Checklist Verdict

| Launch decision | Status | Truth |
| --- | --- | --- |
| Controlled retail alpha | GREEN | Allowed with active operator monitoring and bounded small-package positioning. |
| Broad public launch | BLOCKED | Not allowed until blockers above are resolved. |
| Broad NodeMuncher launch | BLOCKED | Not allowed. |
| Lightning public launch | BLOCKED | Not allowed. |
| PayPal launch | NOT_STARTED | Not exposed. |

## Commands Run

```powershell
rg --files release | Sort-Object
rg -n "GREEN|YELLOW|RED|BLOCKED|PASS|FAIL|Retail alpha|Broad public launch|Lightning|NodeMuncher|Benchmark|Addon|Octane|Stripe|BTCPay|backup|restore|security|receipt|wallet|EV|cert|signing|PayPal|deferred|gated|hidden|freeze|launch" release -S
Get-Content release\RETAIL_ALPHA_FINAL_FREEZE_REPORT_V1.md
Get-Content release\SECURITY_GOLD_AUDIT_V1.md
Get-Content release\FARPY_SECURITY_ATTACK_SURFACE_AUDIT_V1.md
Get-Content release\DISASTER_RECOVERY_AUDIT_V1.md
Get-Content release\FOUNDER_ABSENCE_FIX_V1.md
Get-Content release\WEB_RENDER_BACKUP_ENCRYPTION_PLAN_V1.md
Get-Content release\NODEMUNCHER_LEASE_FAILURE_REPORT_V1.md
Get-Content release\BLENDER_ADDON_FINAL_AUDIT_V1.md
Get-Content release\OCTANE_READINESS_AUDIT_V1.md
Get-Content release\BENCHMARK_PUBLIC_REPUBLISH_RUNTIME_FIX_V1.md
```

## Files Changed

- `release/FARPY_V1_FINAL_CHECKLIST.md`

No code changed.
No backend changed.
No production changed.
No deployment performed.
No secrets printed.
