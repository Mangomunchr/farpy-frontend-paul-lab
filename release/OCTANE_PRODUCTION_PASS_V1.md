# OCTANE_PRODUCTION_PASS_V1

Status: BLOCKED

## Goal

Submit a real Octane package through production, have PR-003 claim it, render it with Octane, upload a ZIP, mint a receipt, download the output, and verify hashes match.

## Result

The production pass was not started because the required Octane render partner is not reachable/online.

Submitting a real paid Octane package while no eligible worker is reachable would likely strand the package in the dispatcher. No customer job was fabricated, no payment was bypassed, and no backend state was mutated.

## Production proof

### Web-render API health

`https://farpy.com/node/v1/web-render/health`

```text
HTTP 200
{"ok":true,"service":"farpy-job-api","ts":"2026-07-02T23:47:59.807Z"}
```

### Worker status

`https://farpy.com/node/v1/web-render/worker/status`

```json
{
  "ok": true,
  "running": false,
  "poll_seconds": 5,
  "processed_jobs": 1,
  "submitted_jobs": 0,
  "running_jobs": 0,
  "queue_cap": 25
}
```

### Node A check

`root@farpy.com` is Node A, not PR-003.

```text
HOST=farpy
IP=95.217.226.184 10.10.20.2
farpy-web-render-api.service: active
farpy-web-render-worker.service: inactive
DropInPaths=/etc/systemd/system/farpy-web-render-worker.service.d/00-nodea-render-forbidden.conf /etc/systemd/system/farpy-web-render-worker.service.d/99-nodea-no-restart.conf
```

Node A worker-disabled policy was preserved. The worker was not restarted.

### PR-003 reachability

```text
ssh: Could not resolve hostname pr-003: No such host is known.
```

## Stage status

| Stage | Status | Evidence |
| --- | --- | --- |
| Production API health | PASS | `/node/v1/web-render/health` returns `200 ok:true` |
| Worker status API | PASS | `/worker/status` returns `200` |
| PR-003 reachable | FAIL | `ssh pr-003` does not resolve |
| PR-003 worker running | FAIL | no reachable PR-003 worker; public status says `running:false` |
| Submit real Octane job | NOT RUN | avoided creating a stuck paid job |
| Claim | NOT RUN | no reachable worker |
| Octane render | NOT RUN | no reachable worker |
| ZIP output | NOT RUN | no render |
| Receipt | NOT RUN | no completed output |
| Download | NOT RUN | no output |
| Hash match | NOT RUN | no output/receipt |

## Commands run

```powershell
ssh root@farpy.com "printf 'HOST='; hostname; printf 'IP='; hostname -I | awk '{print $1}'; systemctl is-active farpy-web-render-api.service || true; systemctl is-active farpy-web-render-worker.service || true; systemctl show farpy-web-render-worker.service -p FragmentPath -p DropInPaths -p ActiveState -p SubState --no-pager | sed -E 's/(TOKEN|SECRET|KEY)=[^ ]+/\1=REDACTED/g'"

Invoke-WebRequest -Uri 'https://farpy.com/node/v1/web-render/health' -UseBasicParsing -TimeoutSec 15

Invoke-WebRequest -Uri 'https://farpy.com/node/v1/web-render/worker/status' -UseBasicParsing -TimeoutSec 15

ssh -o BatchMode=yes -o ConnectTimeout=8 pr-003 "hostname; systemctl is-active farpy-web-render-worker.service || true"
```

## Blocker

PR-003 host access is missing from this environment.

Required input:

- actual PR-003 SSH host/IP/alias
- confirmation that `farpy-web-render-worker.service` on that host is the active Octane HTTP worker
- Octane binary/license already configured on that host

## Safe next action

1. Provide the PR-003 SSH target.
2. Deploy `deploy/worker/web-render-http-worker.py` from `OCTANE_ROUTE_FIX_V1` to that host.
3. Restart `farpy-web-render-worker.service` on PR-003 only.
4. Verify worker logs show canonical URLs without `/node/v1/web-render/node/v1`.
5. Then submit one real Octane package and complete the production pass.

OCTANE_PRODUCTION_PASS_V1 = BLOCKED

## 2026-07-02 Retry

Status remains: BLOCKED.

The worker route source fix is ready in:

- `deploy/worker/web-render-http-worker.py`

Fresh PR-003 access probes:

```text
local ssh config: only Host farpy -> 95.217.226.184
ssh pr-003: Could not resolve hostname pr-003
ssh root@65.21.126.117: Connection timed out
ssh root@10.10.50.15: Permission denied locally; timed out via Node A
ssh root@10.10.50.14: Permission denied locally; timed out via Node A
ssh root@10.10.2.14: Connection timed out
```

Node A remains correctly render-disabled:

```text
farpy-web-render-worker.service: inactive
DropInPaths:
  /etc/systemd/system/farpy-web-render-worker.service.d/00-nodea-render-forbidden.conf
  /etc/systemd/system/farpy-web-render-worker.service.d/99-nodea-no-restart.conf
```

No Octane job was submitted because the patched worker could not be deployed/restarted on PR-003 from this environment.

Required to finish:

1. Provide reachable PR-003 SSH target and accepted user/key path.
2. Deploy `deploy/worker/web-render-http-worker.py` to `/opt/farpy-node/web-render-http-worker.py` on PR-003.
3. Restart `farpy-web-render-worker.service` on PR-003.
4. Confirm claim no longer returns 404.
5. Submit one disposable Octane package and stop after first successful production render.
