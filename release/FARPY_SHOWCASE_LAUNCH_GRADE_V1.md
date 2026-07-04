# FARPY_SHOWCASE_LAUNCH_GRADE_V1

Status: GREEN
Date: 2026-07-03

## Files changed

- `src/app/showcase/page.tsx`
- `src/app/globals.css`
- `release/FARPY_SHOWCASE_LAUNCH_GRADE_V1.md`

## What changed

- Tightened the Showcase hero so the text and visual panel feel like one composition at desktop widths.
- Replaced the prior placeholder-style visual card with a cleaner panel:
  - `Your work here`
  - `Farpy Showcase #001`
  - `Featured artist collaboration`
  - `No fake artist. No fake artwork.`
- Converted selected artist benefits into clear badges:
  - Free rendering assistance
  - Full artist credit
  - Portfolio/social links
  - Promotion across Farpy
- Removed the three-card Coming Soon gallery until real artists exist.
- Added one clean CTA band above the form:
  - `First Farpy Showcase is now open for submissions.`
  - `Submit your work`
- Kept the rights/selection section.
- Kept the existing submission form and mailto behavior.

## What was intentionally not changed

- No backend.
- No API changes.
- No fake artists.
- No fake artwork.
- No fake renders.
- No metadata changes.
- No production deploy in this milestone.

## Validation

```powershell
npm.cmd run build
```

Result: PASS

Built `/showcase` checks:

- Contains `Your work here`.
- Contains `Farpy Showcase #001`.
- Contains `Featured artist collaboration`.
- Contains `Free rendering assistance`.
- Contains `Full artist credit`.
- Contains `Portfolio/social links`.
- Contains `Promotion across Farpy`.
- Contains `First Farpy Showcase is now open for submissions.`.
- Contains `Submit your work`.
- Does not contain `Showcase #002`.
- Does not contain `Showcase #003`.
- Does not contain `404: This page could not be found`.

FARPY_SHOWCASE_LAUNCH_GRADE_V1 = GREEN
