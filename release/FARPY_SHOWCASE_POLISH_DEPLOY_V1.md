# FARPY_SHOWCASE_POLISH_DEPLOY_V1

Status: GREEN
Date: 2026-07-03

## Scope

Deployed the existing `FARPY_SHOWCASE_POLISH_V1` static output to production with a narrow `/showcase` deploy only.

No page code was changed in this deploy milestone.

## Files changed

- `release/FARPY_SHOWCASE_POLISH_DEPLOY_V1.md`

## Production files updated

- `/opt/farpy.com/out/showcase.html`
- `/opt/farpy.com/out/showcase.txt`
- `/opt/farpy.com/out/showcase/`
- Exact `_next/static` assets referenced by the rebuilt Showcase page, including:
  - `/opt/farpy.com/out/_next/static/chunks/3otq-3isyq7ja.css`

## Backup

- `/opt/farpy.com/out.bak.showcase_polish_deploy_v1.20260703T092609Z`

## Commands run

```powershell
npm.cmd run build
scp -r C:\Users\danki\Desktop\farpy-frontend\out\showcase root@farpy.com:/opt/farpy.com/out/showcase
scp C:\Users\danki\Desktop\farpy-frontend\out\showcase.html root@farpy.com:/opt/farpy.com/out/showcase.html
scp C:\Users\danki\Desktop\farpy-frontend\out\showcase.txt root@farpy.com:/opt/farpy.com/out/showcase.txt
curl.exe -I https://farpy.com/showcase
curl.exe -I https://farpy.com/showcase/
curl.exe -I https://farpy.com/_next/static/chunks/3otq-3isyq7ja.css
```

## Verification

- `https://farpy.com/showcase` returns `200`.
- `https://farpy.com/showcase` returns `Content-Type: text/html; charset=utf-8`.
- `https://farpy.com/showcase/` returns `200`.
- `https://farpy.com/_next/static/chunks/3otq-3isyq7ja.css` returns `200` and `Content-Type: text/css; charset=utf-8`.
- Production page contains `Farpy Showcase #001`.
- Production page contains `Your project could be here`.
- Production page does not contain `404: This page could not be found`.
- `/opt/farpy.com/out/showcase` permissions normalized to `755` directories and `644` files.

FARPY_SHOWCASE_POLISH_DEPLOY_V1 = GREEN
