# OCTANE_FRAME_POLICY_SYNC_V1

Status: IMPLEMENTED
Date: 2026-06-30

## Objective

Make the public Octane frame policy consistent across homepage, docs, FAQ, LLM files, add-on website copy, and API-facing customer copy.

## Current Truth

Public Octane alpha is still-only.

- `.orbx` packages are accepted for Octane still renders.
- Public Octane frame count is locked to `1`.
- Public Octane pricing uses `1` frame.
- Private historical multi-frame Octane proof remains a controlled/internal smoke result and is not public product copy.

## Files Changed

- `src/components/HomeRenderFlow.tsx`
- `src/components/AddonPage.tsx`
- `src/app/downloads/page.tsx`
- `public/downloads/Farpy-Blender-Addon-unified.zip`
- `public/downloads/Farpy-Blender-Addon-unified.zip.sha256`
- `C:\Users\danki\Desktop\Farpy-Blender-Addon-unified.zip`
- `C:\Users\danki\Desktop\farpy_blender_addon_octane_export\farpy_render\__init__.py`
- `release/OCTANE_FRAME_POLICY_SYNC_V1.md`

## Homepage Enforcement

When a `.orbx` package is selected:

- Output is forced to `Still image`.
- Animation option is disabled.
- Frame input is disabled and displays `1`.
- Helper text says: `Octane public alpha is still-only: 1 frame.`
- Upload and price payloads submit `frame_start=1`, `frame_end=1`, and `frame_count=1`.

## Add-on Website Copy

The add-on handoff page now says existing Octane `.orbx` packages can be sent as `1-frame still packages`, and automatic ORBX export is not included yet.

## Blender Add-on Copy

The packaged Blender add-on now labels existing Octane `.orbx` packages as `1-frame still packages in public alpha`.

The add-on still uploads existing `.orbx` files with `frame_start=1`, `frame_end=1`, and `frame_count=1`.

## Add-on Artifact

Updated ZIP SHA256:

`8D5CA2D53C2C71736BF9D7205D61D07D49AF40C2BB8E6EA97B697ABC6FC6260B`

## Behavior Preserved

- No backend renderer code changed.
- No API changed.
- Blender still supports stills and animation frame ranges.
- Existing docs/FAQ/LLM copy already stated Octane public alpha is still-only and remains aligned.

## Validation

- `npm.cmd run build` passed.
- `node --check` was not required because no backend/API JavaScript changed.
- Rebuilt Blender add-on ZIP and verified `public` and `out` copies match SHA256 `8D5CA2D53C2C71736BF9D7205D61D07D49AF40C2BB8E6EA97B697ABC6FC6260B`.
- Verified source/output contain `Octane public alpha is still-only: 1 frame.`
- Verified source/output contain `Existing Octane .orbx packages can be sent as 1-frame still packages.`
- Verified stale add-on copy `Octane .orbx packages should be sent from` is absent from source, public assets, and build output.
- Verified `Octane renders each requested frame` is absent from source, public assets, and build output.

## Result

PASS
