# RUNBOOK_AUDIT_V1

Status: DOCUMENTED
Date: 2026-06-30
Mode: Documentation audit only. No code, API, backend, production, or deploy changes.

## Objective

Find every operation that still requires founder knowledge and answer whether a runbook exists.

Allowed answers:

- `YES`: a usable runbook, checklist, script, or release note contains enough steps for an operator to execute or verify the operation without guessing.
- `NO`: missing, incomplete, too historical, requires undocumented access, or depends on founder memory.

## Summary

Farpy has strong runbook coverage for static deploys, Caddy validation, service health checks, same-host restore, failed-wallet refund triage, basic operations dashboard usage, and public regression audits.

Founder knowledge still remains for full-host-loss recovery, encrypted offsite backup implementation, second-operator access, domain/DNS/registrar recovery, Stripe/BTCPay dashboard recovery, fresh paid browser smoke, PR Octane worker access, and some NodeMuncher recovery cases.

## Runbook Matrix

| Operation | Runbook exists? | Evidence | Founder knowledge still required |
| --- | --- | --- | --- |
| Static frontend deploy | YES | `ADDON_PRODUCTION_DEPLOY_V1.md`, `WORKSPACE_PRODUCTION_DEPLOY_V3.md`, `FIRST_RENDER_GREEN_DEPLOY_V1.md`, `HOMEPAGE_PACKAGE_LABEL_FLOW_DEPLOY_V1.md` | Which deploy note is the latest canonical deploy procedure is not yet consolidated. |
| Static frontend rollback | YES | Deploy notes include `/opt/farpy.com/out.bak.*` backups and restore patterns. | Exact latest good backup choice may still need operator judgment. |
| Caddy config validate/reload | YES | `DISASTER_RECOVERY_AUDIT_V1.md`, `WORKSPACE_PRODUCTION_DEPLOY_V3.md` include `caddy validate`, reload/restart, and backup paths. | Full route-authoring knowledge still lives in release history, not a single Caddy runbook. |
| Caddy rollback | YES | `DISASTER_RECOVERY_AUDIT_V1.md` includes copy-back from known-good backup and validation. | Selecting known-good backup remains manual. |
| Service health check | YES | `FOUNDER_ABSENCE_FIX_V1.md` includes `systemctl --failed`, `systemctl is-active`, synthetic monitor, disk checks. | None for basic health check. |
| Restart core Farpy services | YES | `DISASTER_RECOVERY_AUDIT_V1.md` and `FOUNDER_ABSENCE_FIX_V1.md` list service names and restart/status commands. | Knowing when to restart vs preserve evidence still needs operator judgment. |
| Restart web-render API | YES | Multiple deploy/fix notes include `systemctl restart farpy-web-render-api.service` and health checks. | None for simple restart. |
| Restart Caddy | YES | DR/deploy notes include validation before restart/reload. | None for simple validated restart. |
| Restore from same-host backup | YES | `FOUNDER_ABSENCE_FIX_V1.md` includes current-data backup paths and same-host restore proof. | None for same-host proof flow. |
| Restore from offsite encrypted backup | NO | `WEB_RENDER_BACKUP_ENCRYPTION_PLAN_V1.md` is plan-only; offsite push/restore proof is blocked. | Requires encryption implementation, keys, explicit approval, Storage Box restore proof. |
| Full host-loss recovery | NO | `DISASTER_RECOVERY_AUDIT_V1.md` says full host loss is not proven. | Requires offsite backup, restore, DNS/cutover, secret/key/operator access. |
| Create current same-host backup | YES | `FOUNDER_ABSENCE_FIX_V1.md` includes tar/sha commands. | None for same-host backup. |
| Push backup offsite | NO | `OFFSITE_BACKUP_OPERATOR_APPROVAL_V1.md` and `WEB_RENDER_BACKUP_ENCRYPTION_PLAN_V1.md` require explicit approval and encryption implementation. | Requires operator approval and key/Storage Box handling. |
| Recovery USB use | YES | `FARPY_RECOVERY_USB_V1.md` exists and recovery USB structure is documented. | Actual physical USB custody/location may still require founder/operator knowledge. |
| Wallet balance/history inspection | YES | `API_CONTRACT_AUDIT_V1.md`, `ACCOUNT_SELF_SERVICE_V1.md`, `FOUNDER_ABSENCE_FIX_V1.md` identify wallet paths and account APIs. | Manual ledger interpretation still benefits from founder knowledge. |
| Failed wallet-funded package refund/reversal | YES | `FAILED_WALLET_REFUND_FIX_V1.md`, `FARPY_ALERT_TRIAGE_AND_RECOVERY_V1.md` document idempotent refund behavior and recovery proof. | None for the proven failed-wallet path. |
| Card-funded failed package refund | NO | `TRUST_CHAIN_AUDIT_V1.md` marks card-funded failure/refund as policy-backed and less automatically proven. | Requires Stripe dashboard/support judgment and possibly manual process. |
| Duplicate wallet credit/debit investigation | YES | `FARPY_ALERT_TRIAGE_AND_RECOVERY_V1.md` shows ledger inspection, refund events, and idempotency proof pattern. | Requires knowing authoritative user/job ledger mapping. |
| Stripe webhook missed event recovery | YES | `DISASTER_RECOVERY_AUDIT_V1.md` references Stripe Dashboard replay and `scripts/reconcile-stripe-web-render-session.mjs`. | Stripe dashboard access and which event to replay remain operator-specific. |
| Stripe account/API key recovery | NO | `FOUNDER_ABSENCE_FIX_V1.md` says non-founder Stripe recovery access is not proven. | Requires Stripe admin access, recovery contacts, API key rotation procedure. |
| BTCPay webhook recovery | YES | `LIGHTNING_FOUNDATION_REPAIR_V1.md`, `BTCPAY_PUBLIC_CHECKOUT_URL_V1.md`, and API/security audits document webhook fail-closed/idempotent behavior. | BTCPay admin access still not proven for non-founder. |
| BTCPay host/admin recovery | NO | `BTCPAY_HOST_ACCESS_AUDIT_V1.md`, `FOUNDER_ABSENCE_FIX_V1.md` indicate access/recovery gaps. | Requires Node C/BTCPay host credentials, store/admin/API access, wallet/node backup. |
| Bitcoin on-chain invoice issue | PARTIAL / NO | On-chain route and public checkout URL fixes exist, but browser-click/payment proof remains pending. | Requires authenticated browser test and BTCPay operator access if invoice fails. |
| Lightning issue | YES for hold, NO for enable | Safe-hold/gated UI documented; enable path blocked by zero channel/liquidity proof. | Requires Node C Lightning bootstrap, channels, route/payment/webhook proof. |
| Receipt missing after completed package | NO | Alerts exist, but `STATE_MACHINE_AUDIT_V1.md` marks completion-without-receipt recovery as not formally exposed. | Requires manual job/output/receipt inspection and possible custom recovery. |
| Receipt/download token issue | YES | `AUDIT_CANONICAL_RECEIPT_DOWNLOAD_URLS_V1.md`, `JOB_STATUS_TOKEN_DISCLOSURE_FIX_V1.md`, `TRUST_CHAIN_AUDIT_V1.md` document canonical tokenized routes and owner redaction. | Owner-session proof still pending for some private URL checks. |
| Output ZIP hash mismatch | NO | Trust/ops docs identify risk and alert category, but no complete mismatch recovery runbook exists. | Requires preserving evidence, disabling download if needed, and reconciling receipt/output manually. |
| ZIP validation failure triage | YES | `FARPY_ALERT_TRIAGE_AND_RECOVERY_V1.md` documents ZIP validation failures, job inspection, refunds, and acknowledgement. | None for historical pattern; new root causes may need render logs. |
| Worker stuck/running timeout | YES | `FARPY_ALERT_TRIAGE_AND_RECOVERY_V1.md` documents stuck `JOB-039AC641` recovery. | Server-side stale lease/requeue automation remains not fully formalized. |
| Worker offline/stale heartbeat | YES | Ops alerting/triage docs cover worker stale heartbeat and relevance fix. | Remote worker host access still may require founder knowledge. |
| NodeMuncher failed local render report | YES | `NODEMUNCHER_LEASE_FAILURE_REPORT_V1.md` documents fail endpoint and desktop reporting behavior. | Real forced-failure proof remains pending. |
| NodeMuncher interrupted startup lease recovery | NO | No `NODEMUNCHER_STARTUP_RECOVERY_V1.md` was found in release list. | Requires desktop recovery behavior proof and runbook. |
| NodeMuncher install/pair/heartbeat smoke | YES | `NODEMUNCHER_FRESH_INSTALL_V1.md` and related audit scripts exist. | Broad friend-install proof/signing/update still not covered. |
| NodeMuncher broad public launch | NO | Final freeze says broad NodeMuncher launch blocked. | Requires signing/update/fleet/onboarding/earnings/runbook maturity. |
| Octane PR worker install/access | NO | `OCTANE_READINESS_AUDIT_V1.md` says fresh PR worker availability not proven; `ssh pr-003` unresolved in audit environment. | Requires PR GPU host access, license, service, worker token, command path. |
| Octane failed render triage | PARTIAL / NO | Worker fail/refund path exists; current Octane readiness audit lacks fresh worker proof. | Requires access to PR worker logs/license/node. |
| Blender add-on install support | YES | `ADDON_INSTALL_SMOKE_V1.md`, `BLENDER_ADDON_FINAL_AUDIT_V1.md` include install/enable proof. | External runtime upload smoke still needs operator/user proof. |
| Blender add-on auth/session confusion | NO | `BLENDER_ADDON_FINAL_AUDIT_V1.md` identifies issue; runbook/copy fix not canonical here. | Requires clear operator/user instructions and possibly add-on copy update. |
| Benchmark installer/runtime issue | YES | `BENCHMARK_PUBLIC_REPUBLISH_RUNTIME_FIX_V1.md` documents install/run smoke and artifact hashes. | None for current Windows Benchmark issue class. |
| Benchmark user missing Blender | YES | Benchmark Blender-required release notes document user-facing requirement/fix. | None for known missing-Blender failure. |
| Public route regression audit | YES | `scripts/production-regression-audit-v1.ps1`, `scripts/regression/platform-regression-suite-v1.ps1`, and release docs exist. | Private env inputs still needed for full private checks. |
| Paid browser smoke | YES for checklist, NO for completed proof | `PAID_BROWSER_SMOKE_PREP_V1.md` exists; actual paid smoke proof remains pending. | Requires logged-in browser/operator payment. |
| Fresh customer E2E | YES for preflight, NO for completed proof | `FRESH_CUSTOMER_E2E_SMOKE_V1.md` / prep notes exist. | Requires real account/payment/operator action. |
| Ops dashboard use | YES | `FARPY_OPERATIONS_COMMAND_CENTER_V1.md`, `FARPY_OPS_TOKEN_AND_DATA_V1.md` document ops page/token/data. | Token custody/access for non-founder not fully documented. |
| Alert acknowledgement | YES | Ops alerting and triage docs show ack only after resolving conditions. | Requires ops token and judgment that condition is resolved. |
| Disk/inode alert recovery | NO | Alert requirements mention disk/inode, but no capacity cleanup/runbook was found. | Requires knowing what can be safely deleted/archived. |
| Analytics/funnel report recovery | YES | `FARPY_DAILY_FUNNEL_DASHBOARD_V1.md`, `FARPY_ANALYTICS_TRUTH_AUDIT_V1.md` document log source and timer/report. | None for basic report regeneration. |
| Domain/DNS issue | NO | `FOUNDER_ABSENCE_FIX_V1.md` says registrar/auto-renew proof not captured. | Requires registrar/DNS access and recovery procedure. |
| TLS/cert renewal issue | NO | SPOF/DR docs mention Caddy/TLS but no complete renewal runbook/proof. | Requires Caddy cert state, renewal forcing, external monitor proof. |
| Email/magic-link delivery issue | NO | SPOF audit says email provider/DNS records are not fully documented. | Requires provider credentials, DNS records, bounce monitoring. |
| Google OAuth issue | PARTIAL / NO | Restore/return-path fixes exist; OAuth config recovery and callback route runbook not consolidated. | Requires provider/client access and safe next/callback verification. |
| Support request triage | PARTIAL / NO | Account self-service and support audit exist, but full support request center is not implemented. | Requires manual support email/process for unresolved actions. |
| Delete account/data request | NO | Account page uses support request link; no deletion runbook/proven backend mutation. | Requires legal/data retention policy and manual process. |
| Cancel queued package | NO | Account self-service notes say support link only; no cancel mutation endpoint. | Requires manual decision and possibly job/payment handling. |
| Delete uploaded/completed package | NO | Account self-service notes say support request only. | Requires manual storage/receipt/wallet/legal handling. |
| Refund policy dispute | PARTIAL / NO | Refund policy page exists; case-by-case process not operationally runbooked. | Requires Stripe/wallet/receipt judgment. |

## High-Risk NO Items

These are the operations most likely to require founder knowledge during an incident:

1. Full host-loss recovery from offsite backup.
2. Encrypted offsite backup implementation and restore proof.
3. Domain/DNS/registrar recovery.
4. Stripe dashboard/API/webhook recovery.
5. BTCPay/Node C recovery.
6. Additional operator alert delivery setup.
7. PR Octane worker access and recovery.
8. Receipt/output hash mismatch recovery.
9. Disk/inode capacity recovery.
10. Account/data deletion and destructive package deletion.

## Recommended Runbook Consolidation

Create these future Book runbooks before broad launch:

1. `RUNBOOK_DEPLOY_AND_ROLLBACK.md`
   - Static deploy, backend deploy, Caddy validate/reload, rollback.
2. `RUNBOOK_INCIDENT_TRIAGE.md`
   - Ops summary, alerts, stuck jobs, failed jobs, ZIP validation, worker offline.
3. `RUNBOOK_WALLET_AND_PAYMENTS.md`
   - Stripe webhook replay, wallet ledger inspection, refunds, BTCPay invoice/webhook issues.
4. `RUNBOOK_RECEIPTS_AND_DOWNLOADS.md`
   - Missing receipt, broken download, hash mismatch, tokenized URL checks.
5. `RUNBOOK_BACKUP_AND_RESTORE.md`
   - Same-host restore, encrypted offsite backup, Node B restore, full host-loss cutover.
6. `RUNBOOK_ACCESS_RECOVERY.md`
   - Domain, DNS, Stripe, BTCPay, email, Storage Box, OAuth, alert recipients.
7. `RUNBOOK_WORKERS.md`
   - NodeMuncher, Blender worker, Octane PR worker, leases, failures, timeouts.
8. `RUNBOOK_CUSTOMER_SUPPORT.md`
   - Account deletion, package deletion, cancel queued package, billing issue, failed delivery.

## Commands Run

```powershell
rg -n "runbook|rollback|restore|restart|deploy|backup|wallet|receipt|payment|Stripe|BTCPay|worker stuck|stuck|failed|triage|alert|Caddy|systemctl|operator|support|refund|recovery|download|receipt mismatch|ZIP validation|restart" release docs scripts deploy -S
Get-ChildItem scripts,deploy -Recurse -File
Get-Content release\DISASTER_RECOVERY_AUDIT_V1.md
Get-Content release\FOUNDER_ABSENCE_FIX_V1.md
Get-Content release\FARPY_ALERT_TRIAGE_AND_RECOVERY_V1.md
Get-Content release\WORKSPACE_PRODUCTION_DEPLOY_V3.md
```

## Files Changed

- `docs/FARPY_BOOK/RUNBOOK_STATUS.md`
