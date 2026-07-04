# NODEMUNCHER_FRESH_INSTALL_V1

Purpose: repeatable launch-closure audit for a clean Windows user path:

Install Farpy NodeMuncher -> pair -> heartbeat -> reach Ready -> prove public endpoint compatibility.

Run from the Farpy frontend repo root:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\nodemuncher-fresh-install-v1.ps1 -OutputPath C:\tmp\nodemuncher-fresh-install-v1-latest.json
```

Default mode is non-destructive. It does not delete local NodeMuncher data. Use `-Destructive` only for an operator-approved fresh-install reset; this script still records the request and does not remove user data automatically.

## Matrix

| Area | Check | Status | Evidence | Notes |
|---|---|---:|---|---|
| Installer artifacts | Windows NSIS, Windows MSI, macOS DMG and sidecars exist | Script checked | `public/downloads/*` | Required |
| App dist | NodeMuncher frontend dist exists | Script checked | `C:\Users\danki\Desktop\nodemuncher-codex\dist-nodemuncher\index.html` | Required |
| App binary | Tauri release binary exists | Script checked | `src-tauri\target\release\farpy-nodemuncher.exe` | Required |
| Metadata | Product name and version metadata | Script checked | `package.json`, `tauri.nodemuncher.conf.json` | Required |
| Public endpoints | Web render health | Script checked | `https://farpy.com/node/v1/web-render/health` | Required |
| Public endpoints | Invalid NodeMuncher lease token rejected | Script checked | `https://farpy.com/node/v1/nodemuncher/lease/peek` | Required, expects 403 |
| Public endpoints | Invalid heartbeat token rejected | Script checked | `https://api.farpy.com/node/heartbeat` | Required, expects 401 or 403 |
| Local identity | Persisted node identity path if present | Script checked | `%LOCALAPPDATA%\FarpyNode\node.json` | Optional unless installed/paired |
| Fresh install mode | Destructive reset | Script checked | `-Destructive` | Skipped by default |

## Final Verdict

- `GREEN`: installer artifacts, public endpoints, local identity/app checks pass and destructive/fresh-install mode was explicitly requested.
- `YELLOW`: no required blockers, but destructive/fresh-install reset was not executed or optional local identity is absent.
- `RED`: required artifact, app binary/dist, metadata, or public endpoint compatibility fails.
