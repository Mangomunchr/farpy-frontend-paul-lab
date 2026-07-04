# FARPY_SHOWCASE_HERO_LAYOUT_V1

Status: GREEN
Date: 2026-07-03

## Files changed

- `src/app/globals.css`
- `release/FARPY_SHOWCASE_HERO_LAYOUT_V1.md`

## What changed

- Kept the existing Showcase design and card treatment.
- Did not reduce the desktop H1 font size.
- Changed the Showcase hero from a loose fractional split to an explicit two-column layout:
  - left column: `minmax(min(56vw, 680px), 1fr)`
  - right column: `minmax(320px, 420px)`
- Increased desktop horizontal gap to `clamp(3rem, 6vw, 5.5rem)`.
- Added a max-width on the left copy column so text stays contained.
- Right-aligned the featured card with `justify-self: end`.
- Capped the featured card width at `420px`.
- Explicitly set `transform: none` on the featured card so it cannot translate into the text column.
- Changed the Showcase hero stack breakpoint to `900px` so tablet/mobile layouts stack vertically.

## Validation

```powershell
npm.cmd run build
```

Result: PASS

Additional checks:

- Built `/showcase` contains `Farpy Showcase`.
- Built `/showcase` contains `Farpy Showcase #001`.
- Built `/showcase` contains `Your project could be here`.
- Built `/showcase` does not contain `404: This page could not be found`.
- `globals.css` verified as UTF-8 without BOM, literal escape fragments, or mojibake.
- CSS line proof confirms:
  - explicit two-column grid
  - wider desktop gap
  - right-aligned capped card
  - no transform on card
  - stack breakpoint at `900px`

## Notes

No backend, API, or form changes were made. No production deploy was performed in this milestone.

Automated browser rectangle measurement was attempted, but local Playwright is not installed in this repo. Validation was therefore build plus static CSS/output checks.

FARPY_SHOWCASE_HERO_LAYOUT_V1 = GREEN
