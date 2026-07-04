# LAUNCH_ARTIFACT_FREEZE_V1

Freeze timestamp: 2026-06-26

## Farpy Blender Addon

- ZIP path: `C:\Users\danki\Desktop\Farpy-Blender-Addon-unified.zip`
- SHA256: `BE2312CE5E77A1E62C1255A95765AE1C89BEF73E5CEDF114B9E7D75A6DAA7708`
- Status: frozen current launch addon artifact.

## NodeMuncher Desktop Artifacts

- Windows EXE URL: `https://farpy.com/downloads/nodemuncher-windows-amd64.exe`
- Windows EXE SHA256: `FAC4559180E091D27CA7064FA42622CCAA2CC4A27DA9C1235CE84C69000AF9FA`
- Windows MSI URL: `https://farpy.com/downloads/nodemuncher-windows-amd64.msi`
- Windows MSI SHA256: `32B28693FFE71DBD11FA8E2320B6C184C3F2E5361DF0293036D696F9C091AC2F`
- macOS DMG URL: `https://farpy.com/downloads/nodemuncher-macos-aarch64.dmg`
- macOS DMG SHA256: `9041E7EA03E207DB77F525F0119D2CDE3A3E037F2664E95B41EFED8F8F2A69D1`

Note: the public Windows EXE URL points to the NSIS installer artifact. The raw built Windows executable SHA256 is `EC34ED6C1ABA6340295AF50D7D460584224C81739F5D50BAC3BDEFAB33D82B67`.

## Benchmark App Artifact Status

- Release candidate: `Farpy NodeMuncher 0.1.0`
- Build status from release candidate: `npm.cmd run build` passed.
- Tauri status from release candidate: `npm.cmd run tauri build` passed.
- Public benchmark status from release candidate: leaderboard, stats API, and top API returned HTTP 200.

## Public Regression Status

- `PUBLIC_LAUNCH_REGRESSION_V1`: GREEN in current launch thread.
- Scope verified: upload, payment, receipt, download, benchmark, workspace, account, status, leaderboard, addon.

## Known Non-Blockers

- Linux download is not advertised; no Linux installer is present in this release candidate.
- Windows SmartScreen reputation is not established.
- Code signing is not present.
- macOS DMG is unsigned.
- Fresh VM install proof is not included in the artifact freeze.
