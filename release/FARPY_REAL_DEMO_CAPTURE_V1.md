# FARPY_REAL_DEMO_CAPTURE_V1

## Status

BLOCKED

## Goal

Capture one complete real Farpy render from upload to finished download and produce launch-quality screenshots, video, and GIF previews.

## Blocker

No legitimate authenticated customer session input is available to this tool session.

Checked environment variables without printing values:

- `FARPY_WEB_RENDER_COOKIE`: absent
- `FARPY_AUTH_COOKIE`: absent
- `FARPY_SMOKE_BLEND_PATH`: absent
- `FARPY_AUDIT_JOB_STATUS_URL`: absent
- `FARPY_AUDIT_DOWNLOAD_URL`: absent
- `FARPY_AUDIT_RECEIPT_URL`: absent

The task requires a real render using a valid production/test account. Without an authenticated browser/session or operator-driven browser recording access, the capture cannot proceed without violating the no-fake/no-bypass rules.

## Real input found

Known-good small Blender files available locally:

- `C:\Users\danki\Desktop\farpy-frontend\public\smoke\real-smoke.blend`
- `C:\Users\danki\Desktop\farpy-test\cube.blend`
- `C:\Users\danki\Desktop\cube.blend`
- `C:\Users\danki\Desktop\farpy.blend`

Recommended capture input:

- `C:\Users\danki\Desktop\farpy-frontend\public\smoke\real-smoke.blend`

## Required operator input to unblock

Provide one of:

1. A logged-in browser session that can be driven/recorded by the capture tool.
2. A redacted-safe authenticated cookie in `FARPY_WEB_RENDER_COOKIE` or `FARPY_AUTH_COOKIE`.
3. A completed real job status/download/receipt URL set for capture-only verification:
   - `FARPY_AUDIT_JOB_STATUS_URL`
   - `FARPY_AUDIT_DOWNLOAD_URL`
   - `FARPY_AUDIT_RECEIPT_URL`

For a full upload-to-download recording, option 1 is preferred.

## Requested outputs not produced

- `release/demo-proof-pack/farpy-demo-60s.mp4`
- `release/demo-proof-pack/demo-upload.gif`
- `release/demo-proof-pack/demo-progress.gif`
- `release/demo-proof-pack/demo-download.gif`
- `10-job-uploaded.png`
- `11-job-queued.png`
- `12-job-rendering.png`
- `13-job-packaging.png`
- `14-job-ready.png`
- `15-download-page.png`
- `16-downloaded-zip.png`
- `17-render-output.png`
- `18-receipt.png`
- `19-proof.png`

Reason: no real authenticated render was started in this session.

## Commands executed

```powershell
rg -n "FARPY_WEB_RENDER_COOKIE|FARPY_AUTH_COOKIE|SMOKE_BLEND|cube\.blend|blender.*splash|paid.*smoke|public.*smoke|upload.*blend" scripts release docs
```

```powershell
Get-ChildItem -Path 'C:\Users\danki\Desktop' -Recurse -File -Include *.blend,*.orbx
```

```powershell
# presence-only env check; values were not printed
FARPY_WEB_RENDER_COOKIE
FARPY_AUTH_COOKIE
FARPY_SMOKE_BLEND_PATH
FARPY_AUDIT_JOB_STATUS_URL
FARPY_AUDIT_DOWNLOAD_URL
FARPY_AUDIT_RECEIPT_URL
```

## Job evidence

- Job ID: not created
- Receipt ID: not created
- Upload size: not captured
- Renderer: not run
- Render duration: not captured
- Output files: not captured
- ZIP size: not captured
- SHA-256: not captured

## PASS / BLOCKED

BLOCKED

No fake jobs, no fake states, no fake receipt, and no fake download media were created.
