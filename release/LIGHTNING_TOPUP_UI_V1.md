# LIGHTNING_TOPUP_UI_V1

Date: 2026-06-26
Status: YELLOW

The `/topup` UI has been updated locally to expose a Card / Bitcoin Lightning selector, with Card remaining the default. Lightning remains beta-labeled and does not claim wallet credit until the wallet balance is refreshed after BTCPay confirms payment.

Production deployment was not performed in this milestone because exposing a payment rail publicly requires explicit operator approval after the prior E2E blocker: authenticated invoice creation still needs a real signed-in browser/session test.

## Files Changed

- `src/components/TopUpPage.tsx`
- `src/app/globals.css`
- `scripts/job-api.mjs`
- `release/LIGHTNING_TOPUP_UI_V1.md`

## Endpoint Called

The UI calls:

```http
POST /node/v1/web-render/btcpay/invoice
credentials: include
content-type: application/json
```

Supported request bodies:

```json
{ "tier": "usd_1" }
```

```json
{ "tier": "usd_5" }
```

```json
{ "tier": "usd_10" }
```

The client does not send credited cents as the source of truth. The server computes cents from the tier.

## UI Behavior

1. User opens `/topup`.
2. Card is selected by default.
3. Existing Stripe/Card buttons remain: `$10`, `$25`, `$50`, `$100`.
4. User can select `Bitcoin Lightning`.
5. Lightning panel shows beta wording.
6. Lightning options show: `$1`, `$5`, `$10`.
7. Clicking an amount creates a real BTCPay invoice through the server.
8. On success, UI shows:
   - invoice ID
   - amount
   - expiry
   - Open BTCPay button
   - Refresh Balance button
   - instruction to return and refresh wallet after payment
9. UI does not claim payment success unless wallet balance changes.
10. Invoice errors are shown from the server response.

## Backend Alias

Added the route alias needed by the public web-render prefix:

- `/node/v1/btcpay/invoice`
- `/btcpay/invoice`

Existing internal routes remain:

- `/v1/wallet/topup/btcpay/invoice`
- `/node/v1/wallet/topup/btcpay/invoice`

## Validation

```powershell
node --check C:\Users\danki\Desktop\farpy-frontend\scripts\job-api.mjs
```

Result: PASS

```powershell
npm.cmd run build
```

Result: PASS

Local fail-closed endpoint proof:

```text
LOCAL_ALIAS_UNAUTH_STATUS=401 BODY={"ok":false,"error":"auth_required"}
LOCAL_WALLET_DIR_EXISTS=False
```

Static output proof:

- `out/topup.html` exists
- built chunks contain:
  - `Bitcoin Lightning`
  - `BTCPay invoice`
  - `/node/v1/web-render/btcpay/invoice`
  - `usd_1`, `usd_5`, `usd_10`

## Invoice Creation Result

Authenticated browser invoice creation was not executed in this milestone because no legitimate signed-in Farpy browser session was provided, and production deployment/public exposure was not approved during this run.

Unauthenticated invoice creation fails closed with `401 auth_required`.

## Blockers Before `$1` Payment

1. Explicit operator approval to deploy the `/topup` UI with Lightning visible.
2. Deploy updated `scripts/job-api.mjs` alias to production if not already present.
3. Deploy updated static `out` to production.
4. Use a real signed-in Farpy account in the browser.
5. Create a `$1` Lightning invoice from `/topup`.
6. Operator manually pays the invoice.
7. Verify wallet balance increases by exactly `100` cents.
8. Verify BTCPay webhook idempotency by replaying/capturing the same event without a second credit.

## Verdict

LIGHTNING_TOPUP_UI_V1 = YELLOW

The local UI and backend alias are built and validated. Public exposure and authenticated invoice creation remain blocked on explicit production approval and a legitimate signed-in session.
## Current launch clarification

As of `LIGHTNING_UI_GATED_V1` / `LIGHTNING_DOCS_ALIGNED_V1`, public Lightning top-up UI is gated and disabled by default.

- `FARPY_LIGHTNING_ENABLED=true` is required at frontend build time to expose the Lightning controls.
- Default production builds do not show Lightning invoice buttons or Lightning claims on `/topup`.
- Lightning remains blocked for public launch until liquidity/channels and a full invoice -> webhook -> wallet-credit smoke are proven GREEN.
- Card/Stripe remains the enabled public top-up rail.