# FOUNDER_ABSENCE_RECHECK_V1

Status: YELLOW

Date: 2026-07-01

Mode: read-only recheck plus this report file. No production mutation.

## Objective

Re-run the founder absence audit using the latest platform state.

Focus areas:

- Backups
- Recovery
- Monitoring
- Second operator
- Infrastructure
- Payments
- Documentation

## Executive Verdict

Overall founder-absence verdict: YELLOW.

This improves from the original `FOUNDER_ABSENCE_AUDIT_V1` verdict of RED.

Why improved:

- Current same-host production data backup exists.
- Same-host restore proof exists.
- Synthetic monitoring was repaired.
- Failed stale monitoring units were retired.
- Core public platform smoke and regression checks have no hard failures.
- Infrastructure host roles are frozen and documented.
- Operator, incident, deployment, Caddy, systemd, static artifact, and `/etc/farpy` documentation now exists.

Why not GREEN:

- Encrypted offsite backup implementation is still plan-only.
- Current production data has not been proven restored from Storage Box.
- Full Node A loss recovery remains unproven.
- Second-operator access to registrar/DNS, Stripe, BTCPay/Node C, Storage Box, hosting, OAuth/email, and backup keys is not proven.
- Alert delivery to a second human is not proven.

Bounded interpretation:

- 30 days with no host-loss incident: likely survivable.
- 30 days with a worker/payment/static incident: improved, but still operator-access dependent.
- Node A full loss: not founder-independent yet.

## Current Platform Smoke Evidence

### Nightly Platform Smoke

Command:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File C:\Users\danki\Desktop\farpy-frontend\scripts\nightly-platform-smoke-v1.ps1 -OutputPath C:\tmp\founder-absence-recheck-nightly-smoke.json
```

Result:

- PASS: 24
- WARN: 2
- FAIL: 0
- Verdict: WARN
- Evidence: `C:\tmp\founder-absence-recheck-nightly-smoke.json`

Warnings:

- Tokenized receipt URL skipped because env var was not provided.
- Tokenized download URL skipped because env var was not provided.

### Platform Regression Suite

Command:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File C:\Users\danki\Desktop\farpy-frontend\scripts\regression\run-regression-suite-v1.ps1 -OutputPath C:\tmp\founder-absence-recheck-regression.json
```

Result:

- PASS: 40
- WARN: 7
- FAIL: 0
- Verdict: WARN
- Evidence: `C:\tmp\founder-absence-recheck-regression.json`

Warnings:

- Some client-rendered copy was not found in static HTML shells.
- Tokenized completed job, receipt, and download proof URLs were not supplied.

No hard platform failure was found by the read-only checks.

## Comparison Against Previous Audit

| Area | Previous State | Current State | Status |
|---|---|---|---|
| Backups | RED: current backup coverage not proven | Same-host current-data backup exists and checksum proof exists; offsite encrypted backup still not implemented | YELLOW |
| Recovery | RED: restore proof not proven | Same-host restore proof exists; offsite/full-host-loss restore remains unproven | YELLOW |
| Monitoring | RED: failed monitor units | Synthetic monitor repaired; failed stale guards retired; public smoke/regression run clean of FAIL | YELLOW |
| Second operator | RED/P1: access not proven | Gaps are documented in `SECOND_OPERATOR_GAPS.md`; access proof still missing | YELLOW |
| Infrastructure | Mixed/unclear | Node A/B/C/Storage Box/IONOS role map frozen | GREEN for documentation |
| Payments | Partial: routes fail closed, recovery access unknown | Card/topup routes pass public smoke; provider/admin recovery still not proven | YELLOW |
| Documentation | Fragmented | Farpy Book now contains operator, incident, deployment, restore, drift, and config docs | YELLOW/GREEN |

## Area Recheck

### Backups

Current evidence:

- `FOUNDER_ABSENCE_FIX_V1.md` records current backup snapshot:
  - `/var/backups/farpy/current-data-20260630T102558Z`
  - `/var/lib/farpy-web-render`
  - `/var/lib/farpy`
- Same-host checksums passed.
- Same-host restore proof restored 3821 files.
- Storage Box connectivity was proven read-only.

Remaining gap:

- `WEB_RENDER_BACKUP_ENCRYPTION_PLAN_V1.md` is plan-only.
- `OFFSITE_BACKUP_OPERATOR_APPROVAL_V1.md` says offsite push was not run.
- Current `.tar.gz` artifacts are not independently application-encrypted.
- No offsite restore proof exists.

Status: YELLOW.

### Recovery

Current evidence:

- Same-host restore proof exists.
- Operator checklist and recovery checklist exist.
- Incident runbooks exist for common scenarios.
- Static preservation and drift guard documentation exist.

Remaining gap:

- Node B restore from encrypted Storage Box backup is not proven.
- Full host-loss RTO/RPO remains unproven.
- Backup decryption key custody is not implemented/proven.

Status: YELLOW.

### Monitoring

Current evidence:

- Synthetic monitor was repaired in `FOUNDER_ABSENCE_FIX_V1.md`.
- Obsolete failed guard timers were disabled/retired.
- Read-only smoke result: 24 PASS, 2 WARN, 0 FAIL.
- Read-only regression result: 40 PASS, 7 WARN, 0 FAIL.

Remaining gap:

- Alert delivery to a second operator is not proven.
- Optional tokenized receipt/download checks are skipped without env vars.
- External IONOS monitoring status is documented as intended but not proven in this recheck.

Status: YELLOW.

### Second Operator

Current evidence:

- `docs/FARPY_BOOK/SECOND_OPERATOR_GAPS.md` identifies exact access classes.
- `docs/FARPY_BOOK/OPERATOR_CHECKLIST.md` gives morning, weekly, monthly, deploy, incident, and recovery checklists.
- `docs/FARPY_BOOK/INCIDENT_RUNBOOK.md` exists.
- `docs/FARPY_BOOK/DEPLOYMENT_TIMELINE.md` exists.

Remaining gap:

- No proof that a second operator can access Node A/B/C, registrar/DNS, Stripe, BTCPay, Storage Box, OAuth/email, ops token, or backup private key.
- No proof that a second operator receives alerts.

Status: YELLOW.

### Infrastructure

Current evidence:

- `FARPY_INFRA_ROLE_FREEZE_V1.md` freezes roles:
  - Node A: production control plane.
  - Node B: standby, restore tests, synthetic monitoring.
  - Node C: payments / BTCPay.
  - Storage Box: encrypted backups.
  - IONOS: external synthetic monitor.

Remaining gap:

- Role map is documentation only.
- Node B cutover remains unproven.
- Storage Box encrypted backup restore remains unproven.

Status: GREEN for role documentation, YELLOW for operational proof.

### Payments

Current evidence:

- Topup page loads in smoke.
- `/checkout` malformed JSON gate returned 400 in smoke.
- Prior docs record Stripe/card fail-closed behavior.
- BTCPay webhook fail-closed behavior is documented in earlier Lightning/payment notes.
- Lightning remains gated/hidden by policy.

Remaining gap:

- Second-operator Stripe dashboard/refund/webhook replay access is not proven.
- Second-operator BTCPay/Node C access is not proven.
- Authenticated paid fresh-account proof remains operator-input dependent in prior launch docs.

Status: YELLOW.

### Documentation

Current evidence:

- Farpy Book exists with architecture, operations, deployment, API, state machines, backups, disaster recovery, infrastructure, runbooks, and scorecards.
- Drift-control docs exist:
  - Caddy templates
  - systemd templates
  - `/etc/farpy` manifest
  - static artifact manifest
  - static preservation guard
  - production drift guard
- Operator checklist exists.

Remaining gap:

- Documentation is broad but still requires second-operator drill proof.
- Some runbooks are still evidence maps rather than executed operator exercises.

Status: YELLOW/GREEN.

## Current Blocking Items For GREEN

1. Implement encrypted offsite backup with artifact-level encryption.
2. Push only encrypted current-data backup artifacts to Storage Box.
3. Restore from Storage Box to Node B or a non-production target.
4. Verify restored wallet, job, receipt, upload, and output data.
5. Prove second-operator access to:
   - Node A
   - Node B
   - Node C
   - Storage Box
   - registrar/DNS
   - Stripe
   - BTCPay
   - OAuth/email provider
   - monitoring/alerting
6. Prove alert delivery reaches a second human.
7. Run a second-operator recovery drill without founder-only steps.

## Current Non-Blocking Improvements Since RED

- Same-host backup proof exists.
- Same-host restore proof exists.
- Storage Box destination is identified and reachable.
- Offsite backup risk/approval language exists.
- Final encryption approach is selected: `age`.
- Monitoring failed-unit state was repaired/retired in the fix milestone.
- Infrastructure host boundaries are frozen.
- Normal operator checklist exists.
- Nightly and platform regression scripts now exist and run read-only.

## Verdict

YELLOW.

Farpy is no longer in the original founder-absence RED state for routine operation visibility and same-host recovery, but it is not founder-independent.

The decisive remaining risk is full-host-loss recovery: no encrypted offsite restore proof exists yet, and no second-operator access drill has been completed.

## Commands Run

```powershell
Get-ChildItem -LiteralPath C:\Users\danki\Desktop\farpy-frontend\release -Filter '*FOUNDER*'
Get-ChildItem -LiteralPath C:\Users\danki\Desktop\farpy-frontend\release -Filter '*BACKUP*'
Get-ChildItem -LiteralPath C:\Users\danki\Desktop\farpy-frontend\docs\FARPY_BOOK -File
Get-Content -LiteralPath C:\Users\danki\Desktop\farpy-frontend\release\FOUNDER_ABSENCE_AUDIT_V1.md -Raw
Get-Content -LiteralPath C:\Users\danki\Desktop\farpy-frontend\release\FOUNDER_ABSENCE_FIX_V1.md -Raw
Get-Content -LiteralPath C:\Users\danki\Desktop\farpy-frontend\docs\FARPY_BOOK\SECOND_OPERATOR_GAPS.md -Raw
Get-Content -LiteralPath C:\Users\danki\Desktop\farpy-frontend\release\WEB_RENDER_BACKUP_ENCRYPTION_PLAN_V1.md -Raw
Get-Content -LiteralPath C:\Users\danki\Desktop\farpy-frontend\release\OFFSITE_BACKUP_OPERATOR_APPROVAL_V1.md -Raw
Get-Content -LiteralPath C:\Users\danki\Desktop\farpy-frontend\release\FARPY_INFRA_ROLE_FREEZE_V1.md -Raw
Get-Content -LiteralPath C:\Users\danki\Desktop\farpy-frontend\docs\FARPY_BOOK\OPERATOR_CHECKLIST.md -Raw
powershell -NoProfile -ExecutionPolicy Bypass -File C:\Users\danki\Desktop\farpy-frontend\scripts\nightly-platform-smoke-v1.ps1 -OutputPath C:\tmp\founder-absence-recheck-nightly-smoke.json
powershell -NoProfile -ExecutionPolicy Bypass -File C:\Users\danki\Desktop\farpy-frontend\scripts\regression\run-regression-suite-v1.ps1 -OutputPath C:\tmp\founder-absence-recheck-regression.json
```

## Production Mutation

None.

The live checks used existing read-only smoke/regression scripts. The only new file is this release note.
