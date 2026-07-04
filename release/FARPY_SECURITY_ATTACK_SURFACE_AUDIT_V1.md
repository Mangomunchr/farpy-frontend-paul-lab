# FARPY_SECURITY_ATTACK_SURFACE_AUDIT_V1

Date: 2026-06-28
Mode: read-only security audit. No production changes were made.
Verdict: FAIL until P0 is fixed.

## P0

- `scripts/job-api.mjs:570-628` - Unauthenticated `GET /node/v1/web-render/jobs/:job_id` returns `download_url` and `receipt_url` with embedded tokens when the output/receipt exists. Live probes against known completed jobs returned 200 and response properties included `download_url` and `receipt_url`. Because job IDs are short public-style IDs, this creates an avoidable receipt/download token disclosure path for anyone who obtains or guesses a job ID.

## P1

- `/etc/farpy/*.env` production inspection - Several environment files containing secret-like variable names are group/world-readable (`0640` or `0644`), including files with Redis, AWS, webhook, database, and agent-token names. Values were not printed. This is not proven remotely exploitable, but it increases blast radius for any local service/user compromise.
- Production `systemctl cat farpy-jobs-api.service` - The jobs API service still has inline `Environment=` entries visible in unit output. Values were redacted in the audit output, but this partially defeats the prior secret-move hardening goal.
- `scripts/job-api.mjs:1276-1287` - Worker token auth accepts `worker_token` in the query string. Query tokens can land in access logs, referrers, browser history, or copied URLs. Header-based worker auth exists and should be the only accepted production path.
- `scripts/job-api.mjs:2478-2484` - `POST /node/v1/jobs/:job_id/price` still calls `JSON.parse(body || "{}")` without local malformed-JSON handling. `/checkout` and BTCPay invoice paths fail closed correctly; this route has not been brought to the same standard.
- Live header audit - Baseline security headers are present, but the CSP allows `script-src 'unsafe-inline' 'unsafe-eval'`. This may be needed for current Next/static behavior, but it weakens XSS containment and should be tightened when feasible.
- OAuth start route - `GET /auth/google?next=https://evil.example/` reaches the Google redirect flow instead of rejecting the external `next` at the start route. Final callback sanitization was not proven during this audit, so this is marked as redirect-safety risk, not a proven open redirect.

## P2

- Live static route `/proof` returns 404 while earlier launch materials referenced a proof page. This is not a security blocker, but public link/sitemap consistency should remain clean.
- Rate limits for login, topup, upload, pairing, heartbeat, and queue-spam were not proven from repository/config evidence. This is an abuse-resistance gap to verify before broader traffic.
- Caddy exposes legacy/static output route patterns, but `/opt/farpy.com/out/outputs` and `/opt/farpy.com/out/render-output` did not exist during inspection. No exposed artifacts were found.

## Attack Surface Table

| route | method | auth required | observed behavior | risk |
|---|---:|---|---|---|
| `/` | GET/HEAD | no | 200 | public page; OK |
| `/signin` | GET/HEAD | no | 200 | public auth page; OK |
| `/account` | GET/HEAD | app-level | 200 shell | account data fetched by API; OK if API remains gated |
| `/topup` | GET/HEAD | app-level | 200 shell | card UI public shell; checkout API gated |
| `/workspace` | GET/HEAD | app-level/job URL | 200 shell | job API exposure is P0 due status response tokens |
| `/receipt` | GET/HEAD | tokenized data | 200 shell | receipt API should remain token-gated |
| `/downloads` | GET/HEAD | no | 200 | public downloads; OK |
| `/api`, `/addon`, `/pricing`, `/faq`, `/docs`, `/privacy`, `/terms`, `/refunds`, `/contact`, `/status` | GET/HEAD | no | 200 | public docs/legal; OK |
| `/proof` | HEAD | no | 404 | P2 route/link consistency issue |
| `/v1/auth/me` | GET | no | 200 `{authenticated:false}` when signed out | safe public session probe |
| `/v1/auth/logout` | POST | no | 200 signed out | idempotent logout; low risk |
| `/auth/google?next=/account` | GET | no | 302 to Google, secure session cookie | provider configured; OK |
| `/auth/google?next=https://evil.example/` | GET | no | 302 to Google | P1 unless final callback rejects external next |
| `/checkout` | POST | yes | valid unauth JSON -> 401 `auth_required`; malformed -> 400 `invalid_json` | protected; OK |
| `/node/v1/web-render/wallet/balance` | GET | yes | 401 signed out | protected; OK |
| `/node/v1/web-render/wallet/transactions` | GET | yes | 401 signed out | protected; OK |
| `/node/v1/web-render/account/renders` | GET | yes | 401 signed out | protected; OK |
| `/node/v1/web-render/uploads/create` | POST | file/job flow | empty body -> 400 `empty_upload` | upload caps/path checks exist; auth model depends on flow |
| `/node/v1/web-render/jobs/:job_id` | GET | should not disclose tokens | known jobs returned 200 with `download_url`/`receipt_url` properties | P0 token disclosure |
| `/node/v1/web-render/jobs/:job_id/download?token=...` | GET | token | source uses timing-safe token compare | protected if token not disclosed |
| `/node/v1/web-render/jobs/:job_id/receipt?token=...` | GET | token | source uses timing-safe token compare | protected if token not disclosed |
| `/node/v1/web-render/stripe/webhook` | POST | Stripe signature | unsigned body -> 400 `invalid_signature` | protected; OK |
| `/node/v1/web-render/btcpay/webhook` | POST | BTCPay signature | unsigned body -> 400 `invalid_signature` | protected; OK |
| `/node/v1/web-render/btcpay/invoice` | POST | Farpy session | unauth -> 401; malformed -> 400 | protected; Lightning UI gated |
| `/node/v1/web-render/worker/claim` | POST | worker token | no/wrong token -> 404 | fail-closed; query token support is P1 |
| `/node/v1/web-render/nodemuncher/lease/peek` | POST | node token | no/wrong token -> 403 | protected; OK |
| `/node/v1/web-render/ops/summary` | GET | ops token | no/wrong token -> 404 | protected; OK |
| `http://farpy.com:8097/health` | GET | n/a | direct TCP connect failed externally | direct backend port not publicly reachable |
| `https://api.farpy.com/healthz` | GET | no | 200 health JSON | public health; OK |

## Top 10 Concrete Vulnerabilities / Risks

1. P0 unauthenticated job status leaks tokenized download and receipt URLs (`scripts/job-api.mjs:570-628`).
2. Production secret-bearing env files are not uniformly `0600 root:root`.
3. `farpy-jobs-api.service` still exposes inline `Environment=` entries via systemd unit output.
4. Worker auth accepts query-string token fallback (`scripts/job-api.mjs:1276-1287`).
5. Malformed JSON handling is not universal across state-changing job routes (`scripts/job-api.mjs:2478-2484`).
6. OAuth start route accepts external `next` into the provider flow; final callback safety not proven in this audit.
7. CSP baseline still permits `unsafe-inline` and `unsafe-eval` scripts.
8. Rate limiting for login/upload/topup/pairing/heartbeat/queue spam was not proven.
9. Static `/proof` route mismatch can create launch trust noise, though not a direct security defect.
10. Private-interface listener `10.10.20.2:19191` exists; it was not externally reachable-tested beyond public port checks and should remain WireGuard/private only.

## Top 10 Existing Protections

1. Public backend port `8097` is not externally reachable; production binds the job API to localhost.
2. Baseline headers are present: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, and CSP.
3. Stripe webhook rejects unsigned requests with `invalid_signature`.
4. BTCPay webhook rejects unsigned requests with `invalid_signature`.
5. BTCPay webhook verifies invoice state/store/amount before crediting.
6. Wallet topup amounts are server-tiered/allowlisted for Stripe and Lightning.
7. Wallet/Stripe webhook processing has idempotency file/event checks.
8. Download and receipt endpoints use timing-safe token comparison.
9. Upload path handling uses basename-style sanitization and file extension allowlists for `.blend`/`.orbx`.
10. Worker ZIP completion validation requires manifest, job JSON, render log, and exact expected frame files.

## Immediate Hardening Plan

1. Remove `download_url` and `receipt_url` from unauthenticated job status responses, or require a job-status token/session before returning tokenized action URLs.
2. Rotate affected download/receipt tokens for recent jobs if they may have been exposed through public job status calls.
3. Set all secret-bearing `/etc/farpy/*` env/key files to `0600 root:root` and move remaining inline systemd secrets into protected env files.
4. Remove `worker_token` query-string fallback from worker auth after confirming all workers use headers.
5. Add safe JSON parsing to every state-changing JSON route, starting with job price.
6. Reject unsafe `next` values at the OAuth start route as well as callback.
7. Add or verify rate limits at Caddy/API layer for auth, upload, topup, pair, heartbeat, and lease endpoints.

## What Can Wait

- CSP tightening can wait until the static frontend can run without `unsafe-inline`/`unsafe-eval`.
- `/proof` route cleanup is a trust/link quality task, not a security blocker.
- Static legacy output route removal can wait if output directories remain absent, but keep it on the cleanup list.
- Broader NodeMuncher token-at-rest hardening can follow after public-worker scope is reopened.

## Commands Run

```powershell
Set-Location 'C:\Users\danki\Desktop\farpy-frontend'
rg -n "auth|token|secret|password|webhook|checkout|upload|complete|download|receipt|wallet|btcpay|stripe|cookie|SameSite|HttpOnly|csrf|cors|Access-Control|node/v1|lease|heartbeat|pair" scripts src public release -S --glob '!out/**' --glob '!node_modules/**'
rg -n "createServer|pathname ===|match\(|req.method|send\(|setHeader|Set-Cookie|Access-Control|workerTokenOk|requireAuth|requireNodeTokenAuth|btcpayWebhookSignatureValid|stripeWebhookSignatureValid|readRawBody|safeName|createWalletTopupSession|createStripeCheckoutSession|validateWorkerZip" scripts\job-api.mjs -S
rg -n "Caddyfile|reverse_proxy|header |respond|redir|handle_path|8097|farpy-web-render-api|Environment=|EnvironmentFile|STRIPE|BTCPAY|OPS_TOKEN" release scripts src -S --glob '!out/**'
Invoke-WebRequest probes against public routes, checkout, wallet/account APIs, webhooks, worker routes, NodeMuncher routes, ops summary, auth routes, and known job status URLs.
ssh root@farpy.com read-only inspections: ss listeners, caddy validate, selected Caddy route grep, systemctl env redaction grep, /etc/farpy env permission listing, webroot backup/output file checks.
curl -sSI https://farpy.com/
curl -sSI https://api.farpy.com/healthz
curl -sS -m 5 -D - http://farpy.com:8097/health -o /dev/null
```

## Files Changed

- `release/FARPY_SECURITY_ATTACK_SURFACE_AUDIT_V1.md`
