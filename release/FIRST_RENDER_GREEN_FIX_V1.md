# FIRST_RENDER_GREEN_FIX_V1

Status: PASS

## Scope

Closed the remaining first-render P1 issues from `FIRST_RENDER_GREEN_RECHECK_V1`.

No backend, API, payment, pricing, wallet, render, receipt, or route behavior changed.

## Files changed

- `src/app/layout.tsx`
- `src/components/Workspace.tsx`
- `src/components/AccountPage.tsx`
- `src/app/account/page.tsx`
- `src/components/FaqSection.tsx`
- `src/components/ApiPage.tsx`
- `src/components/HomeRenderFlow.tsx`
- `src/app/page.tsx`
- `src/app/signup/page.tsx`
- `public/llms.txt`
- `public/llms-full.txt`
- `release/FIRST_RENDER_GREEN_FIX_V1.md`

## Changes

Page titles:

- Replaced the broken title template separator with `-`.
- Example output: `Pricing - Farpy`

Workspace CTA:

- Before: `Pay & Render`
- After: `Pay and send package`

Account/package language:

- `render history` -> `package history`
- `No renders yet.` -> `No packages yet.`
- `View Workspace` -> `View workspace`
- `View Receipt` -> `View delivery receipt`

Related public copy and LLM files were aligned so generated output no longer contains the old `render history` phrase.

## Validation

Build:

```powershell
npm.cmd run build
```

Result: PASS

Recursive built output scan:

```text
OLD Â· false
OLD Ã‚Â· false
OLD Pay & Render false
OLD render history false
OLD No renders yet false
OLD View Workspace false
OLD View Receipt false
NEEDED  - Farpy true
NEEDED Pay and send package true
NEEDED package history true
NEEDED No packages yet true
NEEDED View workspace true
NEEDED View delivery receipt true
FILES_SCANNED 300
```

## Result

FIRST_RENDER_GREEN_FIX_V1 = PASS
