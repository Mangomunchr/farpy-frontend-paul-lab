# PROD_ENV_SECRET_PERMISSION_HARDENING_V1

Date: 2026-06-28

## Summary

Production Farpy env/key files under `/etc/farpy` were hardened to `0600 root:root`.

## Changes

- Updated sensitive env/key file permissions from `0640`/`0644` to `0600`.
- Preserved existing secret values.
- Preserved `/etc/farpy/farpy.env` immutable behavior after applying `0600`.
- Restarted:
  - `farpy-jobs-api.service`
  - `farpy-web-render-api.service`

## Inline Environment Review

`farpy-jobs-api.service` still has inline operational settings, but no inline secret-like variable names were found.

`farpy-web-render-api.service` still has inline operational settings only:

- `BLENDER_EXE`
- `FARPY_NODE_PAIR_SQLITE`
- `FARPY_PUBLIC_SITE_URL`
- `FARPY_WEB_RENDER_DATA_DIR`
- `FARPY_WEB_RENDER_HOST`
- `FARPY_WEB_RENDER_PORT`
- `NODE_ENV`

Secret-bearing configuration remains in protected `EnvironmentFile=` files.

## Validation

- `/etc/farpy` env/key files inspected in this pass are `600 root root`.
- `farpy-jobs-api.service` active.
- `farpy-web-render-api.service` active.
- `https://api.farpy.com/healthz` returned `200`.
- `https://farpy.com/node/v1/web-render/health` returned `200`.

