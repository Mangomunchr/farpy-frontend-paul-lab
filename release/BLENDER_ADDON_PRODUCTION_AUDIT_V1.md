# BLENDER_ADDON_PRODUCTION_AUDIT_V1

Purpose: verify the Farpy Blender addon production package is present, versioned, documented, and launch-safe.

Run from the Farpy frontend repo root:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\blender-addon-production-audit-v1.ps1 -OutputPath C:\tmp\blender-addon-production-audit-v1-latest.json
```

The script checks the frozen local addon ZIP at:

```text
C:\Users\danki\Desktop\Farpy-Blender-Addon-unified.zip
```

Set `FARPY_ADDON_PUBLIC_ZIP_URL` only if the addon ZIP is published directly and should be verified as a public download.

## Matrix

| Area | Check | Status | Evidence | Notes |
|---|---|---:|---|---|
| Package | Addon ZIP exists locally | Script checked | Local ZIP path | Required |
| Package | Frozen SHA256 matches manifest | Script checked | Local ZIP hash | Required |
| Package | ZIP is valid | Script checked | Expanded temp dir | Required |
| Package | Expected addon files exist | Script checked | `farpy_render/__init__.py` | Required |
| Version | Manifest/version present | Script checked | `bl_info` / `version` | Required |
| Package | No placeholder strings | Script checked | `TODO`, `FIXME`, `localhost`, `example.com`, `changeme` | Required |
| Public route | Addon page returns 200 | Script checked | `/addon` | Required |
| Public route | Downloads page returns 200 | Script checked | `/downloads/` | Required |
| Public download | Public addon ZIP URL | Env-gated | `FARPY_ADDON_PUBLIC_ZIP_URL` | Optional unless ZIP is published directly |
| Docs | Addon README/docs route | Script checked | `/addon` | Non-blocking docs presence check |
| Runtime | Blender background import smoke | Optional | `BLENDER_EXE` or common Blender paths | Skipped when Blender unavailable |

## Final Verdict

- `GREEN`: package, public routes, ZIP sanity, version metadata, placeholder scan, and runtime import all pass.
- `YELLOW`: required package/public checks pass, but Blender runtime test or optional public ZIP URL is skipped.
- `RED`: missing package, broken required public route, invalid ZIP, missing expected addon files/version, or placeholder blocker.
