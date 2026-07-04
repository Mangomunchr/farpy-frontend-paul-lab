# FARPY_WORLD_LAYER_V1

Status: implemented locally

## Scope

Introduced the first Farpy World System vocabulary layer for customer-facing UI copy only.

No backend, API, database, receipt, download, wallet, or render behavior was changed.

## Vocabulary Added

- Render job -> Package
- Worker -> Render Factory, where customer-facing
- Completed -> Package delivered
- Searching/waiting -> Looking for an available render factory

## UI Applied

- Workspace package tracker now uses shared package/factory/delivery language.
- Workspace timeline uses:
  - Package received
  - Queued
  - Rendering
  - Packaging results
  - Delivered
- Current timeline step now includes one contextual sentence.
- Public status/proof labels use Render Factory wording where appropriate.

## Helper

Added `src/lib/worldLanguage.ts` so future UI can reuse the same vocabulary instead of hardcoding package/factory/delivery strings.

## Verification

Run:

```powershell
npm.cmd run build
```
