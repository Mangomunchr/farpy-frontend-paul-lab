# FARPY_WORKSPACE_PRE_SUBMIT_STATE_FIX_V1

## Status

GREEN

## Problem

Workspace treated a priced, pre-submit package as if dispatch had begun. A job with `status=queued`, `payment_status=priced`, no `submitted_at`, no wallet debit, and no render start could show Dispatcher as active.

## Files changed

- `src/components/Workspace.tsx`
- `src/components/JourneyTimeline.tsx`
- `src/lib/worldLanguage.ts`

## Fix

- Added a `Payment / Start package` journey step before Dispatcher.
- Scoped that payment/start step to Workspace so other timeline uses are unchanged.
- Classified priced/pre-submit packages as active in `Payment / Start package`, not Dispatcher.
- Dispatcher is only active after one of:
  - `submitted_at` exists
  - payment is captured
  - backend status is `submitted`, `running`, `complete`, or `failed`
- Updated pre-submit copy:
  - `Ready to send`
  - `Payment required`
  - `Start package to enter dispatch queue.`
- Updated checkout CTA from `Pay and send package` to `Pay and start`.

## Backend behavior

No backend, API, payment, scheduler, receipt, or render behavior changed.

## Verification

- `npm.cmd run build` passed.

## Result

Priced/unpaid packages no longer show false dispatch progress. The Workspace now tells the user to start/pay before entering dispatch.

FARPY_WORKSPACE_PRE_SUBMIT_STATE_FIX_V1 = GREEN
