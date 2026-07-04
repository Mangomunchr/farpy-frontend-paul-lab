# FARPY_HOMEPAGE_ALPHA_SCREENSHOT_REVIEW_V1

## Status

GREEN

## Scope

Homepage local preview and screenshot review only.

## Files changed

- `src/app/globals.css`
- `release/FARPY_HOMEPAGE_ALPHA_SCREENSHOT_REVIEW_V1.md`

## Screenshots

- Desktop: `C:\tmp\farpy-homepage-alpha-cdp-desktop.png`
- Mobile: `C:\tmp\farpy-homepage-alpha-cdp-mobile.png`

## Review results

- First 5 seconds clarity: PASS
  - Hero explains the customer action.
  - Primary CTA is visible.
  - Upload/render/download receipt flow is visible above the package card.
- Trust proof visibility: PASS
  - Receipt-backed, SHA-256 verified, wallet tracked, and no subscription are visible near the hero.
- CTA state: PASS
  - Header and hero CTA show `Send package`.
  - Package card shows `Choose package` and disabled flow remains clear.
- Mobile layout: PASS
  - Device-emulated 390px viewport reports `scrollWidth=390`.
  - Header, hero, CTAs, trust strip, and package card fit without horizontal overflow.
- No fake metrics: PASS
  - No fake latest render, benchmark count, render time, or receipt metric was added.
- No repeated alpha limitation copy: PASS
  - Source keeps the alpha capacity wording only in the intended homepage `Best used for` location.

## Fix applied

- Tightened mobile-only CSS for homepage/header:
  - constrained header CTA width,
  - reduced mobile hero title sizing,
  - forced trust strip into a two-column mobile grid,
  - allowed trust labels to wrap cleanly.

## Commands run

```powershell
npm.cmd run build
```

```powershell
python -m http.server 3110 --bind 127.0.0.1
```

Chrome DevTools device emulation:

- Desktop viewport: `1440x1200`
- Mobile viewport: `390x1200`

## Build result

PASS

Next.js static build completed successfully and generated 37 pages.

## Production

No production deploy performed.
