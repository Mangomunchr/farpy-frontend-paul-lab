# LIGHTNING_FOUNDATION_REPAIR_V1

Date: 2026-06-26
Status: YELLOW

Lightning remains hidden from public UI. This repair establishes a safer backend foundation for BTCPay Lightning top-ups, but the first real `$1` mainnet payment is still blocked until production deployment, BTCPay API access, webhook routing, and a manual paid invoice smoke are proven.

## Authoritative Wallet Path

Authoritative wallet ledger:

- `FARPY_WALLET_STORE_DIR`, or
- `${FARPY_WEB_RENDER_DATA_DIR}/wallet`, or
- local fallback `.farpy-wallet`

Ledger format:

- append-only per-user JSONL file
- filename: `sha256(user_id).jsonl`
- balance source: latest `balance_after_cents`

All new Lightning credit code uses this existing wallet ledger via `appendWalletLedger`. It does not write `/var/lib/farpy/topups.db`, `/var/lib/farpy/ops-topup/topups.db`, or `/opt/farpy/ledger/topups.jsonl`.

## Authoritative Payment Path

Existing Stripe wallet top-up path remains unchanged:

- `POST /v1/wallet/topup/session`
- `POST /node/v1/stripe/webhook`

New backend-only Lightning foundation path:

- `POST /v1/wallet/topup/btcpay/invoice`
- `POST /node/v1/wallet/topup/btcpay/invoice`
- `POST /node/v1/btcpay/webhook`
- `POST /btcpay/webhook`

Lightning is not wired into `src/components/TopUpPage.tsx`; public users still do not see Lightning options.

## Invoice Creation Contract

The invoice endpoint requires an authenticated Farpy session.

Accepted request shape:

```json
{ "tier": "usd_1" }
```

Supported server-side tiers:

| Tier | Credit |
| --- | ---: |
| `usd_1` | 100 cents |
| `usd_5` | 500 cents |
| `usd_10` | 1000 cents |

Security properties:

- account identity comes from Farpy session cookie via `requireAuth(req)`
- client-supplied email/user identifiers are ignored
- client-supplied `amount_cents` is ignored
- amount is computed only from the server-side tier map
- metadata written to BTCPay includes `purpose=wallet_topup_lightning`, `user_id`, `email`, `amount_cents`, and `topup_id`
- checkout is requested with Lightning payment method preference

## Webhook Verification

Webhook handler requires:

- `BTCPAY_WEBHOOK_SECRET`
- `BTCPAY-SIG` / `btcpay-sig` HMAC-SHA256 signature over the raw payload
- valid invoice ID
- matching configured store ID
- direct BTCPay invoice fetch before crediting
- invoice status `Settled`
- invoice metadata `purpose=wallet_topup_lightning`
- invoice amount matching metadata amount and server allowlist

Expired or invalid invoices are ignored without credit.

Invoices that are not settled are ignored without credit.

Unknown stores are rejected.

Unsigned requests are rejected.

## Idempotency Proof

Idempotency key:

- `lightning_invoice_id`
- wallet event ID: `btcpay-invoice-<invoice_id>`

The wallet append path now checks:

- duplicate `event_id`
- duplicate `stripe_session_id`
- duplicate `lightning_invoice_id`

Duplicate BTCPay webhooks return success/duplicate behavior without creating another credit.

## Wallet Credit Fields

Lightning wallet transactions record:

- `event_id`
- `wallet_event_id`
- `type=credit`
- `amount_cents`
- `balance_after_cents`
- `lightning_invoice_id`
- `payment_hash`
- `source=btcpay_lightning`
- `created_at`
- `user_id`
- `email`

The public wallet transaction API now includes Lightning fields so account history can show the credit source without using legacy DBs.

## Failure Handling

| Case | Behavior |
| --- | --- |
| Missing auth on invoice creation | `401 auth_required` |
| Invalid tier | `400 invalid_lightning_tier` |
| BTCPay not configured | `503 btcpay_not_configured` |
| Unsigned webhook | `400 invalid_signature` |
| Unknown store | rejected |
| Expired invoice | ignored, no credit |
| Invalid invoice | ignored, no credit |
| Unsettled/partial invoice | ignored, no credit |
| Amount mismatch | rejected, no credit |
| Replay/duplicate webhook | no duplicate credit |
| Overpayment | not credited beyond invoice amount; final behavior still needs a live BTCPay overpayment policy proof before public enablement |

## Validation Run

Commands run:

```powershell
node --check C:\Users\danki\Desktop\farpy-frontend\scripts\job-api.mjs
```

Result: PASS

```powershell
npm.cmd run build
```

Result: PASS

Local fail-closed smoke:

```text
INVOICE_UNAUTH_STATUS=401 BODY={"ok":false,"error":"auth_required"}
WEBHOOK_UNSIGNED_STATUS=400 BODY={"ok":false,"error":"invalid_signature"}
WALLET_DIR_EXISTS=False
```

This proves unauthenticated invoice creation and unsigned webhooks do not credit the wallet.

## Files Changed

- `scripts/job-api.mjs`
- `release/LIGHTNING_FOUNDATION_REPAIR_V1.md`

## Remaining Blockers Before First `$1` Payment

1. Deploy `scripts/job-api.mjs` to production web-render API.
2. Configure production Caddy/BTCPay webhook target to the canonical public route:
   - `https://farpy.com/node/v1/web-render/btcpay/webhook`
3. Confirm production invoice creation route resolves after deploy:
   - `POST https://farpy.com/node/v1/web-render/wallet/topup/btcpay/invoice`
4. Verify configured BTCPay API key can read store and invoice data.
5. Verify BTCPay store has Lightning enabled on mainnet and can settle invoices.
6. Create one authenticated `$1` invoice from the backend-only endpoint.
7. Manually pay it with operator approval.
8. Confirm webhook delivery credits exactly 100 cents in the authoritative wallet JSONL.
9. Replay the same webhook event and confirm no second credit.
10. Verify account wallet transaction history shows the Lightning credit.
11. Document BTCPay partial/underpaid/overpaid behavior from a live invoice or BTCPay store policy.

## Verdict

LIGHTNING_FOUNDATION_REPAIR_V1 = YELLOW

Foundation code is repaired locally and fails closed, but public Lightning must remain disabled until the production route and one real operator-approved `$1` invoice smoke are GREEN.
## Current launch clarification

As of `LIGHTNING_UI_GATED_V1` / `LIGHTNING_DOCS_ALIGNED_V1`, public Lightning top-up UI is gated and disabled by default.

- `FARPY_LIGHTNING_ENABLED=true` is required at frontend build time to expose the Lightning controls.
- Default production builds do not show Lightning invoice buttons or Lightning claims on `/topup`.
- Lightning remains blocked for public launch until liquidity/channels and a full invoice -> webhook -> wallet-credit smoke are proven GREEN.
- Card/Stripe remains the enabled public top-up rail.