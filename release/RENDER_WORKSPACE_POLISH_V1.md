# RENDER_WORKSPACE_POLISH_V1

Status: GREEN

## Files changed

- `src/components/Workspace.tsx`
- `src/app/globals.css`
- `release/RENDER_WORKSPACE_POLISH_V1.md`

## Behavior changes

- Replaced workspace summary mojibake separator with an ASCII-safe `\u2022` bullet escape so the browser renders `•`.
- Replaced workspace status icon mojibake with ASCII-safe Unicode escapes:
  - complete: `\u2713`
  - running: `\u25CF`
  - queued/submitted: `\u25CB`
- Changed waiting copy based on backend payment state:
  - `checkout_created`: `Waiting for payment confirmation`
  - not attempted / priced / insufficient wallet before capture: `Payment required`
- Completed summary metadata now includes render duration only when `render_seconds` is present:
  - with duration: `6 frames • Blender • 34s • $0.06`
  - without duration: `6 frames • Blender • $0.06`
- Tightened workspace status icon/title layout:
  - centered icon glyph inside the circle
  - reduced icon font clamp
  - added explicit column and row gaps
  - aligned compact header content center on desktop
  - kept mobile stack behavior intact

## Encoding fix verification

Command:

```powershell
rg -n "â€¢|âœ|â—|�" src\components\Workspace.tsx src\components\ReceiptPage.tsx src\components\AccountPage.tsx src\components\RenderDetail.tsx src\components\RenderWidget.tsx src\components\HomeRenderFlow.tsx src\app\workspace src\app\receipt src\app\account -S
```

Result:

```text
no mojibake found
```

## Copy verification

Command:

```powershell
rg -n "Waiting for payment|Payment required|Waiting for payment confirmation" src\components\Workspace.tsx
```

Result:

```text
413:      ? "Waiting for payment confirmation"
414:      : "Payment required";
566:                  Waiting for payment confirmation
```

## Metadata verification

Command:

```powershell
rg -n "renderSeconds|summaryParts|\\u2022" src\components\Workspace.tsx
```

Result:

```text
429:  const renderSeconds = Number.isFinite(Number(job?.render_seconds)) ? Math.round(Number(job?.render_seconds)) : null;
430:  const summaryParts = [
433:    renderSeconds != null ? formatDuration(renderSeconds) : null,
521:                  {summaryParts.length ? <span className="render-job-summary">{summaryParts.join(" \u2022 ")}</span> : null}
```

## Layout verification

Command:

```powershell
rg -n "render-compressed-top|render-status-icon|text-align: center|letter-spacing: 0" src\app\globals.css
```

Relevant result:

```text
3299:.render-compressed-top {
3306:.render-status-icon {
3320:  text-align: center;
3348:  letter-spacing: 0;
```

## Build result

Command:

```powershell
npm.cmd run build
```

Result:

```text
Compiled successfully
Finished TypeScript
Generating static pages (37/37)
```

## Screenshots

Not generated in this run. The in-app browser bridge failed before page capture due a local Node module-mode error outside the repo, so no screenshot proof is claimed.