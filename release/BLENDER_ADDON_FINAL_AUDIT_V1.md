# BLENDER_ADDON_FINAL_AUDIT_V1

Date: 2026-06-30

Objective: audit the Farpy Blender add-on as if it launches tomorrow.

Verdict: YELLOW

No P0 launch blocker was confirmed. The packaged add-on installs and enables in Blender 4.1, the public `/addon` handoff is live, the ZIP hash matches production, and the backend upload route exists. The remaining issues are launch-quality P1/P2 items, mostly around authentication clarity, status/progress expectations, and upgrade/signing-style operational polish.

## Artifact Audited

- Local source ZIP: `C:\Users\danki\Desktop\farpy-frontend\public\downloads\Farpy-Blender-Addon-unified.zip`
- Desktop copy: `C:\Users\danki\Desktop\Farpy-Blender-Addon-unified.zip`
- ZIP SHA256: `BE2312CE5E77A1E62C1255A95765AE1C89BEF73E5CEDF114B9E7D75A6DAA7708`
- ZIP contents: `farpy_render/__init__.py`
- Add-on version: `(0, 4, 0)` from `farpy_render/__init__.py:4`
- Blender compatibility declaration: `(3, 0, 0)` from `farpy_render/__init__.py:5`
- Tested Blender version: `4.1.0`

## Validation Performed

- `python -m py_compile C:\tmp\farpy-addon-audit\farpy_render\__init__.py`: PASS
- Headless Blender install/enable smoke with Blender 4.1.0: PASS
- `npm.cmd run build`: PASS
- `https://farpy.com/addon`: 200
- `https://farpy.com/downloads/Farpy-Blender-Addon-unified.zip`: 200
- Live downloaded ZIP hash: `BE2312CE5E77A1E62C1255A95765AE1C89BEF73E5CEDF114B9E7D75A6DAA7708`
- Production `/addon` contains:
  - `Farpy Render Delivery`
  - `Download Blender Add-on`
  - current SHA256
  - `Delivery receipts verify completed packages`
  - `No secrets are stored in the add-on`

Blender install proof:

```text
BLENDER_VERSION 4.1.0
ZIP_EXISTS True
INSTALL_RESULT {'FINISHED'}
ENABLE_RESULT {'FINISHED'}
PANEL_LABEL Farpy Render Delivery
MISSING_STRINGS []
HAS_SCENE_PROP True
AUDIT_PASS True
```

## P0

None confirmed.

The add-on is installable, loads without Python syntax errors, registers its panel, points to live production URLs, and can reach an existing upload route. No backend/API change was required.

## P1

### 1. Authentication model is confusing inside Blender.

Evidence:

- The add-on stores an optional `API key/token` field at `farpy_render/__init__.py:292-297`.
- Request headers use `Authorization: Bearer <token>` and `x-farpy-api-key` at `farpy_render/__init__.py:151-156`.
- The session check calls `wallet/balance` at `farpy_render/__init__.py:485-488`.
- Backend wallet balance requires a browser cookie session at `scripts/job-api.mjs:2428-2437`.
- No user-facing API key issuance path was proven in this audit.
- Unauthenticated `GET /node/v1/web-render/wallet/balance` returns `401 auth_required`.

Impact:

A normal signed-in website user may click `Check Farpy Sign-in` in Blender and see a sign-in failure because Blender cannot reuse the browser cookie. Direct upload can still create a package because `/node/v1/uploads/create` does not require auth, but the add-on’s “session” concept may make users think they are blocked.

Recommended fix:

Clarify add-on copy:

- `Send package` does not require checking sign-in first.
- Payment/sign-in happens in the workspace after upload.
- Hide or relabel `API key/token` as advanced/internal until a real self-service token flow exists.

### 2. Add-on defines background status polling but does not start it after upload.

Evidence:

- `_poll_status_background()` exists at `farpy_render/__init__.py:201-229`.
- Successful upload sets `last_status_url` at `farpy_render/__init__.py:95-103` and `farpy_render/__init__.py:276-282`.
- No call to `_poll_status_background()` was found after `_set_upload_result()`.
- Manual refresh exists through `FARPY_OT_poll_status` at `farpy_render/__init__.py:515-554`.

Impact:

After upload, the panel says the package was sent, but it does not continuously update to queued/rendering/delivered unless the user clicks `Refresh Status` or uses the web workspace. This is not a backend blocker, but it weakens the “track package” promise.

Recommended fix:

After successful upload, start one background polling thread using `last_status_url`, or change copy to say `Open Workspace to track delivery` as the primary tracking path.

### 3. `requests` dependency is not bundled or proven on every Blender install.

Evidence:

- Add-on imports `requests` at `farpy_render/__init__.py:17-22`.
- If import fails, upload/session/status paths display `Python requests is missing` at `farpy_render/__init__.py:235-238`, `farpy_render/__init__.py:479-482`, and `farpy_render/__init__.py:521-523`.
- Blender 4.1.0 install smoke proved registration, but did not exercise a real `requests.post()` upload from inside Blender.

Impact:

If a tester’s Blender Python lacks `requests`, the add-on installs but direct upload cannot work. The fallback message is honest, but this would block the add-on’s main value for that user.

Recommended fix:

Before external testers, run a real Blender runtime upload smoke from inside the target Blender install. If `requests` is not consistently present, replace with stdlib `urllib` multipart upload or package a safe dependency strategy.

### 4. No add-on update/version check exists.

Evidence:

- Add-on version is static at `farpy_render/__init__.py:4`.
- No call to a version endpoint or public latest-version manifest was found.
- `/addon` shows a ZIP hash but does not tell installed users when they are outdated.

Impact:

If upload/status behavior changes, users can stay on stale ZIPs with no warning.

Recommended fix:

Publish a tiny static latest-version JSON or add-on page checksum note and provide manual update instructions. Do not add auto-update unless necessary.

### 5. Blender compatibility declaration is broader than proven.

Evidence:

- `bl_info["blender"]` is `(3, 0, 0)` at `farpy_render/__init__.py:5`.
- This audit proved Blender 4.1.0 install/enable only.
- The product requirement asks for Blender 4.x compatibility, not Blender 3.x coverage.

Impact:

Blender 3.x users may install the add-on even though production smoke coverage is Blender 4.1.

Recommended fix:

Either test Blender 3.x or raise the declared minimum to the oldest actually supported Blender 4.x version.

### 6. ORBX support is split between website and add-on copy.

Evidence:

- Add-on supports existing ORBX upload through `FARPY_OT_upload_existing_orbx` at `farpy_render/__init__.py:387-430`.
- Panel copy says `Octane .orbx packages should be sent from the Farpy website unless already supported here.` at `farpy_render/__init__.py:586-588`.
- `/addon` repeats similar copy in `src/components/AddonPage.tsx`.

Impact:

Users may not understand whether existing ORBX upload is supported in the add-on. The implementation does support an existing ORBX picker, while automatic ORBX export is not included.

Recommended fix:

Use precise copy: `Existing .orbx files can be sent from this add-on. Automatic Octane ORBX export is not included yet.`

### 7. Add-on upload creates tokenized workspace URLs.

Evidence:

- Workspace URL builder adds `download_token` and `receipt_token` query params at `farpy_render/__init__.py:140-147`.
- Backend upload response returns `download_token` and `receipt_token` at `scripts/job-api.mjs:2567-2578`.
- Tokenized download/receipt endpoints are protected by timing-safe token compare at `scripts/job-api.mjs:2682-2704`.

Impact:

This is the current Farpy workspace model, not a new add-on flaw. Still, the URL should be treated as private. The add-on does not warn users not to share workspace links containing tokens.

Recommended fix:

Add one short note to add-on or `/addon`: `Workspace links can include private delivery tokens; do not share them unless you want someone to access that package.`

## P2

### 1. No pre-upload file size check in Blender.

Evidence:

- Backend caps upload body size using `MAX_UPLOAD_MB` / `MAX_BODY_BYTES` at `scripts/job-api.mjs:24-25` and rejects large requests at `scripts/job-api.mjs:80-96`.
- Add-on formats file size at `farpy_render/__init__.py:58-68` but does not compare it to a known limit before upload.
- Add-on handles backend `413` with human copy at `farpy_render/__init__.py:126-127`.

Impact:

Large files fail only after transfer starts. Not a launch blocker, but poor for slow connections.

Recommended fix:

Expose or hardcode the current upload limit only if the backend limit is stable and documented.

### 2. Progress is truthful but coarse.

Evidence:

- `_set_uploading()` shows filename and size at `farpy_render/__init__.py:72-88`.
- `requests.post()` is a single blocking request in a background thread at `farpy_render/__init__.py:248-254`.

Impact:

No fake progress is shown, which is good. Users only see `Sending package`, not bytes uploaded.

Recommended fix:

Leave as-is for launch unless upload complaints appear.

### 3. Downloads and receipts are workspace-first, not add-on-native.

Evidence:

- Add-on has `Open Workspace`, `Refresh Status`, and browser links at `farpy_render/__init__.py:436-469`.
- It does not provide direct `Download ZIP` or `View Receipt` buttons after completion.

Impact:

Consistent with the current package tracker model, but not a fully self-contained Blender workflow.

Recommended fix:

Defer native download/receipt buttons until after the website flow is stable.

### 4. Advanced settings can break the normal user path.

Evidence:

- `api_base_url` is editable at `farpy_render/__init__.py:287-290`.
- The panel displays `Advanced connection` with API base and token at `farpy_render/__init__.py:628-633`.

Impact:

Useful for operators, risky for normal users.

Recommended fix:

Collapse or label these as `Advanced` and keep defaults obvious.

## Surface Matrix

| Area | Status | Evidence | Notes |
| --- | --- | --- | --- |
| Installation | GREEN | Blender 4.1 install/enable smoke PASS | ZIP installs and panel registers |
| Authentication | YELLOW | `wallet/balance` requires cookie session; add-on token field has no proven self-service issuance | Direct upload still works without auth |
| Upload | GREEN/YELLOW | `/node/v1/uploads/create` accepts multipart `.blend/.orbx`; no auth required | Needs real Blender runtime upload smoke before external testers |
| Progress | YELLOW | Coarse upload status; manual refresh only | No fake progress |
| Workspace | GREEN | Workspace URL opens after upload | Tokenized URL should be treated as private |
| Errors | GREEN | Human messages for 401/403, 413, bad file type, connection lost | No raw secret body leakage |
| Receipts | GREEN/YELLOW | Receipt opens from workspace | No add-on-native receipt button |
| Downloads | GREEN/YELLOW | Download occurs through workspace | No add-on-native download button |
| Settings | YELLOW | API base/token visible | Can confuse normal users |
| Version upgrade | YELLOW | Static version only, no latest-check | Manual update only |
| Blender 4.x compatibility | GREEN for 4.1 | Blender 4.1.0 smoke PASS | 4.0/4.2 not tested in this pass |

## Commands Run

```powershell
Get-ChildItem -LiteralPath 'C:\Users\danki\Desktop' -Force
rg --files -g "*.py" -g "*.zip" -g "*addon*" -g "README*" -g "*.md"
Get-FileHash -Algorithm SHA256 -LiteralPath 'C:\Users\danki\Desktop\Farpy-Blender-Addon-unified.zip'
Get-FileHash -Algorithm SHA256 -LiteralPath 'C:\Users\danki\Desktop\farpy-frontend\public\downloads\Farpy-Blender-Addon-unified.zip'
tar -tf 'C:\Users\danki\Desktop\farpy-frontend\public\downloads\Farpy-Blender-Addon-unified.zip'
tar -xf 'C:\Users\danki\Desktop\farpy-frontend\public\downloads\Farpy-Blender-Addon-unified.zip' -C C:\tmp\farpy-addon-audit
Get-Content -LiteralPath C:\tmp\farpy-addon-audit\farpy_render\__init__.py -Raw
python -m py_compile C:\tmp\farpy-addon-audit\farpy_render\__init__.py
& 'C:\Program Files\Blender Foundation\Blender 4.1\blender.exe' --background --factory-startup --python C:\tmp\blender-addon-final-audit.py
npm.cmd run build
Invoke-WebRequest -Method Get -Uri 'https://farpy.com/addon'
Invoke-WebRequest -Uri 'https://farpy.com/downloads/Farpy-Blender-Addon-unified.zip' -OutFile C:\tmp\Farpy-Blender-Addon-unified.audit.zip
Get-FileHash -Algorithm SHA256 -LiteralPath C:\tmp\Farpy-Blender-Addon-unified.audit.zip
Invoke-WebRequest -Method Post -Uri 'https://farpy.com/node/v1/web-render/uploads/create'
Invoke-WebRequest -Method Get -Uri 'https://farpy.com/node/v1/web-render/wallet/balance'
rg -n "uploads/create|wallet/balance|api.*key|x-farpy-api-key|Authorization|requireFarpySession|auth_required|api_token|download_token|receipt_token" scripts src -S
```

## Exact Next Action

Run one real Blender UI upload smoke from a clean external Blender install:

1. Install the live ZIP.
2. Open a saved `.blend`.
3. Click `Send to Farpy`.
4. Confirm workspace opens with a real `job_id`.
5. Sign in/pay from workspace.
6. Confirm package delivered, ZIP downloads, and delivery receipt opens.

If that smoke fails because `requests` is missing, replace the upload implementation with stdlib networking before sending the add-on to external users.

## Launch Recommendation

Controlled public add-on alpha: YES.

Broad no-handholding add-on launch: NO until authentication/session copy and real external Blender upload smoke are complete.

PASS/FAIL: PASS for audit and install readiness; YELLOW for broad launch readiness.
