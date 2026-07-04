# FIRST_RENDER_FRICTION_DEPLOY_V1

Status: PASS

## Objective

Deployed the homepage first-render friction fix to production.

No backend, API, pricing, payment, render, or receipt logic changed.

## Files changed

- `src/components/HomeRenderFlow.tsx`
- `src/app/layout.tsx`
- `release/FIRST_RENDER_FRICTION_FIX_V1.md`
- `release/FIRST_RENDER_FRICTION_DEPLOY_V1.md`

## Build

Command:

```powershell
npm.cmd run build
```

Result: PASS

## Deploy

Static output from `out` was archived, uploaded, and extracted into `/opt/farpy.com/out`.

Backup:

```text
/opt/farpy.com/out.bak.first_render_friction_deploy_v1.20260629T191215
```

## Production verification

URL:

```text
https://farpy.com/
```

Result:

```text
HTTP status: 200
Title: Farpy - Render Blender + Octane files for less
```

Checks:

```text
Send a package = true
Run a render factory = true
Rendars send packages. NodeMunchers earn by running render factories. = true
Download NodeMuncher absent = true
Start Rendering absent = true
mojibake ð absent = true
mojibake âœ absent = true
mojibake â€ absent = true
clean title = true
```

## Result

FIRST_RENDER_FRICTION_DEPLOY_V1 = PASS
