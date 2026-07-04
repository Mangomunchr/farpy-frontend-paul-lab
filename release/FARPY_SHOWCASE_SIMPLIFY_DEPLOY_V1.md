# FARPY_SHOWCASE_SIMPLIFY_DEPLOY_V1

Status: GREEN
Date: 2026-07-03

## Goal
Deploy the existing `FARPY_SHOWCASE_SIMPLIFY_V1` static output to production.

No page code was changed in this deploy milestone.

## Files Changed
- `release/FARPY_SHOWCASE_SIMPLIFY_DEPLOY_V1.md`

## Production Files Updated
- `/opt/farpy.com/out/showcase.html`
- `/opt/farpy.com/out/showcase.txt`
- `/opt/farpy.com/out/showcase/`
- `/opt/farpy.com/out/_next/static/` hashed assets from the current build

## Backup
- `/opt/farpy.com/out.bak.showcase_simplify_deploy_v1.20260703T103021Z`

## Commands Run
```powershell
npm.cmd run build
tar -czf C:	mparpy-showcase-simplify-deploy-v1.tar.gz showcase showcase.html showcase.txt _next/static
scp -q C:	mparpy-showcase-simplify-deploy-v1.tar.gz root@farpy.com:/tmp/farpy-showcase-simplify-deploy-v1.tar.gz
ssh root@farpy.com <backup and extract narrow Showcase archive>
curl.exe -I https://farpy.com/showcase
```

## Verification
- `https://farpy.com/showcase` returns `200`.
- `Content-Type` is `text/html; charset=utf-8`.
- Page contains `Submit your Blender or Octane project`.
- Page contains required form fields: Artist name, Email, Portfolio, Project link, Tool, Short description.
- Page contains the legal note: `You keep all rights. Submission does not guarantee selection.`
- Old Showcase card/gallery/benefit copy is absent:
  - `Showcase #001`
  - `Coming Soon`
  - `Selected artists receive`
  - `Free rendering assistance`
  - `showcase-gallery`
  - `showcase-feature-card`
- `404: This page could not be found` is absent.
- Source confirmation: `src/components/ShowcaseForm.tsx` still uses the existing `mailto:support@farpy.com` support flow.

## Backend/API
No backend or API changes were made.

FARPY_SHOWCASE_SIMPLIFY_DEPLOY_V1 = GREEN
