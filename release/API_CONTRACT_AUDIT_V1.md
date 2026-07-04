# API_CONTRACT_AUDIT_V1

Status: DOCUMENTED
Date: 2026-06-30
Mode: Read-only audit, no API/code changes

## Objective

Audit every known public or publicly-routed Farpy API endpoint for purpose, auth, input, output, failure codes, retry behavior, idempotency, rate limit, documentation, and unknowns.

## Sources Inspected

- `scripts/job-api.mjs`
- `src/lib/api.ts`
- `src/components/ApiPage.tsx`
- `scripts/production-regression-audit-v1.ps1`
- `scripts/regression/platform-regression-suite-v1.ps1`
- `C:\Users\danki\Desktop\nodemuncher-codex\scripts\public-leaderboard-api.cjs`

## Overall Verdict

YELLOW.

The API surface is mostly identifiable and fail-closed. Strong points: token-gated downloads/receipts, owner-redacted job status, malformed JSON handling on major JSON routes, webhook signature checks, NodeMuncher token auth, ZIP validation before receipt minting, and benchmark POST body/rate limits.

Main gaps: most endpoints lack formal rate-limit docs, retry/idempotency guarantees are uneven, public docs lag newer endpoint families, and route aliases are confusing between `/node/v1/*`, `/node/v1/web-render/*`, `/v1/*`, `farpy.com`, and `api.farpy.com`.

## Web Render / Customer APIs

| Endpoint | Purpose | Auth | Input | Output | Failure codes | Retry / idempotency | Rate limit | Docs | Unknowns |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `GET /node/v1/health`, `GET /health` | Job API health | None | None | `{ ok, service, ts }` | `500` if service fails | Safe read | Not proven | Status/audits | Alias behavior for `/node/v1/web-render/health` |
| `GET /node/v1/worker/status` | Public worker/queue status | None | None | `{ ok, running, poll_seconds, processed_jobs, submitted_jobs, running_jobs, queue_cap }` | possible `500` | Safe read | Not proven | `/status`, `ApiPage` | Whether status should stay public/coarse |
| `POST /node/v1/uploads/create` | Upload `.blend`/`.orbx`; create job | Optional session | multipart/upload fields, filename, frames/renderer | upload/job ids, price, `download_token`, `receipt_token` | `400 empty_upload`, `400 unsupported_file_type`, `413`, queue errors, `500` | Retry creates duplicate unless client dedupes; not idempotent | Queue cap; upload rate not proven | `ApiPage`, UI/add-on | Exact max size and field schema |
| `POST /node/v1/jobs/create` | Metadata-only job create | Optional session | JSON filename/renderer/frames | job id + private tokens | `400 invalid_json`, `400 unsupported_file_type`, queue errors | Retry creates duplicate; not idempotent | Queue cap; no IP limit proven | Smoke/internal notes | Should it remain public? |
| `POST /node/v1/jobs/{id}/price` | Quote/set job price | Not clearly required | JSON price/frame body | public job | `400 invalid_json`, pricing errors, `404/409/500` | Same body likely safe; not formally idempotent | Not proven | `ApiPage`, frontend | Accepted body schema, owner rules |
| `POST /node/v1/jobs/{id}/submit-render` | Submit paid job | Session if owner path; internals in `submitRender` | path id | public job | `402 payment_required`, `404/409/500` | Retry after lost response should be okay by state; not formal | Not proven | `ApiPage`, workspace | Wrong-owner behavior, duplicate submit semantics |
| `GET /node/v1/jobs/{id}` | Job status | Optional; owner gets private URLs | path id + optional cookie | owner public job with private URLs; non-owner safe status | `404 job_not_found`, `500` | Safe polling | Not proven | `ApiPage`, security notes | Recommended poll interval |
| `POST /node/v1/jobs/{id}/create-checkout-session` | Stripe checkout for job | Required session | path id | checkout id/url/status | `401`, `404/409`, provider errors | User can retry; duplicate sessions possible | Not proven | `ApiPage`, workspace | Duplicate checkout behavior |
| `GET /node/v1/jobs/{id}/download?token=...` | Download output ZIP | Per-job token | path id + token | ZIP + `x-farpy-output-sha256` | `404 not_found` | Safe full retry; range unknown | Not proven | `ApiPage`, receipt/workspace | Token expiry, range support |
| `GET /node/v1/jobs/{id}/receipt?token=...` | Read receipt JSON | Per-job token | path id + token | receipt JSON | `404 not_found` | Safe read | Not proven | `ApiPage`, receipt page | Token expiry |

## Account / Wallet / Auth APIs

| Endpoint | Purpose | Auth | Input | Output | Failure codes | Retry / idempotency | Rate limit | Docs | Unknowns |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `GET /v1/wallet/balance`, `/node/v1/wallet/balance` | Read wallet balance | Required session | cookie | `{ ok, authenticated, user_id, email, balance_cents }` | `401`, `500` | Safe read | Not proven | Account/API page | Whether email/user_id should be public API fields |
| `GET /v1/wallet/transactions`, `/node/v1/wallet/transactions` | Wallet history | Required session | cookie | `{ ok, user_id, email, balance_cents, transactions }` | `401`, `500` | Safe read | Not proven | Account/API page | Pagination/export semantics |
| `GET /v1/account/renders`, `/node/v1/account/renders` | Package history | Required session | cookie | `{ ok, user_id, email, renders }` | `401`, `500` | Safe read | Not proven | Account UI | Pagination/retention |
| `POST /checkout`, `/v1/wallet/topup/session`, `/node/v1/wallet/topup/session` | Stripe wallet top-up checkout | Required session | JSON amount/tier | checkout session/url result | `400 invalid_json`, `401`, tier/provider errors | Session creation not idempotent; webhook credit idempotent | Not proven | Topup/audits | Exact amount constraints |
| `POST /v1/wallet/topup/btcpay/bitcoin-invoice`, `/node/v1/wallet/topup/btcpay/bitcoin-invoice`, `/node/v1/btcpay/bitcoin-invoice`, `/btcpay/bitcoin-invoice` | Bitcoin on-chain top-up invoice | Required session | JSON tier/amount selector | invoice/checkout URL | `400 invalid_json`, `401`, invalid tier/config/provider errors | Invoice creation not idempotent; credit idempotent by invoice | Not proven | Topup/release notes | Expiry, under/overpayment docs |
| `POST /v1/wallet/topup/btcpay/invoice`, `/node/v1/wallet/topup/btcpay/invoice`, `/node/v1/btcpay/invoice`, `/btcpay/invoice` | BTCPay invoice; Lightning-capable historical route | Required session | JSON tier | invoice result | `400 invalid_json`, `401`, invalid tier/config/provider errors | Same as Bitcoin | Not proven | Lightning notes | Should remain undocumented while Lightning gated |
| `GET /v1/auth/me` | Current session | Session optional | cookie | user/session JSON | frontend expects `401` unauth | Safe read | Unknown | frontend only | Implementing service/schema not in `job-api.mjs` |
| `POST /v1/auth/logout` | Clear session | Session optional | cookie | `{ ok }` expected | Unknown | Safe/idempotent conceptually | Unknown | frontend only | Implementing service/cookie behavior |
| `POST /v1/auth/magic-link` | Send magic link | None | JSON email/next | success/error | Unknown | repeated sends create emails | Unknown, should exist | auth UI | Provider/rate-limit schema |
| `GET /auth/google?next=...` | Start Google OAuth | None | query `next` | `302` to Google | Unknown | safe browser retry | Unknown | signin/release notes | state/CSRF and next allowlist details |

## Payment Webhooks

| Endpoint | Purpose | Auth | Input | Output | Failure codes | Retry / idempotency | Rate limit | Docs | Unknowns |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `POST /node/v1/stripe/webhook`, `/stripe/webhook` | Finalize Stripe topups/jobs | Stripe signature | raw event + `stripe-signature` | `{ ok, ignored, duplicate, already_captured }` | `400 invalid_signature`, finalization errors | Stripe retries safe; idempotent by event/session/payment | Not applicable/proven | Internal payment notes | Event allowlist and replay retention |
| `POST /node/v1/btcpay/webhook`, `/btcpay/webhook` | Finalize BTCPay wallet topups | BTCPay signature | raw event + `btcpay-sig` | `{ ok, ignored, duplicate, reason }` | `400 invalid_signature`, invoice/config errors | BTCPay retries safe if invoice idempotency holds | Not proven | Internal payment notes | Supported event types and replay retention |

## NodeMuncher Public Worker APIs

| Endpoint | Purpose | Auth | Input | Output | Failure codes | Retry / idempotency | Rate limit | Docs | Unknowns |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `POST /node/v1/nodemuncher/lease/peek` | Non-mutating work peek | Paired node token header | optional JSON/query job/renderer | `{ ok, node_id, job|null }` | `403`, possible `500` | Safe read; non-mutating | Not proven | NodeMuncher notes | Formal leaseJob schema |
| `POST /node/v1/nodemuncher/lease/claim` | Claim paid submitted job | Paired node token header | optional JSON/query job/renderer | `{ ok, node_id, job }`, possible `idempotent:true` | `403`, `402 payment_required`, `409 job_not_claimable`, `200 job:null` | Safe retry for same node/job; idempotent for active same-node claim | Not proven | NodeMuncher notes | Lease expiry/release contract |
| `GET /node/v1/nodemuncher/jobs/{id}/input`, `/node/v1/web-render/nodemuncher/jobs/{id}/input` | Download claimed input | Paired node token; same node/job | path id | octet-stream + job headers | `403`, `404` | Safe while lease active | Not proven | NodeMuncher E2E | Range/resume support |
| `POST /node/v1/nodemuncher/jobs/{id}/progress`, `/node/v1/web-render/nodemuncher/jobs/{id}/progress` | Report progress | Paired node token; same node/job | JSON/header/query rendered count | public job | `403`, `404`, `409 job_not_running`, `400 invalid_rendered_frame_count` | Same/higher count safe; monotonic-ish | Not proven | NodeMuncher notes | Recommended frequency |
| `POST /node/v1/nodemuncher/jobs/{id}/complete`, `/node/v1/web-render/nodemuncher/jobs/{id}/complete` | Upload ZIP, complete, mint receipt | Paired node token; same node/job | raw ZIP + rendered count header/query | public job | `403`, `404`, `409`, `400` ZIP/frame errors | Check status before retry after timeout; not formally idempotent | Not proven | NodeMuncher E2E | Duplicate complete after lost response |
| `POST /node/v1/nodemuncher/jobs/{id}/fail`, `/node/v1/web-render/nodemuncher/jobs/{id}/fail` | Report render failure/refund eligible debit | Paired node token; same node/job | optional JSON failure fields | public job | `403`, `404`, `409 job_already_complete`, `409 job_not_running` | Retry after failed returns current failed job; refund idempotent | Not proven | Failure-report notes | Formal retryable semantics |

## Remote Worker APIs

| Endpoint | Purpose | Auth | Input | Output | Failure codes | Retry / idempotency | Rate limit | Docs | Unknowns |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `POST /node/v1/worker/claim` | PR/remote worker claim loop | Worker token header | worker id/renderer headers | `{ ok, job:null|job }` | `404`, `500` | Poll no-work safe; claim mutates | Not proven | Octane worker notes | Lease timeout/recovery |
| `GET /node/v1/worker/jobs/{id}/input` | Worker input download | Worker token | path id | octet-stream | `404` | Safe while job/input exists | Not proven | Worker notes | Range/resume |
| `POST /node/v1/worker/jobs/{id}/complete` | Worker ZIP complete + receipt | Worker token | raw ZIP + rendered count | public job | `404`, `409 job_not_running`, `400` validation | Check status before retry; not formally idempotent | Not proven | Worker notes | Duplicate complete behavior |
| `POST /node/v1/worker/jobs/{id}/fail` | Worker failure report | Worker token | optional JSON failure | public job | `404`, `500` | Refund path idempotent; route retry semantics less explicit | Not proven | Worker notes | Already-failed semantics |

## Ops APIs

| Endpoint | Purpose | Auth | Input | Output | Failure codes | Retry / idempotency | Rate limit | Docs | Unknowns |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `GET /node/v1/ops/summary` | Internal ops summary/alerts | Ops token; 404 if token not configured | token header | summary JSON | `404`, `403`, `500` | Safe read | Not proven | Ops docs | Accepted token header/query forms |
| `POST /node/v1/ops/alerts/ack` | Acknowledge alerts | Ops token | JSON `{ ids }` | `{ ok, acknowledged }` | `404`, `403`, `400 invalid_json`, `400 missing_alert_ids` | Safe same ids; set semantics | Not proven | Ops docs | Route does not prove underlying condition resolved |

## Benchmark Leaderboard APIs

Base: `/node/v1/leaderboard`.

| Endpoint | Purpose | Auth | Input | Output | Failure codes | Retry / idempotency | Rate limit | Docs | Unknowns |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `POST /submit` | Submit receipt-shaped benchmark row | None proven | JSON benchmark payload | `201 { result_id, rank, sample_count, percentile_label }` | `400`, `413`, `429`, `500 Storage error` | Retry may duplicate unless stable result id; weak idempotency | Yes: per-IP POST/minute in memory | Benchmark API docs | Abuse controls beyond process memory |
| `GET /`, `/top?limit=n` | Top benchmark rows | None | optional limit 1-100 | `{ sample_count, total_submissions, rows }` | `404`, possible storage errors | Safe read | None proven | Benchmark docs | Cache policy |
| `GET /stats` | Aggregate stats | None | none | totals/top/median/common GPUs | `404`, possible storage errors | Safe read | None proven | Benchmark docs | Cache policy |
| `GET /gpus` | GPU aggregates | None | none | `{ total_gpus, gpus }` | `404`, possible storage errors | Safe read | None proven | GPU notes | Public docs completeness |
| `GET /gpu/{slug}` | GPU summary | None | slug `[a-z0-9-]{2,80}` | GPU stats, versions, percentiles | `400 Invalid GPU slug`, `404 GPU not found` | Safe read | None proven | GPU docs | Cache policy |
| `GET /compare/{a}/{b}` | Compare GPUs | None | two slugs | GPU summaries + deltas | `400`, `404` | Safe read | None proven | Compare docs | Same-GPU semantics |
| `GET /result/{id}` | Public result summary | None | safe result id | result/rank/percentile JSON | `400`, `404` | Safe read | None proven | Result docs | ID collision behavior |
| `GET /search?q=...` | Search benchmark data | None | query string | `{ query, result_count, results<=50 }` | Storage errors; empty-query behavior not clearly 400 | Safe read | None proven | Search docs | Empty query contract mismatch |
| `GET /latest?limit=n` | Newest results | None | limit default 25 max 100 | `{ limit, result_count, results }` | `404`, storage errors | Safe read | None proven | Latest docs | Cache policy |
| `GET /rank?score=n` | Prospective score rank | None | positive numeric score | `{ rank, sample_count, percentile_label }` | `400` invalid score | Safe read | None proven | Not clearly public docs | Whether to keep public |

## Explicit Dev/Internal Routes

These exist in `scripts/job-api.mjs` but return `404 not_found` in production via `IS_PRODUCTION` guards:

- `POST /node/v1/jobs/{id}/mark-running`
- `POST /node/v1/jobs/{id}/mark-complete`
- `POST /node/v1/jobs/{id}/mark-failed`
- `POST /node/v1/jobs/{id}/attach-output`
- `POST /node/v1/jobs/{id}/mint-receipt`
- `POST /node/v1/jobs/{id}/authorize-payment-dev`
- `POST /node/v1/jobs/{id}/capture-payment-dev`
- `POST /node/v1/jobs/{id}/fail-payment-dev`

Contract: not production APIs. Expected production response is `404`.

## Cross-Cutting Findings

### Strengths

- Malformed JSON is explicitly handled on checkout, job create, price, ops ack, and BTCPay invoice paths.
- Download and receipt endpoints use timing-safe token comparison.
- Job status redacts private URLs from unauthenticated/non-owner responses.
- NodeMuncher lease claim is idempotent for the same node and active claimed job.
- Benchmark submit has explicit body size and per-IP POST rate limit.
- Worker and NodeMuncher complete paths validate ZIP/frame counts before minting receipts.
- Stripe and BTCPay webhooks require signatures.

### Gaps / Unknowns

- Rate limits are absent or not proven for most customer, auth, topup, and worker endpoints.
- Public API docs do not include every live endpoint family, especially auth, Bitcoin/BTCPay, NodeMuncher, worker, ops, and benchmark rank/search/gpus.
- Alias behavior is confusing: docs mention `/node/v1/web-render/*`, implementation shows `/node/v1/*`, and some checks use `api.farpy.com` for health/NodeMuncher.
- Exact request/response schemas are informal for uploads, pricing, checkout, account renders, auth, and NodeMuncher lease payloads.
- Retry/idempotency is not formally guaranteed for several mutating endpoints that customers/workers may retry after network loss.
- Error envelope is not uniform: web-render tends toward `{ ok:false, error }`; leaderboard uses `sendError` message shape.
- CORS policy and abuse controls are not expressed per endpoint in public docs.

## Documentation Status

| Surface | Current status |
| --- | --- |
| Public customer render API | Partially documented in `src/components/ApiPage.tsx`. |
| Wallet/account API | Partially documented in `src/components/ApiPage.tsx`. |
| Benchmark API | Documented through benchmark API milestones/pages, but audit found `/rank` and empty search behavior need clarification. |
| Auth API | Used by frontend, not fully contract-documented in repo. |
| Payment webhooks | Internal-only, release-note documented. |
| NodeMuncher APIs | Release-note documented, not public customer docs. |
| Worker APIs | Internal/remote-worker release-note documented. |
| Ops APIs | Internal ops release-note documented. |

## Recommended Next Actions

1. Publish a customer-safe `API_CONTRACT_V1` page generated from the customer/benchmark sections only.
2. Create a separate internal `WORKER_API_CONTRACT_V1` for NodeMuncher, PR worker, and ops endpoints.
3. Formalize retry/idempotency rules for `uploads/create`, `submit-render`, checkout creation, and worker complete.
4. Add rate limit documentation and tests for upload/auth/topup/worker endpoints.
5. Normalize route prefixes and explicitly document aliases.
6. Add schema examples for every public request/response shape.
7. Decide whether `/node/v1/jobs/create` and benchmark `/rank` are officially public or legacy/support routes.

## Commands Run

Read-only inspection only:

```powershell
rg -n "pathname ===|pathname\.match|req\.method|/node/v1|/v1/|/checkout|/btcpay|/stripe|/auth|/wallet|/jobs|/uploads|/leaderboard|/ops|/worker|nodemuncher|healthz|readyz" scripts src/app src/lib -S
Get-ChildItem -Path C:\Users\danki\Desktop -Recurse -Filter public-leaderboard-api.cjs
Select-String -Path C:\Users\danki\Desktop\nodemuncher-codex\scripts\public-leaderboard-api.cjs -Pattern "pathname|leaderboard|result|gpu|compare|search|latest|stats|top|sitemap"
Get-Content selected route dispatch ranges from scripts\job-api.mjs
Get-Content selected route dispatch ranges from public-leaderboard-api.cjs
rg -n "auth/google|auth/me|auth/logout|magic|signin|callback|farpy_user|Set-Cookie|cookie" scripts src -S
Get-Content src\components\ApiPage.tsx
```

No API changes were made.
No production changes were made.
No secrets were printed.
