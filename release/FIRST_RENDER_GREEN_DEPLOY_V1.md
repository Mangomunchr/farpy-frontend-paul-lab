# FIRST_RENDER_GREEN_DEPLOY_V1

Status: GREEN

## Objective

Deployed `FIRST_RENDER_GREEN_FIX_V1` to production and confirmed the narrow first-render retail path is green.

No backend, API, payment, wallet, render, receipt, or route behavior changed.

## Files changed

- `src/app/layout.tsx`
- `src/components/Workspace.tsx`
- `src/components/AccountPage.tsx`
- `src/app/account/page.tsx`
- `src/components/FaqSection.tsx`
- `src/components/ApiPage.tsx`
- `src/components/HomeRenderFlow.tsx`
- `src/app/page.tsx`
- `src/app/signup/page.tsx`
- `public/llms.txt`
- `public/llms-full.txt`
- `release/FIRST_RENDER_GREEN_FIX_V1.md`
- `release/FIRST_RENDER_GREEN_DEPLOY_V1.md`

## Build

Command:

```powershell
npm.cmd run build
```

Result: PASS

## Deploy

Static output from `out` was archived, uploaded, backed up, and extracted into `/opt/farpy.com/out`.

Backup:

```text
/opt/farpy.com/out.bak.first_render_green_deploy_v1.20260629T193914
```

## Production verification

Routes:

```text
/          200
/pricing   200
/signin    200
/topup     200
/workspace 200
/receipt   200
/account   200
```

Production HTML + referenced bundle scan:

```text
OLD Â· false
OLD Pay & Render false
OLD render history false
OLD No renders yet false
OLD View Workspace false
OLD View Receipt false
NEEDED Pay and send package true
NEEDED package history true
NEEDED No packages yet true
NEEDED View workspace true
NEEDED View delivery receipt true
```

## Result

FIRST_RENDER_GREEN_DEPLOY_V1 = GREEN
