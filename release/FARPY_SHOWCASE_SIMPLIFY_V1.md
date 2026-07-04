# FARPY_SHOWCASE_SIMPLIFY_V1

Status: GREEN

## Goal
Radically simplify `/showcase` so the ad sells and the page collects submissions.

## Files Changed
- `src/app/showcase/page.tsx`
- `src/components/ShowcaseForm.tsx`
- `src/app/globals.css`
- `release/FARPY_SHOWCASE_SIMPLIFY_V1.md`

## What Changed
- Removed the hero artwork/card, visual placeholder, benefits section, badge grid, feature cards, coming-soon gallery, CTA bands, and long rights section.
- Reduced the page to one centered H1, two short intro lines, the submission form, and one legal note.
- Kept the existing mailto submission behavior; no backend or API changes.
- Reordered the form to: Artist name, Email, Portfolio, Project link, Tool, Short description, rights confirmation, submit.
- Simplified Showcase CSS around a 780px centered layout with mobile stacking.

## Intentionally Not Changed
- No backend form handler was added.
- No fake artists, fake artwork, placeholder gallery, or telemetry was added.
- No routing, API, payment, or product behavior changed.

## Commands Run
```powershell
npm.cmd run build
```

Additional validation scans checked `out/showcase.html` for required copy and confirmed removed placeholder/marketing strings are absent.

## Validation
- Build: PASS
- `/showcase` static export: PASS
- Required submission copy present: PASS
- Old placeholder/gallery/benefit copy absent: PASS
- No lorem ipsum or fake artist content: PASS
- Responsive CSS includes single-column mobile form behavior: PASS

FARPY_SHOWCASE_SIMPLIFY_V1 = GREEN
