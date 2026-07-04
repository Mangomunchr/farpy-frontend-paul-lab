# ADDON_INSTALL_SMOKE_V1

Status: PASS

## Artifact

- Path: `C:\Users\danki\Desktop\farpy-frontend\public\downloads\Farpy-Blender-Addon-unified.zip`
- Initial expected SHA256 verified before install smoke: `2ADA03BA28C1014EA3498C7E440C8FCE190D4E08EA4F8C5D1836894D4DD3B061`
- Install-smoke blocker found: installed add-on source did not contain the exact required visible phrase `Delivery receipt`.
- Minimal code fix: added `Delivery receipt opens from your workspace.` to the panel support text.
- Final ZIP SHA256 after the copy-only install blocker fix: `BE2312CE5E77A1E62C1255A95765AE1C89BEF73E5CEDF114B9E7D75A6DAA7708`

## Blender version

- Blender 4.1.0
- Executable: `C:\Program Files\Blender Foundation\Blender 4.1\blender.exe`

## Install method

Headless Blender install using a temporary user config:

- `BLENDER_USER_CONFIG=C:\tmp\blender-addon-install-smoke-v1-config`
- `BLENDER_USER_SCRIPTS=C:\tmp\blender-addon-install-smoke-v1-config`
- Install API: `bpy.ops.preferences.addon_install(filepath=..., overwrite=True)`
- Enable API: `bpy.ops.preferences.addon_enable(module="farpy_render")`

## Commands run

```powershell
Get-FileHash -Algorithm SHA256 'C:\Users\danki\Desktop\farpy-frontend\public\downloads\Farpy-Blender-Addon-unified.zip'
tar -tf 'C:\Users\danki\Desktop\farpy-frontend\public\downloads\Farpy-Blender-Addon-unified.zip'
& 'C:\Program Files\Blender Foundation\Blender 4.1\blender.exe' --background --factory-startup --python C:\tmp\addon-install-smoke-v1.py
Get-FileHash -Algorithm SHA256 'C:\Users\danki\Desktop\farpy-frontend\public\downloads\Farpy-Blender-Addon-unified.zip'
python -m py_compile 'C:\Users\danki\Desktop\farpy_blender_addon_octane_export\farpy_render\__init__.py'
npm.cmd run build
rg -n "BE2312CE5E77A1E62C1255A95765AE1C89BEF73E5CEDF114B9E7D75A6DAA7708|Farpy Render Delivery|Delivery receipt" out src public release
rg -n "2ADA03BA28C1014EA3498C7E440C8FCE190D4E08EA4F8C5D1836894D4DD3B061|03B9F6039396C06AB83C87E71F7846975DE661D0F2CA216BC60C0ACC4B14A4BF" src public out release
Select-String -LiteralPath 'C:\tmp\addon-install-smoke-v1.log' -Pattern 'Traceback|ADDON_INSTALL_SMOKE_TRACEBACK|ADDON_INSTALL_SMOKE_PASS|REQUIRED_STRING_MISSING|BLENDER_VERSION|PANEL_LABEL|PRIMARY_BUTTON|REGISTERED_PANEL|SCENE_PROP'
```

## Result

Blender log proof:

```text
BLENDER_VERSION 4.1.0
ADDON_INSTALL_RESULT {'FINISHED'}
ADDON_ENABLE_RESULT {'FINISHED'}
PANEL_LABEL Farpy Render Delivery
PRIMARY_BUTTON Send to Farpy
REQUIRED_STRING_MISSING none
REGISTERED_PANEL True
SCENE_PROP True
ADDON_INSTALL_SMOKE_PASS
BLENDER_EXIT_CODE 0
```

Visible/user-facing strings confirmed in installed add-on source:

- `Farpy Render Delivery`
- `Send to Farpy`
- `Choose scene`
- `Send package`
- `Track package`
- `Download result`
- `Delivery receipt`

## Screenshot

- Not captured. The headless Blender install smoke was sufficient to prove install, enable, registration, and panel copy without requiring UI automation.

## Known limitations

- This smoke did not submit a real render package.
- This smoke did not test Blender UI clicks.
- The logged `TBBmalloc` line is emitted by Blender 4.1 during process startup and did not prevent install, enable, or registration.
- No backend APIs were changed.
