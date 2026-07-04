# LIGHTNING_PAYMENT_E2E_V1

Date: 2026-06-27
Status: BLOCKED

Lightning remains hidden from public UI. The backend foundation was deployed and the BTCPay webhook was moved to the repaired web-render route, but a complete invoice -> paid -> webhook -> wallet-credit E2E was not executed because it requires a legitimate authenticated Farpy session and operator manual payment. No auth bypass or forged user cookie was used.

## Production Changes Completed

### Web-render API deploy

Deployed repaired `scripts/job-api.mjs` to production:

- Target: `/opt/farpy-web-render/scripts/job-api.mjs`
- Backup: `/opt/farpy-web-render/scripts/job-api.mjs.bak.lightning_payment_e2e.20260627T001626Z`
- Service restarted: `farpy-web-render-api.service`
- Service status: `active`

Validation:

```text
HEALTH={"ok":true,"service":"farpy-job-api","ts":"2026-06-27T00:15:06.597Z"}
UNSIGNED_WEBHOOK=400 {"ok":false,"error":"invalid_signature"}
```

### Public webhook route

Verified repaired public route fails closed:

```text
POST https://farpy.com/node/v1/web-render/btcpay/webhook
=> 400 {"ok":false,"error":"invalid_signature"}
```

Legacy route still fails closed:

```text
POST https://api.farpy.com/btcpay/webhook
=> 401 {"ok":false,"err":"bad_signature"}
```

### BTCPay webhook registration

Updated existing BTCPay webhook:

- Webhook ID: `YH9hxL5iLr5ptMbPkECMSe`
- URL: `https://farpy.com/node/v1/web-render/btcpay/webhook`
- Enabled: `true`
- Automatic redelivery: `true`
- Authorized events count: `5`

Verified after update:

```text
UPDATE_WEBHOOK=200
DETAIL_AFTER=200
url=https://farpy.com/node/v1/web-render/btcpay/webhook
enabled=True
automaticRedelivery=True
event_count=5
```

## E2E Procedure Status

| Step | Status | Evidence |
| --- | --- | --- |
| Deploy `LIGHTNING_FOUNDATION_REPAIR_V1` | PASS | Production web-render API restarted and healthy. |
| Configure BTCPay webhook | PASS | Webhook now points to repaired web-render route. |
| Verify unsigned webhook rejected | PASS | Public route returns `400 invalid_signature`. |
| Create authenticated `$1` Lightning invoice | BLOCKED | Requires a legitimate signed-in Farpy session. Forging a `farpy_user` cookie was rejected as an auth-bypass risk and was not performed. |
| Operator manually pays invoice | NOT RUN | No invoice was created through authenticated Farpy path. |
| Observe BTCPay status transition | NOT RUN | Blocked before paid invoice. |
| Verify webhook delivery/signature | NOT RUN | Blocked before paid invoice. |
| Verify wallet credit | NOT RUN | Blocked before paid invoice. |
| Verify account history | NOT RUN | Blocked before paid invoice. |
| Replay webhook | NOT RUN | Requires captured real BTCPay event payload/signature from paid invoice. |

## Amount Paid

Not paid.

## Cents Credited

`0`

No wallet credit was created in this milestone.

## Webhook Verification

Fail-closed behavior is verified:

- missing/invalid BTCPay signature is rejected
- webhook route is public and reachable
- webhook is registered in BTCPay to the repaired route

Valid signed BTCPay delivery was not proven because no paid invoice was produced.

## Idempotency Result

Not proven in live E2E.

The deployed code is designed to be idempotent by:

- `lightning_invoice_id`
- `event_id = btcpay-invoice-<invoice_id>`

Live replay proof still requires a real paid BTCPay event.

## Remaining Blockers

1. Provide a legitimate authenticated Farpy smoke session/account for the `$1` invoice creation.
2. Operator manually pays the generated invoice.
3. Capture BTCPay delivery and Farpy webhook logs.
4. Verify exactly one wallet JSONL credit of `100` cents.
5. Replay the same BTCPay event and verify no second wallet credit.
6. Confirm account history shows the Lightning credit.

## Required Safe Next Step

Run the invoice creation from a real signed-in browser/session, or provide an explicit operator-approved authenticated smoke session token/cookie for the dedicated smoke account. Do not use forged identity cookies.

## Verdict

LIGHTNING_PAYMENT_E2E_V1 = BLOCKED

Production backend and webhook routing are ready for the paid smoke, but the complete E2E is blocked on legitimate authenticated user input and manual operator payment.
## Current launch clarification

As of `LIGHTNING_UI_GATED_V1` / `LIGHTNING_DOCS_ALIGNED_V1`, public Lightning top-up UI is gated and disabled by default.

- `FARPY_LIGHTNING_ENABLED=true` is required at frontend build time to expose the Lightning controls.
- Default production builds do not show Lightning invoice buttons or Lightning claims on `/topup`.
- Lightning remains blocked for public launch until liquidity/channels and a full invoice -> webhook -> wallet-credit smoke are proven GREEN.
- Card/Stripe remains the enabled public top-up rail.