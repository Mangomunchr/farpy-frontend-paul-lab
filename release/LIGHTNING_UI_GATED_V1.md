# LIGHTNING_UI_GATED_V1

Status: GREEN

## Goal

Disable the public Lightning top-up path by default unless the frontend build explicitly opts in with:

```bash
FARPY_LIGHTNING_ENABLED=true
```

## Changes

- `/topup` keeps Card as the default and visible payment rail.
- Bitcoin Lightning controls are not rendered unless `FARPY_LIGHTNING_ENABLED=true` is present at build time.
- Lightning invoice creation UI and copy are hidden by default.
- Existing Card/Stripe top-up behavior is unchanged.
- BTCPay backend/webhook code was not modified.

## Safety

Default production builds do not expose Lightning invoice buttons while Lightning liquidity/channel status is unproven.

Backend Lightning endpoints remain auth-protected and fail-closed for operator testing.

## Validation

- `npm.cmd run build` passes.
- Built output with default environment contains no `Create Lightning invoice` text.
- Built output with default environment contains no `Bitcoin Lightning` tab text.

## Remaining blocker

None for the UI gate. Lightning should not be publicly enabled until node liquidity/channels and one full invoice -> webhook -> wallet credit smoke are GREEN.
