# INCIDENT_RUNBOOK

Status: ACTIVE

Date: 2026-06-30

Mode: Documentation only. No code or production changes.

## Purpose

Fast incident response runbook for common Farpy production failures.

Rules:

- Preserve evidence before mutation.
- Do not fake completion.
- Do not manually change wallet state without ledger proof.
- Do not acknowledge alerts until the underlying condition is resolved.
- Back up affected files before changing production state.
- Prefer smallest safe recovery.

## Upload Failure

### Symptoms

- Customer cannot send package.
- `/workspace` never receives an upload/job ID.
- Upload API returns `4xx` or `5xx`.
- Ops may show failed uploads or no new package record.

### Diagnosis

1. Check public page: `https://farpy.com/`.
2. Check API health: `https://farpy.com/node/v1/web-render/health`.
3. Inspect upload route logs for request size, extension, auth/session, and storage errors.
4. Verify upload storage has free disk and inodes.
5. Confirm `.blend` / `.orbx` file type is allowed and not too large.
6. Preserve any related upload ID, job ID, request timestamp, and service log excerpt.

### Recovery

1. If disk/inodes are full, follow `Disk Full` runbook first.
2. If API is down, follow `Server Down` or restart only `farpy-web-render-api.service` after evidence capture.
3. If a partial upload/job exists, mark it failed only if it cannot safely continue.
4. Do not debit wallet or submit render for incomplete upload.
5. Ask customer to resend package only after upload route is healthy.

### Verification

1. Upload a small known-good `.blend` or use existing safe smoke.
2. Confirm upload returns upload/job metadata.
3. Confirm workspace opens.
4. Confirm no wallet debit occurred for failed upload.
5. Confirm `/ops` has no active failed-upload alert.

## Worker Offline

### Symptoms

- Packages remain submitted/queued.
- `/ops` shows worker offline or stale heartbeat.
- Worker status endpoint has no fresh heartbeat.
- Jobs are not claimed.

### Diagnosis

1. Check `/ops` worker alert and active job count.
2. Check worker status endpoint.
3. On worker host, inspect systemd status and recent logs.
4. Verify worker token/env exists and service user is correct.
5. Verify Blender/Octane executable path and license/GPU state when relevant.
6. Confirm whether queued jobs are Blender, Octane, or NodeMuncher-smoke lane.

### Recovery

1. Preserve worker logs before restart.
2. Restart only the affected worker service.
3. If worker cannot render, leave jobs queued or fail them retryable according to package state.
4. Do not complete jobs without valid ZIP/output and receipt validation.
5. If a job is running beyond timeout, use stale-job triage and refund path if no output/receipt exists.

### Verification

1. Worker heartbeat becomes fresh.
2. A safe no-work claim returns healthy no-work state or a queued job is claimed.
3. New smoke package progresses past queued.
4. No wallet debit remains without completion or refund.
5. `/ops` health improves or remaining alerts are understood.

## Receipt Missing

### Symptoms

- Package appears complete but receipt URL fails.
- `/ops` shows receipt generation failure or completion without receipt.
- Download ZIP exists without matching receipt JSON.

### Diagnosis

1. Preserve job JSON, output ZIP, receipt path, and logs.
2. Verify job status and completed timestamp.
3. Verify output ZIP exists and hash can be computed.
4. Verify whether receipt JSON exists under receipt store.
5. Check complete endpoint logs around receipt minting.
6. Check wallet debit and rendered file count.

### Recovery

1. Do not invent a receipt from memory.
2. If receipt generation failed but all authoritative data is intact, use the documented receipt-generation path only if safe and idempotent.
3. If output/hash cannot be proven, mark job failed/retryable and refund wallet debit if no valid delivery exists.
4. If customer already downloaded output, preserve artifact and escalate before mutating state.

### Verification

1. Receipt endpoint returns `200` for owner/private token.
2. Receipt contains job ID, receipt ID, cost, renderer, frame count, and output SHA.
3. ZIP SHA matches receipt output SHA.
4. Account history shows delivery receipt.
5. `/ops` receipt alert is resolved before acknowledgement.

## Wallet Mismatch

### Symptoms

- Customer balance does not match expected top-up/debit/refund.
- Wallet debit exists without completed package.
- Duplicate credit/debit suspected.
- Account history disagrees with receipt/payment provider.

### Diagnosis

1. Preserve wallet ledger before edits.
2. Identify user/account, job ID, receipt ID, payment session/invoice ID, and event IDs.
3. Count matching ledger debits, credits, refunds.
4. Check receipt and output existence.
5. Check Stripe/BTCPay event status where relevant.
6. Determine whether mismatch is display-only or authoritative ledger mismatch.

### Recovery

1. Never delete ledger rows.
2. Use idempotent reversal/refund event if a captured wallet debit has no valid output/receipt.
3. Do not manually credit wallet unless payment provider and event evidence prove payment.
4. For Stripe/BTCPay duplicate webhooks, confirm idempotency keys before taking action.
5. Document every ledger correction with event ID and reason.

### Verification

1. Wallet balance recalculates correctly from ledger.
2. Account history shows expected debit/credit/refund.
3. Duplicate replay does not change balance again.
4. Receipt/download state matches money state.
5. Customer-facing page no longer misstates charge/delivery.

## Stripe Webhook

### Symptoms

- Card checkout succeeds but wallet is not credited.
- Stripe Dashboard shows paid session with no Farpy ledger entry.
- Webhook delivery failed or is pending.
- Top-up appears stuck.

### Diagnosis

1. Preserve Stripe session ID and customer/user mapping.
2. Check webhook endpoint health and recent service logs.
3. Verify Stripe signature validation errors, if any.
4. Confirm session amount and expected wallet credit amount.
5. Check wallet ledger for existing event/session entry.
6. Confirm this is a top-up session, not unrelated Stripe event.

### Recovery

1. Prefer Stripe Dashboard webhook replay when possible.
2. If replay is impossible, use the existing reconcile script only with verified Stripe session evidence.
3. Do not credit twice; ledger event/session ID must be idempotent.
4. If webhook secret/config is broken, fix config and restart API only after backup.

### Verification

1. Wallet ledger has exactly one credit for session.
2. Account balance increases by expected cents.
3. Account history shows top-up.
4. Replaying webhook does not double credit.
5. `/ops` has no payment-without-completion or wallet mismatch alert related to the session.

## Disk Full

### Symptoms

- Uploads fail.
- Renders fail to write frames or ZIP.
- Receipt generation fails due write error.
- `/ops` shows disk or inode alert.
- Service logs show `ENOSPC`, write failure, or no space left.

### Diagnosis

1. Check disk and inode usage.
2. Identify largest directories: uploads, outputs, work dirs, logs, backups, generated builds.
3. Determine whether active jobs are using work/output paths.
4. Preserve evidence for failed jobs before cleanup.
5. Do not delete receipts, wallet ledger, job metadata, or current output ZIPs blindly.

### Recovery

1. Stop only runaway process if it is actively filling disk.
2. Archive or remove safe temporary work dirs for completed/failed old jobs.
3. Rotate/compress logs if they are the cause.
4. Move old deploy backups only after confirming a newer rollback exists.
5. If storage remains tight, pause new uploads by failing closed rather than corrupting jobs.

### Verification

1. Disk and inode usage return below alert threshold.
2. Upload smoke succeeds.
3. Render can write frame and ZIP.
4. Receipt generation can write JSON.
5. `/ops` disk/inode alerts clear.

## Server Down

### Symptoms

- `farpy.com` unreachable.
- `api.farpy.com/healthz` fails.
- Multiple public pages return `5xx` or timeout.
- SSH may or may not work.

### Diagnosis

1. Check external monitor and local network first.
2. If SSH works, check `systemctl --failed`.
3. Check Caddy status and API service status.
4. Check disk/inodes and memory pressure.
5. Check recent deploys and Caddy/API logs.
6. Determine whether only website, API, Caddy, or full host is down.

### Recovery

1. If Caddy config is invalid, follow `Caddy Failure`.
2. If only web-render API is down, restart `farpy-web-render-api.service` after log capture.
3. If static output is broken, rollback `/opt/farpy.com/out` from latest known-good backup.
4. If host is unstable, preserve evidence and use provider console/reboot only if needed.
5. If Node A is unrecoverable, escalate to disaster recovery; full offsite restore is not yet fully proven.

### Verification

1. `https://farpy.com/` returns `200`.
2. `https://farpy.com/status` returns `200`.
3. Web-render health returns `200`.
4. Workspace, top-up, receipt shell, account, and downloads load.
5. `/ops` health is reviewed after recovery.

## Caddy Failure

### Symptoms

- Static pages or API proxy routes fail.
- `caddy validate` fails.
- Caddy service is inactive or restarting.
- Trailing slash/redirect/proxy behavior regresses.

### Diagnosis

1. Preserve current Caddy config before editing.
2. Run `caddy validate` against active config.
3. Inspect Caddy journal for exact parse/proxy/TLS errors.
4. Check recent route changes: `/node/*`, `/ops`, `/downloads`, `/real`, static export rewrites.
5. Confirm upstream API service is healthy before blaming Caddy.

### Recovery

1. Restore the latest known-good Caddy config backup if validation fails.
2. Re-run `caddy validate`.
3. Reload/restart Caddy only after validation passes.
4. Do not change backend behavior to compensate for routing unless Caddy is proven healthy.
5. If TLS/cert issue is suspected, preserve logs and verify DNS points correctly before forcing changes.

### Verification

1. `caddy validate` passes.
2. Caddy service is active.
3. Homepage, `/downloads`, `/downloads/`, `/status`, `/signin`, `/topup`, `/workspace`, `/receipt` return expected status.
4. `/node/v1/web-render/health` proxies correctly.
5. Security headers remain present.

## Evidence Template

Use this shape in `release/<INCIDENT_NAME>.md`:

```markdown
# INCIDENT_NAME

Date:
Status:

## Impact

## Affected IDs

- job_id:
- receipt_id:
- user/account:
- payment/session/invoice:

## Evidence Preserved

## Root Cause

## Recovery Actions

## Verification

## Remaining Risk
```

## References

- `docs/FARPY_BOOK/OPERATOR_CHECKLIST.md`
- `docs/FARPY_BOOK/RUNBOOK_STATUS.md`
- `docs/FARPY_BOOK/TECH_DEBT_REGISTER.md`
- `release/FARPY_ALERT_TRIAGE_AND_RECOVERY_V1.md`
- `release/FAILED_WALLET_REFUND_FIX_V1.md`
- `release/DISASTER_RECOVERY_AUDIT_V1.md`
- `release/FOUNDER_ABSENCE_FIX_V1.md`
- `release/WEB_RENDER_BACKUP_ENCRYPTION_PLAN_V1.md`
