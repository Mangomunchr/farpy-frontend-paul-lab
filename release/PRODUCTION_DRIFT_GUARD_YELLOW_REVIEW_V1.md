# PRODUCTION_DRIFT_GUARD_YELLOW_REVIEW_V1

Status: GREEN

Classification: ACCEPTED

## Objective

Review the remaining `production-drift-guard-v1.ps1` YELLOW warning:

- local `out` sample hashes differ from production
- determine whether this is expected from preserved artifacts/deploy timing
- classify as `ACCEPTED`, `NEEDS_FIX`, or `BLOCKED`

No production changes were made.

## Evidence Reviewed

Latest drift guard evidence:

```text
C:\tmp\production-drift-guard-v1-after-etc-permission-fix.json
```

Summary:

```text
VERDICT=YELLOW
PASS_COUNT=10
WARN_COUNT=1
FAIL_COUNT=0
SKIP_COUNT=0
```

Remaining warning:

```text
local_vs_production_sample_hashes = WARN
index.html hash differs
downloads/Farpy-Blender-Addon-unified.zip hash differs
downloads/Farpy-Blender-Addon-unified.zip.sha256 hash differs
```

## Hash Review

| Sample | Local `out` | Production | Classification | Reason |
| --- | --- | --- | --- | --- |
| `downloads/Farpy-Blender-Addon-unified.zip` | `8d5ca2d53c2c71736bf9d7205d61d07d49af40c2bb8e6ea97b697abc6fc6260b` | `be2312ce5e77a1e62c1255a95765ae1c89bef73e5cedf114b9e7d75a6daa7708` | ACCEPTED | Download artifacts are protected production static artifacts. Raw local `out` is not the deploy source for clean deploys. |
| `downloads/Farpy-Blender-Addon-unified.zip.sha256` | `4b6f4e6e5519150802d122db32630870865f6f141c26adeb28ed73ac31b50121` | `eab963f9c9dd78bc2712eb548125d5a53e2ea693176622ac96b6eeed1555dfee` | ACCEPTED | Sidecar differs with the protected production add-on artifact. Preserved staging must carry production artifact + sidecar unless intentionally updated. |
| `index.html` | `41fb43b863dab6949eadad23c7d702d7f10ffe041b5e36189921d41f9f73600c` | `101ff1fb41c6248380d5ae7fb389d951f09577cd5cfc511df28ee77d583ddafe` | ACCEPTED | Local build state can differ from currently deployed production between deploys. This is a deploy-intent signal, not a preservation failure. |

Matching samples:

```text
downloads/farpy-benchmark-windows-amd64.exe
downloads/farpy-benchmark-windows-amd64.msi
```

## Root Cause

The drift guard is comparing raw local `out` against production.

That check is intentionally conservative and now serves as a warning that raw local `out` is not a safe clean-deploy source.

Two causes are present:

1. Protected production artifacts can differ from files currently in local `out`.
2. `index.html` can differ when the local build represents newer or unpublished frontend state.

This is expected after `STATIC_DEPLOY_PRESERVE_FIX_V1` and `STATIC_DEPLOY_PRESERVE_INTEGRATION_V1`.

The accepted deploy rule is:

- do not deploy raw `out`
- run `scripts/prepare-static-deploy-preserve-v1.ps1`
- archive the prepared `stage_root`
- deploy only after the preservation guard is GREEN against the prepared stage

## Classification

ACCEPTED.

This warning is not a production blocker because:

- `FAIL_COUNT=0`
- Caddy template/production shape passed
- systemd template/production coverage passed
- `/etc/farpy` manifest and permissions passed
- static preservation manifest exists
- preserved deploy staging already proved `GREEN`

This warning should remain visible because it prevents accidental raw `out` clean deploys.

## When It Becomes NEEDS_FIX

Reclassify as `NEEDS_FIX` if:

- the prepared `stage_root` from `prepare-static-deploy-preserve-v1.ps1` fails `PreDeploy`
- a protected production artifact is missing from both production and prepared stage
- a clean deploy process archives raw `out` instead of the preserved stage
- an operator intends to update the add-on ZIP but local sidecar/hash/page are inconsistent

## Commands Run

```powershell
Get-Content -LiteralPath 'C:\tmp\production-drift-guard-v1-after-etc-permission-fix.json' -Raw
Get-Content -LiteralPath 'C:\Users\danki\Desktop\farpy-frontend\scripts\production-drift-guard-v1.ps1' -Raw
Test-Path -LiteralPath 'C:\Users\danki\Desktop\farpy-frontend\release\PRODUCTION_DRIFT_GUARD_YELLOW_REVIEW_V1.md'
```

## Production Changes

None.

No code changes.
No deploy.
