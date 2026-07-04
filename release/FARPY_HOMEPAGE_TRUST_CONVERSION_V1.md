# FARPY_HOMEPAGE_TRUST_CONVERSION_V1

## Status

GREEN

## Files changed

- `src/app/page.tsx`
- `src/components/HomeRenderFlow.tsx`
- `src/app/globals.css`
- `src/lib/site.ts`
- `release/FARPY_HOMEPAGE_TRUST_CONVERSION_V1.md`

## What changed

- Reduced repeated "small render packages" language on the homepage and shared homepage metadata.
- Kept one bounded alpha-capacity mention near the "Best used for" section.
- Replaced the top explainer cards with:
  - `1 Upload`
  - `2 Rendering`
  - `3 Download + Receipt`
- Updated the disabled package CTA to `Choose package to continue`.
- Kept the valid selected-file CTA as `Send package`.
- Converted the "After you send" list into a compact package timeline:
  - Package received
  - Render Partner accepts it
  - Rendering
  - Download package + receipt
- Added a proof strip above "How it works" using honest static copy:
  - `Every completed package produces a verified receipt.`
- Added a reserved visual proof card because no real public render image was found in existing assets:
  - `Sample render gallery coming after Alpha User #1.`
- Added homepage conversion callouts for:
  - Benchmark: `Compare real GPU benchmark results.`
  - Blender add-on: `Render from inside Blender.`

## Intentionally not changed

- No backend changes.
- No API changes.
- No payment, wallet, pricing, render, receipt, or download logic changes.
- No fake telemetry, render counts, testimonials, latest-render metrics, or gallery images.
- No new dependencies.
- No production deploy in this milestone.

## Build and verification

Command run:

```powershell
npm.cmd run build
```

Result:

- PASS
- Next.js static build completed successfully.
- Generated 37 static pages.

Homepage output scan:

- Source-level homepage scan shows `Best for small render packages today` appears once in `src/app/page.tsx` and is absent from `src/components/HomeRenderFlow.tsx` and `src/lib/site.ts`.
- Built `out/index.html` includes Next.js serialized copies of the same rendered phrase; the visible homepage copy keeps one capacity mention near `Best used for`.
- `Choose package first` is absent from `out/index.html`.
- `Choose package to continue` is present.
- `Every completed package produces a verified receipt` is present.
- `Sample render gallery coming after Alpha User #1` is present.
- `Compare real GPU benchmark results` is present.
- `Render from inside Blender` is present.

## Known limitations

- The proof strip uses static trust copy because no public latest-render feed was identified in the homepage data path.
- The visual proof block is reserved because no real render image was available in public assets for this pass.
