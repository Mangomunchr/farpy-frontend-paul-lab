# NODEMUNCHER_STATUS_UI_TRUTH_FIX_V1

Status: GREEN

Date: 2026-07-01

Scope: NodeMuncher desktop UI only. No backend API changes. No lease logic changes.

## Objective

Fix misleading NodeMuncher status UI copy found in `NODEMUNCHER_STATUS_UI_TRUTH_AUDIT_V1`.

## Files Changed

- `C:\Users\danki\Desktop\nodemuncher-codex\src-nodemuncher\NodeMuncherApp.tsx`
- `C:\Users\danki\Desktop\farpy-frontend\release\NODEMUNCHER_STATUS_UI_TRUTH_FIX_V1.md`

## Changes

### Heartbeat / Ready

Changed the top pill from broad `Ready` wording to heartbeat-specific wording:

- `Heartbeat accepted`
- `Heartbeat needed`
- `Auth error`
- `Offline`
- `Not paired`

`Ready` no longer implies full render eligibility.

### Lease / Render State

Changed lease labels:

- `Available` -> `Package available`
- `Leased` -> `Claimed package`
- rendering in progress -> `Rendering`
- local execution error -> `Render failed`

This keeps lease state truthful without changing lease API behavior.

### Paired But Heartbeat Failed

A paired node without accepted heartbeat no longer appears fully healthy. The header pill now distinguishes stored identity from current production heartbeat health.

### Hardcoded Worker Fields

Removed UI display of hardcoded fields:

- `Worker running=false`
- `Worker processes=0`

Replaced them with `Current run`, derived from local execution state:

- `Rendering`
- `Failed`
- `Complete`
- `No active render`

### Settings Copy

Replaced stale bootstrap copy:

```text
Production render-job controls are not enabled in this bootstrap.
```

with:

```text
Alpha controls are manual. Pair this PC, confirm heartbeat, check for a package, then run render while an operator is watching.
```

## Validation

### Stale Copy Scan

Scanned `NodeMuncherApp.tsx` for:

- `Ready`
- `Worker running`
- `Worker processes`
- `Production render-job controls`
- `Claim Job`
- `Leased`
- `Available`

Only expected class/internal strings and new truthful copy remain.

### Build

```powershell
npm.cmd run build:nodemuncher
```

Result: PASS.

### Tauri Build

```powershell
npm.cmd run tauri:nodemuncher
```

Result: PASS.

Built application:

```text
C:\Users\danki\Desktop\nodemuncher-codex\src-tauri\target\release\farpy-nodemuncher.exe
```

Built bundles:

```text
C:\Users\danki\Desktop\nodemuncher-codex\src-tauri\target\release\bundle\msi\Farpy NodeMuncher_0.1.0_x64_en-US.msi
C:\Users\danki\Desktop\nodemuncher-codex\src-tauri\target\release\bundle\nsis\Farpy NodeMuncher_0.1.0_x64-setup.exe
```

## Commands Run

```powershell
git -C 'C:\Users\danki\Desktop\nodemuncher-codex' status --short
$p='C:\Users\danki\Desktop\nodemuncher-codex\src-nodemuncher\NodeMuncherApp.tsx'; Get-Content -LiteralPath $p -Raw
Get-Content -LiteralPath 'C:\Users\danki\Desktop\nodemuncher-codex\package.json' -Raw
$p='C:\Users\danki\Desktop\nodemuncher-codex\src-nodemuncher\NodeMuncherApp.tsx'; rg -n "\bready\b|Ready|Worker running|Worker processes|Production render-job controls|Claim Job|Leased|Available|Heartbeat accepted|Heartbeat needed|Claimed package" $p
git -C 'C:\Users\danki\Desktop\nodemuncher-codex' diff -- src-nodemuncher/NodeMuncherApp.tsx
npm.cmd run build:nodemuncher
npm.cmd run tauri:nodemuncher
```

## Result

GREEN.

The NodeMuncher UI no longer presents heartbeat acceptance as full render eligibility, no longer shows hardcoded false worker state, and no longer contradicts the live manual render controls.
