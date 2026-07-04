# WORKSPACE_PACKAGE_TRACKING_V3

Status: PASS

## Files changed

- `C:\Users\danki\Desktop\farpy-frontend\src\components\Workspace.tsx`
- `C:\Users\danki\Desktop\farpy-frontend\src\lib\worldLanguage.ts`
- `C:\Users\danki\Desktop\farpy-frontend\src\app\workspace\page.tsx`
- `C:\Users\danki\Desktop\farpy-frontend\src\app\workspace\[id]\page.tsx`
- `C:\Users\danki\Desktop\farpy-frontend\release\WORKSPACE_PACKAGE_TRACKING_V3.md`

## Commands run

```powershell
Get-Content -LiteralPath 'src\components\Workspace.tsx' -Raw
Get-Content -LiteralPath 'src\components\JourneyTimeline.tsx' -Raw
Get-Content -LiteralPath 'src\lib\worldLanguage.ts' -Raw
rg -n "\b(job|worker|queue|node|lease|backend)\b|Job ID|Worker|Node|Queue|Lease|Backend" src\components\Workspace.tsx src\components\JourneyTimeline.tsx src\lib\worldLanguage.ts src\app\workspace
npm.cmd run build
rg -n "Package ID|Submitted|Current stage|Estimated next step|Package received|Dispatcher|Render factory|Rendering|Packaging|Package delivered|Download package result|View delivery receipt|Verify receipt|Your package is being prepared at a render factory" src\components\Workspace.tsx src\components\JourneyTimeline.tsx src\lib\worldLanguage.ts src\app\workspace
rg -n "Job ID|Worker|Node|Queue|Lease|Backend|Download ZIP|View Receipt|Start Render|Render workspace" src\components\Workspace.tsx src\components\JourneyTimeline.tsx src\lib\worldLanguage.ts src\app\workspace
```

## Behavior changes

- The workspace now presents itself as the package tracker after `Send to Farpy`.
- The package facts appear before operational controls:
  - Package ID
  - Submitted
  - Current stage
  - Estimated next step
- The Journey Timeline is primary content directly below the package facts.
- Timeline stages use consistent language:
  - Package received
  - Dispatcher
  - Render factory
  - Rendering
  - Packaging
  - Package delivered
- Running state copy now says:
  - `Your package is being prepared at a render factory.`
- Completed package actions are clearer:
  - `Download package result`
  - `View delivery receipt`
  - `Verify receipt • SHA-256 verified`
- The empty/static workspace shell now uses package tracker language.

## Technical details preserved

- No backend/API behavior changed.
- Existing job status fetches are unchanged.
- Existing download and receipt URLs are preserved.
- Existing IDs, hashes, renderer, frame counts, and Verification Details remain available.
- Existing payment, wallet, checkout, render, download, and receipt logic is unchanged.

## Validation

- `npm.cmd run build`: PASS.
- Required package-tracking copy present in source: PASS.
- Removed visible old workspace labels:
  - `Job ID`
  - `Worker`
  - `Node`
  - `Queue`
  - `Lease`
  - `Backend`
  - `Download ZIP`
  - `View Receipt`
  - `Start Render`
  - `Render workspace`
- Old-label scan in workspace source returned no matches: PASS.

## Known limitations

- Estimated next step is derived from the current package state; no fake timing or telemetry was added.
- Percent text only appears when the backend provides `progress_percent`.
- Frame progress remains based on existing backend fields.
