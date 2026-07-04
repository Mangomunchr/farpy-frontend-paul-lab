# STATIC_PRESERVATION_GUARD_V1

Status: PASS

## Objective

Prevent clean static deploys from deleting generated production artifacts.

## Files Changed

- `scripts/static-preservation-guard-v1.ps1`
- `docs/FARPY_BOOK/STATIC_PRESERVATION_GUARD.md`
- `release/STATIC_PRESERVATION_GUARD_V1.md`

## Implemented

- Manifest generator for production-only/static generated files.
- Pre-deploy check comparing production protected artifacts against local `out`.
- Post-deploy verification using the generated manifest.
- Fail-closed RED verdict if a clean deploy would delete protected artifacts.
- JSON evidence output.

## Protected

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

## Commands Run

```powershell
Get-ChildItem C:\Users\danki\Desktop\farpy-frontend\scripts
Get-Content C:\Users\danki\Desktop\farpy-frontend\docs\FARPY_BOOK\STATIC_ARTIFACT_MANIFEST.md -TotalCount 80
$errors=$null; [System.Management.Automation.PSParser]::Tokenize((Get-Content -LiteralPath C:\Users\danki\Desktop\farpy-frontend\scripts\static-preservation-guard-v1.ps1 -Raw), [ref]$errors)
powershell -NoProfile -ExecutionPolicy Bypass -File C:\Users\danki\Desktop\farpy-frontend\scripts\static-preservation-guard-v1.ps1 -Mode PreDeploy -SkipProduction -LocalOut C:\Users\danki\Desktop\farpy-frontend\out -OutputPath C:\tmp\static-preservation-guard-v1-local-dryrun.json -ManifestPath C:\tmp\static-preservation-manifest-v1-local-dryrun.json
powershell -NoProfile -ExecutionPolicy Bypass -File C:\Users\danki\Desktop\farpy-frontend\scripts\static-preservation-guard-v1.ps1 -Mode GenerateManifest -LocalOut C:\Users\danki\Desktop\farpy-frontend\out -OutputPath C:\tmp\static-preservation-guard-v1-generate.json -ManifestPath C:\tmp\static-preservation-manifest-v1.json
powershell -NoProfile -ExecutionPolicy Bypass -File C:\Users\danki\Desktop\farpy-frontend\scripts\static-preservation-guard-v1.ps1 -Mode PreDeploy -LocalOut C:\Users\danki\Desktop\farpy-frontend\out -OutputPath C:\tmp\static-preservation-guard-v1-predeploy.json -ManifestPath C:\tmp\static-preservation-manifest-v1.json
```

Recommended pre-deploy command:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/static-preservation-guard-v1.ps1 -Mode PreDeploy -LocalOut C:\Users\danki\Desktop\farpy-frontend\out -ManifestPath C:\tmp\static-preservation-manifest-v1.json -OutputPath C:\tmp\static-preservation-guard-v1-latest.json
```

## Production Changes

None.

No production deploy was performed.

Production was read only for manifest generation and pre-deploy comparison.

## Validation Results

- PowerShell parse: PASS.
- Local dry run with `-SkipProduction`: YELLOW, expected because production inventory was skipped.
- `GenerateManifest`: GREEN, `C:\tmp\static-preservation-manifest-v1.json` created.
- `PreDeploy`: RED by design because current local `out` is missing 736 protected production artifacts that would need preservation or regeneration before a clean deploy.

The pre-deploy RED is the intended launch safety behavior, not a product failure.

## Patch Note

During validation, the first production run exposed a PowerShell variable-name collision with the built-in `$Host`. The script was patched to use `$RemoteHost`.

The first pre-deploy comparison also exposed path normalization that stripped directory prefixes from remote `find` output. The script was patched to use `%p` so preservation entries keep paths such as `downloads/...`, `node/...`, and `project-status/...`.

## Result

PASS. A deploy-time preservation guard now exists, but it is not yet wired into the deploy workflow.
