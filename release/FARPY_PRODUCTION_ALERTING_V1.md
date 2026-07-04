# FARPY_PRODUCTION_ALERTING_V1

Status: GREEN
Timestamp: 2026-06-27T17:47:22Z

## Goal

Turn Farpy into a self-reporting production system that detects operational failures before users report them.

## Files changed

- `scripts/job-api.mjs`
- `src/components/OpsCommandCenter.tsx`
- `release/FARPY_PRODUCTION_ALERTING_V1.md`
- Production Caddy: `/etc/caddy/caddy.real.json`

## API additions

### `GET /node/v1/ops/summary`

Extended the existing token-protected ops summary with:

- `health_status`: `GREEN`, `YELLOW`, or `RED`
- `alerts[]`
  - `id`
  - `severity`
  - `category`
  - `message`
  - `created_at`
  - `resolved`
  - `source`
- `alert_counts`
  - `critical`
  - `warn`
  - `info`
  - `active`
  - `resolved`

### `POST /node/v1/ops/alerts/ack`

Added token-protected alert acknowledgement.

Request:

```json
{ "ids": ["alert-id"] }
```

Behavior:

- Requires `FARPY_OPS_TOKEN` / `FARPY_WEB_RENDER_OPS_TOKEN`.
- Missing/wrong token returns `403`.
- Missing alert IDs returns `400`.
- Acknowledged alert IDs are stored in the production data directory.
- Acknowledgement marks generated alert IDs as `resolved: true`.

## Alert rules

Generated only from existing production data:

- `job_submitted_stuck`: job submitted longer than `FARPY_OPS_SUBMITTED_STUCK_MS`, default 5 minutes.
- `job_running_timeout`: running job exceeds its configured render timeout.
- `failed_upload`: failed job with upload/input failure reason.
- `receipt_generation_failure`: completed job missing receipt file.
- `wallet_debit_without_completion`: wallet debit exists, but job has not completed after timeout.
- `worker_offline`: worker status unavailable.
- `worker_heartbeat_stale`: heartbeat older than `FARPY_OPS_WORKER_STALE_MS`, default 60 seconds.
- `queue_depth_over_threshold`: queue depth over `FARPY_OPS_QUEUE_WARN_THRESHOLD`.
- `disk_usage_high`: disk usage over `FARPY_OPS_DISK_WARN_PERCENT`, default 90%.
- `inode_usage_high`: inode usage over `FARPY_OPS_INODE_WARN_PERCENT`, default 90%.
- `receipt_mismatch`: receipt/output SHA mismatch.
- `zip_validation_failure`: render failed due ZIP/frame validation.

No fake alerts are emitted. If there is no source data for a condition, no alert is generated for that condition.

## Health status

- `RED`: one or more unresolved critical alerts.
- `YELLOW`: no critical alerts, but one or more unresolved warning alerts.
- `GREEN`: no unresolved critical or warning alerts.

## Frontend

The `/ops` dashboard now shows:

- production health banner
- critical / warning / active alert counts
- newest alerts first
- token-backed `Acknowledge active alerts` button
- existing system/render/node/financial/storage/recent widgets preserved

## Deployment

Backend:

```powershell
scp scripts\job-api.mjs root@farpy.com:/tmp/job-api.mjs.alerting.20260627T174404Z
ssh root@farpy.com "cp /opt/farpy-web-render/scripts/job-api.mjs /opt/farpy-web-render/scripts/job-api.mjs.bak.production_alerting.20260627T174404Z"
ssh root@farpy.com "cp /tmp/job-api.mjs.alerting.20260627T174404Z /opt/farpy-web-render/scripts/job-api.mjs"
ssh root@farpy.com "node --check /opt/farpy-web-render/scripts/job-api.mjs"
ssh root@farpy.com "systemctl restart farpy-web-render-api.service"
```

Static frontend:

```powershell
npm.cmd run build
tar -czf C:\tmp\farpy-out-production-alerting-20260627T174426Z.tar.gz -C C:\Users\danki\Desktop\farpy-frontend out
scp C:\tmp\farpy-out-production-alerting-20260627T174426Z.tar.gz root@farpy.com:/tmp/
ssh root@farpy.com "cp -a /opt/farpy.com/out /opt/farpy.com/out.bak.production_alerting.20260627T174426Z"
ssh root@farpy.com "tar -xzf /tmp/farpy-out-production-alerting-20260627T174426Z.tar.gz -C /opt/farpy.com"
```

Caddy:

Added `/ops` and `/ops/` rewrite to `/ops.html`.

```powershell
ssh root@farpy.com "caddy validate --config /etc/caddy/caddy.real.json"
ssh root@farpy.com "systemctl restart caddy"
```

Backups:

- `/opt/farpy-web-render/scripts/job-api.mjs.bak.production_alerting.20260627T174404Z`
- `/opt/farpy.com/out.bak.production_alerting.20260627T174426Z`
- `/etc/caddy/caddy.real.json.bak.ops_route.20260627T174722Z`

## Production verification

| Check | Result |
| --- | --- |
| `/ops` | HTTP 200 |
| `/ops/` | HTTP 200 |
| `/node/v1/web-render/ops/summary` without token | HTTP 403 |
| `/node/v1/web-render/ops/summary` with token | HTTP 200 |
| `health_status` | `RED` |
| `alert_counts` | `{"active":6,"critical":6,"info":0,"resolved":0,"warn":0}` |
| `/node/v1/web-render/ops/alerts/ack` without token | HTTP 403 |
| `/node/v1/web-render/ops/alerts/ack` with token and empty IDs | HTTP 400 `missing_alert_ids` |

Sample real active alerts detected:

- `job_running_timeout:job-039ac641`
- `wallet_debit_without_completion:job-039ac641`
- `zip_validation_failure:job-d01fde45`

## Final state

`FARPY_PRODUCTION_ALERTING_V1 = GREEN`
