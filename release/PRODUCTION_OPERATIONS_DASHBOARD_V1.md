# PRODUCTION_OPERATIONS_DASHBOARD_V1

Purpose: single 30-second operator audit/dashboard for Farpy July 1 launch readiness.

Run from the Farpy frontend repo root:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\production-operations-dashboard-v1.ps1 -OutputPath C:\tmp\production-operations-dashboard-v1-latest.json
```

The dashboard checks public launch-critical surfaces by default. Optional richer/private metrics are env-var gated and are never faked:

```powershell
$env:FARPY_OPS_STATUS_JSON_URL="https://..."
$env:FARPY_OPS_JOBS_JSON_URL="https://..."
$env:FARPY_OPS_LEADERBOARD_STATS_URL="https://..."
$env:FARPY_OPS_RECENT_RECEIPT_URL="https://..."
$env:FARPY_OPS_RECENT_DOWNLOAD_URL="https://..."
```

## 30-Second Summary

The script prints compact operator lines:

```text
WEBSITE: GREEN/YELLOW/RED
JOBS: GREEN/YELLOW/RED
NODES: GREEN/YELLOW/RED
RECEIPTS: GREEN/YELLOW/RED
DOWNLOADS: GREEN/YELLOW/RED
BENCHMARK: GREEN/YELLOW/RED
ALERTS: GREEN/YELLOW/RED
```

## Matrix

| Area | Check | Status | Evidence | Notes |
|---|---|---:|---|---|
| WEBSITE | Homepage, workspace, account, status page | Script checked | `/`, `/workspace`, `/account`, `/status` | Required |
| JOBS | Web render health and worker status | Script checked | `/node/v1/web-render/health`, `/worker/status` | Required |
| NODES | NodeMuncher public auth gates | Script checked | `/node/v1/nodemuncher/lease/peek`, `/claim` | Required, missing token should be 403 |
| RECEIPTS | Receipt shell and optional recent receipt | Script checked / env-gated | `/receipt`, `FARPY_OPS_RECENT_RECEIPT_URL` | Optional private metric skipped without env |
| DOWNLOADS | Downloads and addon pages, optional recent ZIP | Script checked / env-gated | `/downloads/`, `/addon`, `FARPY_OPS_RECENT_DOWNLOAD_URL` | Optional private metric skipped without env |
| BENCHMARK | Benchmark page and leaderboard APIs | Script checked | `/benchmark/leaderboard`, `/node/v1/leaderboard/top`, `/stats` | Required |
| DOCS/LEGAL | API/docs/legal/trust pages | Script checked | `/api`, `/faq`, `/docs`, `/privacy`, `/terms`, `/refunds`, `/contact`, `/dmca`, `/acceptable-use`, `/security`, `/files`, `/pricing` | Required |
| ALERTS | Optional ops status JSON | Env-gated | `FARPY_OPS_STATUS_JSON_URL` | Skipped without env |

## Final Verdict

- `GREEN`: all required public ops checks pass and richer/private metrics are provided or no skips remain.
- `YELLOW`: required public ops checks pass, but richer/private metrics are skipped or non-required checks fail.
- `RED`: any required public ops check fails.
