# Static Artifact Manifest

Status: production static artifact manifest, values public-safe.

Purpose: document production static files under `/opt/farpy.com/out` that clean deploys must preserve, regenerate, or intentionally replace.

Source: read-only production inventory on 2026-06-30.

## Current Deploy Rule

Clean static deploys must not archive raw local `out` directly.

Required prep:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/prepare-static-deploy-preserve-v1.ps1 -EvidencePath C:\tmp\static-deploy-preserve-fix-v1-latest.json
```

The deploy archive source must be the `stage_root` written by that command.

Raw local `out` is unsafe for clean deploys unless:

- it passes `scripts/static-preservation-guard-v1.ps1 -Mode PreDeploy`, or
- every protected artifact missing from raw `out` has been intentionally regenerated and documented.

Latest preservation proof:

```text
STATIC_DEPLOY_PRESERVE_FIX_V1
Prepared stage: C:\tmp\farpy-static-deploy-preserved-20260701T003131Z
Missing protected artifacts before preservation: 736
Fetched into prepared stage: 736
Predeploy guard: GREEN
Production deploy performed: false
```

## Static Root

| Root | Purpose | Deploy rule |
| --- | --- | --- |
| `/opt/farpy.com/out` | Main `farpy.com` static export and generated public artifacts | Do not blindly delete. Deploys must preserve or regenerate runtime-generated JSON and public downloads. |
| `/opt/farpy.com/out/downloads` | Public downloadable artifacts and SHA256 sidecars | Preserve unless intentionally replacing a known artifact. |
| `/opt/farpy.com/out/status` | Public status page and generated status JSON | Regenerate or preserve during clean deploy. |
| `/opt/farpy.com/out/proof` | Public proof page data/artifacts | Regenerate or preserve during clean deploy. |
| `/opt/farpy.com/out/receipt-static` | Public/static receipt JSON aliases | Preserve or regenerate from receipt source of truth. |
| `/opt/farpy.com/out/project-status` | Generated project status JSON | Preserve or regenerate if still linked. |
| `/opt/farpy.com/out/node` | Generated NodeMuncher/fleet JSON | Preserve or regenerate from status/node jobs. |

## Current Production Counts

| Category | Count | Bytes | Examples |
| --- | ---: | ---: | --- |
| Downloads | 18 | 12,550,081 | `downloads/Farpy-Blender-Addon-unified.zip`, benchmark MSI/EXE, NodeMuncher artifacts, sidecars |
| Status artifacts | 43 | 192,453 | `status/metrics.json`, `status/fleet.json`, `e2e-surface-status.json` |
| Audit/proof artifacts | 67 | 515,480 | `render-loop-audit.json`, `proof/recent-public.json`, proof pages |
| Project status JSON | 18 | 66,766 | `project-status/PROJ-*.json` |
| Static receipt JSON | 701 | 300,825 | `receipt-static/JOB-*/index.json` |
| Node JSON | 7 | 7,022 | `node/fleet.json`, `node/heartbeat-reality.json` |
| Root JSON | 6 | 12,383 | `money-loop-status.json`, `nodemuncher-status.json` |

## Downloads and Sidecars

These files are user-facing artifacts. A clean deploy must copy them from the repo/build artifact source or preserve them from production.

| Path | Purpose | SHA256 observed | Deploy rule |
| --- | --- | --- | --- |
| `downloads/Farpy-Blender-Addon-unified.zip` | Blender add-on ZIP | `be2312ce5e77a1e62c1255a95765ae1c89bef73e5cedf114b9e7d75a6daa7708` | Preserve or replace with matching release manifest and sidecar. |
| `downloads/Farpy-Blender-Addon-unified.zip.sha256` | Blender add-on sidecar | sidecar file hash observed, contents must match ZIP hash | Preserve/update beside ZIP. |
| `downloads/farpy-benchmark-windows-amd64.exe` | Benchmark Windows NSIS installer | `2b3fa677db85232f1640bbfb5b862e7d0fd61926577b092df7ade8c80ec7d73a` | Preserve unless republishing Benchmark. |
| `downloads/farpy-benchmark-windows-amd64.exe.sha256` | Benchmark EXE sidecar | sidecar file hash observed, contents must match EXE hash | Preserve/update beside EXE. |
| `downloads/farpy-benchmark-windows-amd64.msi` | Benchmark Windows MSI installer | `fdffda04d38aa36f7f9d2abf2af29bef3cc5e04248a5e4feedf88684e4a37135` | Preserve unless republishing Benchmark. |
| `downloads/farpy-benchmark-windows-amd64.msi.sha256` | Benchmark MSI sidecar | sidecar file hash observed, contents must match MSI hash | Preserve/update beside MSI. |
| `downloads/nodemuncher-windows-amd64.exe` | NodeMuncher Windows alpha/internal artifact | `fac4559180e091d27ca7064fa42622ccaa2cc4a27da9c1235ce84c69000af9fa` | Preserve only if still intentionally available. |
| `downloads/nodemuncher-windows-amd64.msi` | NodeMuncher Windows alpha/internal artifact | `32b28693ffe71dbd11fa8e2320b6c184c3f2e5361df0293036d696f9c091ac2f` | Preserve only if still intentionally available. |
| `downloads/nodemuncher-macos-aarch64.dmg` | NodeMuncher macOS alpha/internal artifact | `9041e7ea03e207db77f525f0119d2cde3a3e037f2664e95b41efed8f8f2a69d1` | Preserve only if still intentionally available. |

## Generated Status and Audit JSON

These files are not ordinary frontend source. They are produced by production jobs/timers/scripts and may be overwritten frequently.

| Path/pattern | Purpose | Owner/generator | Deploy rule |
| --- | --- | --- | --- |
| `status/metrics.json` | Public status metrics | status generator/timer | Regenerate after deploy or preserve. |
| `status/fleet.json` | Public fleet/status data | status generator/timer | Regenerate after deploy or preserve. |
| `e2e-surface-status.json` | Surface smoke/e2e state | production smoke/audit script | Preserve or regenerate. |
| `money-loop-status.json` | Money loop status | production report/status script | Preserve or regenerate. |
| `nodemuncher-status.json` | NodeMuncher status summary | node/status script | Preserve or regenerate. |
| `output-reconcile-status.json` | Output reconcile status | reconcile script | Preserve or regenerate. |
| `render-loop-audit.json` | Render loop audit status | audit script | Preserve or regenerate. |
| `share-proof-generate-status.json` | Share/proof generation status | proof generator | Preserve or regenerate. |
| `proof/recent-public.json` | Public proof feed | proof sanitizer/generator | Preserve or regenerate from public-safe source. |
| `proof/recent.json` | Proof feed | proof generator | Review public safety before preserving. |
| `node/*.json` | Node/fleet/operator attention state | node status scripts | Preserve or regenerate. |
| `project-status/*.json` | Project status snapshots | project/status generators | Preserve or regenerate if linked. |
| `receipt-static/JOB-*/index.json` | Static receipt aliases | receipt static alias sync | Preserve or regenerate from receipt source of truth. |

## Build-Owned Artifacts

These are normally replaced by `npm run build` and static deploy:

- `_next/static/**`
- page HTML/TXT route exports
- page-local `__next.*.txt` static export files
- ordinary route `index.html` files

Clean deploys may replace these from `out`, but must not delete runtime-generated JSON/downloads unless they are included in the new `out`.

## Safe Deploy Pattern

1. Build frontend locally.
2. Run `scripts/prepare-static-deploy-preserve-v1.ps1`.
3. Confirm the prepared stage reports GREEN.
4. Archive the prepared `stage_root`, not raw `out`.
5. Stage the preserved archive on production beside the current static root.
6. Confirm preserved artifacts are present in the staged tree:
   - `downloads/**`
   - `status/*.json`
   - root generated `*.json`
   - `node/*.json`
   - `proof/*.json`
   - `project-status/*.json`
   - `receipt-static/**`
7. Verify sidecar hashes for every artifact in `downloads`.
8. Atomically promote staged tree or sync with explicit excludes.
9. Run route checks:
   - `/`
   - `/downloads`
   - `/downloads/Farpy-Blender-Addon-unified.zip`
   - `/status`
   - `/status/metrics.json`
   - `/proof/recent-public.json`
10. Regenerate status/audit artifacts if they were intentionally not preserved.

## Risk Notes

- A full `rm -rf /opt/farpy.com/out && cp -r out` deploy can erase public downloads, receipt aliases, status JSON, and audit JSON.
- Raw local `out` can differ from production and still be acceptable only when deploying a preserved stage. Production drift guard currently warns on raw `out` sample hash differences for this reason.
- Receipt-static JSON should be treated as derived but customer-visible; do not remove unless the receipt service can regenerate it immediately.
- `proof/recent.json` may contain more data than `proof/recent-public.json`; confirm sanitizer policy before exposing or preserving broadly.
- NodeMuncher artifacts in `/downloads` are controlled-alpha artifacts and should not be promoted as public customer Benchmark downloads.

## Related Release Notes

- `release/STATIC_ARTIFACT_MANIFEST_V1.md`
- `release/STATIC_PRESERVATION_GUARD_V1.md`
- `release/STATIC_DEPLOY_PRESERVE_FIX_V1.md`
- `release/STATIC_DEPLOY_PRESERVE_INTEGRATION_V1.md`
- `release/PRODUCTION_DRIFT_GUARD_YELLOW_REVIEW_V1.md`
