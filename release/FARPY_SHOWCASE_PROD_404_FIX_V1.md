# FARPY_SHOWCASE_PROD_404_FIX_V1

Status: GREEN
Date: 2026-07-03

## Root cause

Production `/showcase` was being served from an extensionless static file at `/opt/farpy.com/out/showcase`. The bytes were the Showcase page, but Caddy did not emit `Content-Type: text/html` for the extensionless file. Because Farpy also sends `X-Content-Type-Options: nosniff`, browsers could render the response as raw HTML instead of the page.

A second audit check found the default Next.js not-found marker (`404: This page could not be found`) embedded inside the exported page hydration payload. The page itself was not a 404, but the marker made the grep-based production proof fail.

## Files changed

- `src/app/not-found.tsx`
- Production Caddy config: `/etc/caddy/caddy.real.json`
- Production static artifacts:
  - `/opt/farpy.com/out/showcase.html`
  - `/opt/farpy.com/out/showcase.txt`
  - `/opt/farpy.com/out/showcase/`

## Production backups

- Caddy backup: `/etc/caddy/caddy.real.json.bak.showcase_prod_404_fix_v1.20260703T090342Z`
- Static backup: `/opt/farpy.com/out.bak.showcase_prod_404_fix_v1.20260703T090903Z`

## Fix

- Added a narrow Caddy route for `/showcase` and `/showcase/` that rewrites to `/showcase.html` and serves from `/opt/farpy.com/out`.
- Restored the immutable bit on `/etc/caddy/caddy.real.json` after validation/restart.
- Replaced the bad extensionless `/opt/farpy.com/out/showcase` file with the proper exported `/showcase/` directory.
- Added a minimal custom Next not-found page so exported Showcase HTML no longer embeds the default `404: This page could not be found` marker.

## Commands run

```powershell
ssh root@farpy.com "systemctl show caddy -p ExecStart --no-pager; grep -nE 'showcase|try_files|file_server|rewrite|redir|root' /etc/caddy/Caddyfile /etc/caddy/caddy.real.json 2>/dev/null | head -120"
curl.exe -i https://farpy.com/showcase
curl.exe -I https://farpy.com/showcase.html
curl.exe -I https://farpy.com/showcase/
npm.cmd run build
ssh root@farpy.com "chattr -i /etc/caddy/caddy.real.json && python3 /tmp/showcase-prod-404-fix-v1.py; rc=$?; chattr +i /etc/caddy/caddy.real.json; exit $rc"
scp -r C:\Users\danki\Desktop\farpy-frontend\out\showcase root@farpy.com:/opt/farpy.com/out/showcase
scp C:\Users\danki\Desktop\farpy-frontend\out\showcase.html root@farpy.com:/opt/farpy.com/out/showcase.html
scp C:\Users\danki\Desktop\farpy-frontend\out\showcase.txt root@farpy.com:/opt/farpy.com/out/showcase.txt
ssh root@farpy.com "find /opt/farpy.com/out/showcase -type d -exec chmod 755 {} +; find /opt/farpy.com/out/showcase -type f -exec chmod 644 {} +; chmod 644 /opt/farpy.com/out/showcase.html /opt/farpy.com/out/showcase.txt"
curl.exe -i https://farpy.com/showcase
curl.exe -I https://farpy.com/showcase/
```

## Proof

- `https://farpy.com/showcase` returns `HTTP/1.1 200 OK`.
- `https://farpy.com/showcase` returns `Content-Type: text/html; charset=utf-8`.
- `https://farpy.com/showcase/` returns `HTTP/1.1 200 OK`.
- `curl -s https://farpy.com/showcase` contains `Farpy Showcase`.
- `curl -s https://farpy.com/showcase` does not contain `404: This page could not be found`.
- Caddy is active after restart.
- `/etc/caddy/caddy.real.json` immutable bit restored.

## Notes

No backend API changes were made. No unrelated static deploy was performed.

FARPY_SHOWCASE_PROD_404_FIX_V1 = GREEN
