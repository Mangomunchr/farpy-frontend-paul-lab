# WORKSPACE_FAILURE_POLISH_V1

Status: implemented

Scope:
- Frontend workspace failure copy and display only.
- No backend, payment, wallet, render, scheduler, or receipt behavior changed.

Changes:
- Classified common render failures into friendlier customer messages.
- Replaced the failed-job billing note with calmer receipt-aware wording.
- Updated the failed timeline path to show:
  - Upload received
  - Payment captured
  - Assigned to render node
  - Rendering failed
  - Packaging ZIP
  - Download ready
- Added failure metadata in the collapsed Details section when available:
  - Failure Class
  - Failure Code
  - Retryable
  - Node ID
  - Receipt Created
- Kept Retry as a start-again action because the workspace currently supports retry by returning to the homepage.

Validation:
- `npm.cmd run build`
