# BTCPAY_INVOICE_CREATE_FAILURE_FIX_V1

## Summary

Fixed Bitcoin invoice creation failure from the public `/topup` Bitcoin path.

## Root cause

Farpy requested BTCPay checkout payment method `BTC-Chain`.

BTCPay rejected that value with HTTP `422`. Direct payload comparison showed:

- generic invoice: accepted
- `BTC-Chain`: rejected
- `BTC-CHAIN`: accepted
- `BTC`: accepted

## Fix

Bitcoin invoices now request `BTC-CHAIN`, matching BTCPay's accepted on-chain method id.

The public checkout URL rewrite now sets `hostname` and `port` separately so an internal BTCPay port such as `19080` is not carried into user-facing checkout URLs when `BTCPAY_PUBLIC_URL` has no port.

## Logging

BTCPay invoice creation failures now log redacted diagnostics:

- rail
- status code
- error code/title
- short message

No secrets, API keys, tokens, cookies, or user identifiers are logged.

## Scope

- No Stripe changes.
- No wallet ledger changes.
- No webhook crediting changes.
- Lightning remains gated by the existing UI flag.
