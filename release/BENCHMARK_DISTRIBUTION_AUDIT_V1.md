# BENCHMARK_DISTRIBUTION_AUDIT_V1

Status: audit complete

Date: 2026-06-26

Scope:
- Audit only.
- No production files, routes, artifacts, or links were changed.

## Files inspected

- `C:\Users\danki\Desktop\farpy-frontend\src\app\page.tsx`
- `C:\Users\danki\Desktop\farpy-frontend\src\app\downloads\page.tsx`
- `C:\Users\danki\Desktop\farpy-frontend\public\downloads\*`
- `C:\Users\danki\Desktop\farpy-frontend\release\LAUNCH_ARTIFACT_FREEZE_V1.md`
- `C:\Users\danki\Desktop\farpy-frontend\scripts\production-regression-audit-v1.ps1`
- `C:\Users\danki\Desktop\nodemuncher-codex\src-tauri\tauri.conf.json`
- `C:\Users\danki\Desktop\nodemuncher-codex\package.json`
- `C:\Users\danki\Desktop\nodemuncher-codex\release-dryrun\PUBLIC_RELEASE_DRY_RUN_V1.json`
- `C:\Users\danki\Desktop\nodemuncher-codex\release-dryrun\WINDOWS_INSTALLER_CLICKTHROUGH_V1.json`
- `C:\Users\danki\Desktop\nodemuncher-codex\src-tauri\target\release\bundle\*`

## Benchmark artifacts found

| Type | File | Size | Last modified | SHA256 | Public? |
|---|---|---:|---|---|---|
| Windows MSI | `C:\Users\danki\Desktop\nodemuncher-codex\src-tauri\target\release\bundle\msi\Farpy Benchmark_0.1.0_x64_en-US.msi` | 2,871,296 | 2026-06-25 10:50:46 | `A2D81F3E532939F8CCC7C593D172DB27C781F6F2BCEC5079C643726D68B765E2` | No public URL found |
| Windows NSIS EXE | `C:\Users\danki\Desktop\nodemuncher-codex\src-tauri\target\release\bundle\nsis\Farpy Benchmark_0.1.0_x64-setup.exe` | 1,919,718 | 2026-06-25 10:50:54 | `A073E301BA542205155F34F4524BB2FFFC648EA10DDE8CFCFF3C47688936FC8D` | No public URL found |

Artifacts not found:
- Benchmark DMG: not found.
- Benchmark DEB: not found.
- Benchmark RPM: not found.
- Benchmark standalone non-installer EXE: not found as a distributable artifact.

Config note:
- `src-tauri\tauri.conf.json` has `productName: "Farpy Benchmark"` and `version: "0.1.0"`.
- Bundle targets include `deb`, `rpm`, `dmg`, `msi`, and `nsis`, but only Benchmark MSI and NSIS artifacts were found locally.

## Public URLs checked

| URL | Status | Notes |
|---|---:|---|
| `https://farpy.com/benchmark` | 200 | Public benchmark GPU index route exists. |
| `https://farpy.com/benchmark/leaderboard` | 200 | Current best public Benchmark web entry point. |
| `https://farpy.com/benchmark/latest` | 200 | Live benchmark page. |
| `https://farpy.com/benchmark/search` | 200 | Live benchmark page. |
| `https://farpy.com/benchmark/api` | 200 | Live benchmark API docs. |
| `https://farpy.com/leaderboard` | 200 | Legacy leaderboard route remains live. |
| `https://farpy.com/downloads/Farpy%20Benchmark_0.1.0_x64-setup.exe` | 404 | Guessed Benchmark NSIS public URL does not exist. |
| `https://farpy.com/downloads/Farpy%20Benchmark_0.1.0_x64_en-US.msi` | 404 | Guessed Benchmark MSI public URL does not exist. |
| `https://farpy.com/downloads/farpy-benchmark-windows-amd64.exe` | 404 | Guessed normalized Benchmark EXE URL does not exist. |
| `https://farpy.com/downloads/farpy-benchmark-windows-amd64.msi` | 404 | Guessed normalized Benchmark MSI URL does not exist. |
| `https://farpy.com/downloads/farpy-benchmark-macos-aarch64.dmg` | 404 | Guessed Benchmark DMG URL does not exist. |

GitHub:
- Local repo remote: `https://github.com/Mangomunchr/farpy-nodemuncher.git`.
- Public GitHub Releases API for `Mangomunchr/farpy-nodemuncher` returned 404.
- No public GitHub release download URL was found in the audited repo content.

## Public download locations

`farpy.com/downloads` currently publishes NodeMuncher artifacts only:
- `/downloads/nodemuncher-windows-amd64.exe`
- `/downloads/nodemuncher-windows-amd64.msi`
- `/downloads/nodemuncher-macos-aarch64.dmg`

No Benchmark installer/download link was found on:
- Homepage `/`
- Downloads `/downloads/`
- Benchmark leaderboard `/benchmark/leaderboard`
- Benchmark API docs `/benchmark/api`
- Public GitHub Releases

## Discoverability

- Homepage: Benchmark is not linked from the inspected live homepage HTML.
- Downloads: Benchmark is not listed on the inspected live downloads page.
- Direct benchmark web route: `/benchmark/leaderboard` is live if the URL is known.
- Under 30 seconds from the homepage: not discoverable as a desktop/app download path.

## Version consistency

- Local Benchmark installer artifacts: `0.1.0`.
- `nodemuncher-codex/package.json`: `0.1.0`.
- `src-tauri/tauri.conf.json`: `0.1.0`.
- No public Benchmark installer URL exists, so public installer version consistency cannot be verified.

## Missing links

- Missing public Windows Benchmark NSIS link.
- Missing public Windows Benchmark MSI link.
- Missing public Benchmark hash sidecars.
- Missing Downloads page entry for Farpy Benchmark.
- Missing homepage/nav path to Farpy Benchmark.
- Missing public release location for macOS/Linux Benchmark artifacts, if those are intended.

## Broken links

No broken live Benchmark installer links were found because no live Benchmark installer links were found.

The following candidate URLs were checked and returned 404:
- `https://farpy.com/downloads/Farpy%20Benchmark_0.1.0_x64-setup.exe`
- `https://farpy.com/downloads/Farpy%20Benchmark_0.1.0_x64_en-US.msi`
- `https://farpy.com/downloads/farpy-benchmark-windows-amd64.exe`
- `https://farpy.com/downloads/farpy-benchmark-windows-amd64.msi`
- `https://farpy.com/downloads/farpy-benchmark-macos-aarch64.dmg`

## Current recommended download path

For public Benchmark web data:
- `https://farpy.com/benchmark/leaderboard`

For Benchmark desktop installers:
- No public recommended download path exists today.
- The only verified installer artifacts are local files under `C:\Users\danki\Desktop\nodemuncher-codex\src-tauri\target\release\bundle\`.

## Issues

### P0

- Public Benchmark desktop distribution is not active: Windows Benchmark installers exist locally but are not available through `farpy.com/downloads`, GitHub Releases, or a discovered CDN/static path.

### P1

- Benchmark is not discoverable from the homepage or Downloads page in under 30 seconds.
- No public SHA256 sidecars exist for Benchmark installer artifacts.
- Public downloads currently imply desktop distribution is NodeMuncher-only.

### P2

- Tauri config declares Benchmark bundle targets for `deb`, `rpm`, and `dmg`, but no local Benchmark DEB/RPM/DMG artifacts were found.
- Public Benchmark web pages are live, but their relationship to the desktop Benchmark app is not surfaced from the main launch navigation.

## Recommendation

If Farpy Benchmark desktop distribution is intended for launch:
1. Publish the existing Windows Benchmark MSI and NSIS artifacts to a deliberate public path.
2. Add SHA256 sidecars.
3. Add a Downloads page section for Farpy Benchmark.
4. Add a lightweight path from `/benchmark/leaderboard` to the desktop Benchmark download.

If only public benchmark results are intended for launch:
1. Keep `https://farpy.com/benchmark/leaderboard` as the recommended path.
2. Do not advertise Benchmark desktop downloads until artifacts are intentionally published.
