# PRODUCTION_REGRESSION_AUDIT_V1

Purpose: repeatable production regression audit for the Farpy July 1 launch surface.

Run from the repo root:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\production-regression-audit-v1.ps1
```

The audit checks public routes, production health/status endpoints, benchmark and leaderboard endpoints, public artifact URLs, and the frozen local Blender addon ZIP hash. It exits nonzero when any P0 public launch route or public endpoint fails.

Private/tokenized render checks are not faked. They are skipped unless the operator provides:

```powershell
$env:FARPY_AUDIT_JOB_STATUS_URL="https://farpy.com/node/v1/web-render/jobs/JOB-..."
$env:FARPY_AUDIT_DOWNLOAD_URL="https://farpy.com/node/v1/web-render/jobs/JOB-.../download?token=..."
$env:FARPY_AUDIT_RECEIPT_URL="https://farpy.com/node/v1/web-render/jobs/JOB-.../receipt?token=..."
```

## Required Matrix

| Area | Check | Status | Evidence | Notes |
|---|---|---:|---|---|
| Website | Homepage and public website shell | Script checked | `/` | P0, public |
| Workspace | Workspace page | Script checked | `/workspace` | P0, public shell |
| Account | Account and sign-in pages | Script checked | `/account`, `/signin` | P0, public shells |
| Upload | Private upload smoke job status | Env-gated | `FARPY_AUDIT_JOB_STATUS_URL` | Skipped without tokenized evidence URL |
| Payment/wallet | Top up page | Script checked | `/topup` | P0, public shell |
| Receipt | Receipt shell and optional tokenized receipt | Script checked / env-gated | `/receipt`, `FARPY_AUDIT_RECEIPT_URL` | Tokenized receipt skipped without env |
| Download | Optional tokenized download | Env-gated | `FARPY_AUDIT_DOWNLOAD_URL` | Skipped without tokenized URL |
| Benchmark | Benchmark public pages | Script checked | `/benchmark/leaderboard`, `/benchmark/latest`, `/benchmark/search`, `/benchmark/api` | P0, public |
| Leaderboard | Public leaderboard APIs | Script checked | `/node/v1/leaderboard/top`, `/stats`, `/latest` | P0, public |
| Blender Addon | Addon page and frozen ZIP hash | Script checked | `/addon`, local addon ZIP path | Local hash uses `LAUNCH_ARTIFACT_FREEZE_V1` |
| NodeMuncher | Downloads and lease auth gates | Script checked | `/downloads/*`, `/node/v1/nodemuncher/lease/*` | Missing token must reject with 403 |
| Status | Status and health endpoints | Script checked | `/status`, `/node/v1/web-render/health`, `/worker/status` | P0, public |
| Docs/legal | Trust/legal/doc routes | Script checked | `/faq`, `/docs`, `/dmca`, `/pricing`, `/privacy`, `/terms`, `/refunds`, `/contact`, `/acceptable-use`, `/security`, `/files` | P0, public |

## Final Launch Verdict

The verdict is produced by the script:

- `GREEN`: all checks pass and no private checks are skipped.
- `YELLOW`: public P0 checks pass, but optional private/tokenized checks are skipped or non-P0 checks fail.
- `RED`: one or more P0 public launch checks fail.
