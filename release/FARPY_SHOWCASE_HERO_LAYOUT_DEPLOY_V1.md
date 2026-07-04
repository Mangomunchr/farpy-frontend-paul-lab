# FARPY_SHOWCASE_HERO_LAYOUT_DEPLOY_V1

Status: GREEN
Date: 2026-07-03

## Scope

Deployed existing `FARPY_SHOWCASE_HERO_LAYOUT_V1` static output to production.

No page code changes were made in this deploy milestone.

## Files changed

- `release/FARPY_SHOWCASE_HERO_LAYOUT_DEPLOY_V1.md`

## Production files updated

- `/opt/farpy.com/out/showcase.html`
- `/opt/farpy.com/out/showcase.txt`
- `/opt/farpy.com/out/showcase/`
- Exact `_next/static` assets referenced by the rebuilt Showcase page, including:
  - `/opt/farpy.com/out/_next/static/chunks/3ie6dcvk6z25z.css`

## Backup

- `/opt/farpy.com/out.bak.showcase_hero_layout_deploy_v1.20260703T094847Z`

## Commands run

```powershell
npm.cmd run build
scp -r C:\Users\danki\Desktop\farpy-frontend\out\showcase root@farpy.com:/opt/farpy.com/out/showcase
scp C:\Users\danki\Desktop\farpy-frontend\out\showcase.html root@farpy.com:/opt/farpy.com/out/showcase.html
scp C:\Users\danki\Desktop\farpy-frontend\out\showcase.txt root@farpy.com:/opt/farpy.com/out/showcase.txt
curl.exe -I https://farpy.com/showcase
curl.exe -I https://farpy.com/showcase/
curl.exe -I https://farpy.com/_next/static/chunks/3ie6dcvk6z25z.css
```

## Verification

- `https://farpy.com/showcase` returns `200`.
- `https://farpy.com/showcase` returns `Content-Type: text/html; charset=utf-8`.
- `https://farpy.com/showcase/` returns `200`.
- `https://farpy.com/_next/static/chunks/3ie6dcvk6z25z.css` returns `200` and `Content-Type: text/css; charset=utf-8`.
- Production page contains `Farpy Showcase`.
- Production page contains `Farpy Showcase #001`.
- Production page contains `Your project could be here`.
- Production page does not contain `404: This page could not be found`.
- Production CSS contains the hero no-overlap rules:
  - `grid-template-columns: minmax(min(56vw, 680px), 1fr) minmax(320px, 420px)`
  - `gap: clamp(3rem, 6vw, 5.5rem)`
  - `justify-self: end`
  - `width: min(100%, 420px)`
  - `@media (max-width: 900px)`

## Visual verification note

The production CSS now enforces a bounded right card, larger column gap, no card transform, and vertical stacking below 900px. Direct browser screenshot/rectangle verification was not available in this environment because local Playwright is not installed, so layout proof is via deployed CSS contract plus live route checks.

FARPY_SHOWCASE_HERO_LAYOUT_DEPLOY_V1 = GREEN
