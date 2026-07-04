# PRODUCTION_FRESH_ACCOUNT_E2E_V1

Status: BLOCKED
Timestamp: 2026-06-27T18:10:58Z

## Goal

Prove the complete Farpy production flow using a brand-new account with no reused state:

1. Create account
2. Verify sign-in, sign-out, sign-in again
3. Top up via Card
4. Verify wallet, history, ledger entry, receipt
5. Upload Blender file
6. Run real render
7. Verify workspace, progress, completion, download, receipt, SHA256, render seconds, wallet debit
8. Verify ZIP contents
9. Refresh and verify persistence
10. Sign out and sign back in
11. Re-run launch audits

## Result

The flow could not be completed without operator-controlled external inputs.

This milestone requires:

- a brand-new email inbox that can receive and open the Farpy magic-link email
- a real approved Card top-up payment through production Stripe/Card checkout
- a real browser session tied to that new account

Those inputs were not available to Codex in this session. No authentication was bypassed, no wallet balances were injected, no databases were edited, and no fake pass was recorded.

## Production preflight

Public production route/API checks were run read-only before the block.

| Area | URL | Result |
| --- | --- | --- |
| Home | `https://farpy.com/` | HTTP 200 |
| Sign in | `https://farpy.com/signin` | HTTP 200 |
| Account | `https://farpy.com/account` | HTTP 200 |
| Top up | `https://farpy.com/topup` | HTTP 200 |
| Workspace | `https://farpy.com/workspace` | HTTP 200 |
| Receipt shell | `https://farpy.com/receipt` | HTTP 200 |
| Job API health | `https://farpy.com/node/v1/web-render/health` | HTTP 200, `ok=true` |
| Worker status | `https://farpy.com/node/v1/web-render/worker/status` | HTTP 200, `submitted_jobs=0`, `running_jobs=0` |

## Account lifecycle

Status: BLOCKED

Reason: creating and verifying a brand-new account requires access to the new email inbox and the one-time magic-link URL. No inbox was available in this session.

## Payment

Status: BLOCKED

Reason: Card top-up requires a real approved payment through production checkout. No operator approval or payment instrument was available in this session.

## Render

Status: NOT STARTED

Reason: render must happen after real account creation and Card top-up.

## Download

Status: NOT STARTED

Reason: no fresh completed render was created in this milestone.

## Receipt

Status: NOT STARTED

Reason: no fresh completed render was created in this milestone.

## Wallet

Status: NOT STARTED

Reason: no fresh Card top-up was completed.

## Persistence

Status: NOT STARTED

Reason: no fresh authenticated account/session was created.

## Production defects discovered

None from public preflight.

The blocker is operational input, not an observed production code failure.

## Required operational input to run GREEN

Provide, in an interactive browser session or operator-run smoke environment:

- fresh test email inbox access
- approval to complete one production Card top-up
- valid Blender test file

Then run the flow end-to-end without SSH/database edits and attach:

- account email
- top-up session/payment proof
- starting and final wallet balance
- job ID
- upload ID
- receipt ID
- output ZIP SHA256
- receipt output SHA256
- downloaded file SHA256
- ZIP listing containing `manifest.json`, `job.json`, `render-log.txt`, and output frame(s)

## Final state

`PRODUCTION_FRESH_ACCOUNT_E2E_V1 = BLOCKED`
