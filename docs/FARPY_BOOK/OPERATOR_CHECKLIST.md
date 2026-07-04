# OPERATOR_CHECKLIST

Status: ACTIVE

Date: 2026-06-30

Mode: Documentation only. No code or production changes.

## Purpose

One normal-operations checklist for Farpy operators.

Rule: each checklist stays under 10 items.

## Morning

1. Open `/ops` and confirm `health_status` is `GREEN` or explain every active alert.
2. Check website, account, top-up, workspace, receipt, status, and downloads shells with the regression dashboard or browser.
3. Confirm jobs API, render API, worker status, benchmark API, and leaderboard API are reachable.
4. Review active jobs: queued, rendering, failed today, completed today.
5. Review wallet events: debits, credits, refunds, receipts minted.
6. Check storage: upload/output usage, free disk, inode usage, recent ZIP count.
7. Review last 20 failures and confirm every customer-impacting failure has refund/receipt/download state understood.
8. Confirm Lightning remains gated unless explicit payment proof is GREEN.
9. Check external monitor status if available.

## Weekly

1. Run `scripts/production-regression-audit-v1.ps1`.
2. Run `scripts/production-operations-dashboard-v1.ps1`.
3. Run `scripts/launch-freeze-v1.ps1`.
4. Review `release/FARPY_ALERT_TRIAGE_AND_RECOVERY_V1.md` pattern for any new unresolved alerts.
5. Verify public downloads and SHA sidecars for Add-on, Benchmark, and NodeMuncher controlled-alpha artifacts.
6. Spot-check one tokenized completed package: workspace, download ZIP, delivery receipt, SHA match if evidence URL is available.
7. Check Caddy and core services for failed units.
8. Review disk growth and decide whether storage cleanup/archive is needed.
9. Update this Book if a runbook became stale.

## Monthly

1. Prove a current backup exists and has a matching checksum.
2. Perform a non-destructive restore proof to a safe target.
3. Confirm domain, DNS, TLS, email, Stripe, BTCPay, hosting, Storage Box, and monitoring access for at least one backup operator.
4. Review Stripe and BTCPay webhook delivery health.
5. Review wallet ledger integrity and recent refund/reversal events.
6. Review receipt/output mismatch alerts and ZIP validation failures.
7. Refresh security posture: headers, CORS, rate-limit proof, secret/env permissions.
8. Confirm NodeMuncher remains controlled alpha unless broad-launch blockers are closed.
9. Archive old release artifacts only after hashes and current public links are verified.

## Pre-Deploy

1. Identify exact scope: frontend, backend, worker, Caddy, artifacts, or docs.
2. Read the latest related release note and confirm no frozen contract is being changed.
3. Run local syntax/build checks required for the touched area.
4. Back up every affected production path before replacing files.
5. For Caddy changes, run `caddy validate` before reload/restart.
6. For backend changes, run `node --check` before restart.
7. Confirm secrets are not printed in commands, logs, release notes, or terminal output.
8. Prepare rollback command before deploying.
9. Announce whether this deploy affects money, render, receipt, download, auth, or worker behavior.

## Post-Deploy

1. Confirm affected service is active or static route returns `200`.
2. Run targeted smoke for the changed surface.
3. Run public route/API checks for homepage, top-up, workspace, receipt, account, status, downloads.
4. Verify auth gates still fail closed where applicable.
5. Verify no private download, receipt, wallet, token, or owner data is exposed unauthenticated.
6. Check `/ops` health and active alerts after deploy.
7. Save release note with files changed, commands run, backup paths, smoke result, and rollback path.
8. If anything fails, rollback first unless preserving evidence is more important.
9. Do not mark GREEN without proof.

## Incident

1. Preserve evidence before mutation: job JSON, wallet ledger, receipt, output ZIP, worker logs, service logs.
2. Classify impact: money, render, download, receipt, auth, support, or infrastructure.
3. Check `/ops` alert details and affected job/user/receipt IDs.
4. If money is involved, verify ledger before refunding or reversing.
5. If output/receipt is missing or mismatched, do not expose fake completion.
6. Fail stale jobs safely and mark retryable only when the state supports it.
7. Acknowledge alerts only after the underlying condition is resolved.
8. Record the incident and recovery in `release/`.
9. If unsure, stop customer-visible damage first, then investigate.

## Recovery

1. Decide recovery class: same-host rollback, service restart, static rollback, Caddy rollback, data restore, or host-loss recovery.
2. Prefer the smallest recovery that restores service while preserving evidence.
3. Use known-good backups and verify checksums before replacing live files.
4. Restore configs and data to a temporary target first when possible.
5. Validate Caddy, systemd units, env files, wallet ledger, job store, receipt store, upload/output paths.
6. Restart only required services.
7. Verify health endpoints, `/ops`, workspace, download, receipt, account, top-up, and status.
8. Record restored source, target, checksum, commands, and residual risk.
9. If full host-loss or offsite restore is needed, treat current state as not fully proven and escalate to the disaster recovery runbook.

## Reference Documents

- `docs/FARPY_BOOK/RUNBOOK_STATUS.md`
- `docs/FARPY_BOOK/V1_LAUNCH_SCORECARD.md`
- `docs/FARPY_BOOK/TECH_DEBT_REGISTER.md`
- `release/PRODUCTION_REGRESSION_AUDIT_V1.md`
- `release/FARPY_PRODUCTION_ALERTING_V1.md`
- `release/FARPY_ALERT_TRIAGE_AND_RECOVERY_V1.md`
- `release/SINGLE_POINT_OF_FAILURE_AUDIT_V2.md`
- `release/WEB_RENDER_BACKUP_ENCRYPTION_PLAN_V1.md`
