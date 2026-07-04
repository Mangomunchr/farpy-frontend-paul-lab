# AUDIT_CANONICAL_RECEIPT_DOWNLOAD_URLS_V1

Status: implemented

Goal:
- Make launch audit scripts validate the same receipt and download URL shapes used by the live Farpy UI.

Canonical URL shapes:
- Workspace download button:
  `/node/v1/web-render/jobs/<JOB_ID>/download?token=<download_token>`
- Human receipt page:
  `/receipt?job_id=<JOB_ID>&receipt_token=<receipt_token>&download_token=<download_token>`
- Raw receipt JSON used by the receipt page:
  `/node/v1/web-render/jobs/<JOB_ID>/receipt?token=<receipt_token>`

Script changes:
- `scripts/public-user-smoke-v1.ps1`
  - Accepts the human receipt page URL or the raw receipt JSON URL.
  - Derives the raw JSON URL from `/receipt?...` when needed.
  - Prints canonical URL shape guidance on 404 failures.
- `scripts/production-regression-audit-v1.ps1`
  - Uses ZIP/content sanity for tokenized download checks.
  - Accepts the human receipt page URL or the raw receipt JSON URL.
  - Prints canonical URL shape guidance on 404 failures.

Notes:
- No production routes changed.
- No fake PASS behavior added.
- Token values are redacted in audit output.

Validation:
- `powershell -NoProfile -ExecutionPolicy Bypass -File scripts\public-user-smoke-v1.ps1 -OutputPath C:\tmp\public-user-smoke-v1-latest.json`
- `powershell -NoProfile -ExecutionPolicy Bypass -File scripts\production-regression-audit-v1.ps1 -OutputPath C:\tmp\production-regression-audit-v1-latest.json`
- `powershell -NoProfile -ExecutionPolicy Bypass -File scripts\launch-freeze-v1.ps1 -OutputPath C:\tmp\launch-freeze-v1-latest.json`
