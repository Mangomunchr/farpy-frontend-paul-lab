# NODEMUNCHER_EARNINGS_COPY_FIX_V1

Status: GREEN

Date: 2026-07-01

Scope: NodeMuncher desktop UI copy only. No payout logic added. No backend/API changes.

## Objective

Make the NodeMuncher earnings UI clearly non-authoritative until a server payout endpoint exists.

Required copy direction:

- Estimated earnings
- Receipt-backed history
- Final payouts are confirmed by Farpy account/payment records

## Files Changed

- `C:\Users\danki\Desktop\nodemuncher-codex\src-nodemuncher\NodeMuncherApp.tsx`
- `C:\Users\danki\Desktop\farpy-frontend\release\NODEMUNCHER_EARNINGS_COPY_FIX_V1.md`

## Changes

Updated NodeMuncher copy:

- Tab label:
  - before: `Earnings`
  - after: `Estimated earnings`

- Missing amount copy:
  - before: `Earnings amount pending. Receipt recorded.`
  - after: `Estimated earnings pending. Receipt-backed history recorded.`

- Completed row label:
  - before: `Earnings`
  - after: `Estimated earnings`

- Earnings panel note:
  - `Receipt-backed history. Final payouts are confirmed by Farpy account/payment records.`

- Default completed-job source copy:
  - before: `Completed render jobs from the paired node.`
  - after: `Receipt-backed history from the paired node.`

If a backend row returns an amount, the UI now formats it as estimated:

```text
$0.01 estimated
```

## Validation

Source scan confirmed old vague copy is absent and new copy is present:

```text
122:{ id: "earnings", label: "Estimated earnings" },
195:return job.receipt_id ? "Estimated earnings pending. Receipt-backed history recorded." : "Not available";
467:<span>Estimated earnings</span><strong>{value(execution.earnings_status)}</strong>
511:title="Estimated earnings"
512:note="Receipt-backed history. Final payouts are confirmed by Farpy account/payment records."
567:<p>{note || (source ? `Source: ${source}` : "Receipt-backed history from the paired node.")}</p>
599:<span>Estimated earnings</span>
```

Build:

```powershell
npm.cmd run build:nodemuncher
```

Result: PASS.

## Commands Run

```powershell
$p='C:\Users\danki\Desktop\nodemuncher-codex\src-nodemuncher\NodeMuncherApp.tsx'; rg -n "Earnings|earnings|payout|Receipt recorded|Completed render|completed render|history" $p
git -C 'C:\Users\danki\Desktop\nodemuncher-codex' diff -- src-nodemuncher/NodeMuncherApp.tsx
$p='C:\Users\danki\Desktop\nodemuncher-codex\src-nodemuncher\NodeMuncherApp.tsx'; Select-String -LiteralPath $p -Pattern 'Earnings amount pending','<span>Earnings','title="Earnings"','label: "Earnings"','Estimated earnings','Receipt-backed history','Final payouts' | ForEach-Object { "$($_.LineNumber):$($_.Line.Trim())" }
npm.cmd run build:nodemuncher
```

## Result

GREEN.

NodeMuncher no longer implies desktop earnings are final or authoritative. The UI now frames the page as estimated earnings backed by receipt history, with final payouts confirmed by Farpy account/payment records.
