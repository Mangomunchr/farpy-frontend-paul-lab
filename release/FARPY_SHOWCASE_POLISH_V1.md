# FARPY_SHOWCASE_POLISH_V1

Status: GREEN
Date: 2026-07-03

## Files changed

- `src/app/showcase/page.tsx`
- `src/app/globals.css`
- `release/FARPY_SHOWCASE_POLISH_V1.md`

## What changed

- Polished the existing `/showcase` page without changing backend behavior or form handling.
- Updated hero copy to focus on turning a Blender or Octane project into a featured Farpy Showcase.
- Reduced and constrained hero headline sizing so `Farpy Showcase` wraps cleanly instead of clipping.
- Replaced the text-only hero card with a premium visual placeholder for `Farpy Showcase #001`.
- Added honest placeholder copy only:
  - `Featured artist`
  - `Artwork coming soon.`
  - `Your project could be here.`
  - `Powered by Farpy`
- Reworked the four offer cards with simple icons and clearer labels:
  - Upload project
  - Render with Farpy
  - Featured artist
  - Published across Farpy
- Added a Coming Soon gallery above the submission form with three honest placeholder cards.
- Improved form spacing and made the submit button presentation slightly stronger.
- Added responsive CSS so the hero, gallery, cards, and form stack cleanly on smaller screens.

## What was intentionally not changed

- No backend/API changes.
- No new form backend.
- No fake artists.
- No fake renders.
- No fake artwork.
- No metadata changes; existing SEO metadata was preserved.
- No production deployment in this milestone.

## Validation

```powershell
npm.cmd run build
```

Result: PASS

Additional checks:

- Built `/showcase` contains `Farpy Showcase #001`.
- Built `/showcase` contains `Artwork coming soon.`.
- Built `/showcase` contains `Your project could be here.`.
- Built `/showcase` contains `Upload project`, `Render with Farpy`, `Featured artist`, and `Published across Farpy`.
- Built `/showcase` contains `Showcase #001`, `Showcase #002`, and `Showcase #003`.
- Built output scan found no `Lorem ipsum`, `fake artist`, or `fake artwork` copy.
- `src/app/globals.css` verified as UTF-8 without BOM and without mojibake after edit cleanup.

FARPY_SHOWCASE_POLISH_V1 = GREEN
