# LAUNCH_FREEZE_V1

Current phase: `JULY_1_PRODUCTION_LAUNCH_CLOSURE`

Launch verdict: `YELLOW / LAUNCHABLE`

Reason: no failures, no blockers, and no public P0 launch risk in current evidence. Remaining skips are explicitly non-blocking optional evidence inputs, so the launch freeze is not represented as fake GREEN.

## Contract Summary

| Contract | Verdict | Pass | Fail | Skip | Blockers | Notes |
|---|---:|---:|---:|---:|---:|---|
| PRODUCTION_REGRESSION_AUDIT_V1 | GREEN | 43 | 0 | 0 | 0 | Public launch routes, private completed job status, tokenized download, and receipt checks pass. |
| PUBLIC_USER_SMOKE_V1 | GREEN | 9 | 0 | 0 | 0 | Public user surfaces plus completed job/download/receipt token checks pass. |
| NODEMUNCHER_FRESH_INSTALL_V1 | YELLOW | 15 | 0 | 1 | 0 | Artifacts and public endpoints pass; destructive fresh-install reset not run. |
| BLENDER_ADDON_PRODUCTION_AUDIT_V1 | YELLOW | 10 | 0 | 1 | 0 | Addon package and Blender import pass; direct public addon ZIP URL not supplied. |
| PRODUCTION_OPERATIONS_DASHBOARD_V1 | YELLOW | 26 | 0 | 5 | 0 | Public ops checks pass; richer private ops metric URLs missing. |
| AUDIT_CANONICAL_RECEIPT_DOWNLOAD_URLS_V1 | GREEN | - | 0 | 0 | 0 | Audit scripts now validate canonical tokenized download and receipt URL shapes. |

## Non-Blocking Skip List

- `NODEMUNCHER_FRESH_INSTALL_V1`: destructive fresh-install reset was intentionally not run.
- `BLENDER_ADDON_PRODUCTION_AUDIT_V1`: direct public addon ZIP URL env was not supplied.
- `PRODUCTION_OPERATIONS_DASHBOARD_V1`: optional richer/private ops URLs were not supplied.

These skips are optional proof depth, not current launch blockers.

## Frozen Surfaces

- Receipt schema
- Job lifecycle
- Wallet/payment flow
- Public APIs
- NodeMuncher protocol
- Benchmark public pages/API
- Blender addon package shape
- Download/receipt URL behavior

## Allowed Changes After Freeze

- Copy
- CSS
- Small UX
- Bug fixes
- Docs
- Audit script improvements

## Blocked Changes After Freeze

- Schema rewrites
- New render engines
- Payout model changes
- Major frontend redesign
- Backend architecture rewrite
- New product surfaces

## Launch Blockers

- None public.

## Remaining Inputs To Turn YELLOW / LAUNCHABLE -> GREEN

- Public addon ZIP URL env
- Optional richer ops JSON URLs
- Destructive fresh-install reset run for NodeMuncher, if intentionally approved

## Verification Script

Run from repo root:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\launch-freeze-v1.ps1 -OutputPath C:\tmp\launch-freeze-v1-latest.json
```

Script verdict rules:

- `GREEN`: all contracts GREEN, with no skips.
- `YELLOW_LAUNCHABLE`: no FAIL rows and no blockers across available evidence, but non-blocking optional skips remain.
- `RED`: any FAIL row or blocker exists.

The script exits nonzero only on `RED`.
