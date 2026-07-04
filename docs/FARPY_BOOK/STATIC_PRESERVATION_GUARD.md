# Static Preservation Guard

Status: implemented and documented as required clean-deploy prep.

Script: `scripts/static-preservation-guard-v1.ps1`

Purpose: prevent clean static deploys from deleting production-generated artifacts under `/opt/farpy.com/out`.

## Protected Artifacts

The guard protects:

- `downloads/**`
- `downloads/*.sha256`
- Blender add-on ZIP and sidecar
- Benchmark installers and sidecars
- NodeMuncher controlled-alpha artifacts and sidecars if present
- root generated `*.json`
- generated status/audit JSON
- `status/*.json`
- `proof/*.json`
- `node/*.json`
- `project-status/*.json`
- `receipt-static/**`

## Modes

| Mode | Purpose | Production mutation |
| --- | --- | --- |
| `GenerateManifest` | Read production static root and write protected artifact manifest. | None |
| `PreDeploy` | Generate/read manifest and compare protected production artifacts to local `out`. Fails if clean deploy would delete them. | None |
| `PostDeploy` | Read manifest and verify protected artifacts still exist in production after deploy. | None |
| `All` | Run manifest generation, pre-deploy comparison, and post-deploy verification. Use only when appropriate around a deploy. | None |

## Default Command

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/static-preservation-guard-v1.ps1 -Mode PreDeploy -LocalOut C:\Users\danki\Desktop\farpy-frontend\out -ManifestPath C:\tmp\static-preservation-manifest-v1.json -OutputPath C:\tmp\static-preservation-guard-v1-latest.json
```

## Required Clean Deploy Prep

Clean static deploys must use the preserved staging prep command:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/prepare-static-deploy-preserve-v1.ps1 -EvidencePath C:\tmp\static-deploy-preserve-fix-v1-latest.json
```

The deploy archive source must be the `stage_root` written to `C:\tmp\static-deploy-preserve-fix-v1-latest.json`.

Do not archive raw `out` for a clean deploy unless:

- `static-preservation-guard-v1.ps1 -Mode PreDeploy -LocalOut out` is GREEN, or
- every protected artifact missing from raw `out` has been intentionally regenerated and documented.

Raw `out` clean deploys are unsafe because a clean static-root swap can delete production-generated artifacts that are not produced by `npm run build`.

## Expected Behavior

The script is fail-closed:

- `GREEN`: local `out` contains every protected artifact from the production manifest.
- `YELLOW`: a check was skipped, usually because production inventory was intentionally skipped.
- `RED`: clean deploy would delete protected artifacts, or post-deploy verification found missing artifacts.

On RED during `PreDeploy`, the script writes:

- `preserve_required`
- `manifest_path`
- `output_path`

The deploy must stop until those artifacts are copied into the staged output or regenerated intentionally.

## Preservation Workflow

1. Build frontend locally.
2. Run `prepare-static-deploy-preserve-v1.ps1`.
3. Confirm `C:\tmp\static-deploy-preserve-fix-v1-latest.json` reports `verdict=GREEN`.
4. Archive the reported `stage_root`, not raw `out`.
5. Back up production `/opt/farpy.com/out`.
6. Deploy the staged output.
7. Run `PostDeploy` with the same manifest.
8. If `PostDeploy` is RED, roll back or restore missing artifacts immediately.

Manual `PreDeploy` remains useful for diagnosis:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/static-preservation-guard-v1.ps1 -Mode PreDeploy -LocalOut C:\Users\danki\Desktop\farpy-frontend\out -ManifestPath C:\tmp\static-preservation-manifest-v1.json -OutputPath C:\tmp\static-preservation-guard-v1-latest.json
```

If this is RED, that is expected when raw `out` does not contain generated production artifacts. The preserved staging prep must make the prepared deploy source GREEN.

## Secret Safety

The guard records public/static artifact paths, size, mtime, category, and source.

It must not print:

- cookies
- API keys
- webhook secrets
- tokens
- env file contents
- private keys

## Relationship To Static Artifact Manifest

This script operationalizes `docs/FARPY_BOOK/STATIC_ARTIFACT_MANIFEST.md`.

The manifest remains the human source of truth. The guard produces deploy-time evidence and a machine-readable preservation list.

## Limitations

- The guard checks existence, size, category, and path. It does not hash every production file because `receipt-static/**` can be high-cardinality.
- It does not decide whether `proof/recent.json` is public-safe; it preserves it if production currently serves it.
- It does not deploy, copy, remove, or regenerate files.
- It assumes SSH read access to production when `-SkipProduction` is not set.
- `prepare-static-deploy-preserve-v1.ps1` reads protected artifacts from production into a local staging directory, but still does not deploy production by itself.
