# FARPY_OPS_TOKEN_AND_DATA_V1

Status: GREEN.

## Summary

Configured `FARPY_OPS_TOKEN` for `farpy-web-render-api.service` using a root-owned systemd drop-in. The `/ops/` page remains read-only. Private metrics now require the token and the summary endpoint returns populated production data when the token is supplied.

The token value was not printed, committed, embedded in frontend code, or placed in any URL.

## Production configuration

Env drop-in:

- `/etc/systemd/system/farpy-web-render-api.service.d/70-ops-token.conf`

Permissions:

- `600`

Service restarted:

- `farpy-web-render-api.service`

## Auth checks

Internal upstream:

- No token: `403`
- Wrong token: `403`
- Correct token: `200`

Public Caddy route:

- `https://farpy.com/node/v1/web-render/ops/summary`
- No token: `403`
- Wrong token: `403`
- Correct token: `200`

## Populated summary proof

Correct-token JSON returned:

- `ok=true`
- keys: `ok,generated_at,system,render,nodes,financial,storage,recent,alerts`
- render fields: `6`
- node fields: `8`
- financial fields: `4`
- storage fields: `4`
- recent jobs: `20`
- recent receipts: `20`
- recent failures: `13`
- alert rows: `6`

Generated at:

- `2026-06-26T23:29:45.247Z`

## Widget coverage

Populated from existing production data:

- queued/running/completed/failed render counts
- recent jobs
- recent receipts
- recent failures
- worker status fields where available
- storage basics
- alert lists

Unavailable fields remain honest `no data` in the UI.

## Screenshot

- `C:\tmp\farpy-ops-token-and-data-v1.png`

Note: screenshot automation captured the locked public page state. Token-authenticated data population was validated through the same public endpoint used by the page, without exposing the token.
