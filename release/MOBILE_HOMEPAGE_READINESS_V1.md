# MOBILE_HOMEPAGE_READINESS_V1

Status: PASS

## Files changed

- `src/app/globals.css`
- `release/MOBILE_HOMEPAGE_READINESS_V1.md`

## Commands run

- `npm.cmd run build`
- `python -m http.server 4177 --bind 127.0.0.1` from `out`
- Edge headless screenshot at 390x844
- Edge DevTools mobile viewport audit at 390x844
- Edge DevTools desktop viewport audit at 1440x1000
- `rg -n "overflow-x: clip|site-nav-links\\.fy-header__nav|home-page-v1 \\.fy-home-title|fy-home-actions|fy-first-minute-card" src\\app\\globals.css out\\_next\\static\\chunks`

## Before behavior

- Mobile header could show desktop nav links and crowd the CTA.
- The top CTA could spill off the right side on small viewports.
- Hero title and copy behaved like desktop content squeezed into a phone width.
- Homepage CTAs and first-minute cards had mobile sizing, but the page still had overflow risk from header/layout rules.

## After behavior

- At small widths, secondary header nav links are hidden and the logo plus one primary CTA remain visible.
- Header uses a single compact row on mobile without horizontal overflow.
- Hero title has a mobile-specific size and wrapping rule.
- Homepage CTA buttons stack full width with stronger spacing.
- First-minute cards reduce padding and heading sizes on mobile.
- `html` and `body` have a max-width and overflow guard while the offending mobile header/content widths are fixed directly.

## Mobile viewport tested

Viewport: 390x844 CSS pixels.

Measured proof:

```json
{
  "innerWidth": 390,
  "htmlClientWidth": 390,
  "htmlScrollWidth": 390,
  "bodyClientWidth": 390,
  "bodyScrollWidth": 390,
  "overflow": false,
  "site_nav_width": 390,
  "site_nav_links_display": "none",
  "site_nav_cta_right": 376,
  "title_width": 362,
  "actions_width": 362,
  "cards_width": 362,
  "has_primary_cta": true,
  "has_secondary_cta": true
}
```

Screenshot:

- `C:\tmp\mobile-homepage-readiness-v1-cdp-mobile.png`

## Desktop viewport tested

Viewport: 1440x1000 CSS pixels.

Measured proof:

```json
{
  "innerWidth": 1440,
  "htmlScrollWidth": 1425,
  "bodyScrollWidth": 1425,
  "overflow": false,
  "site_nav_links_display": "flex",
  "cta_text": "Start a render",
  "title_font": "44px"
}
```

Screenshot:

- `C:\tmp\mobile-homepage-readiness-v1-cdp-desktop.png`

## Known limitations

- Verified against local static export only.
- No production deploy was performed in this milestone.
- No backend, API, render, payment, route, or page behavior was changed.

## Test result

- `npm.cmd run build`: PASS
- Mobile homepage horizontal overflow: PASS
- Mobile header usability: PASS
- Mobile hero readability: PASS
- Mobile primary CTA visibility: PASS
- Desktop nav preservation: PASS
