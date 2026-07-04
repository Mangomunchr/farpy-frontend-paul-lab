# FARPY_DIGITAL_BOOTH_LAYOUT_V2

Status: GREEN

## Scope

Fixed `/booth` desktop composition so it reads as a wider premium exhibit booth instead of compressed overlapping cards.

Changed file:

- `src/app/globals.css`

No backend, no new routes, no fake content.

## Layout Changes

- Widened the desktop booth shell to use the available viewport more fully.
- Increased booth height so the scene has room to breathe vertically.
- Made the TV the center visual anchor at `874px` wide in the desktop proof.
- Moved showcase completely left as a wall-mounted frame.
- Moved brochure rack completely right as a separate stand.
- Expanded the counter to `1500px` wide in the desktop proof.
- Moved downloads below the counter as a separate shelf.
- Visually removed large floating `BROCHURE STAND` and `DOWNLOAD TABLE` labels while preserving accessible headings.
- Increased major object spacing to roughly 50px+ on the wall and 160px from TV to counter.

## Validation

Command:

```powershell
npm.cmd run build
```

Result: PASS

Static route confirmed:

```text
○ /booth
```

## Screenshot Proof

Desktop screenshot:

- `release/booth-proof/booth-layout-v2-desktop-1728x1560.png`

Rendered metrics:

```json
{
  "viewport": { "width": 1728, "height": 1560 },
  "overflow": { "clientWidth": 1713, "scrollWidth": 1713, "bodyScrollWidth": 1713 },
  "elements": {
    "banner": { "x": 527, "y": 126, "w": 660, "h": 161, "visible": true },
    "tv": { "x": 419, "y": 361, "w": 874, "h": 538, "visible": true },
    "showcase": { "x": 85, "y": 471, "w": 280, "h": 294, "visible": true },
    "rack": { "x": 1346, "y": 475, "w": 280, "h": 316, "visible": true },
    "counter": { "x": 107, "y": 1062, "w": 1500, "h": 251, "visible": true },
    "downloads": { "x": 597, "y": 1366, "w": 520, "h": 140, "visible": true }
  },
  "gaps": {
    "showcase_to_tv": 54,
    "tv_to_rack": 52,
    "tv_to_counter": 164,
    "counter_to_downloads": 52
  }
}
```

## Visual Result

- TV is the first major visual object.
- Showcase, TV, and brochures occupy distinct wall zones.
- Counter reads as a reception desk, not a floating card.
- Downloads read as a small shelf below the counter.
- Desktop has no horizontal overflow.

FARPY_DIGITAL_BOOTH_LAYOUT_V2 = GREEN