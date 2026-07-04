# SECURITY_GOLD_AUDIT_V1

Date: 2026-06-30

Production URL: https://farpy.com

Verdict: YELLOW

No currently exploitable public P0 was proven by this audit. Core money/render/download/receipt gates mostly fail closed, worker/node endpoints reject missing or invalid tokens, and previous critical fixes for job-status token disclosure, worker query-token auth, malformed price JSON, and env permissions are present.

YELLOW is warranted because several P1 security issues remain: one public job-create route still returns an avoidable 500 on malformed JSON, `farpy.com` lacks HSTS while `api.farpy.com` has it, legacy `/outputs/*` static Caddy routes remain in active config, broad API CORS is still `*`, and abuse/rate-limit proof is incomplete for retail traffic.

## P0

None proven.

## P1

### 1. `POST /node/v1/web-render/jobs/create` malformed JSON returns 500.

Evidence:

- `scripts/job-api.mjs:2527-2535` parses JSON directly without route-local `try/catch`.
- Live probe: `POST https://farpy.com/node/v1/web-render/jobs/create` with malformed JSON returned `500 {"ok":false,"err":"internal_error"}`.
- Comparable route is fixed: `POST /node/v1/web-render/jobs/JOB-NOPE/price` with malformed JSON returned `400 {"ok":false,"error":"invalid_json"}`.

Impact:

Not a payment bypass, but it is an avoidable public 500 on a job-creation surface. It weakens fail-closed behavior and can add alert/noise under malformed traffic.

Recommended fix:

Wrap `/node/v1/jobs/create` JSON parsing like `/checkout`, BTCPay invoice routes, and `/jobs/:id/price`; return `400 invalid_json`.

### 2. `farpy.com` is missing HSTS.

Evidence:

- `HEAD https://farpy.com/`: no `Strict-Transport-Security` header.
- `HEAD https://farpy.com/topup`: no `Strict-Transport-Security` header.
- `HEAD https://farpy.com/signin`: no `Strict-Transport-Security` header.
- `HEAD https://api.farpy.com/healthz`: `Strict-Transport-Security=max-age=31536000; includeSubDomains; preload`.

Impact:

Main customer site has baseline security headers but does not enforce browser HTTPS upgrade persistence. This is a P1 launch hardening gap.

Recommended fix:

Apply the same HSTS header to `farpy.com` as `api.farpy.com` after verifying no HTTP-only subdomain dependencies.

### 3. Active Caddy config contains legacy static output routes.

Evidence:

- `/etc/caddy/Caddyfile:236-247` serves `/render-output/*` and `/outputs/*` from `/opt/farpy.com/out/outputs` with `file_server`.
- Live probes currently returned 404 for:
  - `https://farpy.com/outputs/`
  - `https://farpy.com/outputs`
  - `https://api.farpy.com/outputs/`

Impact:

No current public ZIP browsing was proven, but the route is a standing footgun. If build/deploy output ever includes private render outputs under `/opt/farpy.com/out/outputs`, Caddy will serve them directly.

Recommended fix:

Remove or explicitly `respond 404/403` for legacy `/outputs/*` and `/render-output/*` unless a current token-gated route uses them.

### 4. Broad CORS remains on JSON API responses.

Evidence:

- `scripts/job-api.mjs:51-59` sets `access-control-allow-origin: *` and allows `authorization`, node-token, ops-token, and BTCPay signature headers.
- Live preflight to `/node/v1/web-render/uploads/create` from `Origin: https://evil.example` returned:
  - `Access-Control-Allow-Origin: *`
  - `Access-Control-Allow-Methods: GET,POST,OPTIONS`
  - `Access-Control-Allow-Headers: content-type,x-filename,authorization,x-farpy-node-token,x-farpy-node-id,x-farpy-ops-token,btcpay-sig`

Impact:

Because `Access-Control-Allow-Credentials` was not observed, browser cookies are not readable cross-origin through this CORS policy. Still, allowing arbitrary origins to call token-header endpoints increases blast radius if bearer/node/ops tokens are ever pasted into a browser context.

Recommended fix:

Restrict CORS to `https://farpy.com` for browser-facing endpoints and avoid advertising sensitive operator/worker headers to arbitrary origins. Keep machine-to-machine workers on server-side paths where CORS is irrelevant.

### 5. Rate-limit proof is incomplete for public abuse paths.

Evidence:

- Caddy has `request_body max_size 32KB` for `/funnel-event` at `/etc/caddy/Caddyfile:179-183`.
- Backend upload body cap exists at `scripts/job-api.mjs:24-25` and `scripts/job-api.mjs:76-99`.
- Systemd environment includes rate-like variables for one service, but this audit did not prove effective limits on auth, upload, checkout/topup, pair, heartbeat, worker claim, or NodeMuncher lease routes.
- Prior `FARPY_SECURITY_ATTACK_SURFACE_AUDIT_V1.md` also marked rate-limit proof as not proven.

Impact:

Abuse traffic could create cost/noise even if payment/render gates hold.

Recommended fix:

Add or prove rate limits at Caddy/API layer for:

- magic-link/signin
- upload/create
- checkout/topup invoice
- pair/heartbeat
- lease peek/claim
- worker claim/fail/complete

### 6. Some `/etc/farpy` files are still world-readable and should be reviewed.

Evidence:

- Most sensitive env/key files are `0600 root:root`.
- `ls -l /etc/farpy` still shows several `0644` root-owned files, including:
  - `farpy.env.bak.20251227T145610Z`
  - `worker.env.nodeid.1777580359`
  - `dhfm-config.json`
  - `nm-config-gpu*.json`
  - status/manifest/policy files

Impact:

The audit did not print file contents and did not prove these contain secrets. The naming suggests at least some are backup/config artifacts that should be reviewed and set to least-readable permissions if they contain credentials or node identity.

Recommended fix:

Review the remaining `0644` files under `/etc/farpy`. Any file containing credentials, tokens, webhook secrets, node identity, or private endpoint material should be `0600 root:root`.

### 7. Auth boundary is confusing and should be documented or hardened.

Evidence:

- Local and production `scripts/job-api.mjs:154-166` derive web-render identity from `farpy_user` cookie.
- Public HTTPS probes with a fake `farpy_user` cookie against `/node/v1/web-render/wallet/balance`, `/wallet/transactions`, `/account/renders`, and BTCPay invoice routes returned `401 auth_required`.
- Direct public exploitation was not reproduced.

Impact:

No public forged-cookie exploit was proven, but the service source appears to trust a raw cookie if it reaches this API. This is acceptable only if the reverse proxy/auth layer reliably strips or normalizes untrusted cookies and only emits trusted session identity.

Recommended fix:

Make the web-render API verify a signed session cookie or call the auth service directly, rather than relying on a raw `farpy_user` value. At minimum, document the proxy/session trust boundary and add a regression test proving forged external `farpy_user` cookies are rejected.

## P2

### 1. CSP still allows `unsafe-inline` and `unsafe-eval`.

Evidence:

- Public header includes `script-src 'self' 'unsafe-inline' 'unsafe-eval' ...`.

Impact:

Not a current launch blocker because the app uses inline scripts/Next behavior, but tightening CSP should remain on the hardening backlog.

### 2. Ops dashboard token is entered in browser state.

Evidence:

- `src/components/OpsCommandCenter.tsx` stores the operator token in React state and sends it as `x-farpy-ops-token`.

Impact:

Not a public vulnerability by itself, but operator screenshots/browser extensions could leak the token. Continue treating `/ops` as internal.

### 3. Tokenized workspace/receipt URLs remain the product model.

Evidence:

- `src/components/Workspace.tsx:239-240` reads `download_token` and `receipt_token` from URL query.
- `src/components/ReceiptPage.tsx:99-105` builds raw receipt/download URLs with those tokens.
- Privacy/docs copy warns users not to share tokenized links.

Impact:

Acceptable for alpha, but token-in-URL links are inherently shareable and can leak through screenshots or copied URLs. Analytics sanitization is present, which reduces one major leak path.

## Attack Surface Table

| Route | Method | Auth required | Observed behavior | Risk |
|---|---:|---|---|---|
| `/` | GET/HEAD | No | 200, security headers except HSTS | P1 HSTS gap |
| `/topup` | GET/HEAD | No page shell | 200, security headers except HSTS | P1 HSTS gap |
| `/signin` | GET/HEAD | No | 200, security headers except HSTS | P1 HSTS gap |
| `api.farpy.com/healthz` | HEAD | No | 200, HSTS present | OK |
| `/checkout` | POST | Session | Valid unauth JSON -> 401; malformed -> 400 | OK |
| `/node/v1/web-render/btcpay/webhook` | POST | Signature | Unsigned -> 400 invalid_signature | OK |
| `/node/v1/web-render/worker/claim` | POST | Worker token | Missing/query bad token -> 404 | OK |
| `/node/v1/nodemuncher/lease/peek` | POST | Node token | Missing token -> 403 | OK |
| `/node/v1/web-render/ops/summary` | GET | Ops token | Missing token -> 403 | OK |
| `/node/v1/web-render/ops/alerts/ack` | POST | Ops token | Missing token -> 403 | OK |
| `/node/v1/web-render/jobs/:id/download?token=...` | GET | Per-job token | Bad/missing job -> 404 | OK |
| `/node/v1/web-render/jobs/:id/receipt?token=...` | GET | Per-job token | Bad/missing job -> 404 | OK |
| `/node/v1/web-render/jobs/:id/price` | POST | Job token/session not required | Malformed -> 400; missing job -> 404 | OK |
| `/node/v1/web-render/jobs/create` | POST | No | Malformed -> 500 | P1 |
| `/outputs/`, `/receipts/` | GET | N/A | 404 live | OK today; legacy route risk |
| `/.env`, `/.git/config` | GET | N/A | 404 | OK |
| `/../../etc/passwd` | GET | N/A | 404 | OK |

## Top Concrete Vulnerabilities / Risks

1. `POST /node/v1/web-render/jobs/create` malformed JSON causes public 500.
2. `farpy.com` lacks HSTS despite API domain having it.
3. Active Caddyfile still contains `/outputs/*` and `/render-output/*` direct file-server routes.
4. API CORS allows all origins and advertises sensitive token headers.
5. Effective rate limiting is not proven for auth/upload/topup/pair/heartbeat/lease.
6. Some `/etc/farpy` backup/config files remain `0644` and require content review.
7. Web-render source relies on raw `farpy_user` cookie identity; public forged-cookie probe failed, but the trust boundary should be made explicit or cryptographic.
8. CSP remains permissive with `unsafe-inline` and `unsafe-eval`.
9. Ops token is browser-entered and must be kept out of screenshots/extensions.
10. Tokenized download/receipt URLs remain shareable by design.

## Top Existing Protections

1. Download and receipt endpoints use timing-safe token comparison.
2. Unauthenticated job status redacts `download_url`, `receipt_url`, private tokens, owner identity, and payment IDs.
3. Worker auth no longer accepts query-string worker tokens.
4. NodeMuncher lease/input/progress/complete routes require node-token auth and node ownership.
5. Worker and NodeMuncher completion validate ZIP structure and exact frame count before receipt minting.
6. Receipt minting requires output path and output SHA.
7. Failed wallet-funded jobs without delivery artifact have an idempotent refund path.
8. Stripe webhook validates signatures and idempotently records processed events.
9. BTCPay webhook validates HMAC signature, verifies invoice with BTCPay, and credits idempotently.
10. Production service listeners are localhost/private except SSH and Caddy 80/443.
11. Secrets are mostly in root-owned env files and systemd output no longer showed secret values inline.
12. Analytics strips query strings and does not intentionally send receipt/download tokens.

## Commands Run

```powershell
Select-String -Path scripts\job-api.mjs -Pattern ...
Select-String -Path src\components\*.tsx,src\lib\*.ts,src\app\**\*.tsx,scripts\*.mjs -Pattern ...
rg -n "TODO|FIXME|HACK|localhost|127\.0\.0\.1|0\.0\.0\.0|secret|password|token|api[_-]?key|eval\(|child_process|exec\(|spawn\(|fetch\(" scripts src public release
Invoke-WebRequest -Method Head https://farpy.com/
Invoke-WebRequest -Method Head https://farpy.com/topup
Invoke-WebRequest -Method Head https://farpy.com/signin
Invoke-WebRequest -Method Head https://api.farpy.com/healthz
Invoke-WebRequest -Method POST https://farpy.com/node/v1/web-render/worker/claim?worker_token=bad
Invoke-WebRequest -Method POST https://farpy.com/node/v1/nodemuncher/lease/peek
Invoke-WebRequest -Method POST https://farpy.com/checkout
Invoke-WebRequest -Method POST https://farpy.com/node/v1/web-render/btcpay/webhook
Invoke-WebRequest https://farpy.com/.env
Invoke-WebRequest https://farpy.com/.git/config
Invoke-WebRequest https://farpy.com/../../etc/passwd
Invoke-WebRequest https://farpy.com/outputs/
Invoke-WebRequest https://farpy.com/receipts/
ssh root@farpy.com 'nl -ba /etc/caddy/Caddyfile'
ssh root@farpy.com 'ss -ltnp'
ssh root@farpy.com 'ls -l /etc/farpy'
ssh root@farpy.com 'systemctl cat farpy-web-render-api.service farpy-jobs-api.service'
node --check scripts\job-api.mjs
```

## Overall Recommendation

Retail alpha security recommendation: YES, with P1 hardening queued immediately.

Broad public launch recommendation: NO, until HSTS, malformed create JSON, legacy static output routes, CORS tightening, and rate-limit proof are addressed.
