# FRESH_CUSTOMER_E2E_SMOKE_V1

Status: BLOCKED_MISSING_ENV
Timestamp: 2026-06-28T12:11:25Z

## Goal

Validate one fresh real-user path:

login/account -> top-up/payment -> wallet credit -> submit render -> job complete -> receipt exists -> ZIP/download works.

## Current result

The full fresh customer E2E has not been executed because the required legitimate customer inputs are not available in this Codex environment.

No authentication was bypassed, no wallet balance was injected, no database was edited, no payment was fabricated, and no render job was manually completed.

## Smoke preflight script

Use:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\fresh-customer-e2e-smoke-v1.ps1 -OutputPath C:\tmp\fresh-customer-e2e-smoke-v1-latest.json
```

The script validates prerequisites and exits nonzero with `BLOCKED_MISSING_ENV` or `BLOCKED_INVALID_ENV` when the real customer smoke cannot safely run.

## Required env vars

| Env var | Purpose | Secret |
| --- | --- | --- |
| `FARPY_SMOKE_EMAIL` | Fresh customer smoke account email address | No |
| `FARPY_SMOKE_AUTH_METHOD` | Legitimate auth method: `manual_magic_link`, `google_oauth`, or `session_cookie` | No |
| `FARPY_SMOKE_STRIPE_MODE` | Stripe mode for this smoke: `test` or `live` | No |
| `FARPY_SMOKE_BLEND_PATH` | Local path to a small known-good `.blend` file | No |
| `FARPY_SMOKE_TOPUP_AMOUNT_CENTS` | Expected Card top-up amount in cents | No |
| `FARPY_SMOKE_PAYMENT_APPROVED` | Must be `true` before any real checkout is performed | No |

When `FARPY_SMOKE_AUTH_METHOD=session_cookie`, also set:

| Env var | Purpose | Secret |
| --- | --- | --- |
| `FARPY_SMOKE_SESSION_COOKIE` | Legitimate session cookie from the smoke account | Yes |

Optional post-smoke proof env vars:

| Env var | Purpose | Secret |
| --- | --- | --- |
| `FARPY_AUDIT_JOB_STATUS_URL` | Tokenized completed job status URL | Yes |
| `FARPY_AUDIT_DOWNLOAD_URL` | Tokenized completed ZIP download URL | Yes |
| `FARPY_AUDIT_RECEIPT_URL` | Tokenized completed receipt URL | Yes |

## User/test account used

None yet.

A fresh account requires access to a real email inbox or legitimate authenticated customer session.

## Payment rail used

Card / Stripe is the currently enabled public payment rail.

Lightning is not part of this smoke and must not be used for this milestone.

## Job ID

None yet.

## Receipt URL/status

Not available yet.

## Download URL/status/size

Not available yet.

## Balance before/after

Not available yet.

## Last public production checks

Existing public smoke and regression checks were run to verify the non-private surfaces stayed healthy.

### PUBLIC_USER_SMOKE_V1

Evidence: `C:\tmp\fresh-customer-public-user-smoke.json`

- Verdict: YELLOW
- Pass: 6
- Fail: 0
- Skip: 3

Skipped because these private/tokenized inputs were not set:

- `FARPY_AUDIT_JOB_STATUS_URL`
- `FARPY_AUDIT_DOWNLOAD_URL`
- `FARPY_AUDIT_RECEIPT_URL`

### PRODUCTION_REGRESSION_AUDIT_V1

Evidence: `C:\tmp\fresh-customer-regression-smoke.json`

- Verdict: GREEN
- Pass: 40
- Fail: 0
- Skip: 3

Skipped checks were the same private/tokenized completed-job proofs.

## Final verdict

BLOCKED_MISSING_ENV until the required smoke prerequisites are supplied.

This is an operational-input blocker, not a proven code regression.