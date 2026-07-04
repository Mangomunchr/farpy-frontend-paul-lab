# DRIFT_GUARD_BOOK_UPDATE_V1

Status: GREEN

## Objective

Update the Farpy Book with current drift-control truth.

No production changes were made.

## Files Changed

- `docs/FARPY_BOOK/PRODUCTION_DRIFT_GUARD.md`
- `docs/FARPY_BOOK/STATIC_ARTIFACT_MANIFEST.md`
- `docs/FARPY_BOOK/ETC_FARPY_MANIFEST.md`
- `release/DRIFT_GUARD_BOOK_UPDATE_V1.md`

`docs/FARPY_BOOK/CURRENT_STATE.md` does not exist, so it was not updated.

## Current Truth Added

- `/etc/farpy` secret-like file permissions are fixed.
- Drift guard reports `/etc/farpy` manifest coverage and secret permissions as PASS.
- `scripts/prepare-static-deploy-preserve-v1.ps1` exists and is the required clean static deploy prep step.
- Clean deploys from raw local `out` are unsafe unless raw `out` passes the static preservation guard or all protected artifacts are intentionally regenerated.
- Current production drift guard state is `YELLOW` with no FAIL rows:

```text
VERDICT=YELLOW
PASS_COUNT=10
WARN_COUNT=1
FAIL_COUNT=0
SKIP_COUNT=0
```

The remaining YELLOW warning is accepted:

- raw local `out` sample hashes differ from production
- this is expected because preserved staging, not raw `out`, is the clean-deploy source

## Commands Run

```powershell
Get-Content -LiteralPath 'C:\Users\danki\Desktop\farpy-frontend\docs\FARPY_BOOK\PRODUCTION_DRIFT_GUARD.md' -Raw
Get-Content -LiteralPath 'C:\Users\danki\Desktop\farpy-frontend\docs\FARPY_BOOK\STATIC_ARTIFACT_MANIFEST.md' -Raw
Get-Content -LiteralPath 'C:\Users\danki\Desktop\farpy-frontend\docs\FARPY_BOOK\ETC_FARPY_MANIFEST.md' -Raw
if (Test-Path -LiteralPath 'C:\Users\danki\Desktop\farpy-frontend\docs\FARPY_BOOK\CURRENT_STATE.md') { Get-Content -LiteralPath 'C:\Users\danki\Desktop\farpy-frontend\docs\FARPY_BOOK\CURRENT_STATE.md' -Raw } else { Write-Host 'NO_CURRENT_STATE' }
Select-String -Path 'C:\Users\danki\Desktop\farpy-frontend\docs\FARPY_BOOK\PRODUCTION_DRIFT_GUARD.md','C:\Users\danki\Desktop\farpy-frontend\docs\FARPY_BOOK\STATIC_ARTIFACT_MANIFEST.md','C:\Users\danki\Desktop\farpy-frontend\docs\FARPY_BOOK\ETC_FARPY_MANIFEST.md' -Pattern 'YELLOW|FAIL_COUNT=0|prepare-static-deploy-preserve-v1.ps1|raw local `out`|unsafe|0600 root:root|unsafe_secret_mode_count: 0'
```

## Production Changes

None.

No code changes.
No deploy.
