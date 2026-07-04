# BLENDER_ADDON_POLISH_V1

## Status

PASS

## Files changed

- `public/downloads/Farpy-Blender-Addon-unified.zip`
- `public/downloads/Farpy-Blender-Addon-unified.zip.sha256`
- `C:\Users\danki\Desktop\Farpy-Blender-Addon-unified.zip`
- `release/BLENDER_ADDON_POLISH_V1.md`

Source edited and packaged from:

- `C:\tmp\farpy-addon-polish-v1\farpy_render\__init__.py`

Backup created:

- `C:\tmp\Farpy-Blender-Addon-unified.pre-polish.20260701002525.zip`

Final ZIP SHA256:

- `1679B392CE7ECC54C4E9AD31A04A2A92AFF826468CA8383CB7200011117176D5`

## UX improvements

- First-run panel now starts with a clear welcome flow:
  - Connect account
  - Select `.blend`
  - Render
  - Download receipt
- Pairing/account state is clearer:
  - Default state is `Not connected`.
  - The panel has a visible `Check connection` action.
  - 401 explains sign-in is required.
  - 403 explains the Farpy access token is invalid.
- Upload preflight is friendlier:
  - Unsaved `.blend` asks the user to save first.
  - Missing local file gives a plain recovery message.
  - Non-`.blend` scene sends the user to the supported package path.
  - Missing scene camera is blocked before upload with a human message.
- Progress wording is honest and bounded:
  - Uploading
  - Queued
  - Rendering
  - Packaging
  - Ready
  - Failed
  - No fake percentages or fake timers.
- Completion actions are more obvious:
  - Open Workspace
  - Open Download
  - Open Receipt
  - Render another
- Error polish:
  - Connection failures now use human-readable copy.
  - Generic Python exception strings are not surfaced in the main status path.
  - No stack traces are shown in panel copy.
- Label cleanup:
  - `Send to Farpy` primary panel button changed to `Render`.
  - Existing ORBX action changed to `Send .orbx`.
  - `Refresh Status` changed to `Refresh`.
  - `View Account` shortened to `Account`.
  - `Lane` copy changed to `Delivery speed`.
- Advanced connection remains available, but is labeled as advanced and keeps the token field password-masked.

## What was intentionally not changed

- No backend API changes.
- No wallet, payment, render, receipt, or schema changes.
- No automatic ORBX export.
- No fake telemetry, fake timers, fake progress percentages, or fake success states.
- No new dependencies.
- No Blender UI redesign beyond native panel layout/copy cleanup.

## Commands run

```powershell
tar -tf 'C:\Users\danki\Desktop\farpy-frontend\public\downloads\Farpy-Blender-Addon-unified.zip'
Get-FileHash -Algorithm SHA256 'C:\Users\danki\Desktop\farpy-frontend\public\downloads\Farpy-Blender-Addon-unified.zip'
Expand-Archive -LiteralPath 'C:\Users\danki\Desktop\farpy-frontend\public\downloads\Farpy-Blender-Addon-unified.zip' -DestinationPath 'C:\tmp\farpy-addon-polish-v1' -Force
python -m py_compile 'C:\tmp\farpy-addon-polish-v1\farpy_render\__init__.py'
Compress-Archive -Path 'C:\tmp\farpy-addon-polish-v1-stage\farpy_render' -DestinationPath 'C:\Users\danki\Desktop\farpy-frontend\public\downloads\Farpy-Blender-Addon-unified.zip' -Force
Get-FileHash -Algorithm SHA256 'C:\Users\danki\Desktop\farpy-frontend\public\downloads\Farpy-Blender-Addon-unified.zip'
tar -tf 'C:\Users\danki\Desktop\farpy-frontend\public\downloads\Farpy-Blender-Addon-unified.zip'
npm.cmd run build
Expand-Archive -LiteralPath 'C:\Users\danki\Desktop\farpy-frontend\public\downloads\Farpy-Blender-Addon-unified.zip' -DestinationPath 'C:\tmp\farpy-addon-polish-v1-verify' -Force
python -m py_compile 'C:\tmp\farpy-addon-polish-v1-verify\farpy_render\__init__.py'
```

## Build status

- Python syntax check on edited source: PASS
- Python syntax check from rebuilt ZIP: PASS
- ZIP shape: PASS, contains only `farpy_render/__init__.py`
- Frontend build: PASS

## Screenshots

- Not captured in this pass. Blender runtime/UI automation was not available in the current tool session.

## Known limitations

- The add-on still relies on Farpy website/workspace for final pricing, payment, download, and receipt presentation.
- `Open Download` and `Open Receipt` use direct URLs only when the existing backend response/status payload provides them; otherwise they fall back to the workspace.
- The access token field is preserved for existing authenticated direct-upload behavior, but normal users should use Farpy account sign-in on the website.
