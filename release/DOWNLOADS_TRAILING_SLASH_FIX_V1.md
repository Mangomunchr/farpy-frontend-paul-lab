# DOWNLOADS_TRAILING_SLASH_FIX_V1

Status: GREEN
Timestamp: 2026-06-27T02:17:42Z

## Root cause

`/opt/farpy.com/out/downloads.html` existed, but Caddy did not have an extensionless static route for `/downloads` or `/downloads/`. The static artifact directory `/opt/farpy.com/out/downloads/` is used for downloadable files, so `/downloads/` fell through to the wrong static lookup and returned 404.

## Fix

Added a Caddy route before generic static handling:

- host: `farpy.com`
- paths: `/downloads`, `/downloads/`
- rewrite: `/downloads.html`
- file server root: `/opt/farpy.com/out`

No frontend, backend, payment, wallet, render, or UI behavior was changed.

## Production files changed

- `/etc/caddy/caddy.real.json`

## Local files changed

- `scripts/production-regression-audit-v1.ps1`
- `scripts/production-operations-dashboard-v1.ps1`
- `release/DOWNLOADS_TRAILING_SLASH_FIX_V1.md`

## Backups

- `/etc/caddy/caddy.real.json.bak.downloads_trailing_slash.20260627T021247Z`
- `/etc/caddy/caddy.real.json.bak.downloads_trailing_slash.20260627T021323Z`

## Commands run

```powershell
ssh root@farpy.com "test -f /opt/farpy.com/out/downloads.html; test -d /opt/farpy.com/out/downloads; grep -n '\"/downloads' /etc/caddy/caddy.real.json || true"
ssh root@farpy.com "chattr -i /etc/caddy/caddy.real.json"
ssh root@farpy.com "python3 - <<'PY' ... PY"
ssh root@farpy.com "caddy validate --config /etc/caddy/caddy.real.json"
ssh root@farpy.com "systemctl restart caddy; chattr +i /etc/caddy/caddy.real.json; systemctl is-active caddy"
ssh root@farpy.com "curl -k -I https://farpy.com/downloads; curl -k -I https://farpy.com/downloads/"
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\production-regression-audit-v1.ps1 -OutputPath C:\tmp\production-regression-audit-v1-latest.json
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\production-operations-dashboard-v1.ps1 -OutputPath C:\tmp\production-operations-dashboard-v1-latest.json
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\launch-freeze-v1.ps1 -OutputPath C:\tmp\launch-freeze-v1-latest.json
```

Note: `systemctl reload caddy` is not supported by this unit, so the validated config was applied with `systemctl restart caddy`. The immutable flag was restored afterward.

## URL validation

| URL | Result |
| --- | --- |
| `https://farpy.com/downloads` | HTTP 200 |
| `https://farpy.com/downloads/` | HTTP 200 |

## Audit results

| Contract | Verdict | Pass | Fail | Skip | Evidence |
| --- | --- | ---: | ---: | ---: | --- |
| `PRODUCTION_REGRESSION_AUDIT_V1` | GREEN | 40 | 0 | 3 | `C:\tmp\production-regression-audit-v1-latest.json` |
| `PRODUCTION_OPERATIONS_DASHBOARD_V1` | GREEN | 26 | 0 | 5 | `C:\tmp\production-operations-dashboard-v1-latest.json` |
| `LAUNCH_FREEZE_V1` | YELLOW_LAUNCHABLE | 97 | 0 | 13 | `C:\tmp\launch-freeze-v1-latest.json` |

## Final state

`DOWNLOADS_TRAILING_SLASH_FIX_V1 = GREEN`
