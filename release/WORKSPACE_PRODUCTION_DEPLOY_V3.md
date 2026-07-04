# WORKSPACE_PRODUCTION_DEPLOY_V3

Status: PASS

## Scope

Deployed the updated Workspace package tracker static build to production and added a narrow production rewrite so existing package URLs of the form `/workspace/JOB-*` serve the Workspace shell.

No backend, API, payment, receipt, or render logic was changed.

## Files changed

- `src/components/Workspace.tsx`
- `src/lib/worldLanguage.ts`
- `src/app/workspace/page.tsx`
- `src/app/workspace/[id]/page.tsx`
- `release/WORKSPACE_PACKAGE_TRACKING_V3.md`
- `release/WORKSPACE_PRODUCTION_DEPLOY_V3.md`

Production config changed:

- `/etc/caddy/caddy.real.json`

## Backups

- Static backup: `/opt/farpy.com/out.bak.workspace_production_deploy_v3.20260629T174955`
- Static backup: `/opt/farpy.com/out.bak.workspace_production_deploy_v3.20260629T175901`
- Caddy backups:
  - `/etc/caddy/caddy.real.json.bak.workspace_production_deploy_v3.20260629T174955`
  - `/etc/caddy/caddy.real.json.bak.workspace_production_deploy_v3.20260629T175636`
  - `/etc/caddy/caddy.real.json.bak.workspace_production_deploy_v3.20260629T175720`

## Build

Command:

```powershell
npm.cmd run build
```

Result: PASS

## Deployment

Static output was archived from `out`, copied to production, backed up, and extracted into `/opt/farpy.com/out`.

Caddy was updated with a narrow route:

```text
/workspace/JOB-* -> /workspace.html
```

Caddy validation passed, Caddy restarted successfully, and `/etc/caddy/caddy.real.json` was restored to immutable protection after the edit.

## Production verification

HTTP checks:

```text
https://farpy.com/workspace                    200
https://farpy.com/workspace?job_id=JOB-04CC8A13 200
https://farpy.com/workspace/JOB-04CC8A13       200
```

Static shell proof:

```text
Package tracker visible: true
Render workspace visible: false
Job ID visible in public shell: false
Worker visible in public shell: false
Node visible in public shell: false
Queue visible in public shell: false
Lease visible in public shell: false
Backend visible in public shell: false
```

Live client bundle proof:

```text
Package received: true
Dispatcher: true
Render factory: true
Package delivered: true
Download package result: true
View delivery receipt: true
Verify receipt: true
Your package is being prepared at a render factory: true
Download ZIP: false
View Receipt: false
Start Render: false
```

Source scan found one remaining `worker` reference in `Workspace.tsx` only as internal failure-text classification for legacy backend messages. It displays as `Render factory failed during rendering.`

## Result

WORKSPACE_PRODUCTION_DEPLOY_V3 = PASS
