# BTCPAY_PUBLIC_CHECKOUT_URL_V1

## Summary

Farpy now rewrites user-facing BTCPay checkout URLs with `BTCPAY_PUBLIC_URL`.

## Behavior

- Internal BTCPay API calls still use `BTCPAY_URL`.
- Returned invoice checkout links preserve the original path and query.
- Only the protocol and host are replaced with `BTCPAY_PUBLIC_URL`.

## Scope

- No Stripe changes.
- No wallet ledger changes.
- No webhook crediting changes.
- No payment-method forcing in this patch.
- Lightning UI remains controlled by its existing frontend gate.
