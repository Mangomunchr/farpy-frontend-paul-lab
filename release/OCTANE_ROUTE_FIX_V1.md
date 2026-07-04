# OCTANE_ROUTE_FIX_V1

## 2026-07-02 Deployment Attempt Update

Status: YELLOW - source fix is ready, PR-003 deployment is blocked by missing/reachable worker host target.

### What was verified this pass

- `https://farpy.com/node/v1/web-render/health` returns `200` with `ok:true`.
- The only SSH host configured locally is `farpy` / `farpy.com` at `95.217.226.184`.
- `root@farpy.com` is Node A, not PR-003:
  - hostname: `farpy`
  - `farpy-web-render-worker.service`: `inactive`
  - drop-ins: `00-nodea-render-forbidden.conf`, `99-nodea-no-restart.conf`
- `ssh pr-003` fails DNS resolution: `Could not resolve hostname pr-003`.
- Node A worker-disabled policy was preserved. No restart was performed on Node A.
- Source-controlled worker route builder compiles:
  - `python -m py_compile deploy/worker/web-render-http-worker.py`
- Duplicate route pattern scan on the worker source is clean:
  - no `/node/v1/web-render/node/v1`
  - no `/node/v1/web-render/web-render`

### Route proof

The patched source-controlled worker resolves routes as:

```text
worker/claim => https://farpy.com/node/v1/web-render/worker/claim
worker/jobs/JOB-X/complete => https://farpy.com/node/v1/web-render/worker/jobs/JOB-X/complete
worker/jobs/JOB-X/fail => https://farpy.com/node/v1/web-render/worker/jobs/JOB-X/fail
/node/v1/worker/jobs/JOB-X/input => https://farpy.com/node/v1/web-render/worker/jobs/JOB-X/input
/node/v1/web-render/worker/claim => https://farpy.com/node/v1/web-render/worker/claim
```

### Deployment blocker

The correct PR-003 SSH target was not available from this workstation. Deploying to `root@farpy.com` would touch Node A, which is explicitly render-disabled and must not be restarted for this milestone.

Required operator input to finish production deployment:

- SSH host/IP/alias for PR-003
- confirmation that `farpy-web-render-worker.service` on that host is the active Octane worker service

### Commands run this pass

```powershell
rg -n "PR-003|pr-003|farpy-web-render-worker|web-render-http-worker|Node C|Node A|worker-disabled|135\.181|farpy-node" "C:\Users\danki\Desktop\farpy-frontend\release" "C:\Users\danki\Desktop\farpy-frontend\docs" "C:\Users\danki\Desktop\farpy-frontend\infra" "C:\Users\danki\Desktop\farpy-frontend\deploy"
Get-Content -LiteralPath "$env:USERPROFILE\.ssh\config" -ErrorAction SilentlyContinue | Select-String -Pattern 'Host |HostName|User ' -Context 0,2
ssh root@farpy.com "printf 'HOST='; hostname; printf 'IP='; hostname -I | awk '{print $1}'; systemctl is-active farpy-web-render-worker.service || true; systemctl show farpy-web-render-worker.service -p FragmentPath -p DropInPaths -p ExecStart -p ActiveState -p SubState --no-pager | sed -E 's/(TOKEN|SECRET|KEY)=[^ ]+/\1=REDACTED/g'; journalctl -u farpy-web-render-worker.service -n 40 --no-pager | sed -E 's/(token|secret|key|Authorization|Bearer)[^ ]*/\1=REDACTED/Ig'"
ssh -o BatchMode=yes -o ConnectTimeout=8 pr-003 "hostname; systemctl is-active farpy-web-render-worker.service || true"
python -m py_compile 'C:\Users\danki\Desktop\farpy-frontend\deploy\worker\web-render-http-worker.py'
Invoke-WebRequest -Uri 'https://farpy.com/node/v1/web-render/health' -UseBasicParsing -TimeoutSec 15
```

Status: YELLOW - local/source fix complete, production claim proof requires operator-approved live claim.

## Goal

Fix Octane HTTP worker URL construction so worker endpoints resolve through one canonical `API_BASE` route format instead of producing duplicated paths such as:

`https://farpy.com/node/v1/web-render/node/v1/worker/claim`

## Files changed

- `deploy/worker/web-render-http-worker.py`

## Exact change

Added a source-controlled copy of the production PR-003 Octane HTTP worker and changed `api_url(path)` so it:

- keeps full `http://` and `https://` URLs unchanged
- joins endpoint routes only through `API_BASE`
- strips legacy `/node/v1/web-render/` and `/node/v1/` prefixes from endpoint paths before joining
- resolves `claim`, `complete`, `fail`, and `input/download` routes through the same builder

Verified route builder outputs:

```text
worker/claim => https://farpy.com/node/v1/web-render/worker/claim
worker/jobs/JOB-X/complete => https://farpy.com/node/v1/web-render/worker/jobs/JOB-X/complete
worker/jobs/JOB-X/fail => https://farpy.com/node/v1/web-render/worker/jobs/JOB-X/fail
/node/v1/worker/jobs/JOB-X/input => https://farpy.com/node/v1/web-render/worker/jobs/JOB-X/input
/node/v1/web-render/worker/claim => https://farpy.com/node/v1/web-render/worker/claim
URL_BUILDER_PASS
```

No duplicate `/node/v1/web-render/node/v1/` or `/node/v1/web-render/web-render/` paths are produced by the updated builder.

## Commands run

```powershell
rg -n "API_BASE|WEB_RENDER_API|worker/claim|worker/jobs|complete|fail|download|node/v1" "C:\Users\danki\Desktop\farpy-frontend\scripts" "C:\Users\danki\Desktop\farpy-frontend\release"
ssh root@farpy.com "python3 -m py_compile /opt/farpy-node/web-render-http-worker.py && grep -nE 'API_BASE|WEB_RENDER_API|worker/claim|worker/jobs|complete|fail|download|node/v1|def .*url|url =' /opt/farpy-node/web-render-http-worker.py | sed -n '1,220p'"
Select-String -Path 'C:\Users\danki\Desktop\farpy-frontend\scripts\job-api.mjs' -Pattern 'workerClaimMatch|workerCompleteMatch|workerFailMatch|workerInputMatch|workerDownload|worker/claim|worker/jobs|/node/v1/worker|/worker/' -Context 2,4
scp root@farpy.com:/opt/farpy-node/web-render-http-worker.py 'C:\Users\danki\Desktop\farpy-frontend\deploy\worker\web-render-http-worker.py'
python -m py_compile 'C:\Users\danki\Desktop\farpy-frontend\deploy\worker\web-render-http-worker.py'
node --check 'C:\Users\danki\Desktop\farpy-frontend\scripts\job-api.mjs'
```

Route builder proof:

```powershell
@'
from pathlib import Path
import os, urllib.parse, shutil
text=Path(r'C:\Users\danki\Desktop\farpy-frontend\deploy\worker\web-render-http-worker.py').read_text()
ns={'os': os, 'urllib': urllib, 'Path': Path, 'shutil': shutil}
start=text.index('DEFAULT_API_BASE')
end=text.index('def request_json')
exec(text[start:end], ns)
for route in ['worker/claim','worker/jobs/JOB-X/complete','worker/jobs/JOB-X/fail','/node/v1/worker/jobs/JOB-X/input','/node/v1/web-render/worker/claim']:
    resolved=ns['api_url'](route)
    print(f'{route} => {resolved}')
    if '/node/v1/web-render/node/v1/' in resolved or '/node/v1/web-render/web-render/' in resolved:
        raise SystemExit(f'DUPLICATE_PATH {resolved}')
print('URL_BUILDER_PASS')
'@ | python -
```

## Backend route compatibility

`scripts/job-api.mjs` still exposes canonical backend handlers at:

- `POST /node/v1/worker/claim`
- `GET /node/v1/worker/jobs/:job_id/input`
- `POST /node/v1/worker/jobs/:job_id/complete`
- `POST /node/v1/worker/jobs/:job_id/fail`

Public worker base remains:

- `https://farpy.com/node/v1/web-render`

The updated worker builder maps both legacy backend paths and public namespaced paths to the public worker base.

## Verification status

- Local worker syntax check: PASS
- Backend route file syntax check: PASS
- Non-mutating route-builder proof: PASS
- Live authenticated `claim` proof: BLOCKED by safety. A real authenticated claim can mutate production by claiming an eligible render job.
- Live `complete`/`fail` proof: BLOCKED by safety without an operator-approved disposable claimed job.

## Production deployment

Not deployed in this milestone. Live production patching of `/opt/farpy-node/web-render-http-worker.py` was not performed because Node A is a shared production host and may not be the eligible Octane worker target.

Required operator-approved deployment step:

```bash
backup="/opt/farpy-node/web-render-http-worker.py.bak.OCTANE_ROUTE_FIX_V1.$(date -u +%Y%m%dT%H%M%SZ)"
cp -a /opt/farpy-node/web-render-http-worker.py "$backup"
install -m 0755 deploy/worker/web-render-http-worker.py /opt/farpy-node/web-render-http-worker.py
python3 -m py_compile /opt/farpy-node/web-render-http-worker.py
systemctl restart farpy-web-render-worker.service
```

Run the authenticated claim/complete/fail proof only with a disposable Octane test job or during an operator-approved Octane production pass.
