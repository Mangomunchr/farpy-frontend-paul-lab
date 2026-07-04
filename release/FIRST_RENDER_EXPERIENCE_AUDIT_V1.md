# FIRST_RENDER_EXPERIENCE_AUDIT_V1

Status: PASS

Mode: audit only. No backend, API, or product code changes.

Production URL: `https://farpy.com`

Reviewed path:

Homepage -> Pricing -> Sign in -> Fund wallet -> Upload `.blend` -> Submit -> Workspace -> Journey Timeline -> Download ZIP -> Delivery receipt

Live route checks:

- `/` -> 200
- `/pricing` -> 200
- `/signin` -> 200
- `/topup` -> 200
- `/workspace` -> 200
- `/receipt` -> 200
- `/account` -> 200

## P0 - Blocks First Render

None found in this source/live-route audit.

## P1 - Confusion

### 1. Homepage secondary CTA sends first-time customers toward NodeMuncher

Evidence: `src/components/HomeRenderFlow.tsx`

User goal: understand Farpy and start a first render.

Current primary action: `Start Rendering`

Confusing element: secondary CTA is `Download NodeMuncher`, which is not part of the customer first-render path and can distract from upload -> wallet -> render.

Delete/simplify: replace the secondary CTA with `View pricing` or `How it works`.

Concrete fix: change the secondary hero CTA from `/downloads` / `Download NodeMuncher` to `/pricing` / `View pricing` for retail alpha.

Trust effect: keeps the first user on the paying-customer path instead of sending them to a controlled-alpha worker product.

### 2. Homepage contains visible mojibake in icon/trust strip text

Evidence: `src/components/HomeRenderFlow.tsx`

Observed strings include mojibake for package/factory/mail/check icons:

- `ðŸ“¦`
- `ðŸ­`
- `ðŸ“¬`
- `âœ“`

User goal: quickly understand the three-step flow and trust claims.

Confusing element: broken glyphs make the page feel less trustworthy before upload.

Delete/simplify: replace emoji/check glyphs with plain text, lucide icons, or verified UTF-8 characters.

Concrete fix: repair source encoding or replace these with CSS/lucide icons so production renders cleanly.

Trust effect: removes an immediate quality signal problem on the first screen.

### 3. Two homepage upload flows appear to coexist in source vocabulary

Evidence: `src/components/HomeRenderFlow.tsx`, `src/components/RenderWidget.tsx`

User goal: upload one `.blend` and get a price.

Confusing element: `HomeRenderFlow` supports `.blend` and `.orbx`, while `RenderWidget` is still Blender-only and includes older wording such as `Render a file`, `Continue to render`, and `No anonymous jobs`.

Delete/simplify: keep one canonical first-render upload component live on the homepage.

Concrete fix: if `RenderWidget` is no longer used, remove it from customer-facing paths. If it is still used on any route, update it to the package/factory language and `.blend`/`.orbx` support truth.

Trust effect: prevents users from seeing contradictory renderer/file support.

### 4. Upload button jumps straight to Workspace without telling the user payment happens next

Evidence: `src/components/HomeRenderFlow.tsx`

User goal: send a package and understand the next step.

Primary action: upload/price package.

Confusing element: after upload and price, the app redirects to Workspace with tokens. The homepage does not clearly say: "Next: sign in and pay from your package tracker."

Can delete: no deletion required.

Concrete fix: add one short line near the upload button: `Next, your package tracker will show the price and payment step.`

Trust effect: reduces surprise when the user lands on Workspace and sees payment/sign-in controls.

### 5. Workspace still uses `Pay & Render` while surrounding copy says package tracker

Evidence: `src/components/Workspace.tsx`

User goal: start the paid render package.

Primary action: pay/start.

Confusing element: the page now uses package-tracker language, but the checkout button says `Pay & Render`.

Can delete: no.

Concrete fix: rename the button to `Pay and send package` or `Pay and start package`.

Trust effect: makes the button match the page's mental model while preserving payment clarity.

### 6. Wallet top-up has two rails before the first successful render

Evidence: `src/components/TopUpPage.tsx`

User goal: add enough balance and get back to rendering.

Primary action: add funds.

Confusing element: first-time users see `Card` and `Bitcoin`. Bitcoin is legitimate, but it adds a decision before the first render.

Can delete: do not remove Bitcoin if it is intentionally live.

Concrete fix: keep Card as the visually dominant default and add a short helper line under Card: `Fastest way to start your first render.`

Trust effect: preserves rails while steering first-time users to the least-friction path.

### 7. Top-up success return path is not obvious from the page copy

Evidence: `src/components/TopUpPage.tsx`

User goal: fund wallet, then continue rendering.

Primary action: choose top-up amount.

Confusing element: page has `Back to Account`, but not `Back to package tracker` when the user came from Workspace.

Can delete: no.

Concrete fix: preserve `next` from `/topup?next=<workspace-url>` or add a simple `Return to package tracker` link when a `next` query is present.

Trust effect: reduces the chance of losing the active package after payment.

### 8. Sign-in page sends a user who changes their mind to homepage, not pricing/workspace context

Evidence: `src/components/AuthPage.tsx`

User goal: sign in to continue wallet/payment.

Primary action: Continue with Google or send email link.

Confusing element: bottom link says `Start a new render`, even when `next=/topup` or `next=/workspace...` exists.

Can delete: yes, delete the bottom link on payment-gated flows.

Concrete fix: when `next` is not `/account`, replace `Start a new render` with `Continue after sign-in` helper copy, or remove the link.

Trust effect: avoids pulling users away from the payment/render continuation path.

### 9. Receipt page title leads with receipt ID instead of human outcome

Evidence: `src/components/ReceiptPage.tsx`

User goal: confirm delivery and download/verify output.

Primary action: Download ZIP.

Confusing element: top H1 is the raw receipt ID; the clearer phrase `Package delivered successfully.` appears inside the card.

Can delete: do not delete receipt ID.

Concrete fix: make H1 `Delivery Receipt` or `Package delivered`, and keep `Receipt ID` in the summary/details.

Trust effect: first read confirms success before technical proof.

### 10. Account page mixes old and new language

Evidence: `src/components/AccountPage.tsx`

User goal: find recent packages, downloads, and receipts.

Primary action: View Workspace / Download ZIP / View Receipt.

Confusing element: page copy says `render history`, empty state says `No renders yet`, actions say `View Workspace`.

Can delete: no.

Concrete fix: use `package history`, `No packages yet`, and `View package tracker` while keeping technical IDs.

Trust effect: keeps account/history consistent with the new package tracker model.

## P2 - Polish

### 1. Pricing page does not link directly into the upload flow

Evidence: `src/app/pricing/page.tsx`

User goal: understand cost, then start.

Primary action: no obvious page-local CTA in the inspected source.

Concrete fix: add `Start with a small package` CTA linking to `/#start`.

### 2. Homepage upload default frame count is high for a first test

Evidence: `src/components/HomeRenderFlow.tsx`

Current default: `DEFAULT_FRAMES = 120`

User goal: try a small first package.

Concrete fix: default to a smaller first-render value, or show a starter hint near the input: `Try 1-8 frames first.`

### 3. Error messages still expose backend-shaped phrases in upload/pricing failures

Evidence: `src/components/HomeRenderFlow.tsx`

Examples:

- `Upload failed (${response.status}).`
- `Pricing failed (${priceResponse.status}).`

Concrete fix: map these to human messages:

- `Farpy could not send this package. Check your connection and try again.`
- `Farpy could not price this package. Try again or contact support.`

### 4. Receipt and account still expose `Job ID` above advanced contexts

Evidence: `src/components/ReceiptPage.tsx`, `src/components/AccountPage.tsx`

Concrete fix: keep `Job ID` but move it under `Verification Details` where possible, while showing `Package ID` on the surface.

### 5. Top-up page says Bitcoin payments settle but not how to recover after paying

Evidence: `src/components/TopUpPage.tsx`

Concrete fix: under Bitcoin amount buttons, add: `After payment, return here and refresh your balance.`

## Page-by-page Summary

| Page | User trying to do | Primary action | Main friction | Concrete fix |
| --- | --- | --- | --- | --- |
| Homepage | Understand and start | Start Rendering / upload | NodeMuncher CTA distracts; mojibake hurts trust | Replace secondary CTA; fix encoding |
| Pricing | Confirm cost | Learn rates | No direct start CTA | Add `Start with a small package` |
| Sign in | Continue payment/render | Google or email link | Escape link can pull user away | Remove/adjust bottom link when `next` exists |
| Top up | Add funds | Card amount button | Card competes with Bitcoin for first render | Emphasize Card as fastest first-render rail |
| Upload | Send `.blend` | Choose file/send | Next payment step not explained | Add one next-step sentence |
| Workspace | Pay/start/track | Pay/start or Download | `Pay & Render` mismatches package language | Rename to package-oriented payment button |
| Journey Timeline | Understand wait state | Read tracker | Good; primary content is clear | No P1 fix required |
| Download ZIP | Retrieve output | Download package result | Good; action is prominent | No P1 fix required |
| Delivery receipt | Verify output | Download / copy hash | H1 is raw receipt ID | Lead with success, keep ID in details |
| Account | Find history | View/Download/Receipt | Mixed render/package terms | Rename visible history labels |

## Recommendation

Freeze status for first-render UX: YELLOW.

No audited issue blocks a first render, but the homepage encoding problem and NodeMuncher CTA are high-confidence P1 fixes before sending new users at paid traffic.
