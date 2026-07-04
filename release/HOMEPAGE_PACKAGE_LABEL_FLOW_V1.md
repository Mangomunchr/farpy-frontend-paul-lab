# HOMEPAGE_PACKAGE_LABEL_FLOW_V1

Date: 2026-06-30
Scope: Homepage UI only. No backend, API, pricing, or payment logic changes.

## Files Changed

- `src/components/HomeRenderFlow.tsx`
- `src/app/globals.css`
- `release/HOMEPAGE_PACKAGE_LABEL_FLOW_V1.md`

## Before

The homepage estimator used system-centric render configuration language:

- Visible renderer selection cards.
- Render lane wording.
- Normal/Fast lane labels.
- Frames-to-render copy.
- Upload controls mixed with renderer selection.

## After

The homepage now follows a package-label flow:

1. Package
   - `Send package`
   - `Drop a .blend or .orbx package here.`
   - `Choose package`
   - Selected files show filename plus `Blender package` or `Octane package` inferred from extension.

2. Output
   - `Still image`
   - `Animation`

3. Frames
   - Still image uses one `Frame` field.
   - Animation uses `From` / `To` frame fields.
   - Total frames are calculated as `end - start + 1`.
   - Frame validation clamps to frame >= 1 and end >= start.

4. Delivery
   - `Standard` = existing normal queue/rate.
   - `Priority` = existing fast queue/rate.
   - Pricing math is unchanged.

5. Summary
   - Shows frame count, delivery choice, and price.

6. CTA
   - Single primary CTA area.
   - Before file selection: disabled `Choose package first`.
   - After file selection: `Send package`.

7. Trust microline
   - `Receipt-backed | SHA-256 verified | No subscription`

8. After-you-send journey
   - Package received
   - Render Partner accepts it
   - Rendering
   - Download package + receipt

## API / Payload Behavior

No backend API changed.

The existing upload and price endpoints are still used:

- `POST ${WEB_RENDER_API_BASE}/uploads/create`
- `POST ${WEB_RENDER_API_BASE}/jobs/:job_id/price`

Existing payload fields are preserved:

- `renderer`
- `frame_count`
- `frame_start`
- `frame_end`

Renderer inference:

- `.blend` -> `blender`
- `.orbx` -> `octane`
- unknown extension -> visible unsupported package error

## Mobile Notes

Added scoped CSS so the new frame range and package summary stack cleanly on narrow screens:

- Frame range becomes one column under 540px.
- Upload title and price total clamp down on mobile.
- No intentionally wide controls were added.

## Known Limitations

- The UI does not inspect files.
- It does not claim automatic scene frame detection.
- Pricing remains based on the existing frame count and delivery rate model.
- Octane frame support policy is not changed by this UI patch.

## Commands Run

```powershell
npm.cmd run build
rg --fixed-strings "Render Lane" src public out
rg --fixed-strings "Frames to Render" src public out
rg --fixed-strings "Start a render" src public out
rg --fixed-strings "Render Factory" src public out
rg --fixed-strings "render factory" src public out
rg --fixed-strings "render factories" src public out
rg --fixed-strings "factory failed" src public out
rg --fixed-strings "Send package" src out
rg --fixed-strings "Drop a .blend or .orbx package here." src out
rg --fixed-strings "Still image" src out
rg --fixed-strings "Animation" src out
rg --fixed-strings "Standard" src out
rg --fixed-strings "Priority" src out
rg --fixed-strings "Receipt-backed" src out
rg --fixed-strings "SHA-256 verified" src out
rg --fixed-strings "No subscription" src out
rg --fixed-strings "Render Partner accepts it" src out
```

## Test Result

PASS.

Build result:

```text
npm.cmd run build
Compiled successfully
TypeScript finished successfully
Static pages generated successfully
```

Forbidden public terms scan:

```text
Render Lane: absent
Frames to Render: absent
Start a render: absent
Render Factory: absent
render factory: absent
render factories: absent
factory failed: absent
```

Required package-label terms scan:

```text
Send package: present
Drop a .blend or .orbx package here.: present
Still image: present
Animation: present
Standard: present
Priority: present
Receipt-backed: present
SHA-256 verified: present
No subscription: present
Render Partner accepts it: present
```
