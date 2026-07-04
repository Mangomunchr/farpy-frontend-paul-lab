# PLATFORM_REGRESSION_SUITE_V1

Status: CREATED
Date: 2026-06-30

## Objective

Create one read-only regression suite covering Farpy public and tokenized launch surfaces.

This milestone does not redesign the product, mutate production data, create payments, submit renders, or upload files. It creates a repeatable suite that can be run later as a launch gate.

## Files Created

- `scripts/regression/platform-regression-suite-v1.ps1`
- `release/PLATFORM_REGRESSION_SUITE_V1.md`

## One Command

Default public-safe run (uses `https://farpy.com` for pages and `https://api.farpy.com` for health/API-host checks):

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\regression\platform-regression-suite-v1.ps1 -OutputPath C:\tmp\platform-regression-suite-v1-latest.json
```

Optional private/tokenized checks:

```powershell
$env:FARPY_REGRESSION_JOB_STATUS_URL="https://farpy.com/node/v1/web-render/jobs/<JOB_ID>/status?token=<status_token>"
$env:FARPY_REGRESSION_DOWNLOAD_URL="https://farpy.com/node/v1/web-render/jobs/<JOB_ID>/download?token=<download_token>"
$env:FARPY_REGRESSION_RECEIPT_URL="https://farpy.com/receipt?job_id=<JOB_ID>&receipt_token=<receipt_token>&download_token=<download_token>"
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\regression\platform-regression-suite-v1.ps1 -OutputPath C:\tmp\platform-regression-suite-v1-latest.json
```

The script redacts token-like query values in evidence output.

## Coverage Matrix

| Area | Expected HTTP | Expected UI | Expected API | Expected failure mode |
| --- | --- | --- | --- | --- |
| Homepage | `200` | Hero, package-label flow, `Send package`; no stale `Start a render` / `Render Factory` language | Static public page only | `404/500`, stale CTA, mojibake/stale terms |
| Signin | `200` | Google sign-in and email sign-in visible | Auth start links available from page | `404/500`, missing sign-in options |
| Account | `200` | Balance/wallet shell visible; private data may require session | No mutation | Shell or sign-in prompt acceptable; `500` is failure |
| Workspace | `200` | Package tracker shell; no public `worker`, `lease`, `backend` wording | Private/tokenized job status optional via env | `404/500`, stale technical wording |
| Upload | `200` homepage upload surface | Package -> Output -> Frames -> Delivery -> Summary | No upload mutation in suite | Missing upload UI or stale render-lane labels |
| Topup | `200` | Card visible; Lightning not shown while gated | Checkout/invoice auth gates checked without creating payments | `500`, Lightning shown as live, unauth payment route accepts request |
| Wallet | `200` account shell | Wallet/history section visible | No mutation | `404/500` |
| Receipt | `200` shell, optional tokenized receipt URL | Delivery receipt shell or actual receipt if env provided | Receipt URL optional via env | `404/500`; missing receipt fields when private URL supplied |
| Download | Optional tokenized URL via env | Completed package ZIP downloads | Tokenized download returns non-empty zip-like artifact | Missing env skips; supplied bad URL fails |
| Status | `200` | Website, Wallet, Rendering, Receipts pillars visible | No mutation | `404/500` |
| Addon | `200` | Farpy Render Delivery and Download Blender Add-on visible | No mutation | `404/500`, missing install CTA |
| Benchmark | `200` public page; `200` stats/top APIs | Benchmark page visible | `/node/v1/leaderboard/stats` and `/top` public read-only | `404/500` |
| Node health | `200` `/healthz`; `/readyz` optional/soft | None | Health checks plus NodeMuncher auth gates | Health non-200; missing token accepted by heartbeat/lease |

## API Checks Included

- `GET /healthz`
- `GET /readyz` as a soft/non-required compatibility check
- `GET /node/v1/leaderboard/stats`
- `GET /node/v1/leaderboard/top`
- `POST /node/v1/web-render/jobs/create` malformed JSON must return `400`
- `POST /checkout` malformed JSON must return `400`
- `POST /checkout` valid unauthenticated JSON must return `401/403`
- `POST /node/v1/web-render/btcpay/invoice` unauthenticated must return `401/403`
- `POST /node/heartbeat` without node token must fail closed
- `POST /node/v1/nodemuncher/lease/peek` without node token must fail closed

## Private Checks

The suite deliberately does not invent private URLs. These are skipped unless provided:

- `FARPY_REGRESSION_JOB_STATUS_URL`
- `FARPY_REGRESSION_DOWNLOAD_URL`
- `FARPY_REGRESSION_RECEIPT_URL`

## Output

The suite prints:

- PASS/FAIL/SKIP per check
- HTTP status where available
- evidence URL or env var name
- timestamp
- final summary

It also writes JSON to the `-OutputPath` value.

## Exit Behavior

- Exit `0`: no required failures.
- Exit `1`: one or more required checks failed.
- Verdict `GREEN`: all checks pass and no skips.
- Verdict `YELLOW`: required checks pass but private optional checks are skipped.
- Verdict `RED`: at least one required check fails.

## Production Mutation Policy

No production mutations are performed by the default suite.

The suite does not:

- upload files
- create payments
- create invoices for authenticated users
- submit renders
- alter wallets
- complete jobs
- acknowledge alerts
- modify backend state

## Known Limits

This is a regression gate, not a full paid-customer E2E. Paid browser smoke remains a separate operator-approved flow because it requires real authentication and payment intent.

## Acceptance

- Regression runner created under `scripts/regression/`.
- Release note created.
- One command can execute the full public-safe suite later.
- Private/tokenized checks are explicit and skipped when env vars are missing.
- No production mutations.


## Validation Run

Command run:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\regression\platform-regression-suite-v1.ps1 -OutputPath C:\tmp\platform-regression-suite-v1-latest.json
```

Result from 2026-06-30 local run against production:

```text
VERDICT=RED
PASS=19
FAIL=2
SKIP=3
REQUIRED_FAIL=2
```

Failures captured by the suite:

- Workspace: `/workspace` returned `200`, but production HTML did not contain `Track your render from upload to download`.
- Upload/Homepage: `/` returned `200`, but production HTML still contained stale `Render Lane` copy.

Skipped checks were private/tokenized checks because no env vars were supplied:

- `FARPY_REGRESSION_JOB_STATUS_URL`
- `FARPY_REGRESSION_DOWNLOAD_URL`
- `FARPY_REGRESSION_RECEIPT_URL`

This validation did not mutate production.
