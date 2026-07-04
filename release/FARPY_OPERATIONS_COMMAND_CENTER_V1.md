# FARPY_OPERATIONS_COMMAND_CENTER_V1

Status: GREEN with private metrics locked until `FARPY_OPS_TOKEN` is configured.

## Summary

Created a read-only internal operations dashboard at:

- `https://farpy.com/ops/`

The page loads public health checks immediately and shows private widgets as honest `no data` until an operator token is entered.

## Routes added

- `GET /ops/` static operator page
- `GET /node/v1/web-render/ops/summary` public Caddy route to the protected upstream summary endpoint
- `GET /node/v1/ops/summary` upstream read-only API route

## Read-only widgets

- System: website, jobs API, worker API, leaderboard API, benchmark API
- Render: queued, rendering, completed today, failed today, average render time, average queue wait
- Nodes: Blender workers, Octane workers, last heartbeat, worker version, GPU count, active jobs
- Financial: wallet debits, wallet credits, revenue today, receipts minted
- Storage: upload storage, output storage, free disk, recent ZIP count
- Recent: last 20 jobs, receipts, failures
- Alerts: stuck jobs, offline workers, receipt mismatch, ZIP validation failure, payment without completion, completion without receipt

## Safety

- No admin actions.
- No mutation endpoints.
- No restart buttons.
- Private summary endpoint is token-gated.
- No download or receipt tokens are exposed in the ops summary payload.
- If `FARPY_OPS_TOKEN` / `FARPY_WEB_RENDER_OPS_TOKEN` is not configured, the private endpoint returns `404`.

## Production deploy

Backups:

- `/opt/farpy-web-render/scripts/job-api.mjs.bak.ops-command-center-v1.20260626T230318Z`
- `/opt/farpy.com/out/ops.html.bak.ops-command-center-v1.20260626T230318Z`
- `/opt/farpy.com/out/ops.html.bak.ops-command-center-v1-static-refresh.20260626T230533Z`
- `/opt/farpy.com/out/ops.html.bak.ops-command-center-v1-static-final.20260626T230657Z`

Services restarted:

- `farpy-web-render-api.service`

## Validation

Build:

- `npm.cmd run build` passed.
- `node --check scripts/job-api.mjs` passed.

Production HTTP:

- `https://farpy.com/ops/` -> `200`
- `https://farpy.com/node/v1/web-render/health` -> `200`
- `https://farpy.com/node/v1/web-render/worker/status` -> `200`
- `https://farpy.com/node/v1/web-render/ops/summary` -> `404` without token, expected fail-closed state because no ops token is configured.

Screenshot:

- `C:\tmp\farpy-ops-command-center-v1.png`

## Remaining operator input

To populate private widgets, configure one of:

- `FARPY_OPS_TOKEN`
- `FARPY_WEB_RENDER_OPS_TOKEN`

on `farpy-web-render-api.service`, then refresh `/ops/` with that token.
