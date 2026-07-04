# ALPHA_METRICS

Status: ACTIVE

Date: 2026-07-01

## Purpose

Canonical Retail Alpha metrics for Farpy.

This document defines metrics only.

No analytics implementation, tracking code, schema change, backend change, or production mutation is included.

## Priority Key

- P0: required to know whether Retail Alpha is working safely.
- P1: important for improving conversion, trust, and reliability.
- P2: useful after the first supervised users.

## Acquisition

| Metric | Definition | Formula | Future Data Source | Priority |
|---|---|---|---|---|
| Visitors | Unique people reaching Farpy public web pages. | Count distinct visitor identifiers or privacy-safe unique IP/session approximations over a period. | Caddy access logs, future privacy-safe analytics, funnel report. | P0 |
| Signups | New Farpy accounts created or first authenticated sessions for new users. | Count new user/account records or first-seen authenticated identities. | Auth/account store, `/v1/auth/me` derived account records. | P0 |
| Sign-in rate | Share of visitors who sign in. | Signups or signed-in users / visitors. | Caddy logs plus auth/account store. | P1 |

## Activation

| Metric | Definition | Formula | Future Data Source | Priority |
|---|---|---|---|---|
| Wallet topups | Successful wallet funding events. | Count wallet credit events from payment rails. | Wallet ledger, Stripe events, BTCPay events. | P0 |
| First package sent | First uploaded render package per user. | Count users with at least one package/job created. | Upload/job store. | P0 |
| Time to first render | Time from first landing visit or signup to first completed receipt. | First receipt created time - first visit or signup time. | Access logs, auth/account store, job store, receipt store. | P1 |
| First receipt viewed | First time a user opens a delivery receipt. | Count users with at least one receipt page/API access after completion. | Receipt route logs, future receipt-view event. | P1 |

## Reliability

| Metric | Definition | Formula | Future Data Source | Priority |
|---|---|---|---|---|
| Render success rate | Share of sent packages that produce completed output and receipt. | Completed packages / submitted packages. | Job store, receipt store. | P0 |
| Failed packages | Packages that end in failed state. | Count jobs/packages with status `failed`. | Job store, ops summary. | P0 |
| Refunds | Wallet reversals/refunds issued for failed or incorrect packages. | Count refund/reversal wallet events and total cents. | Wallet ledger, refund records. | P0 |
| Average render duration | Average time spent rendering after render partner starts. | Average completed_at - started_at for completed packages. | Job store. | P1 |
| Average queue time | Average time from paid/submitted to render start. | Average started_at - submitted_at for completed packages. | Job store. | P1 |

## Engagement

| Metric | Definition | Formula | Future Data Source | Priority |
|---|---|---|---|---|
| Second package | Users who send a second package. | Count users with package count >= 2. | Job/upload store by user/account. | P1 |
| Return users | Users who return after first session or first package. | Count users with activity on multiple days or sessions. | Auth/account activity, access logs, future analytics. | P2 |
| Repeat topups | Users who top up wallet more than once. | Count users with wallet credit event count >= 2. | Wallet ledger. | P1 |

## Support

| Metric | Definition | Formula | Future Data Source | Priority |
|---|---|---|---|---|
| Support requests | Total support issues reported by users. | Count submitted support reports or manually logged issues. | Future support request form, support inbox, operator log. | P0 |
| Billing issues | Support requests about topup, wallet, debit, refund, or payment provider. | Count support requests tagged billing. | Future support form tags, operator log. | P0 |
| Render issues | Support requests about upload, render failure, stuck package, frame output, or render partner behavior. | Count support requests tagged render. | Future support form tags, ops alerts, operator log. | P0 |
| Download issues | Support requests about missing, blocked, empty, corrupt, or inaccessible ZIP downloads. | Count support requests tagged download. | Future support form tags, operator log. | P0 |

## Trust

| Metric | Definition | Formula | Future Data Source | Priority |
|---|---|---|---|---|
| Receipt opens | Delivery receipt views by users. | Count receipt page/API accesses for completed packages. | Receipt route logs, future receipt-view event. | P1 |
| Receipt verification success | Completed packages where receipt output SHA matches downloadable ZIP/output SHA. | Count verified matches / completed packages checked. | Receipt store, output store, audit scripts. | P0 |
| Download completion rate | Completed packages whose ZIP is successfully downloaded. | Successful download responses / completed packages. | Download route logs, future download event. | P1 |

## Business

| Metric | Definition | Formula | Future Data Source | Priority |
|---|---|---|---|---|
| Revenue | Net completed-render revenue recognized from delivered packages. | Sum completed package charges minus refunds/reversals. | Wallet ledger, receipt store, payment provider records. | P0 |
| Wallet balances | Outstanding customer wallet balance. | Sum wallet credits - debits - refunds/reversals by account. | Wallet ledger. | P0 |
| Credits purchased | Total wallet credits bought by users. | Sum successful topup credit cents. | Wallet ledger, Stripe, BTCPay. | P0 |
| Credits consumed | Total wallet balance spent on delivered packages. | Sum wallet debit cents for packages with valid delivery receipt. | Wallet ledger, receipt store. | P0 |

## Minimum Retail Alpha Dashboard

For supervised alpha, the minimum daily dashboard should show:

- Visitors
- Signups
- Wallet topups
- First packages sent
- Completed renders
- Failed packages
- Refunds
- Receipt verification success
- Support requests
- Revenue

## Non-Goals

- No client analytics implementation.
- No tracking pixels.
- No cookies added.
- No schema changes.
- No event pipeline.
- No new dashboard code.
- No fake metrics.

## Related Documents

- `docs/FARPY_BOOK/RETAIL_ALPHA_GATE.md`
- `docs/FARPY_BOOK/LAUNCH_DAY_PLAYBOOK.md`
- `docs/FARPY_BOOK/CONTROLLED_ALPHA_USER_1.md`
- `docs/FARPY_BOOK/ALPHA_FEEDBACK_FORM.md`
- `release/TIME_TO_FIRST_RENDER_AUDIT_V1.md`
