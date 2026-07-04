# Caddy Routes

Status: source-controlled route map from sanitized production evidence.

Purpose: document the public Farpy Caddy boundary without storing secrets or creating a deployable production config.

Canonical template: `infra/caddy/caddy.real.template.json`

## Source

Read-only production inspection on 2026-06-30:

- `/etc/caddy/caddy.real.json`
- `/etc/caddy/Caddyfile`

No production files were modified.

## Static Roots

| Host/surface | Static root | Notes |
| --- | --- | --- |
| `farpy.com` | `/opt/farpy.com/out` | Main static export, downloads, docs, account/workspace/receipt shells. |
| `farpy.com/benchmark` | `/var/www/farpy/benchmark` | Public benchmark pages, dynamic static shells, sitemap. |
| `status.farpy.com` | `/opt/farpy.com/out/status` | Generated public status artifacts. |

Generated status/audit JSON files may be production artifacts rather than ordinary frontend build output. A static deploy must preserve, regenerate, or intentionally retire them.

## Public Pages

| Route | Behavior |
| --- | --- |
| `/` | Static homepage. |
| `/signin`, `/signup` | Static auth shells; auth APIs proxy separately. |
| `/account`, `/topup`, `/pricing` | Static customer pages. |
| `/workspace` | Static package tracker shell. |
| `/workspace/JOB-*` | Static workspace shell for job/package identifiers. |
| `/receipt`, `/receipt/*` | Static receipt shell; private receipt data comes from APIs/tokens. |
| `/downloads`, `/downloads/`, `/downloads/*` | Static downloads and SHA256 sidecars. |
| `/addon`, `/docs`, `/faq`, `/status`, `/privacy`, `/terms` | Static public pages. |
| `/real`, `/real/`, `/real/*` | Permanent redirect to `/` for legacy business-card compatibility. |

## API Proxy Routes

| Host | Route | Upstream | Notes |
| --- | --- | --- | --- |
| `farpy.com` | `/v1/auth/*` | `127.0.0.1:8092` | Auth/session service. |
| `farpy.com` | `/v1/wallet/*`, `/v1/account/*`, `/checkout` | `127.0.0.1:19102` | Wallet/account/checkout boundary. |
| `farpy.com` | `/node/v1/web-render/*` | `127.0.0.1:19102` | Web render API path used by customer flows. |
| `farpy.com` | `/node/v1/pair*` | `127.0.0.1:19002` | NodeMuncher pairing path. |
| `farpy.com` | `/submit*`, `/real-submit/*`, `/api/submit` | `127.0.0.1:8097` | Legacy submit paths retained for compatibility. |
| `farpy.com` | `/api/*` | `127.0.0.1:8097` | Legacy API fallback. |
| `farpy.com` | `/funnel-event` | `127.0.0.1:19181` | Analytics event collector with small request body limit. |
| `api.farpy.com` | `/node/v1/leaderboard*` | `127.0.0.1:19022` | Benchmark leaderboard API. |
| `api.farpy.com` | `/upload*` | `127.0.0.1:8096` | Upload API. |
| `api.farpy.com` | `/node/v1/heartbeat`, `/node/v1/lease/*`, `/node/v1/receipts`, `/node/v1/pair/*` | `127.0.0.1:19002` | Node control paths. |
| `api.farpy.com` | `/webhooks/stripe*` | `127.0.0.1:8091` | Rewritten to `/webhook`; signature validation remains service responsibility. |
| `api.farpy.com` | `/node/v1/checkout*` | `127.0.0.1:19024` | Checkout API path. |
| `api.farpy.com` | `/*` | `127.0.0.1:8097` | Jobs API default fallback. |

## Benchmark Routes

| Route | Static behavior |
| --- | --- |
| `/benchmark/result/*` | Rewrite to `/result/index.html` under `/var/www/farpy/benchmark`. |
| `/benchmark/gpu/*` | Rewrite to `/gpu/index.html`. |
| `/benchmark/compare/*` | Rewrite to `/compare/index.html`. |
| `/benchmark/leaderboard` | Serve leaderboard shell. |
| `/benchmark/latest` | Serve latest shell. |
| `/benchmark/search` | Serve search shell. |
| `/benchmark/api` | Serve public API docs shell. |
| `/benchmark`, `/benchmark/*` | Strip prefix and serve benchmark static root. |

## Workspace JOB Route

`/workspace/JOB-*` must serve the exported workspace shell, not a literal static file per job. The browser then loads job/package state through the web-render API.

This route is critical for links from uploads, receipts, account history, add-on handoff, and support messages.

## Downloads

Downloads are static files under `/opt/farpy.com/out/downloads`.

The route set must support both:

- `/downloads`
- `/downloads/`
- `/downloads/<artifact>`

SHA256 sidecars should be served as plain static files beside the artifact.

## Security Headers

Production includes baseline headers for public hosts:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- CSP allowing current static assets, Google OAuth, Stripe checkout, and existing analytics.

Do not tighten CSP without browser-testing auth, Stripe checkout, addon downloads, and workspace/receipt flows.

## Caveats

- This route map is sanitized documentation, not an exact byte-for-byte production config.
- Localhost upstream ports are production service boundaries; they are not intended to be directly public.
- Secrets belong in `/etc/farpy` env files and service configuration, not Caddy templates.
- Generated status/audit JSON may drift from repo output and should be handled explicitly during deploy.

## Validation Commands

```powershell
curl.exe -I https://farpy.com/
curl.exe -I https://farpy.com/downloads
curl.exe -I https://farpy.com/downloads/
curl.exe -I https://farpy.com/workspace/JOB-EXAMPLE
curl.exe -I https://farpy.com/benchmark/leaderboard
curl.exe -I https://api.farpy.com/healthz
```

On production, use `caddy adapt` before deploying any real config.
