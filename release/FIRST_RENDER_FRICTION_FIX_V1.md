# FIRST_RENDER_FRICTION_FIX_V1

Status: PASS

## Scope

Fixed the two highest-impact first-render friction items from `FIRST_RENDER_EXPERIENCE_AUDIT_V1`:

1. Homepage mojibake / broken visible characters.
2. NodeMuncher CTA confusion above the fold.

No backend, API, pricing, payment, render, receipt, or route behavior changed.

## Files changed

- `src/components/HomeRenderFlow.tsx`
- `src/app/layout.tsx`
- `release/FIRST_RENDER_FRICTION_FIX_V1.md`

## Changes

Homepage primary CTA:

- Before: `Start Rendering`
- After: `Send a package`

Homepage secondary CTA:

- Before: `Download NodeMuncher`
- After: `Run a render factory`

Clarifying copy added:

```text
Rendars send packages. NodeMunchers earn by running render factories.
```

Broken hero/trust-strip glyphs were replaced with plain text:

- `Package`
- `Factory`
- `Receipt`
- `Verified: SHA-256 downloads`
- `Verified: receipts for every completed package`
- `Verified: wallet balance never changes without a receipt`

Homepage metadata title separator was repaired:

- Before: `Farpy â€” Render Blender + Octane files for less`
- After: `Farpy - Render Blender + Octane files for less`

## Validation

Build:

```powershell
npm.cmd run build
```

Result: PASS

Built homepage UTF-8 scan:

```text
ð false
âœ false
â€ false
Download NodeMuncher false
Start Rendering false
Send a package true
Run a render factory true
Rendars line true
title clean true
```

## Result

FIRST_RENDER_FRICTION_FIX_V1 = PASS
