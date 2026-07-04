# ALPHA_METRICS_BASELINE_V1

Status: GREEN

Date: 2026-07-01

## Objective

Define canonical Retail Alpha metrics only.

No analytics implementation.
No tracking code.
No production changes.

## Files Changed

- `docs/FARPY_BOOK/ALPHA_METRICS.md`
- `release/ALPHA_METRICS_BASELINE_V1.md`

## Metrics Defined

Acquisition:

- Visitors
- Signups
- Sign-in rate

Activation:

- Wallet topups
- First package sent
- Time to first render
- First receipt viewed

Reliability:

- Render success rate
- Failed packages
- Refunds
- Average render duration
- Average queue time

Engagement:

- Second package
- Return users
- Repeat topups

Support:

- Support requests
- Billing issues
- Render issues
- Download issues

Trust:

- Receipt opens
- Receipt verification success
- Download completion rate

Business:

- Revenue
- Wallet balances
- Credits purchased
- Credits consumed

## Commands Run

None.

Documentation-only patch.

## Production Mutation

None.

## Result

PASS.

Canonical Retail Alpha metrics are now defined in the Farpy Book with definition, formula, future data source, and priority.
