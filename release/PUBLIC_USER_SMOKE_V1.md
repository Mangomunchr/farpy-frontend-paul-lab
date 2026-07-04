# PUBLIC_USER_SMOKE_V1

Purpose: repeatable production smoke for the real customer path:

Landing -> account/session -> upload/render evidence -> job status -> download -> receipt -> history persistence.

Run from the repo root:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\public-user-smoke-v1.ps1 -OutputPath C:\tmp\public-user-smoke-v1-latest.json
```

Public route checks run without secrets. Private completed-render checks require explicit tokenized URLs and are never faked:

```powershell
$env:FARPY_AUDIT_JOB_STATUS_URL="https://farpy.com/node/v1/web-render/jobs/JOB-..."
$env:FARPY_AUDIT_DOWNLOAD_URL="https://farpy.com/node/v1/web-render/jobs/JOB-.../download?token=..."
$env:FARPY_AUDIT_RECEIPT_URL="https://farpy.com/node/v1/web-render/jobs/JOB-.../receipt?token=..."
```

The script redacts token-like query values in output and evidence.

## Matrix

| Area | Check | Status | Evidence | Notes |
|---|---|---:|---|---|
| Landing | farpy.com loads | Script checked | `/` | Public, required |
| Workspace | Workspace route loads | Script checked | `/workspace` | Public, required |
| Account/session | Account route loads | Script checked | `/account` | Public shell, required |
| Account/session | Signin route loads | Script checked | `/signin` | Public shell, required |
| Receipt | Receipt shell route loads | Script checked | `/receipt` | Public shell, required |
| Job status | Job status URL validates | Env-gated | `FARPY_AUDIT_JOB_STATUS_URL` | Required for GREEN |
| Download | ZIP/content headers sanity | Env-gated | `FARPY_AUDIT_DOWNLOAD_URL` | Required for GREEN |
| Receipt | Receipt JSON/hash fields sanity | Env-gated | `FARPY_AUDIT_RECEIPT_URL` | Required for GREEN |
| History persistence | Account route still loads after smoke | Script checked | `/account` | Public shell, required |

## Final Verdict

- `GREEN`: all required public checks pass and all private smoke env vars are provided and pass.
- `YELLOW`: public checks pass, but one or more private smoke env vars are missing.
- `RED`: any required public check or provided private check fails.
