# SECOND_OPERATOR_GAP_AUDIT_V1

Status: ACTIVE

Date: 2026-06-30

Mode: Documentation audit only. No production changes. No secrets recorded.

## Purpose

Identify what a second operator would need to keep Farpy alive without founder intervention.

This document lists gaps in:

- credentials
- runbooks
- DNS
- domains
- payments
- deployments
- restores
- monitoring

## Executive Verdict

Second-operator readiness: YELLOW / NOT COMPLETE

Farpy has many working operational runbooks, audits, and recovery notes. The remaining gap is not mostly commands; it is authority, access, and custody proof.

A second operator can likely follow service/deploy/triage notes once logged into the right systems. It is not yet proven that they can obtain the right access, receive alerts, decrypt or restore backups, recover external accounts, or cut over Node B during a founder absence.

## Priority Summary

| Priority | Gap | Why It Matters |
|---|---|---|
| P0 | None currently proven for bounded retail alpha | No active public P0 was found in the reviewed Book/release evidence. |
| P1 | Second-operator access to registrar/DNS, hosting, Stripe, BTCPay, email/OAuth, Storage Box, and backup keys is not proven | Founder absence can stall production recovery, payments, login, backups, and incident response. |
| P1 | Encrypted offsite restore and Node B cutover are not proven | A second operator cannot recover from Node A loss without a tested off-host restore. |
| P1 | Alert delivery to a second human is not proven | Failures may be detected by scripts but not reach anyone who can act. |
| P1 | Production config/source-of-truth is partly production-only | Rebuilds may depend on founder memory or direct host inspection. |
| P2 | Runbooks exist but are fragmented across many release notes | A second operator can lose time finding the right document during an incident. |

## Access Gap Matrix

| Area | Required Second-Operator Access | Current Evidence | Gap | Priority |
|---|---|---|---|---|
| Node A production host | SSH or emergency console access; sudo/root break-glass path; service restart authority | `FOUNDER_ABSENCE_FIX_V1.md` verifies core services, backups, monitor repair, and same-host restore. | Second-operator access to Node A is not proven in docs. | P1 |
| Node B standby | SSH/console access; ability to restore backups; DNS/Caddy cutover authority | Infra role freeze defines Node B as warm standby / restore tests. | Node B restore/cutover from encrypted offsite backup is not proven. | P1 |
| Node C payments/BTCPay | Host access; BTCPay admin; store/API/webhook settings; wallet/node recovery | BTCPay/Lightning audits and payment fixes exist. | Non-founder BTCPay/Node C admin recovery is not proven. | P1 |
| Storage Box | SSH/SFTP access; backup destination access; restore read access | `FOUNDER_ABSENCE_FIX_V1.md` proves Storage Box connectivity from Node A. | Second-operator credentials and restore from Storage Box are not proven. | P1 |
| Backup encryption keys | Decryption key custody; sealed backup; rotation/revocation procedure | `WEB_RENDER_BACKUP_ENCRYPTION_PLAN_V1.md` recommends age-based plan. | Keys are not generated/distributed/proven; no restore proof from encrypted backup. | P1 |
| Domain registrar | Login, 2FA recovery, billing, auto-renew, transfer lock visibility | SPOF and founder absence docs identify registrar as unproven. | Registrar, auto-renew, and secondary access are not documented/proven. | P1 |
| DNS provider | Zone editing, nameserver control, emergency records, cutover records | SPOF docs identify DNS as critical. | Provider and second-operator access are not proven. | P1 |
| TLS/cert management | Ability to inspect/renew/reload Caddy-managed certificates | Caddy/TLS is working; Caddy runbooks exist. | Certificate renewal/cutover recovery and external expiry monitoring are incomplete. | P1 |
| Stripe | Dashboard admin, webhook event replay, refunds, disputes, payout/bank visibility, API key rotation | Stripe routes/webhooks are fail-closed; runbook notes mention replay/reconcile. | Non-founder Stripe recovery/admin access is not proven. | P1 |
| BTCPay | Store admin, webhook/API key rotation, invoice debugging, Node C access | BTCPay webhook and invoice hardening exists. | Non-founder BTCPay admin access and host recovery are not proven. | P1 |
| Email/magic link provider | Sender domain, delivery logs, bounce monitoring, DNS records, credential recovery | Email/magic-link is a login/support dependency. | Email provider and recovery path are not fully documented. | P1 |
| Google OAuth | OAuth client admin, callback URL management, secret rotation | Google OAuth was restored/fixed. | Provider console access and recovery runbook are not consolidated. | P2 |
| Ops dashboard | FARPY_OPS_TOKEN custody and safe use; dashboard route knowledge | Ops command center and token/data docs exist. | Token handoff/rotation procedure for second operator is not proven. | P1 |
| IONOS/external monitoring | Login, alert destination, monitor configuration | Infra role freeze assigns IONOS to external synthetic monitoring. | Alert delivery to a second operator is not proven. | P1 |
| Repository/source control | Repo access, release/docs write access, deploy artifact history | Farpy Book and release docs exist locally. | Formal CODEOWNERS/ownership and canonical infra templates are incomplete. | P2 |

## Runbook Gap Matrix

| Operation | Current Runbook Status | Second-Operator Gap | Priority |
|---|---|---|---|
| Static frontend deploy | YES | Latest canonical deploy flow is spread across deployment release notes. | P2 |
| Static rollback | YES | Selecting the correct known-good backup still needs operator judgment. | P2 |
| Caddy validate/reload/rollback | YES | Route-authoring knowledge is historical, not a single Caddy runbook. | P2 |
| Core service restart | YES | Operator needs access and judgment about preserving evidence before restart. | P2 |
| Same-host backup/restore | YES | Same-host restore proof exists; second-operator Node A access not proven. | P1 |
| Offsite encrypted backup | PLAN_ONLY / BLOCKED | No implemented encrypted offsite push and no offsite restore proof. | P1 |
| Full host-loss recovery | NO | No timed Node B restore/cutover from offsite backup. | P1 |
| Stripe webhook replay/reconcile | PARTIAL | Dashboard access and event selection require operator authority. | P1 |
| BTCPay invoice/webhook recovery | PARTIAL | BTCPay admin/Node C access not proven. | P1 |
| Failed wallet-funded package refund | YES | Proven path exists; second operator must know authoritative ledger locations. | P2 |
| Card-funded failed package refund | NO / PARTIAL | Stripe support/refund path is not fully runbooked. | P1 |
| Receipt/download mismatch | NO | Evidence-preserving recovery is not complete. | P1 |
| Worker offline/stuck job triage | YES | Remote worker host access may still depend on founder. | P1 |
| Disk/inode capacity recovery | NO | Alerts exist, but cleanup/archive policy is incomplete. | P1 |
| Domain/DNS incident | NO | No complete registrar/DNS runbook or secondary access proof. | P1 |
| TLS/cert incident | NO / PARTIAL | Caddy works, but renewal/cert-expiry incident response is incomplete. | P1 |
| Support escalation | PARTIAL | Support request center/self-service gaps remain. | P2 |

## Credential Classes Required

Do not store secrets in this Book. Store only ownership/custody metadata and recovery procedure names.

| Credential Class | Needs Second Operator? | Required Custody Proof |
|---|---|---|
| Production SSH keys | Yes | Second operator can access Node A/B/C or emergency console without founder. |
| Root/sudo break-glass | Yes | Sealed process, access log, and revocation path. |
| `/etc/farpy` runtime env values | Yes, via protected backup only | Restorable from encrypted backup; never pasted into docs. |
| Stripe dashboard/API | Yes | Admin or recovery contact tested. |
| BTCPay admin/API/webhook | Yes | Admin/recovery contact tested. |
| Domain registrar/DNS | Yes | Login, 2FA, billing, auto-renew verified. |
| Storage Box access | Yes | Can list and restore encrypted backups. |
| Backup decryption key | Yes | Sealed key backup and at least one restore test. |
| Email/OAuth provider | Yes | Provider admin or recovery route documented. |
| Ops token | Yes | Rotation and safe custody documented. |
| Repository/deploy access | Yes | Can build, deploy, and roll back from source. |

## Payment Gaps

| Payment Area | Current Status | Gap | Priority |
|---|---|---|---|
| Stripe/card | Live public rail, fail-closed behavior documented | Second-operator Stripe dashboard/API/refund/webhook recovery not proven | P1 |
| Bitcoin on-chain | Backend proof exists; browser-click proof has been tracked separately | Second-operator BTCPay/Node C access not proven | P1 |
| Lightning | Hidden/gated | No public risk while hidden; enabling requires liquidity/payment/webhook proof | P2 while hidden |
| PayPal | Deferred | No second-operator action unless re-enabled | P2 |
| Wallet ledger | Authoritative and idempotent | Offsite restore/key custody and manual reconciliation process need proof | P1 |

## Deployment Gaps

| Deployment Area | Current Status | Gap | Priority |
|---|---|---|---|
| Static deploy | Proven repeatedly | Need one canonical runbook instead of release-note archaeology | P2 |
| Backend deploy | Proven through many fixes | `scripts/job-api.mjs` is high-risk and needs change guardrails | P1 |
| Caddy changes | Backup/validate/reload practices exist | Need single Caddy runbook and config template | P2 |
| Secrets/env changes | Permissions hardened | Need redacted env templates and second-operator restoration proof | P1 |
| Rollback | Local backup patterns exist | Need clear “latest known good” selection criteria | P2 |

## Restore Gaps

| Restore Target | Current Proof | Gap | Priority |
|---|---|---|---|
| Static frontend | Backup/rollback patterns exist | No measured second-operator exercise | P2 |
| Caddy config | Backup/validate notes exist | No complete DNS/TLS incident runbook | P1 |
| `/var/lib/farpy` | Same-host backup/restore proof exists | No offsite encrypted restore proof | P1 |
| `/var/lib/farpy-web-render` | Same-host backup/restore proof exists | No offsite encrypted restore proof | P1 |
| Wallet ledger | Included in data recovery scope | No timed restore and integrity proof from offsite | P1 |
| Receipts | Included in data recovery scope | No offsite restore proof/customer-token recovery proof | P1 |
| Uploads/outputs | Included in data recovery scope | Large artifact offsite strategy and retention are not proven | P1 |
| Node C/BTCPay | Not fully proven | Need host/wallet/config backup and restore proof | P1 |

## Monitoring Gaps

| Monitoring Area | Current Evidence | Gap | Priority |
|---|---|---|---|
| Synthetic monitor | Repaired and passing in founder absence fix | Delivery to second human not proven | P1 |
| Ops dashboard | Exists and has tokenized private data path | Token custody/rotation and second-operator login not proven | P1 |
| Alerting | Active alert triage has been performed | “Monitor the monitor” and external alert proof incomplete | P1 |
| Disk/inode alerts | Alert categories exist | Cleanup/runbook and second-operator escalation incomplete | P1 |
| Funnel/access logs | Funnel report exists | Log retention/offsite strategy unclear | P2 |

## Recommended Second-Operator Handoff Packet

Do not include raw secrets. Include sealed references, locations, and proof checkboxes.

1. Infrastructure map:
   - Node A: production control plane.
   - Node B: standby/restore/synthetic monitoring.
   - Node C: BTCPay/payments.
   - Storage Box: encrypted backups.
   - IONOS: external monitoring.
2. Access checklist:
   - host access
   - registrar/DNS
   - Stripe
   - BTCPay
   - email/OAuth
   - Storage Box
   - repo/deploy
   - ops dashboard
3. Sealed secret/key custody:
   - production SSH
   - backup decryption key
   - protected env restore package
   - payment dashboard recovery
4. Emergency runbooks:
   - deploy/rollback
   - payment incident
   - wallet mismatch
   - receipt/download issue
   - worker offline/stuck job
   - disk full
   - Node A loss / Node B cutover
5. Proof exercises:
   - second operator logs into every required external account
   - restores encrypted backup on Node B
   - receives a real alert
   - runs regression audit
   - performs non-mutating ops dashboard check

## P0

None currently proven for bounded retail alpha.

## P1

1. Prove second-operator registrar/DNS access.
2. Prove second-operator Stripe access.
3. Prove second-operator BTCPay/Node C access.
4. Prove second-operator Storage Box access.
5. Implement and prove encrypted offsite backup restore.
6. Prove second operator has backup decryption key custody.
7. Prove Node B restore/cutover from offsite backup.
8. Prove alert delivery to a second human.
9. Create redacted production config templates for Caddy/systemd/env files.
10. Consolidate payment, restore, receipt/download, and worker runbooks.

## P2

1. Consolidate deploy/rollback notes into one canonical Book runbook.
2. Add a second-operator drill calendar.
3. Add account/support self-service runbooks.
4. Add log retention/offsite log policy.
5. Add add-on/artifact ownership and version manifest.
6. Add Benchmark promotion/signing/update handoff if Benchmark becomes active again.

## Acceptance Criteria For “Second Operator Ready”

Farpy should not be marked second-operator ready until all of these are true:

- A second operator can log into Node A, Node B, Node C, and Storage Box.
- A second operator can access registrar/DNS and verify auto-renew/billing.
- A second operator can access Stripe and BTCPay dashboards.
- A second operator receives production alerts.
- A second operator can decrypt and restore an offsite backup on Node B.
- A second operator can run the production regression suite.
- A second operator can restart/rollback services from runbooks without founder help.
- A second operator can verify wallet/receipt/download integrity without seeing customer secrets in docs.

## Related Documents

- `docs/FARPY_BOOK/CONSOLIDATION_REPORT.md`
- `docs/FARPY_BOOK/RUNBOOK_STATUS.md`
- `docs/FARPY_BOOK/RTO_RPO.md`
- `docs/FARPY_BOOK/SINGLE_POINT_OF_FAILURE_AUDIT_V2.md`
- `docs/FARPY_BOOK/TECH_DEBT_REGISTER.md`
- `release/FOUNDER_ABSENCE_AUDIT_V1.md`
- `release/FOUNDER_ABSENCE_FIX_V1.md`
- `release/WEB_RENDER_BACKUP_ENCRYPTION_PLAN_V1.md`
- `release/OFFSITE_BACKUP_OPERATOR_APPROVAL_V1.md`
- `release/FARPY_INFRA_ROLE_FREEZE_V1.md`

## Commands Run

```powershell
Get-Content -LiteralPath 'C:\Users\danki\Desktop\farpy-frontend\docs\FARPY_BOOK\CONSOLIDATION_REPORT.md' -Raw
Get-Content -LiteralPath 'C:\Users\danki\Desktop\farpy-frontend\docs\FARPY_BOOK\RUNBOOK_STATUS.md' -Raw
Get-Content -LiteralPath 'C:\Users\danki\Desktop\farpy-frontend\release\FOUNDER_ABSENCE_FIX_V1.md' -Raw
Get-Content -LiteralPath 'C:\Users\danki\Desktop\farpy-frontend\release\SINGLE_POINT_OF_FAILURE_AUDIT_V2.md' -Raw
```

No production changes were made.
No secrets were printed.
