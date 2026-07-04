# PRODUCTION_DRIFT_GUARD_V1

Status: PASS / GUARD VERDICT RED

## Objective

Implement a read-only drift guard script.

## Files Changed

- `scripts/production-drift-guard-v1.ps1`
- `release/PRODUCTION_DRIFT_GUARD_V1.md`

## Implemented Checks

- Caddy template vs production route shape.
- systemd template coverage for launch-critical services and timers.
- `/etc/farpy` manifest coverage and secret-like permission check.
- static preservation manifest generation through `static-preservation-guard-v1.ps1`.
- local `out` vs production sample hashes for core static/download artifacts.

## Safety

- Does not print secret values.
- Does not read env file contents.
- Does not mutate production.
- Does not deploy.
- Production access is read-only through SSH commands that emit sanitized metadata.

## Command

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/production-drift-guard-v1.ps1 -OutputPath C:\tmp\production-drift-guard-v1-latest.json
```

## Commands Run

```powershell
$errors=$null; [System.Management.Automation.PSParser]::Tokenize((Get-Content -LiteralPath C:\Users\danki\Desktop\farpy-frontend\scripts\production-drift-guard-v1.ps1 -Raw), [ref]$errors)
powershell -NoProfile -ExecutionPolicy Bypass -File C:\Users\danki\Desktop\farpy-frontend\scripts\production-drift-guard-v1.ps1 -SkipProduction -OutputPath C:\tmp\production-drift-guard-v1-skipprod.json
powershell -NoProfile -ExecutionPolicy Bypass -File C:\Users\danki\Desktop\farpy-frontend\scripts\production-drift-guard-v1.ps1 -OutputPath C:\tmp\production-drift-guard-v1-latest.json
```

## Expected Verdicts

- `GREEN`: no drift warnings or failures.
- `YELLOW`: unknown/unclassified drift or sample hash mismatch that needs operator review.
- `RED`: missing critical templates, routes, services, manifests, or unsafe secret-like permissions.

## Production Changes

None.

Production was inspected read-only. No services were restarted. No files were modified.

## Validation Result

Evidence:

- `C:\tmp\production-drift-guard-v1-latest.json`

Final guard verdict:

- `VERDICT=RED`
- `PASS_COUNT=9`
- `WARN_COUNT=1`
- `FAIL_COUNT=1`
- `SKIP_COUNT=0`

Passing checks:

- Caddy template shape.
- Production Caddy route signals.
- systemd template coverage.
- production systemd critical unit state returned.
- `/etc/farpy` manifest exists.
- production `/etc/farpy` files are covered by manifest.
- static preservation guard exists.
- static preservation manifest generated.
- local `out` exists.

Warning:

- Local `out` differs from production for sample static hashes:
  - `index.html`
  - `downloads/Farpy-Blender-Addon-unified.zip`
  - `downloads/Farpy-Blender-Addon-unified.zip.sha256`

Failure:

- Four secret-like `/etc/farpy` files are not `0600`.

Path-only findings:

- `/etc/farpy/farpy.env.bak.20251227T145610Z` mode `0644`
- `/etc/farpy/systemd-secret-move-backups-20260628T201245Z/50-worker-token.conf` mode `0644`
- `/etc/farpy/systemd-secret-move-backups-20260628T201245Z/env.conf` mode `0644`
- `/etc/farpy/worker.env.nodeid.1777580359` mode `0644`

No secret values were printed.

## Result

PASS for implementation. The guard correctly returns RED against current production drift and should block deploys until the secret-like file permissions are fixed or explicitly reclassified.
