# STATIC_DEPLOY_PRESERVE_FIX_V1

Status: GREEN

## Objective

Make frontend deploy preparation preserve protected static artifacts before any clean static deploy.

## Files Changed

- `scripts/prepare-static-deploy-preserve-v1.ps1`
- `release/STATIC_DEPLOY_PRESERVE_FIX_V1.md`

## Implemented

The prep script:

1. Creates a timestamped staging directory under `C:\tmp`.
2. Copies local `out` into the staging directory.
3. Generates a read-only production static preservation manifest.
4. Compares the staging directory against protected production artifacts.
5. Fetches missing protected artifacts from production into the stage.
6. Runs `static-preservation-guard-v1.ps1 -Mode PreDeploy` against the prepared stage.
7. Writes a machine-readable proof bundle to `C:\tmp\static-deploy-preserve-fix-v1-latest.json`.

Protected artifact classes:

- `downloads/**`
- Blender add-on ZIP
- `.sha256` sidecars
- generated status/audit JSON
- root generated `*.json`
- `status/*.json`
- `proof/*.json`
- `node/*.json`
- `project-status/*.json`
- `receipt-static/**`

## Safety

- No production deploy.
- No production writes.
- No production deletes.
- No service restarts.
- Production is read only for manifest generation and artifact fetch.

## Command

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/prepare-static-deploy-preserve-v1.ps1 -EvidencePath C:\tmp\static-deploy-preserve-fix-v1-latest.json
```

## Validation

PASS.

Latest proof:

- Evidence: `C:\tmp\static-deploy-preserve-fix-v1-latest.json`
- Prepared stage: `C:\tmp\farpy-static-deploy-preserved-20260701T003131Z`
- Static preservation manifest: `C:\tmp\static-preservation-manifest-v1.json`
- Predeploy guard evidence: `C:\tmp\static-preservation-guard-v1-preservefix-predeploy.json`
- Missing protected artifacts before preservation: `736`
- Protected artifacts fetched into stage: `736`
- Final verdict: `GREEN`
- Production deploy performed: `false`

Parse check:

```powershell
$errors=$null; [System.Management.Automation.PSParser]::Tokenize((Get-Content -LiteralPath 'C:\Users\danki\Desktop\farpy-frontend\scripts\prepare-static-deploy-preserve-v1.ps1' -Raw), [ref]$errors) | Out-Null
```

Result: `PARSE_OK prepare-static-deploy-preserve-v1.ps1`

## Notes

The first local proof exposed two Windows-specific packaging issues:

- `Copy-Item -LiteralPath out\*` treated the wildcard literally; fixed to use `Copy-Item -Path`.
- Streaming a tar archive through a PowerShell pipeline corrupted the archive; fixed by writing a local tar file through raw `cmd.exe` redirection before extraction.

No production deploy was performed.
