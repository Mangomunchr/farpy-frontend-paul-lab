# CONTROLLED_ALPHA_USER_1

Status: ACTIVE

Date: 2026-07-01

## Purpose

Complete controlled-alpha script for Alpha User #1.

Scenario:

- Brand new user.
- No Farpy knowledge.
- Uses normal public production website.
- No backend edits.
- No manual wallet credits.
- No fake render success.

## Operator Rules

1. Do not guide the user through hidden/internal tools.
2. Do not change production state manually.
3. Do not bypass auth, payment, wallet, render, receipt, or download flows.
4. Record every blocker with screenshot, URL, timestamp, and job/package ID if available.
5. If money is involved, preserve wallet/payment evidence before recovery.
6. If render fails, do not promise completion; use the failed-package recovery language.

## Proof Fields To Capture

| Field | Value |
|---|---|
| User email | Redacted |
| Browser / OS | |
| Starting wallet balance | |
| Top-up amount | |
| Payment rail | Card unless otherwise approved |
| Upload/package filename | |
| Upload ID | |
| Package/job ID | |
| Price/cost | |
| Final package status | |
| ZIP download size | |
| ZIP SHA-256 if checked | |
| Receipt URL | |
| Receipt ID | |
| Receipt output SHA match | Yes / No / Not checked |
| Final wallet balance | |
| Account history shows package | Yes / No |

## Step 1: Create Account

User action:

1. Open `https://farpy.com`.
2. Click `Send package` or navigate to `Sign in`.
3. Choose Google sign-in or email sign-in.
4. Complete sign-in using a fresh account/email.

Expected behavior:

- User lands in the intended Farpy page after authentication.
- Account/session is established.
- User can open `/account`.

Likely confusion:

- User may expect a traditional password signup.
- Magic-link email may be delayed or land in spam.
- Google OAuth may feel like sign-in rather than account creation.

Success criteria:

- `/account` loads.
- Account page shows wallet/balance area.
- User email/account identity is visible or inferable without exposing private data in screenshots.

Recovery path:

- If Google sign-in fails, try email magic link.
- If email link is delayed, check spam/promotions.
- If redirect lands somewhere wrong, manually open `https://farpy.com/account`.
- If account still cannot load, stop test and record auth blocker.

## Step 2: Sign In

User action:

1. If not already signed in, open `https://farpy.com/signin`.
2. Sign in normally.
3. Return to `https://farpy.com/account`.

Expected behavior:

- Google button and email sign-in are available.
- Sign-in preserves redirect when started from another page.
- Account page opens after sign-in.

Likely confusion:

- User may not know whether they are already signed in.
- If they started from a workspace page, they may expect to return there automatically.

Success criteria:

- `/account` returns a signed-in account view.
- Wallet balance is visible.

Recovery path:

- Use `/signin?next=/account`.
- If sign-in loops, capture URL and browser console/network symptoms.
- If session appears stale, sign out if possible and sign in again.

## Step 3: Add Funds

User action:

1. Open `https://farpy.com/topup`.
2. Use Card.
3. Add a small approved amount.
4. Return to Farpy after checkout.
5. Confirm account balance increased.

Expected behavior:

- Card is visible and usable.
- Lightning is not presented as a live public option unless explicitly enabled later.
- PayPal is not presented as live.
- Stripe checkout opens for Card.
- Wallet balance updates after successful payment.

Likely confusion:

- User may not know why Farpy uses wallet balance before rendering.
- User may expect render payment directly at submission instead of topping up.
- Checkout return may take a moment before wallet balance updates.

Success criteria:

- Wallet balance increases by expected amount.
- Account history shows top-up or wallet credit.
- No manual backend repair was needed.

Recovery path:

- If checkout does not open, record topup page screenshot and network error.
- If checkout succeeds but wallet does not update, preserve Stripe/payment session evidence and account page screenshot.
- Do not manually credit wallet during the test.
- If payment is captured but wallet missing, treat as payment incident.

## Step 4: Send Package

User action:

1. Return to homepage.
2. Use the package upload flow.
3. Choose a small known-good `.blend` package.
4. Select output and frames.
5. Choose Standard delivery unless instructed otherwise.
6. Click `Send package`.

Expected behavior:

- Upload UI accepts `.blend`.
- Package type is clear.
- Frame controls are understandable.
- Summary shows frame count, delivery, and estimated price/cost.
- User is sent to workspace/package tracker after submission.

Likely confusion:

- User may not know which file to choose.
- User may not understand still image vs animation.
- User may try an unsupported file type.
- User may not understand that large projects should be tested with a small package first.

Success criteria:

- Package upload succeeds.
- Workspace opens with package/job ID.
- Package enters a clear tracked state.
- Wallet/payment state is understandable.

Recovery path:

- If unsupported file: ask user to choose `.blend` or `.orbx`.
- If upload fails: record file size, extension, browser, network response, and any upload ID.
- If wallet insufficient: return to topup.
- If package submits but workspace does not load, capture package/job ID if visible and open `/workspace`.

## Step 5: Track Package

User action:

1. Stay on workspace/package tracker.
2. Watch journey timeline.
3. Wait for delivery or failure.

Expected behavior:

- Timeline is primary.
- User sees package journey:
  - Package received
  - Dispatcher
  - Render Partner
  - Rendering
  - Packaging
  - Package delivered
- If running, the page explains that the package is being prepared at a render partner.
- No fake progress is shown.

Likely confusion:

- User may not know how long to wait.
- User may refresh or navigate away.
- User may not understand queued/running states.

Success criteria:

- Package progresses to delivered, or failure state is honest and actionable.
- If delivered, Download ZIP and View delivery receipt are obvious.
- If failed, user sees no fake completion and understands next step/refund policy.

Recovery path:

- If stuck: operator checks package ID in ops/status without changing state.
- If failed: verify no receipt/output before discussing refund/reversal.
- If page appears stale: refresh once, then record status payload if available.

## Step 6: Download ZIP

User action:

1. Click `Download ZIP` or `Download package result`.
2. Save the ZIP locally.
3. Confirm file is non-empty.

Expected behavior:

- Download begins from the workspace or receipt page.
- ZIP contains completed output and package metadata.
- User does not need internal tokens or manual links.

Likely confusion:

- Browser may block or hide downloads.
- User may not know where the ZIP was saved.
- Large download may take time.

Success criteria:

- ZIP download returns HTTP 200 in browser behavior.
- File size is greater than zero.
- ZIP opens locally.

Recovery path:

- If download fails, open delivery receipt and retry download from there if available.
- If completed package has receipt but no ZIP, treat as download incident.
- If ZIP is empty/corrupt, preserve file and receipt before taking action.

## Step 7: View Receipt

User action:

1. Click `View delivery receipt`.
2. Review receipt summary.
3. Confirm receipt ID and SHA-256 are visible.

Expected behavior:

- Receipt page explains itself before technical data.
- User sees package delivered successfully.
- User sees renderer, frames, completed time, cost, and SHA-256 proof when available.
- Advanced/verification details remain available.

Likely confusion:

- SHA-256 may be unfamiliar.
- User may not know why receipt matters.
- User may expect a payment invoice instead of a delivery receipt.

Success criteria:

- Receipt page loads.
- Receipt ID is visible.
- Output SHA-256 is visible if package completed.
- Download button/link remains available.

Recovery path:

- If receipt route fails, preserve workspace URL and package ID.
- If receipt exists but missing SHA, treat as trust-chain issue.
- If receipt and ZIP disagree, stop and preserve both artifacts.

## Step 8: Sign Out

User action:

1. Open account or user menu if available.
2. Click sign out.
3. Reopen account page to confirm signed-out behavior.

Expected behavior:

- Session clears.
- Authenticated pages no longer show private account data.
- User can sign in again later and see history.

Likely confusion:

- Sign-out control may not be obvious.
- Some pages may still show public shells while private data is hidden.

Success criteria:

- User signs out successfully.
- `/account` no longer shows private wallet/history.
- Returning to `/signin` is clear.

Recovery path:

- If no sign-out control is visible, record as UX issue.
- If private data remains visible after sign-out and refresh, treat as security issue.
- If user signs back in, account history should persist.

## Operator End-State Checklist

Mark each item:

- Account created: PASS / FAIL
- Sign-in works: PASS / FAIL
- Funds added: PASS / FAIL
- Package sent: PASS / FAIL
- Workspace tracking understandable: PASS / FAIL
- Package delivered: PASS / FAIL
- ZIP downloaded: PASS / FAIL
- Receipt viewed: PASS / FAIL
- Account history updated: PASS / FAIL
- Sign-out works: PASS / FAIL

## Stop Conditions

Stop the test immediately and classify as launch-blocking if:

- Payment captures money but wallet does not credit.
- Wallet debit occurs but no delivery receipt/output/refund path exists.
- Completed package cannot download.
- Receipt is missing for a completed package.
- Private receipt/download URLs are exposed to the wrong user.
- Sign-out leaves private data visible.

## Accepted Non-Blockers For Alpha User #1

- User asks what SHA-256 means.
- User needs guidance to choose a small `.blend`.
- Receipt/download private proof is technical but visible.
- Bitcoin/Lightning/PayPal confusion is avoided by keeping Card primary and Lightning gated.
- NodeMuncher is not part of this user script.

## Related Documents

- `docs/FARPY_BOOK/RETAIL_ALPHA_GATE.md`
- `docs/FARPY_BOOK/LAUNCH_DAY_PLAYBOOK.md`
- `docs/FARPY_BOOK/OPERATOR_CHECKLIST.md`
- `docs/FARPY_BOOK/INCIDENT_RUNBOOK.md`
- `release/PAID_BROWSER_SMOKE_PREP_V1.md`
- `release/RETAIL_ALPHA_FINAL_FREEZE_REPORT_V1.md`
