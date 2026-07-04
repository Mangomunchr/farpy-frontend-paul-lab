# ADDON_WEBSITE_HANDOFF_V1

Status: PASS

## Files changed

- `C:\Users\danki\Desktop\farpy-frontend\src\components\AddonPage.tsx`
- `C:\Users\danki\Desktop\farpy-frontend\src\app\addon\page.tsx`
- `C:\Users\danki\Desktop\farpy-frontend\src\app\downloads\page.tsx`
- `C:\Users\danki\Desktop\farpy-frontend\public\downloads\Farpy-Blender-Addon-unified.zip`
- `C:\Users\danki\Desktop\farpy-frontend\public\downloads\Farpy-Blender-Addon-unified.zip.sha256`
- `C:\Users\danki\Desktop\farpy-frontend\release\LAUNCH_ARTIFACT_FREEZE_V1.md`
- `C:\Users\danki\Desktop\farpy-frontend\release\ADDON_WEBSITE_HANDOFF_V1.md`

## Commands run

```powershell
rg --files | rg 'src/app/addon|Addon|addon|public|release'
rg -n "Addon|add-on|Blender|Farpy Render|Download Blender|Farpy-Blender|SHA256" src public release
Get-Item -LiteralPath 'C:\Users\danki\Desktop\Farpy-Blender-Addon-unified.zip'
Get-Content -LiteralPath 'C:\Users\danki\Desktop\farpy-frontend\src\components\AddonPage.tsx' -Raw
Get-Content -LiteralPath 'C:\Users\danki\Desktop\farpy-frontend\src\app\addon\page.tsx' -Raw
Get-Content -LiteralPath 'C:\Users\danki\Desktop\farpy-frontend\src\app\downloads\page.tsx' -Raw
Copy-Item -LiteralPath 'C:\Users\danki\Desktop\Farpy-Blender-Addon-unified.zip' -Destination 'C:\Users\danki\Desktop\farpy-frontend\public\downloads\Farpy-Blender-Addon-unified.zip' -Force
Set-Content -LiteralPath 'C:\Users\danki\Desktop\farpy-frontend\public\downloads\Farpy-Blender-Addon-unified.zip.sha256' -Value 'BE2312CE5E77A1E62C1255A95765AE1C89BEF73E5CEDF114B9E7D75A6DAA7708  Farpy-Blender-Addon-unified.zip' -Encoding ASCII
Get-FileHash -Algorithm SHA256 'C:\Users\danki\Desktop\farpy-frontend\public\downloads\Farpy-Blender-Addon-unified.zip'
npm.cmd run build
Test-Path -LiteralPath 'C:\Users\danki\Desktop\farpy-frontend\out\addon.html'
Test-Path -LiteralPath 'C:\Users\danki\Desktop\farpy-frontend\out\downloads\Farpy-Blender-Addon-unified.zip'
Test-Path -LiteralPath 'C:\Users\danki\Desktop\farpy-frontend\out\downloads\Farpy-Blender-Addon-unified.zip.sha256'
rg -n "Farpy Render Delivery|Download Blender Add-on|Download the add-on ZIP|BE2312CE5E77A1E62C1255A95765AE1C89BEF73E5CEDF114B9E7D75A6DAA7708|Delivery receipts verify completed packages" out src
Get-FileHash -Algorithm SHA256 'C:\Users\danki\Desktop\farpy-frontend\out\downloads\Farpy-Blender-Addon-unified.zip'
rg -n "<previous-addon-sha256>" src public out release
```

## Before / after behavior

Before:

- `/addon` described the older Blender add-on alpha and linked users back to the homepage.
- The visible SHA-256 hash was stale.
- The public static tree did not include the latest add-on ZIP.
- The install path was not explicit.

After:

- `/addon` uses the polished add-on name `Farpy Render Delivery`.
- The primary CTA is `Download Blender Add-on`.
- The page shows clear install steps:
  1. Download the add-on ZIP.
  2. Blender -> Preferences -> Add-ons -> Install.
  3. Open the Farpy Render Delivery panel.
- The page explains the flow with package language: send package, track package, delivery receipt, render factory, package delivered.
- Secondary links are available for Workspace, Account, Pricing, and Docs.
- `/downloads` also links to the same add-on ZIP and current SHA-256.

## ZIP path

- Source artifact: `C:\Users\danki\Desktop\Farpy-Blender-Addon-unified.zip`
- Static source path: `C:\Users\danki\Desktop\farpy-frontend\public\downloads\Farpy-Blender-Addon-unified.zip`
- Exported path: `C:\Users\danki\Desktop\farpy-frontend\out\downloads\Farpy-Blender-Addon-unified.zip`
- Public path after deploy: `/downloads/Farpy-Blender-Addon-unified.zip`

## ZIP SHA256

`BE2312CE5E77A1E62C1255A95765AE1C89BEF73E5CEDF114B9E7D75A6DAA7708`

## Known limitations

- The page does not claim Blender marketplace verification.
- The page does not claim live install counts, instant delivery, or guaranteed success.
- Octane ORBX packages are directed to the Farpy website unless already supported in the add-on.
- No add-on telemetry was added.
- No backend/API behavior changed.

## Test result

- `/addon` static export exists: PASS.
- Add-on ZIP exists in static output: PASS.
- Add-on SHA-256 sidecar exists in static output: PASS.
- Exported ZIP SHA-256 matches the known artifact: PASS.
- Required install copy and checksum appear in output: PASS.
- `npm.cmd run build`: PASS.
