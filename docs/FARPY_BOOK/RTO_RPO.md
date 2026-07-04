# Recovery Time / Recovery Point Audit

Status: ACTIVE

Purpose: estimate Farpy recovery objectives from existing proof without inventing targets.

Definitions:

- RTO: how long it should take to restore service after failure.
- RPO: how much data loss is acceptable after failure.
- UNKNOWN: no measured objective or proof was found.
- Evidence may show a runbook exists without proving a timed RTO/RPO.

## Summary

Overall status: YELLOW

Farpy has useful same-host recovery notes, service restart procedures, deployment rollback patterns, alerting, and some restore proof. Full host-loss recovery, encrypted offsite restore, exact backup cadence, and measured recovery timings remain unproven. Therefore most RTO/RPO values are intentionally marked `UNKNOWN`.

## Subsystem Matrix

| Subsystem | Estimated RTO | Estimated RPO | Evidence | Unknowns |
|---|---:|---:|---|---|
| Public website / static frontend | UNKNOWN | UNKNOWN | Static deploy and rollback notes exist. Production static root backups have been used in deploy flows. | No timed restore proof. Exact latest-good artifact selection is operator-dependent. |
| Caddy / routing / TLS | UNKNOWN | Last backed-up config; exact RPO UNKNOWN | Caddy validate/reload/rollback procedures are documented in recovery and deploy notes. | Domain/DNS registrar recovery and certificate emergency recovery are not fully proven. |
| Web-render API / job API | UNKNOWN | UNKNOWN | Service restart and health-check runbooks exist. `systemd` hardening and health probes were previously verified. | No timed rebuild/redeploy from backup proof. Runtime env reconstruction still depends on protected env files and operator access. |
| Auth / sessions / Google OAuth | UNKNOWN | UNKNOWN | Google OAuth restore/fix notes exist. Session/auth routes have been audited. | Email/magic-link provider recovery and OAuth provider account recovery are not fully proven. |
| Account data | UNKNOWN | UNKNOWN | Data-flow docs identify account/session storage as critical state. Recovery notes reference `/var/lib/farpy` and `/var/lib/farpy-web-render`. | Exact backup cadence, retention, and restore timing are not proven. |
| Wallet ledger | UNKNOWN | UNKNOWN | Wallet inspection, failed wallet-funded refund/reversal, and ledger triage runbooks exist. | No measured restore proof for wallet ledger from offsite backup. Card-funded refund workflow remains less proven than wallet-funded reversal. |
| Stripe / card payments | UNKNOWN | Provider event replay plus local ledger backup; exact RPO UNKNOWN | Stripe webhook/reconcile notes exist, including dashboard replay/reconciliation workflows. Card is the live public payment rail. | Stripe account/API key recovery, webhook outage RPO, and fresh paid browser proof depend on operator access. |
| Bitcoin / BTCPay on-chain | UNKNOWN | UNKNOWN | BTCPay webhook hardening, invoice creation, and public checkout URL fixes exist. Lightning is gated. | BTCPay host/admin recovery is not fully proven. On-chain end-to-end public payment proof remains operator-dependent. |
| Lightning | UNKNOWN | UNKNOWN | Lightning UI is gated/hidden; route hint/channel audits identify liquidity/connectivity as blocker. | No public enablement RTO/RPO because rail is intentionally disabled. |
| Upload storage | UNKNOWN | UNKNOWN | Upload paths are identified in data-flow/recovery notes. Same-host recovery is partially documented. | Offsite encrypted backup and full restore timing are not proven. Retention/deletion policy is not fully documented. |
| Job metadata / dispatcher state | UNKNOWN | UNKNOWN | Job lifecycle, alerting, stuck-job triage, and state-machine audits exist. | No measured restore proof for active job state. In-flight jobs may require manual fail/retry decisions after restore. |
| Render workers / Render Partners | UNKNOWN | N/A for stateless worker capacity; job state RPO UNKNOWN | Worker heartbeat, stale worker alerts, NodeMuncher E2E, and PR-003 Octane proofs exist. | Worker host access, reinstall time, and capacity recovery are not timed. Octane host recovery remains more operator-dependent. |
| NodeMuncher desktop | UNKNOWN | Local node identity backup UNKNOWN | Pairing, heartbeat, lease, render, failure-report, startup-recovery, and installer audits exist across release notes. | Broad public launch remains controlled alpha. Token/device recovery and signed update path are not fully proven. |
| Octane render lane | UNKNOWN | Job/output state RPO UNKNOWN | Octane remote still and multi-frame private smoke proofs exist. Public Octane path was validated in alpha flows. | Licensed GPU node recovery, Octane license restoration, and host migration timing are not proven. |
| Output ZIP downloads | UNKNOWN | UNKNOWN | Download/receipt/token audits and ZIP validation checks exist. Completed packages include SHA-256 proof. | Offsite restore of large outputs is not proven. Retention and deletion points remain partially unknown. |
| Receipts | UNKNOWN | UNKNOWN | Receipt-backed trust, SHA-256 verification, receipt pages, and receipt/download audits exist. | Receipt DB/file restore timing and independent offsite restore proof are not measured. |
| Benchmark public product | UNKNOWN | Public artifact backup state UNKNOWN | Public download deployment, runtime fix, hard timeout, and launch audit notes exist. | Installer signing/update path and long-term artifact recovery are not fully proven. |
| Blender add-on | UNKNOWN | ZIP artifact/version backup UNKNOWN | Add-on ZIP, SHA, website handoff, install smoke, and audits exist. | Public artifact recovery from offsite backup and version rollback timing are not measured. |
| Ops dashboard / monitoring | UNKNOWN | UNKNOWN | Ops dashboard, alerting, funnel reports, and triage/recovery docs exist. | Alert delivery to an additional operator and external monitor failover remain not fully proven. |
| Backups / restore | UNKNOWN for full host loss | UNKNOWN | Same-host restore proof and recovery USB docs exist. Offsite encryption plan exists. | Encrypted offsite backup implementation and full restore from offsite backup are not proven. |
| Support operations | UNKNOWN | N/A | Support-zero-email audit and external user smoke pack exist. | Response target, escalation ownership, and self-service coverage are not formalized as RTO/SLO. |

## Known Detection Thresholds

These are detection or alert thresholds, not proven RTO/RPO values.

| Condition | Known Threshold | Evidence | Notes |
|---|---:|---|---|
| Job stuck in submitted | More than 5 minutes | Production alerting requirements/release notes | Detection only; recovery time remains UNKNOWN. |
| Worker heartbeat stale | About 60 seconds where configured | Ops alerting notes | Detection only; replacement/recovery time remains UNKNOWN. |
| Running job timeout | Configurable / job-dependent | Worker/render watchdog and alerting notes | Timeout prevents indefinite hangs but does not prove service RTO. |
| Disk usage alert | Greater than 90% | Ops alerting notes | Detection only; cleanup/recovery runbook timing remains UNKNOWN. |
| Inode alert | Low free inode count | Ops alerting notes | Detection only; recovery timing remains UNKNOWN. |

## Highest Risk Unknowns

1. Full Node A loss recovery time is UNKNOWN.
2. Encrypted offsite backup restore RTO/RPO is UNKNOWN.
3. Wallet ledger RPO is UNKNOWN without proven backup cadence and restore.
4. Receipt/output restore RPO is UNKNOWN for completed customer packages.
5. Domain/DNS/TLS account recovery timing is UNKNOWN.
6. Stripe/BTCPay administrative access recovery timing is UNKNOWN.
7. Worker capacity recovery time is UNKNOWN, especially for licensed Octane capacity.

## Proof Needed To Replace UNKNOWN

1. Time a static frontend rollback from backup to healthy `https://farpy.com/`.
2. Time a Caddy config restore/validate/reload from backup.
3. Time a web-render API restore using backed-up scripts, env files, and systemd units.
4. Time a same-host restore of wallet, jobs, receipts, uploads metadata, and outputs metadata.
5. Create and verify encrypted offsite backups, then time a restore on Node B.
6. Define backup cadence and retention for `/var/lib/farpy`, `/var/lib/farpy-web-render`, configs, env files, receipts, uploads, and outputs.
7. Run a controlled full-host-loss simulation on Node B using only documented backups.
8. Document provider recovery for registrar/DNS, Stripe, BTCPay, email/OAuth, and monitoring.

## Related Evidence

- `release/DISASTER_RECOVERY_AUDIT_V1.md`
- `release/FOUNDER_ABSENCE_FIX_V1.md`
- `release/OFFSITE_BACKUP_OPERATOR_APPROVAL_V1.md`
- `release/WEB_RENDER_BACKUP_ENCRYPTION_PLAN_V1.md`
- `release/FARPY_RECOVERY_USB_V1.md`
- `release/SINGLE_POINT_OF_FAILURE_AUDIT_V2.md`
- `docs/FARPY_BOOK/RUNBOOK_STATUS.md`
- `docs/FARPY_BOOK/DATA_FLOW.md`
- `docs/FARPY_BOOK/OPERATOR_CHECKLIST.md`
- `docs/FARPY_BOOK/INCIDENT_RUNBOOK.md`

## Verdict

Current RTO/RPO posture: YELLOW

Farpy has recovery procedures and useful proof for local operations, but launch-grade recovery objectives are not yet measurable. The next recovery milestone should be a timed Node B restore from encrypted offsite backup, followed by a documented cutover exercise.
