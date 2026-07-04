# FARPY_DIGITAL_BOOTH_POLISH_V1

Status: GREEN

## Scope

Polished the existing `/booth` immersive conference booth so it reads as a physical premium expo booth instead of floating UI cards.

Changed files:

- `src/app/booth/page.tsx`
- `src/app/globals.css`

## Booth Polish

- Enlarged and centered the mounted TV; added thicker bezel treatment, reflection, stronger shadow, and a heavier stand.
- Widened the counter to anchor the booth at roughly booth-width scale.
- Kept Chompy on the left side of the counter.
- Lowered and strengthened the suspended banner with visible ceiling cables and drop shadow.
- Restyled the brochure stand so cards read as inserted rack pieces.
- Updated showcase frame copy to `YOUR ART HERE` and `Help us replace the AI placeholders.`
- Kept the `Submit Artwork` action linked to `/showcase`.
- Strengthened floor perspective, side boundaries, soft lighting, and convention-hall grounding.
- Added/kept subtle convention details: `Booth B-1337`, `Free demos. No free GPUs.`, and `Always Open.`

## Validation

Command:

```powershell
npm.cmd run build
```

Result: PASS

Build output includes static route:

```text
○ /booth
```

## Screenshot Evidence

Saved fresh screenshots:

- `release/booth-proof/booth-polish-desktop-1440x1100.png`
- `release/booth-proof/booth-polish-mobile-390x1200.png`

Desktop rendered metrics:

```json
{
  "viewport": { "width": 1440, "height": 1100 },
  "overflow": { "clientWidth": 1425, "scrollWidth": 1425, "bodyScrollWidth": 1425 },
  "elements": {
    "banner": { "x": 332, "y": 141, "w": 760, "h": 200, "visible": true },
    "tv": { "x": 382, "y": 373, "w": 660, "h": 424, "visible": true },
    "counter": { "x": 153, "y": 770, "w": 1120, "h": 245, "visible": true },
    "rack": { "x": 989, "y": 501, "w": 270, "h": 344, "visible": true },
    "showcase": { "x": 169, "y": 482, "w": 330, "h": 304, "visible": true },
    "downloads": { "x": 535, "y": 774, "w": 280, "h": 145, "visible": true }
  }
}
```

Mobile rendered metrics:

```json
{
  "viewport": { "width": 390, "height": 1200 },
  "overflow": { "clientWidth": 390, "scrollWidth": 390, "bodyScrollWidth": 390 },
  "elements": {
    "banner": { "x": 32, "w": 326, "visible": true },
    "tv": { "x": 32, "w": 326, "visible": true },
    "showcase": { "x": 32, "w": 326, "visible": true },
    "rack": { "x": 32, "w": 326, "visible": true },
    "counter": { "x": 32, "w": 326, "visible": true }
  }
}
```

## Visual Audit

- TV visually dominates the booth.
- Counter anchors the booth and spans the scene.
- Banner reads first and appears suspended.
- Brochures appear seated in the rack.
- Showcase frame reads as a gallery-style frame.
- Desktop has no horizontal overflow.
- Mobile stacks cleanly with no horizontal overflow.

FARPY_DIGITAL_BOOTH_POLISH_V1 = GREEN