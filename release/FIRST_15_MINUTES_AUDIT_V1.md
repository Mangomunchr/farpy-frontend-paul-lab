# FIRST_15_MINUTES_AUDIT_V1

Status: YELLOW

Date: 2026-07-01

Mode: read-only audit. No code changes.

## Objective

Audit only the first fifteen minutes for a brand-new user.

Scope:

- Homepage
- Signup/signin
- Wallet
- Upload
- Workspace

Ignored:

- Advanced receipt verification
- NodeMuncher broad launch
- Benchmark
- Add-on installation
- Ops/internal surfaces
- Disaster recovery

## Executive Summary

No P0 first-render blocker was found in source review.

The first fifteen minutes are launchable, but not frictionless. The main P1 issue is cognitive load: the path asks a new user to learn Farpy terms, wallet top-up behavior, render/package language, and partner/NodeMuncher concepts at almost the same time.

Current first-15-minute status: YELLOW.

Retail alpha can proceed, but Alpha User #1 should be watched closely for payment/wallet and terminology confusion.

## P0

None found in this audit.

## P1

### 1. Homepage introduces "Rendars" and "NodeMunchers" too early

Evidence:

- `src/components/HomeRenderFlow.tsx`
- Homepage trust line: `Rendars send packages. NodeMunchers earn by running render partners.`
- Secondary CTA: `Become a render partner`

Why it matters:

A brand-new user wants to know what to do first. "Rendar" and "NodeMuncher" are internal/community terms that compete with the main action: send a package.

Concrete fix:

- Keep the primary customer sentence focused on:
  - Upload package.
  - Track delivery.
  - Download ZIP + receipt.
- Move NodeMuncher language below the first upload card or to a separate secondary section.
- Replace the first-minute line with plainer copy:
  - `Send a package to Farpy. Render partners process it.`

### 2. Wallet model is still a first-run mental hurdle

Evidence:

- `src/components/TopUpPage.tsx`
- Topup copy: `Add wallet balance for future render packages.`
- Workspace can show either `Top Up`, `Send package`, or `Pay and send package` depending on state.

Why it matters:

New users may expect "pay for this render" rather than "top up a wallet, then spend from it." This is not broken, but it can create hesitation before the first paid package.

Concrete fix:

- On `/topup`, add one plain sentence near the balance:
  - `Your wallet is used to pay for render packages. Unused balance stays in your account.`
- On workspace payment area, prefer one explanation:
  - `This package costs $X. Use wallet balance or checkout to send it.`
- Keep Card primary.

### 3. Upload-before-signin flow may surprise users

Evidence:

- `src/components/HomeRenderFlow.tsx`
- Homepage upload calls `/uploads/create` directly and redirects to workspace.
- `src/components/Workspace.tsx` later shows `Sign in to Pay` when needed.

Why it matters:

This is good for momentum, but a brand-new user may not realize account/signin is required before payment/history/download continuity.

Concrete fix:

- Near the homepage send button, add a small line:
  - `You can choose a package first. Sign in is required before payment.`

### 4. Topup navigation label is inconsistent

Evidence:

- `src/components/SiteNav.tsx`
- Nav label: `TopUp`
- Page title: `Top up wallet`

Why it matters:

This is small, but in the first fifteen minutes "TopUp" looks like product jargon or a typo.

Concrete fix:

- Rename nav label to `Top up`.

### 5. Workspace empty state repeats itself

Evidence:

- `src/components/Workspace.tsx`
- Empty state shows:
  - `No package selected.`
  - `No active package selected.`

Why it matters:

The user may land on `/workspace` from nav before sending a package. Repeating the same idea wastes the chance to tell them what to do next.

Concrete fix:

- Use:
  - Title: `No package selected.`
  - Body: `Send a small Blender or Octane package to start tracking delivery.`

### 6. Workspace still contains mojibake in completed-state copy

Evidence:

- `src/components/Workspace.tsx`
- `downloadMeta` join string contains `â€¢`.
- Verified badge text contains `Verify receipt â€¢ SHA-256 verified`.

Why it matters:

This may appear after the first render completes, which can happen inside the first fifteen minutes for a small package. It damages trust at the exact moment the user is checking delivery.

Concrete fix:

- Replace `â€¢` with `•`.

### 7. Bitcoin is visible during the first wallet visit

Evidence:

- `src/components/TopUpPage.tsx`
- Payment tabs include `Card` and `Bitcoin`.
- Lightning is correctly gated.

Why it matters:

Bitcoin is allowed, but Alpha User #1 should probably use Card. Two rails in the first wallet visit may distract from the shortest path.

Concrete fix:

- Keep Bitcoin visible if required, but make Card visually primary and label Bitcoin as secondary:
  - `Bitcoin invoice`
  - `Use Card for the fastest first top-up.`

## P2

### 1. "Dispatcher" may be unfamiliar in the workspace journey

Evidence:

- `src/lib/worldLanguage.ts`
- Workspace journey includes `Dispatcher`.

Why it matters:

Not a blocker. "Queued" or "Finding render partner" may be easier than a new noun.

Concrete fix:

- Consider replacing customer-visible `Dispatcher` with `Finding render partner`.

### 2. "Render Partner accepts it" is slightly abstract

Evidence:

- `src/components/HomeRenderFlow.tsx`
- After-send journey: `Render Partner accepts it`

Why it matters:

User understands "Farpy starts rendering" faster than "accepts it."

Concrete fix:

- Use:
  - `Render partner starts it`
  - or `Farpy starts rendering`

### 3. Account requirement copy is accurate but not motivating

Evidence:

- `src/components/AuthPage.tsx`
- Copy: `Accounts are required for stored balances.`

Why it matters:

Accurate, but a first user may care more about receipt/history/download persistence.

Concrete fix:

- Consider:
  - `Sign in to keep your wallet, package history, downloads, and receipts.`

## First-15-Minute Path Assessment

| Area | User Goal | Current Status | Main Friction |
|---|---|---|---|
| Homepage | Understand and start | YELLOW/GREEN | Too many named concepts early |
| Signup | Create/sign in | GREEN | "Account" is framed around balance only |
| Wallet | Add funds | YELLOW | Wallet-first model needs one clearer sentence |
| Upload | Send package | GREEN | Sign-in/payment requirement appears later |
| Workspace | Track package | YELLOW | Empty state and completed-state copy polish |

## Recommended Next Small Fixes

1. Remove or defer "Rendars" from the hero first-minute copy.
2. Rename nav `TopUp` to `Top up`.
3. Add one wallet explainer line on `/topup`.
4. Add one sign-in-before-payment hint near homepage Send package.
5. Replace workspace mojibake `â€¢` with `•`.
6. Simplify workspace empty state.

## Commands Run

```powershell
rg -n "Send package|Upload package|Wallet|Sign in|Continue with Google|Package received|Dispatcher|Render Partner|Pay and send package|Delivery Receipt|topup|workspace" C:\Users\danki\Desktop\farpy-frontend\src -S
Get-ChildItem -LiteralPath C:\Users\danki\Desktop\farpy-frontend\src\components -File
Get-Content -LiteralPath C:\Users\danki\Desktop\farpy-frontend\docs\FARPY_BOOK\CONTROLLED_ALPHA_USER_1.md -Raw
Get-Content -LiteralPath C:\Users\danki\Desktop\farpy-frontend\src\components\HomeRenderFlow.tsx -Raw
Get-Content -LiteralPath C:\Users\danki\Desktop\farpy-frontend\src\components\TopUpPage.tsx -Raw
Get-Content -LiteralPath C:\Users\danki\Desktop\farpy-frontend\src\components\AuthPage.tsx -Raw
Get-Content -LiteralPath C:\Users\danki\Desktop\farpy-frontend\src\components\Workspace.tsx -Raw
```

## Production Mutation

None.

## Verdict

YELLOW.

No first-15-minute P0 was found. The path is usable for controlled alpha, but the first user should be observed for wallet-model confusion and terminology hesitation.
