# CADDY_TEMPLATE_SOURCE_CONTROL_V1

Status: PASS

## Objective

Create sanitized source-controlled Caddy config templates from production without secrets and without production changes.

## Files Changed

- `infra/caddy/caddy.real.template.json`
- `docs/FARPY_BOOK/CADDY_ROUTES.md`
- `release/CADDY_TEMPLATE_SOURCE_CONTROL_V1.md`

## Production Evidence Used

Read-only inspection of:

- `/etc/caddy/caddy.real.json`
- `/etc/caddy/Caddyfile`

Captured route shape only:

- public routes
- API proxy routes
- static roots
- workspace `JOB-*` shell route
- downloads routes
- benchmark routes
- generated status/audit artifact caveats
- baseline security headers

No secrets, certificates, cookies, tokens, webhook secrets, or credential values were copied.

## Commands Run

```powershell
ssh root@farpy.com "<read-only route inspection of /etc/caddy/caddy.real.json and /etc/caddy/Caddyfile>"
Get-ChildItem C:\Users\danki\Desktop\farpy-frontend
Get-Content C:\Users\danki\Desktop\farpy-frontend\release\PRODUCTION_DRIFT_AUDIT_V1.md
Test-Path C:\Users\danki\Desktop\farpy-frontend\infra\caddy\caddy.real.template.json
Test-Path C:\Users\danki\Desktop\farpy-frontend\docs\FARPY_BOOK\CADDY_ROUTES.md
Test-Path C:\Users\danki\Desktop\farpy-frontend\release\CADDY_TEMPLATE_SOURCE_CONTROL_V1.md
New-Item -ItemType Directory -Force -Path C:\Users\danki\Desktop\farpy-frontend\infra\caddy,C:\Users\danki\Desktop\farpy-frontend\docs\FARPY_BOOK,C:\Users\danki\Desktop\farpy-frontend\release
```

## Notes

- `caddy.real.template.json` is a sanitized route template, not a drop-in production config.
- The route map documents internal upstream ports as reverse-proxy boundaries only.
- Static deploys must preserve or regenerate generated status/audit artifacts under `/opt/farpy.com/out`.
- `/downloads` and `/downloads/` must both remain reachable.
- `/workspace/JOB-*` must serve the workspace shell.

## Production Changes

None.

## Result

PASS. Source-controlled Caddy route documentation now exists without exposing secrets.
