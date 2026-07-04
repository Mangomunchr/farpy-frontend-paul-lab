# PRODUCTION_DRIFT_GUARD_PLAN_V1

Status: PLAN_ONLY

## Objective

Plan a deploy-time drift guard. No implementation yet.

## Files Changed

- `docs/FARPY_BOOK/PRODUCTION_DRIFT_GUARD.md`
- `release/PRODUCTION_DRIFT_GUARD_PLAN_V1.md`

## Guard Should Detect

- production-only Caddy drift
- systemd drift
- missing static generated artifacts
- unexpected `/etc/farpy` files
- local `out` vs production mismatch

## Plan Summary

The future guard should compare deploy candidates against four source-controlled manifests:

- `infra/caddy/caddy.real.template.json`
- `infra/systemd/`
- `docs/FARPY_BOOK/ETC_FARPY_MANIFEST.md`
- `docs/FARPY_BOOK/STATIC_ARTIFACT_MANIFEST.md`

It should fail closed for:

- missing P0 routes
- missing critical services
- missing P0 `/etc/farpy` env/key/config files
- unsafe permissions on secret-like files
- missing public downloads or sidecars
- destructive deploys that would erase generated status/audit/proof/receipt artifacts without a preservation or regeneration plan

## Commands Run

None beyond file creation.

## Production Changes

None.

## Implementation Status

Not implemented by design.

Recommended future script:

`scripts/production-drift-guard-v1.ps1`

## Result

PASS for plan creation. No deployment behavior changed.
