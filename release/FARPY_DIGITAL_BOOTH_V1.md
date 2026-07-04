# FARPY_DIGITAL_BOOTH_V1

Status: GREEN

## Scope
- Added public `/booth` route with booth-style banner, TV, counter, brochure rack, download table, showcase wall, and contact area.
- Used only existing public routes and assets. No fake telemetry, visitors, awards, artists, renders, showcase entries, or demo video.
- Added `/booth` to the sitemap and footer.

## Notes
- No public demo video file was found in `public/`, so the TV uses the requested clickable "Demo coming soon." state.
- No canonical Farpy X, Discord, or GitHub link was found in the existing app/docs, so contact exposes the existing `support@farpy.com` email only.

## Validation
- `npm.cmd run build` passed.
- Booth CSS includes desktop-first three-column booth rows with tablet/mobile single-column fallbacks and page-level overflow clipping.

FARPY_DIGITAL_BOOTH_V1 = GREEN