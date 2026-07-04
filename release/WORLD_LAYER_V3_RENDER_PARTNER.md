# WORLD_LAYER_V3_RENDER_PARTNER

## Status

PASS

## Objective

Replace customer-facing `Render Factory` language with `Render Partner` while preserving backend, NodeMuncher, scheduler, worker, API, and receipt schema behavior.

## Files Changed

- `src/components/HomeRenderFlow.tsx`
- `src/lib/worldLanguage.ts`
- `src/components/Workspace.tsx`
- `src/app/status/page.tsx`
- `src/components/FaqSection.tsx`
- `src/components/AddonPage.tsx`
- `src/components/PublicProofPage.tsx`
- `src/app/docs/page.tsx`
- `release/WORLD_LAYER_V3_RENDER_PARTNER.md`

## Copy Changes

- Homepage hero: `render factories` -> `render partners`
- Homepage secondary CTA: `Run a render factory` -> `Become a render partner`
- Homepage explanatory copy: `NodeMunchers earn by running render factories` -> `NodeMunchers earn by running render partners`
- Journey timeline: `Render factory` -> `Render partner`
- Workspace waiting/running copy now says `render partner`
- Failed package copy now says `This render partner encountered a problem. No completed delivery was produced.`
- Failed package refund-safe copy remains: `If no delivery receipt was created, the completed-render charge is returned.`
- Status/proof labels now say `Render partner status`
- Docs/FAQ/add-on public copy now uses `render partner`

## Preserved

- No backend/API changes.
- No NodeMuncher/internal naming changes.
- No receipt schema changes.
- No scheduler/worker logic changes.
- Existing worker endpoint URLs remain unchanged.

## Commands Run

- `rg -n "render factory|Render factory|Render Factory|factories|factory failed" src public -g "*.tsx" -g "*.ts" -g "*.txt" -g "*.html"`
- `rg -n "render partner|Render partner|Render Partner|partners|partner encountered" src public -g "*.tsx" -g "*.ts" -g "*.txt" -g "*.html"`
- `npm.cmd run build`
- `rg -n "render factory|Render factory|Render Factory|factories|factory failed" out src public -g "*.html" -g "*.js" -g "*.txt" -g "*.tsx" -g "*.ts"`
- `rg -n "render partner|Render partner|Render Partner|partners|partner encountered|Become a render partner" out src public -g "*.html" -g "*.js" -g "*.txt" -g "*.tsx" -g "*.ts"`
- `rg -n --fixed-strings "If no delivery receipt was created, the completed-render charge is returned." out src\components\Workspace.tsx`

## Validation

- `npm.cmd run build`: PASS
- Customer-facing source/output scan for old terms: PASS, no matches for `render factory`, `Render factory`, `Render Factory`, `factories`, or `factory failed` in `src`, `public`, or `out`.
- Source/output scan for new terms: PASS, `render partner` copy present.
- Failed-state refund-safe copy: PASS.

