# FARPY_DIGITAL_BOOTH_SCREENSHOT_AUDIT_V1

Status: GREEN

## Preview
- Local preview: `http://127.0.0.1:3018/booth`
- Preview mode: `npm.cmd run dev -- -p 3018`

## Screenshots
- Desktop: `release/booth-proof/booth-desktop-1440x1100.png`
- Mobile: `release/booth-proof/booth-mobile-390x1200.png`

## Audit Results
- Looks like a booth, not a normal page: PASS
- No clipped banner: PASS
- No horizontal overflow: PASS
- TV visible: PASS
- Counter visible: PASS
- Brochure rack visible: PASS
- Showcase wall visible: PASS
- Mobile stacks cleanly: PASS

## Viewport Checks
Desktop CDP metrics:
- `clientWidth`: 1425
- `scrollWidth`: 1425
- Key booth elements visible inside viewport: banner, TV, counter, rack, showcase.

Mobile CDP metrics:
- `clientWidth`: 390
- `scrollWidth`: 390
- `bodyScrollWidth`: 390
- Key booth elements fit inside x=32..358: banner, TV, counter, rack, showcase.

## Notes
- The screenshot audit found mobile right-edge crowding and collapsed-looking booth word spacing on the first capture.
- Fixed with booth-scoped font normalization, mobile width containment, and a booth-page-only mobile nav CTA hide.
- Re-captured desktop and mobile screenshots after fixes.
- `npm.cmd run build` passed after the screenshot-audit fixes.

FARPY_DIGITAL_BOOTH_SCREENSHOT_AUDIT_V1 = GREEN