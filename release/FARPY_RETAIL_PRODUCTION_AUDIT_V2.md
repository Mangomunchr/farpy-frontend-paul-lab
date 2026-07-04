# FARPY_RETAIL_PRODUCTION_AUDIT_V2

Date: 2026-06-29
Production URL: https://farpy.com
Overall status: YELLOW

Retail alpha recommendation: YES, with operator-supervised first paid users.
Broad public launch recommendation: NO.

## Scope And Evidence

This audit used live production HTTPS probes, existing production audit scripts, read-only production service checks, source inspection, and one harmless unpaid upload/price/status smoke. No secrets, cookies, or tokens are printed here.

Browser automation note: the in-app browser control runtime failed locally before it could attach to the logged-in browser session. No owner session cookie was available in environment variables, so owner-only paid checkout, private receipt URL, and private download URL checks remain pending operator proof rather than being faked.

## Critical

No confirmed P0 customer-facing blocker was found in public route/API probes.

## High

### P1 - Fresh paid customer E2E was not completed in this audit

Evidence:
- `FARPY_AUTH_COOKIE=False`
- `FARPY_WEB_RENDER_COOKIE=False`
- `FARPY_SMOKE_SESSION_COOKIE=False`
- `FARPY_AUDIT_JOB_STATUS_URL=False`
- `FARPY_AUDIT_DOWNLOAD_URL=False`
- `FARPY_AUDIT_RECEIPT_URL=False`
- Existing `public-user-smoke-v1.ps1` run was blocked by the local approval layer.
- Browser control failed before connecting to the logged-in session.

Impact:
- Public pages, upload, pricing, and fail-closed payment gates are verified.
- A true paying-customer path from checkout to render to receipt/download was not re-proven in this pass.

Repro:
1. Run `scripts/fresh-customer-e2e-smoke-v1.ps1` with legitimate auth/payment env vars, or use a browser session that automation can control.
2. Top up by Card.
3. Submit a small Blender package.
4. Verify completed job, receipt, ZIP download, SHA-256 match, account history.

Recommended fix:
- Provide an operator-approved smoke account/session and run the fresh customer E2E script end to end before accepting non-founder paid traffic.

### P1 - Homepage advertises NodeMuncher download while downloads page says NodeMuncher is internal alpha

Evidence:
- `src/components/HomeRenderFlow.tsx` shows secondary CTA text: `Download NodeMuncher`.
- `src/app/downloads/page.tsx` says: `NodeMuncher worker builds are internal alpha artifacts and are not published as public user downloads.`
- Live homepage contains `Download NodeMuncher`.

Impact:
- Trust/product-language mismatch. A normal visitor can click a prominent CTA expecting a public desktop download, then hit a page saying that product is internal alpha.
- This does not block render purchase, but it undermines launch clarity.

Repro:
1. Visit `https://farpy.com/`.
2. Click `Download NodeMuncher`.
3. Land on `/downloads`, where NodeMuncher is described as internal alpha rather than a public download.

Recommended fix:
- Change the homepage secondary CTA to a retail-safe action, e.g. `View downloads`, `Download Benchmark`, or remove it until NodeMuncher is public.

### P1 - Public worker status appears inconsistent with Node A state

Evidence:
- Live public endpoint:
  - `GET https://farpy.com/node/v1/web-render/worker/status`
  - returned `{"ok":true,"running":false,"poll_seconds":5,"processed_jobs":1,"submitted_jobs":0,"running_jobs":1,"queue_cap":25}`
- Read-only Node A file:
  - `/var/lib/farpy-web-render/worker-status.json`
  - contained `running:true`, `submitted_jobs:1`, `running_jobs:0`, `heartbeat_at:"2026-06-23T07:12:13.209Z"`
- Node A services:
  - `farpy-web-render-api.service`: active
  - `caddy`: active

Impact:
- Customer-visible status and operator-visible status can disagree.
- If a customer job stalls, status may not be trustworthy enough to diagnose quickly.

Repro:
1. Run `curl https://farpy.com/node/v1/web-render/worker/status`.
2. On Node A, compare `/var/lib/farpy-web-render/worker-status.json`.

Recommended fix:
- Confirm which process/data path backs `/node/v1/web-render/worker/status`.
- Remove stale fallback source or make the endpoint report explicit `limited_visibility` if it cannot see worker truth.

## Medium

### P2 - `/proof` exists in local build but returns 404 in production

Evidence:
- `npm.cmd run build` lists `○ /proof`.
- Live probe: `GET https://farpy.com/proof` returned `404`.
- Same-origin crawl found no current public link to `/proof`.
- Sitemap does not advertise `/proof`.

Impact:
- Not a current public dead-link, but it is a route/deploy mismatch for an intended trust page.

Repro:
1. Run `curl -i https://farpy.com/proof`.
2. Compare local build route list showing `/proof`.

Recommended fix:
- Either add the missing Caddy/static rewrite for `/proof -> /proof.html`, or remove the source page until it is intentionally public.

### P2 - Several legacy/guard services are failed or inactive on Node A

Evidence:
- `systemctl list-units --type=service --all | grep -Ei 'farpy|render|worker|octane|node'`
- Failed examples:
  - `farpy-footer-guard.service`
  - `farpy-nodemuncher-receipt-verify.service`
  - `farpy-supergreen-guard.service`
  - `farpy-synthetic-monitor.service`
- Public operations audit still returned GREEN.

Impact:
- Not proven customer-facing, but failed guard services can reduce operator confidence.

Recommended fix:
- Classify each failed unit as retired, scheduled-only, or required. Disable retired units or repair required units.

## Verified Green Areas

### Public routes

Evidence:
- `scripts/production-regression-audit-v1.ps1` result:
  - `VERDICT=GREEN`
  - `PASS_COUNT=40`
  - `FAIL_COUNT=0`
  - `SKIP_COUNT=3`
- `scripts/production-operations-dashboard-v1.ps1` result:
  - `VERDICT=GREEN`
  - `PASS_COUNT=26`
  - `FAIL_COUNT=0`
  - `SKIP_COUNT=5`

Sample route timing:

| Route | HTTP | Time | Bytes |
|---|---:|---:|---:|
| `/` | 200 | 0.837s | 36987 |
| `/workspace` | 200 | 0.781s | 18855 |
| `/topup` | 200 | 0.792s | 18965 |
| `/account` | 200 | 0.831s | 19312 |
| `/receipt` | 200 | 1.023s | 18732 |
| `/pricing` | 200 | 0.885s | 25990 |
| `/downloads` | 200 | 0.779s | 23329 |
| `/status` | 200 | 0.785s | 25201 |
| `/benchmark/leaderboard` | 200 | 0.598s | 8157 |

### Sitemap and links

Evidence:
- `https://farpy.com/sitemap.xml`
  - `SITEMAP_COUNT=15`
  - `SITEMAP_BAD_COUNT=0`
- Same-origin crawl:
  - `LOCAL_LINK_COUNT=54`
  - `LOCAL_LINK_BAD_COUNT=0`

### SEO and public assets

Evidence from `https://farpy.com/`:
- `<title`: present
- `og:title`: present
- `twitter:card`: present
- `canonical`: present
- `application/ld+json`: present
- `Start Rendering`: present
- `SHA-256 verified downloads`: present

Asset probes:
- `/robots.txt`: 200
- `/sitemap.xml`: 200
- `/favicon.ico`: 200
- `/apple-touch-icon.png`: 200
- `/opengraph-image`: 200

### Upload, estimate, and unpaid job status

Evidence:
- Uploaded `public/smoke/real-smoke.blend` through the live web-render API:
  - `upload_id=UP-6DB3DD22`
  - `job_id=JOB-06144308`
  - `price_cents=1`
  - `payment_status=priced`
  - `sha256=9c3dcfc994ca10b7c1f3151f7685e38814013b2cdbac4a318826a08bfaaf7698`
- Valid price JSON:
  - `POST /node/v1/web-render/jobs/JOB-06144308/price`
  - returned 200 and preserved `price_cents=1`, `payment_status=priced`.
- Public unauthenticated job status:
  - `GET /node/v1/web-render/jobs/JOB-06144308`
  - returned safe fields only; no `download_url`, no `receipt_url`, no token.

### Payment and auth fail-closed checks

Evidence:
- `GET /v1/auth/me` as guest: 200 with `authenticated:false`.
- `GET /v1/wallet/balance` as guest: 401 `auth_required`.
- `POST /checkout` malformed JSON: 400 `invalid_json`.
- `POST /checkout` valid JSON as guest: 401 `auth_required`.
- `POST /node/v1/web-render/btcpay/bitcoin-invoice` as guest: 401 `auth_required`.
- `POST /node/v1/web-render/btcpay/invoice` as guest: 401 `auth_required`.
- `POST /node/v1/web-render/btcpay/webhook` unsigned: 400 `invalid_signature`.
- `POST /node/v1/web-render/stripe/webhook` unsigned: 400 `invalid_signature`.
- `POST /node/v1/web-render/jobs/JOB-06144308/create-checkout-session` as guest: 401 `auth_required`.
- `POST /node/v1/web-render/jobs/JOB-06144308/submit-render` unpaid: 402 `payment_required`.

### Auth redirects

Evidence:
- `GET /auth/google?next=%2Faccount`
  - returned 302 to Google OAuth.
  - Set-Cookie includes `HttpOnly`, `Secure`, `SameSite=Lax`.
- `GET /real`
  - returned 301 to `https://farpy.com/`.

### Worker and NodeMuncher auth gates

Evidence:
- `POST /node/v1/web-render/worker/claim?worker_token=bad`: 404 `not_found`.
- `POST /node/v1/nodemuncher/lease/peek` without token: 403 `forbidden`.
- Production regression audit confirms lease claim without token also rejects.

### Security headers

Observed on public/API responses:
- `Content-Security-Policy`: present.
- `X-Content-Type-Options: nosniff`: present.
- `X-Frame-Options: DENY`: present.
- `Referrer-Policy: strict-origin-when-cross-origin`: present.
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`: present.

### Build

Evidence:
- `npm.cmd run build`
  - compiled successfully.
  - generated 37 static pages.

## Commands Run

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\production-regression-audit-v1.ps1 -OutputPath C:\tmp\production-regression-audit-v2-run.json
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\production-operations-dashboard-v1.ps1 -OutputPath C:\tmp\production-operations-dashboard-v2-run.json
curl.exe -sS -X POST https://farpy.com/node/v1/web-render/uploads/create -F "file=@public\smoke\real-smoke.blend;filename=retail-audit-smoke.blend" -F "renderer=blender" -F "frame_count=1"
curl.exe -sS -i -X POST https://farpy.com/node/v1/web-render/jobs/JOB-06144308/price -H "content-type: application/json" --data-binary "@C:\tmp\farpy-price-body.json"
Invoke-WebRequest https://farpy.com/node/v1/web-render/jobs/JOB-06144308
curl.exe -sS -i -X POST https://farpy.com/node/v1/web-render/jobs/JOB-06144308/create-checkout-session -H "content-type: application/json" --data "{}"
curl.exe -sS -i -X POST https://farpy.com/node/v1/web-render/jobs/JOB-06144308/submit-render -H "content-type: application/json" --data "{}"
curl.exe -sS -i -X POST https://farpy.com/checkout -H "content-type: application/json" --data-binary "@C:\tmp\checkout-valid.json"
curl.exe -sS -i -X POST https://farpy.com/node/v1/web-render/btcpay/bitcoin-invoice -H "content-type: application/json" --data-binary "@C:\tmp\btc-valid.json"
curl.exe -sS -i -X POST https://farpy.com/node/v1/web-render/btcpay/invoice -H "content-type: application/json" --data-binary "@C:\tmp\ln-valid.json"
curl.exe -sS -i -X POST https://farpy.com/node/v1/web-render/btcpay/webhook -H "content-type: application/json" --data "{}"
curl.exe -sS -i -X POST https://farpy.com/node/v1/web-render/stripe/webhook -H "content-type: application/json" --data "{}"
curl.exe -sS -I --max-redirs 0 "https://farpy.com/auth/google?next=%2Faccount"
curl.exe -sS -I https://farpy.com/real
Invoke-WebRequest https://farpy.com/sitemap.xml
Invoke-WebRequest https://farpy.com/
curl.exe -sS -o NUL -w "%{http_code} %{time_total} %{size_download}" https://farpy.com/
ssh root@farpy.com "systemctl is-active farpy-web-render-api.service; systemctl is-active caddy"
ssh root@farpy.com "systemctl list-units --type=service --all | grep -Ei 'farpy|render|worker|octane|node' | head -80"
npm.cmd run build
```

## Final Retail Review

Would I let my parents use this?
- Yes, if I or an operator is watching the first few paid renders and they start with a small package.

Would I let a paying stranger use this?
- Yes for controlled retail alpha, not unattended broad launch.

Would I publicly launch today?
- Retail alpha: yes.
- Broad public launch: no.

Blockers before broad public launch:
- Complete one fresh paid customer E2E proof with receipt/download SHA verification.
- Align homepage NodeMuncher CTA with controlled-alpha reality.
- Resolve or explicitly downgrade the public worker-status consistency issue.

