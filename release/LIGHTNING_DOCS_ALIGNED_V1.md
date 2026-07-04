# LIGHTNING_DOCS_ALIGNED_V1

Status: GREEN

## Goal

Align Lightning documentation and release notes with the current gated UI state.

## Current state

Lightning top-up is not a public launch payment rail by default.

- Public `/topup` keeps Card/Stripe as the enabled rail.
- Bitcoin Lightning controls are hidden in default frontend builds.
- `FARPY_LIGHTNING_ENABLED=true` is required at frontend build time to expose Lightning controls.
- Backend BTCPay invoice and webhook endpoints remain auth-protected/fail-closed for operator testing.
- Lightning remains blocked until liquidity/channels and a full invoice -> webhook -> wallet-credit smoke are proven GREEN.

## Historical docs clarified

The following historical release notes were appended with the current launch clarification rather than rewritten or deleted:

- `release/AUTH_INVOICE_500_ROOT_CAUSE_V1.md`
- `release/LIGHTNING_TOPUP_UI_V1.md`
- `release/LIGHTNING_RUNTIME_CONFIG_ENABLE_V1.md`
- `release/LIGHTNING_PAYMENT_E2E_V1.md`
- `release/LIGHTNING_FOUNDATION_REPAIR_V1.md`

## Code changes

No payment code, wallet ledger logic, BTCPay backend logic, or render logic was changed.

## Remaining blocker

Lightning public enablement remains blocked until the Lightning node has usable liquidity/channels and a real invoice-to-wallet-credit smoke passes.