# STATIC_DEPLOY_PRESERVE_INTEGRATION_V1

Status: GREEN

## Objective

Integrate `prepare-static-deploy-preserve-v1.ps1` into the documented frontend static deploy flow.

No production deploy was performed.

## Files Changed

- `docs/FARPY_BOOK/DEPLOYMENT_TIMELINE.md`
- `docs/FARPY_BOOK/STATIC_PRESERVATION_GUARD.md`
- `release/STATIC_DEPLOY_PRESERVE_INTEGRATION_V1.md`

## Integration

Clean static deploys now require preserved staging:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/prepare-static-deploy-preserve-v1.ps1 -EvidencePath C:\tmp\static-deploy-preserve-fix-v1-latest.json
```

The deploy archive source must be the `stage_root` written to:

```text
C:\tmp\static-deploy-preserve-fix-v1-latest.json
```

## Unsafe Path

The old raw `out` archive path is now explicitly marked unsafe for clean deploys unless:

- raw `out` passes `static-preservation-guard-v1.ps1 -Mode PreDeploy`, or
- all protected production-only artifacts are regenerated into `out` and documented.

## Protected Artifacts

The documented flow preserves:

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

## Validation

The previous local proof from `STATIC_DEPLOY_PRESERVE_FIX_V1` remains the integration baseline:

- Prepared stage: `C:\tmp\farpy-static-deploy-preserved-20260701T003131Z`
- Missing protected artifacts before preservation: `736`
- Protected artifacts fetched into stage: `736`
- Guard verdict: `GREEN`
- Guard checks: `PASS=3 FAIL=0 SKIP=0`
- Production deploy performed: `false`

This milestone changed documentation only.

## Commands Run

```powershell
Get-Content -LiteralPath 'C:\Users\danki\Desktop\farpy-frontend\docs\FARPY_BOOK\DEPLOYMENT_TIMELINE.md' -Raw
Get-Content -LiteralPath 'C:\Users\danki\Desktop\farpy-frontend\docs\FARPY_BOOK\STATIC_PRESERVATION_GUARD.md' -Raw
Select-String -Path 'C:\Users\danki\Desktop\farpy-frontend\docs\FARPY_BOOK\DEPLOYMENT_TIMELINE.md','C:\Users\danki\Desktop\farpy-frontend\docs\FARPY_BOOK\STATIC_PRESERVATION_GUARD.md' -Pattern 'prepare-static-deploy-preserve-v1.ps1|raw `out`|unsafe|stage_root|clean deploy'
```

## Production Changes

None.
