# FARPY_DIGITAL_BOOTH_DEPLOY_V1

Status: GREEN

## Scope
- Deployed the existing immersive `/booth` static page to production.
- No application source code changes were made for this deploy task.
- Static build output was produced with `npm.cmd run build` and deployed to `/opt/farpy.com/out`.

## Deploy
- Built local static export: PASS
- Static preservation stage: `C:\tmp\farpy-static-deploy-preserved-20260704T002100Z`
- Protected artifacts missing before preservation: `736`
- Protected artifacts fetched into stage: `736`
- Deploy archive: `C:\tmp\farpy-booth-deploy-v1-20260704T002156Z.tgz`
- Production archive: `/tmp/farpy-booth-deploy-v1-20260704T002156Z.tgz`
- Static backup: `/opt/farpy.com/out.bak.booth_deploy_v1.20260704T002156Z`

## Production Route
`/opt/farpy.com/out/booth.html` was present after static deploy, but `https://farpy.com/booth` initially returned 404 because Caddy clean-route rewrites are explicit.

Added a narrow production Caddy route:

- `/booth` -> `/booth.html`
- `/booth/` -> `/booth.html`

Caddy config backup:

- `/etc/caddy/caddy.real.json.bak.booth_deploy_v1.20260704T002156Z`

Caddy validation: PASS

Caddy config immutability restored: PASS

## Verification
| Check | Result |
| --- | --- |
| `https://farpy.com/booth` returns 200 | PASS |
| Content-Type is `text/html` | PASS: `text/html; charset=utf-8` |
| Page contains `FARPY` | PASS |
| Page contains `B-1337` | PASS |
| Page contains `Always Open` | PASS |
| `/sitemap.xml` contains `/booth` | PASS |
| No 404 marker in page body | PASS |
| CSS chunk returns 200 | PASS |
| CSS Content-Type is `text/css` | PASS: `text/css; charset=utf-8` |

CSS verified:

- `https://farpy.com/_next/static/chunks/1we85td2p1q1-.css`

## Preservation Guard
Post-deploy static preservation guard:

- Verdict: GREEN
- Evidence: `C:\tmp\farpy-booth-deploy-postdeploy-guard-v1.json`

## Notes
- The first upload attempt timed out and left a partial remote archive; it was overwritten successfully on retry.
- The first full tar extraction hit immutable `receipt-static` files and stopped. The deploy was completed by extracting the same preserved archive while excluding `receipt-static/*`, leaving existing protected immutable receipt artifacts in place.

FARPY_DIGITAL_BOOTH_DEPLOY_V1 = GREEN