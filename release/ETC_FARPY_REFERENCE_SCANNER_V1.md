# ETC_FARPY_REFERENCE_SCANNER_V1

Status: PASS

## Objective

Create a redacted scanner for `/etc/farpy` references.

## Files Changed

- `scripts/etc-farpy-reference-scanner-v1.ps1`
- `release/ETC_FARPY_REFERENCE_SCANNER_V1.md`

## Implemented

- Inventories `/etc/farpy` file paths, mode, owner, and size.
- Searches selected production code/config roots for literal `/etc/farpy/...` path references.
- Reports which files are referenced by which service/script/config files.
- Reports orphan config files with no discovered reference.
- Reports production files missing from `docs/FARPY_BOOK/ETC_FARPY_MANIFEST.md`.

## Safety

- Does not print file contents.
- Does not print env values.
- Does not print secrets.
- Does not mutate production.
- Skips large/binary/dependency files.

## Command

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/etc-farpy-reference-scanner-v1.ps1 -OutputPath C:\tmp\etc-farpy-reference-scanner-v1-latest.json
```

## Commands Run

```powershell
$errors=$null; [System.Management.Automation.PSParser]::Tokenize((Get-Content -LiteralPath C:\Users\danki\Desktop\farpy-frontend\scripts\etc-farpy-reference-scanner-v1.ps1 -Raw), [ref]$errors)
powershell -NoProfile -ExecutionPolicy Bypass -File C:\Users\danki\Desktop\farpy-frontend\scripts\etc-farpy-reference-scanner-v1.ps1 -SkipProduction -OutputPath C:\tmp\etc-farpy-reference-scanner-v1-skipprod.json
powershell -NoProfile -ExecutionPolicy Bypass -File C:\Users\danki\Desktop\farpy-frontend\scripts\etc-farpy-reference-scanner-v1.ps1 -OutputPath C:\tmp\etc-farpy-reference-scanner-v1-latest.json
```

## Production Changes

None.

Production was scanned read-only. No files were modified. No services were restarted.

## Validation Result

Evidence:

- `C:\tmp\etc-farpy-reference-scanner-v1-latest.json`

Final scanner verdict:

- `VERDICT=GREEN`
- `PRODUCTION_FILE_COUNT=78`
- `REFERENCED_COUNT=37`
- `ORPHAN_COUNT=41`
- `MISSING_MANIFEST_COUNT=0`

Referenced examples:

- `/etc/farpy/.env`
- `/etc/farpy/accept.env`
- `/etc/farpy/alert.env`
- `/etc/farpy/auth-secrets.env`
- `/etc/farpy/backup.env`
- `/etc/farpy/btcpay.env`
- `/etc/farpy/bunny.env`
- `/etc/farpy/dhfm-config.json`

Orphan/no discovered reference examples:

- `/etc/farpy/admin.key`
- `/etc/farpy/admin_key`
- `/etc/farpy/agent.env`
- `/etc/farpy/analytics-redis.env`
- `/etc/farpy/api_key.env`
- `/etc/farpy/billing.env`
- `/etc/farpy/BOOT_RECONCILE_OK`
- `/etc/farpy/btcpay.env.bak.20260628T085316Z`

No secret values were printed.

## Result

PASS. Script created and validated against production read-only.
