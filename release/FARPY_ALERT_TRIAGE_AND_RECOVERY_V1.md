# FARPY_ALERT_TRIAGE_AND_RECOVERY_V1

Status: GREEN
Timestamp: 2026-06-27T17:59:37Z

## Initial ops state

- `health_status`: `RED`
- active alerts: `6`
- critical alerts: `6`

## Alerts found

| Alert ID | Severity | Category | Job | Created | Message |
| --- | --- | --- | --- | --- | --- |
| `job_running_timeout:job-039ac641` | critical | render | `JOB-039AC641` | 2026-06-26T09:58:29.639Z | Job running beyond configured timeout. |
| `wallet_debit_without_completion:job-039ac641` | critical | wallet | `JOB-039AC641` | 2026-06-26T09:58:28.530Z | Wallet debit exists without completion after timeout. |
| `zip_validation_failure:job-d01fde45` | critical | render | `JOB-D01FDE45` | 2026-06-26T03:29:30.381Z | ZIP validation failure. |
| `zip_validation_failure:job-ddddb02a` | critical | render | `JOB-DDDDB02A` | 2026-06-23T07:41:01Z | ZIP validation failure. |
| `worker_heartbeat_stale:worker` | critical | worker | n/a | 2026-06-23T07:12:13.209Z | Worker heartbeat stale. |
| `zip_validation_failure:job-59daa9c8` | critical | render | `JOB-59DAA9C8` | 2026-06-23T06:38:29.644Z | ZIP validation failure. |

## Evidence inspected

For each affected job:

- job JSON
- upload path
- output ZIP path
- receipt path
- authoritative wallet ledger

Worker evidence:

- `/var/lib/farpy-web-render/worker-status.json`
- `systemctl list-units --type=service --all`
- render worker process list

Recovery evidence was preserved under:

- `/var/lib/farpy-web-render/recovery/FARPY_ALERT_TRIAGE_AND_RECOVERY_V1`

## Root causes

### `JOB-039AC641`

- Customer impact: paid wallet render was stuck in `running`.
- Wallet impact: one 1-cent debit existed.
- Receipt impact: no receipt existed.
- Artifact impact: no output ZIP existed.
- Root cause: public NodeMuncher smoke job remained `running` after worker path did not complete.
- Recovery: marked failed, retryable, no output/receipt, appended one idempotent wallet refund.

### `JOB-D01FDE45`

- Customer impact: safety gate validation job failed closed.
- Wallet impact: one 1-cent debit existed.
- Receipt impact: no receipt existed.
- Artifact impact: no output ZIP existed.
- Root cause: intentional safety gate validation job; no render attempted.
- Recovery: verified failed closed, retryable, appended one idempotent wallet refund.

### `JOB-DDDDB02A`

- Customer impact: failed Blender render.
- Wallet impact: one 48-cent debit existed.
- Receipt impact: no receipt existed.
- Artifact impact: no output ZIP existed.
- Root cause: historical ZIP/frame validation failure after partial/incomplete render path.
- Recovery: verified failed closed, retryable, appended one idempotent wallet refund.

### `JOB-59DAA9C8`

- Customer impact: failed Blender render after partial frames.
- Wallet impact: one 40-cent debit existed.
- Receipt impact: no receipt existed.
- Artifact impact: no output ZIP existed.
- Root cause: render process exited before all frames completed.
- Recovery: verified failed closed, retryable, appended one idempotent wallet refund.

### Worker heartbeat stale

- Customer impact: no live customer render was left waiting after `JOB-039AC641` recovery.
- Wallet impact: none.
- Receipt impact: none.
- Artifact impact: none.
- Root cause: stale control-plane worker status file from a time when local worker heartbeat was present; production has an explicit no-local-worker guard.
- Recovery: tightened alert relevance so stale worker status alerts are emitted only when live job state has active work requiring workers.

## Actions taken

- Backed up job JSON files and wallet ledger before mutation.
- Appended wallet refunds after verifying the original ledger debit for each job.
- Marked stale running job `JOB-039AC641` failed and retryable.
- Marked historical failed jobs retryable/recovered.
- Confirmed no output ZIPs or receipts exist for the recovered failed jobs.
- Deployed a minimal alert relevance fix to `job-api.mjs`.
- Acknowledged only the three recovered historical ZIP validation alerts after their wallet/artifact conditions were verified closed.

## Wallet recovery

| Job | Debit count | Refund count | Refund cents | Refund event |
| --- | ---: | ---: | ---: | --- |
| `JOB-039AC641` | 1 | 1 | 1 | `wallet-refund-JOB-039AC641` |
| `JOB-D01FDE45` | 1 | 1 | 1 | `wallet-refund-JOB-D01FDE45` |
| `JOB-DDDDB02A` | 1 | 1 | 48 | `wallet-refund-JOB-DDDDB02A` |
| `JOB-59DAA9C8` | 1 | 1 | 40 | `wallet-refund-JOB-59DAA9C8` |

Final verified wallet balance for `mangomunchr@gmail.com`: `3429` cents.

## Deployment

Deployed:

- `scripts/job-api.mjs`

Production backup:

- `/opt/farpy-web-render/scripts/job-api.mjs.bak.alert_triage.20260627T175937Z`

Validation:

```powershell
node --check scripts\job-api.mjs
```

Production:

```powershell
node --check /opt/farpy-web-render/scripts/job-api.mjs
systemctl restart farpy-web-render-api.service
systemctl is-active farpy-web-render-api.service
```

Result: service active.

## Final ops state

- `health_status`: `GREEN`
- `alert_counts`: `{"active":0,"critical":0,"info":0,"resolved":3,"warn":0}`

Resolved alerts still visible as acknowledged evidence:

- `zip_validation_failure:job-d01fde45`
- `zip_validation_failure:job-ddddb02a`
- `zip_validation_failure:job-59daa9c8`

## Customer-impacting issues discovered

Wallet debits existed for four failed/stale jobs without completed outputs or receipts. All four were refunded exactly once in the authoritative wallet ledger.

## Final state

`FARPY_ALERT_TRIAGE_AND_RECOVERY_V1 = GREEN`
