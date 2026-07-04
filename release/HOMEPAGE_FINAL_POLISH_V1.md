# HOMEPAGE_FINAL_POLISH_V1

Status: PASS

## Files changed

- `src/components/HomeRenderFlow.tsx`
- `src/app/page.tsx`
- `src/components/SiteNav.tsx`
- `src/components/ApiPage.tsx`
- `src/components/AuthPage.tsx`
- `src/components/Workspace.tsx`
- `src/app/workspace/[id]/page.tsx`
- `src/lib/worldLanguage.ts`
- `src/components/Workspace.tsx.bak.receipt_workspace_ux_20260628T152924Z`
- `release/HOMEPAGE_FINAL_POLISH_V1.md`

## Changes

- Replaced customer-facing render factory language with Render Partner / render partner language.
- Unified primary CTA wording to `Send package`.
- Updated homepage feature cards to Package, Render Partner, and Receipt.
- Changed upload copy to `Upload a Blender package` / `Upload an Octane package`.
- Compressed the homepage trust strip to `Receipt-backed`, `SHA-256 verified`, `Wallet tracked`, and `No subscription`.
- Updated the homepage how-it-works copy to `Upload package`, `Render Partners process it`, and `Download package + receipt`.

## Validation

- Source scan has no remaining `Render Factory`, `render factory`, `render factories`, `factory failed`, or `Start a render`.
- Backend, API, payment, wallet, pricing, and render logic were not changed.

## Commands

- `rg -n --fixed-strings "Start a render" src public`
- `rg -n --fixed-strings "Send a package" src public`
- `rg -n "Render Factory|Render factories|render factory|render factories|factory failed" src public`
- `npm.cmd run build`
