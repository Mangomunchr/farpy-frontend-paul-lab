# TOPUP_BITCOIN_ONCHAIN_RESTORE_V1

Date: 2026-06-28

## Summary

Restored a public Bitcoin on-chain wallet top-up option on `/topup` while keeping Lightning hidden unless explicitly enabled at build time.

## Payment Rails

- Card / Stripe: visible and unchanged.
- Bitcoin: visible, labeled as `Bitcoin` in the UI.
- Lightning: hidden by default. The existing Lightning path remains gated by `FARPY_LIGHTNING_ENABLED=true` and is not shown in the default production build.
- PayPal: not shown.

## Backend Behavior

Bitcoin invoices use the Farpy BTCPay backend path and request an on-chain-only payment method:

- Endpoint: `/node/v1/web-render/btcpay/bitcoin-invoice`
- BTCPay checkout method: `BTC-Chain`
- Metadata purpose: `wallet_topup_bitcoin`
- Metadata rail: `bitcoin`

The BTCPay webhook still verifies invoice/store/status/amount before wallet credit. No client-side wallet credit was added.

## Validation Notes

Unauthenticated invoice creation must return `401 auth_required`. Authenticated invoice creation requires a real Farpy session cookie and was not faked.
