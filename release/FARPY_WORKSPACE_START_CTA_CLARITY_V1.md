# FARPY_WORKSPACE_START_CTA_CLARITY_V1

## Status

GREEN

## Problem

Users could upload and price a package, then miss the final action required to start rendering.

## Files changed

- `src/components/Workspace.tsx`
- `src/app/globals.css`

## Fix

- Added a large sticky Workspace callout for pre-submit priced packages.
- The callout says:
  - `Your package is priced but not rendering yet.`
  - `Pay and start render` for checkout-backed starts.
- Kept the active journey step as `Payment / Start package`.
- Suppressed duplicate lower pre-submit actions so the next action is visually obvious.
- After payment/submission enters dispatch, the top callout changes to `Rendering started`.
- Progress UI remains hidden until the backend reports `running`.

## Backend behavior

No backend, API, payment, scheduler, receipt, or render behavior changed.

## Verification

- `npm.cmd run build` passed.

FARPY_WORKSPACE_START_CTA_CLARITY_V1 = GREEN
