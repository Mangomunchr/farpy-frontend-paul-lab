# DISASTER_RECOVERY_AUDIT_V1

Date: 2026-06-30
Mode: read-only audit, production inspected, no production changes made.

## Verdict

Status: YELLOW / PARTIAL RECOVERABILITY

Short answer: Farpy can likely recover from a bad deploy, failed service, broken Caddy config, or missed webhook. Farpy is not yet proven recoverable from total production host or disk loss because current customer state, render inputs, outputs, receipts, and wallet ledgers were not found in a current off-host backup.

## Evidence Summary

Production host observed: `farpy`.

Current live roots found:

- Static site: `/opt/farpy.com/out` approx 30M.
- Web render state: `/var/lib/farpy-web-render` approx 1.3G.
- Legacy/app state: `/var/lib/farpy` approx 225M.
- Web render code: `/opt/farpy-web-render`.
- Node/worker code: `/opt/farpy-node`.
- Caddy config: `/etc/caddy`.
- Secret/config envs: `/etc/farpy`.
- Systemd units/drop-ins: `/etc/systemd/system`.

Live web-render data counts observed:

- jobs: 99 files
- uploads: 92 files
- outputs: 46 files
- receipts: 47 files
- wallet ledgers: 5 files
- Stripe event records: 6 files
- BTCPay event records: 1 file
- recovery records: 5 files
- work files: 143 files

Additional `/var/lib/farpy` state observed:

- auth files: 774
- job files: 1133
- inputs: 53
- receipts: 101
- Stripe files: 46
- BTCPay files: 19
- ledger directory: approx 22M
- inputs directory: approx 136M

Backup evidence found:

- `/backup/code/farpy-code-YYYYMMDD.tar.gz` exists through 2026-04-01.
- `/backup/config/farpy-config-YYYYMMDD.tar.gz` exists through 2026-04-01.
- `/backup/db/farpy-YYYYMMDD.sql.gz` exists through 2026-04-04, but files after 2026-04-01 were 20 bytes in the listing and are suspect.
- Many Caddy same-host config backups exist under `/etc/caddy`.
- No `release/BACKUP_RESTORE_PROOF_V1.md` was found.
- No current dated backup archive for `/var/lib/farpy-web-render` was found during this audit.
- No off-host backup destination/proof was found during this audit.

Health evidence:

- `caddy validate --config /etc/caddy/Caddyfile` returned `Valid configuration`.
- `https://farpy.com/` returned OK during production probe.
- `https://api.farpy.com/healthz` returned OK during production probe.
- `https://farpy.com/node/v1/leaderboard/stats` returned OK during production probe.

Risk note:

- `/opt/farpy.com/out` is currently `drwxrwxrwx`. This is not a direct disaster recovery blocker, but it is an avoidable integrity risk for the public static root and should be tightened after launch freeze.

## Recovery Matrix

| Area | Source of Truth | Recoverable Today? | Evidence | Gap |
| --- | --- | --- | --- | --- |
| Database/auth/account | `/var/lib/farpy`, SQLite/JSONL stores | Partially | live files exist; old DB backups exist through Apr 2026 | no current/off-host backup proof |
| Wallet | `/var/lib/farpy-web-render/wallet`, `/var/lib/farpy/ledger`, topup/Stripe records | Not proven after host loss | wallet files exist live | no current/off-host wallet ledger backup proof |
| Receipts | `/var/lib/farpy-web-render/receipts`, `/var/lib/farpy/receipts` | Not proven after host loss | receipt files exist live | no current/off-host receipt backup proof |
| Uploads | `/var/lib/farpy-web-render/uploads`, `/var/lib/farpy/inputs` | Not proven after host loss | 92 uploads, 53 inputs observed | no current/off-host artifact backup proof |
| Downloads/outputs | `/var/lib/farpy-web-render/outputs`, public output aliases | Not proven after host loss | 46 outputs observed | no current/off-host output backup proof |
| Workers | `/opt/farpy-node`, systemd worker units/env, remote PR node | Partially | control-plane worker files exist | remote GPU node full restore/access not proven in this audit |
| Caddy | `/etc/caddy/Caddyfile`, `caddy.real.json`, backups | Yes for config rollback on same host | many same-host Caddy backups; validation passes | off-host config backup currentness not proven |
| Systemd | `/etc/systemd/system/*farpy*` and drop-ins | Partially | active unit paths known | no current systemd archive/restore proof |
| Stripe | Stripe Dashboard + `/etc/farpy/stripe.env` + event records | Partially | env import and event dirs exist | requires Stripe access; webhook replay/reconciliation procedure must be run manually |
| BTCPay | `/etc/farpy/btcpay.env` + event records + BTCPay host | Partially | env and event dir exist | Lightning disabled/gated; BTCPay host recovery not proven here |
| Backups | `/backup`, `/var/backups`, Caddy local backups | Weak for full DR | old code/config/db archives found | no current/off-host backup proof for live customer data |

## Exact Recovery Order

### 0. Freeze writes if original host is still alive

Use this when recovering from corruption, bad deploy, or partial failure.

```bash
systemctl stop farpy-web-render-api.service farpy-jobs-api.service farpy-stripe-webhook.service farpy-node-api.service farpy-node-pair.service farpy-checkout-api.service farpy-topup.service farpy-submitd.service
systemctl stop farpy-web-render-worker.service 2>/dev/null || true
```

Do not stop Caddy until a maintenance page or alternate health response is ready.

### 1. Snapshot live state before touching it

```bash
stamp=$(date -u +%Y%m%dT%H%M%SZ)
mkdir -p /var/backups/farpy-dr-$stamp

tar --xattrs --acls -czf /var/backups/farpy-dr-$stamp/etc-farpy.tgz /etc/farpy
tar --xattrs --acls -czf /var/backups/farpy-dr-$stamp/etc-caddy.tgz /etc/caddy
tar --xattrs --acls -czf /var/backups/farpy-dr-$stamp/systemd-farpy.tgz /etc/systemd/system
tar --xattrs --acls -czf /var/backups/farpy-dr-$stamp/opt-farpy-web-render.tgz /opt/farpy-web-render
tar --xattrs --acls -czf /var/backups/farpy-dr-$stamp/opt-farpy-node.tgz /opt/farpy-node
tar --xattrs --acls -czf /var/backups/farpy-dr-$stamp/opt-farpy-com-out.tgz /opt/farpy.com/out
tar --xattrs --acls -czf /var/backups/farpy-dr-$stamp/var-lib-farpy-web-render.tgz /var/lib/farpy-web-render
tar --xattrs --acls -czf /var/backups/farpy-dr-$stamp/var-lib-farpy.tgz /var/lib/farpy
sha256sum /var/backups/farpy-dr-$stamp/*.tgz > /var/backups/farpy-dr-$stamp/SHA256SUMS
```

Required but not proven today: copy this backup set off-host.

```bash
rsync -aH --numeric-ids /var/backups/farpy-dr-$stamp/ BACKUP_USER@BACKUP_HOST:/farpy-dr/$stamp/
```

### 2. Provision replacement host

Install required platform packages before restore:

```bash
apt-get update
apt-get install -y caddy nodejs npm python3 python3-venv unzip jq curl rsync
```

Install Blender/Octane only where appropriate:

- Control plane: Blender only if local Blender rendering remains enabled.
- Remote GPU worker: Octane binary/license and Blender as needed.

### 3. Restore configuration and secrets

```bash
tar --xattrs --acls -xzf etc-farpy.tgz -C /
tar --xattrs --acls -xzf etc-caddy.tgz -C /
tar --xattrs --acls -xzf systemd-farpy.tgz -C /

chown -R root:root /etc/farpy
chmod 700 /etc/farpy
find /etc/farpy -type f -name '*.env' -exec chmod 600 {} \;
```

Validate Caddy before starting:

```bash
caddy validate --config /etc/caddy/Caddyfile
```

### 4. Restore code/static/runtime state

```bash
tar --xattrs --acls -xzf opt-farpy-web-render.tgz -C /
tar --xattrs --acls -xzf opt-farpy-node.tgz -C /
tar --xattrs --acls -xzf opt-farpy-com-out.tgz -C /
tar --xattrs --acls -xzf var-lib-farpy-web-render.tgz -C /
tar --xattrs --acls -xzf var-lib-farpy.tgz -C /

chown -R root:root /opt/farpy-web-render /opt/farpy-node /opt/farpy.com/out
chmod -R go-w /opt/farpy.com/out
```

Note: `chmod -R go-w /opt/farpy.com/out` fixes the observed world-writable static root during restore.

### 5. Restore/enable services

```bash
systemctl daemon-reload
systemctl enable --now caddy
systemctl enable --now farpy-auth.service farpy-balance.service farpy-checkout-api.service farpy-stripe-webhook.service farpy-jobs-api.service farpy-web-render-api.service farpy-node-api.service farpy-node-pair.service farpy-leaderboard.service
systemctl restart caddy farpy-auth.service farpy-balance.service farpy-checkout-api.service farpy-stripe-webhook.service farpy-jobs-api.service farpy-web-render-api.service farpy-node-api.service farpy-node-pair.service farpy-leaderboard.service
```

Then check:

```bash
systemctl --failed
systemctl status caddy farpy-web-render-api.service farpy-jobs-api.service farpy-stripe-webhook.service --no-pager
curl -fsS https://farpy.com/ >/dev/null
curl -fsS https://api.farpy.com/healthz >/dev/null
curl -fsS https://farpy.com/node/v1/leaderboard/stats >/dev/null
```

### 6. Stripe recovery

Required inputs:

- Stripe Dashboard access.
- Current webhook signing secret in `/etc/farpy/stripe.env`.
- Service health for `farpy-stripe-webhook.service`.
- Reconcile script: `scripts/reconcile-stripe-web-render-session.mjs` in repo.

Recovery steps:

```bash
systemctl status farpy-stripe-webhook.service --no-pager
journalctl -u farpy-stripe-webhook.service -n 200 --no-pager
```

For missed checkout/webhook sessions, replay in Stripe Dashboard or run the existing reconciliation script with redacted env loaded. Do not manually credit wallets unless the Stripe event and Farpy wallet ledger are reconciled and the operation is written as a normal wallet event.

### 7. Wallet recovery

Authoritative paths to restore together:

- `/var/lib/farpy-web-render/wallet`
- `/var/lib/farpy-web-render/stripe-events`
- `/var/lib/farpy-web-render/btcpay-events`
- `/var/lib/farpy/ledger`
- `/var/lib/farpy/topups*`
- `/var/lib/farpy/stripe`
- `/var/lib/farpy/btcpay`

Verification:

```bash
find /var/lib/farpy-web-render/wallet -type f | wc -l
find /var/lib/farpy-web-render/stripe-events -type f | wc -l
find /var/lib/farpy-web-render/btcpay-events -type f | wc -l
```

Then use account UI and authenticated `/account` checks to verify balances and history. Never reconstruct balances from memory; replay or restore ledger entries.

### 8. Job, upload, receipt, and download recovery

Restore these as a consistent set:

- `/var/lib/farpy-web-render/jobs`
- `/var/lib/farpy-web-render/uploads`
- `/var/lib/farpy-web-render/outputs`
- `/var/lib/farpy-web-render/receipts`
- `/var/lib/farpy-web-render/work`
- `/var/lib/farpy-web-render/recovery`

Integrity checks:

```bash
find /var/lib/farpy-web-render/jobs -type f | wc -l
find /var/lib/farpy-web-render/uploads -type f | wc -l
find /var/lib/farpy-web-render/outputs -type f | wc -l
find /var/lib/farpy-web-render/receipts -type f | wc -l
```

For a completed job, verify:

- job JSON exists
- receipt JSON exists
- output ZIP exists
- receipt output SHA matches ZIP SHA or documented output member SHA, depending on receipt schema
- download URL returns non-empty file for the owner/tokenized route
- receipt URL returns 200 for owner/tokenized route

### 9. Worker recovery

Control-plane worker/code paths:

- `/opt/farpy-node/web-render-http-worker.py`
- `/opt/farpy-node/systemd/farpy-web-render-worker.service`
- `/opt/farpy-web-render/scripts/render-worker.mjs`

Remote Octane worker must be restored separately on the GPU node. Known requirement from prior Octane smoke: the worker must run as the GPU-node user, not root, and the Octane command/license must be valid on that node.

Verification sequence:

```bash
python3 -m py_compile /opt/farpy-node/web-render-http-worker.py
systemctl daemon-reload
systemctl status farpy-web-render-worker.service --no-pager
journalctl -u farpy-web-render-worker.service -n 100 --no-pager
```

Then submit a private still smoke before re-opening public Octane traffic.

### 10. Caddy recovery

Current config validates. Restore and validate before reload:

```bash
caddy validate --config /etc/caddy/Caddyfile
systemctl reload caddy
curl -I https://farpy.com/
curl -I https://farpy.com/downloads
curl -I https://farpy.com/status
curl -I https://api.farpy.com/healthz
```

Rollback to a same-host backup if Caddy breaks:

```bash
cp -a /etc/caddy/Caddyfile.bak.<known-good> /etc/caddy/Caddyfile
caddy validate --config /etc/caddy/Caddyfile
systemctl reload caddy
```

## What Fails If Production Fully Dies Today

If the control-plane host and disk are lost and no newer off-host backup exists:

- Recent wallet balances are not provably recoverable.
- Recent render receipts are not provably recoverable.
- Recent uploaded Blender/Octane source packages are not provably recoverable.
- Recent output ZIP downloads are not provably recoverable.
- Recent node pairing/lease state may not be recoverable.
- Stripe can help identify payments, but it cannot reconstruct render artifacts or Farpy receipt/output hashes.

That is the main disaster recovery blocker.

## P0 Recovery Gaps

1. No current off-host backup proof for `/var/lib/farpy-web-render`.
   - Impact: wallet ledgers, jobs, uploads, outputs, receipts can be lost on host/disk loss.
   - Fix: daily or hourly encrypted off-host backup of `/var/lib/farpy-web-render` with SHA256 manifest and restore proof.

2. No current off-host backup proof for `/var/lib/farpy`.
   - Impact: auth/account/legacy ledger/jobs/input state may be lost on host/disk loss.
   - Fix: include `/var/lib/farpy` in same backup set.

3. No restore proof note exists for the current architecture.
   - Impact: recovery depends on operator memory.
   - Fix: run a non-destructive restore into `/tmp/farpy-restore-proof/<stamp>` and verify checksums.

## P1 Recovery Gaps

1. `/opt/farpy.com/out` is world-writable.
   - Impact: static root integrity risk.
   - Fix: `chmod -R go-w /opt/farpy.com/out` after confirming deploy user needs.

2. Backup set in `/backup` appears stale.
   - Impact: code/config/db archives stop around 2026-04-01 while launch state is 2026-06-30.
   - Fix: revive or replace backup automation.

3. Some services are failed or auto-restarting.
   - Observed failed services include `farpy-footer-guard`, `farpy-nodemuncher-receipt-verify`, `farpy-supergreen-guard`, `farpy-synthetic-monitor`.
   - Impact: not directly DR-blocking, but reduces confidence in automated proof/monitoring.

4. Worker node recovery is not fully proven by this audit.
   - Impact: control plane can recover while Octane capacity remains down.
   - Fix: separate PR GPU node backup and restore checklist.

## P2 Recovery Gaps

1. Many historical Caddy backups are retained in `/etc/caddy`.
   - Impact: operator noise during emergency.
   - Fix: keep last known-good/current backups in a labeled directory and archive the rest.

2. Old DB backup files include 20-byte suspect dumps.
   - Impact: confusing false confidence.
   - Fix: validate backup artifacts after creation.

## Minimum Backup Contract To Become Green

Create one backup job that produces this directory every day at minimum, hourly preferred for wallet/jobs:

```text
/var/backups/farpy-dr-YYYYMMDDTHHMMSSZ/
  etc-farpy.tgz
  etc-caddy.tgz
  systemd-farpy.tgz
  opt-farpy-web-render.tgz
  opt-farpy-node.tgz
  opt-farpy-com-out.tgz
  var-lib-farpy-web-render.tgz
  var-lib-farpy.tgz
  SHA256SUMS
```

Then copy it off-host and prove restore:

```bash
rsync -aH --numeric-ids /var/backups/farpy-dr-$stamp/ BACKUP_USER@BACKUP_HOST:/farpy-dr/$stamp/
mkdir -p /tmp/farpy-restore-proof/$stamp
cd /tmp/farpy-restore-proof/$stamp
for f in /var/backups/farpy-dr-$stamp/*.tgz; do tar -tzf "$f" >/dev/null; done
sha256sum -c /var/backups/farpy-dr-$stamp/SHA256SUMS
```

## Final Answer

Can Farpy recover if production dies?

- Service crash: YES.
- Bad deploy/static rollback: YES.
- Bad Caddy config: YES, with same-host backups.
- Missed Stripe webhook: LIKELY, with Stripe Dashboard/reconciliation.
- Lost worker process: YES for service restart; PARTIAL for remote GPU node replacement.
- Lost production disk/host: NOT PROVEN.

Launch posture: do not claim disaster-recovery readiness until current off-host backups and a restore proof exist for `/var/lib/farpy-web-render` and `/var/lib/farpy`.

## Commands Run

```powershell
Get-ChildItem -LiteralPath 'C:\Users\danki\Desktop\farpy-frontend\release' -Filter *.md | Where-Object { $_.Name -match 'BACKUP|RESTORE|DISASTER|OPERATIONS|FREEZE|DEPLOY|SECURITY|LIGHTNING|NODEMUNCHER' } | Select-Object Name,Length,LastWriteTime
Get-Content -LiteralPath 'C:\Users\danki\Desktop\farpy-frontend\deploy\systemd\farpy-web-render-api.service'
Get-Content -LiteralPath 'C:\Users\danki\Desktop\farpy-frontend\deploy\systemd\farpy-web-render-worker.service'
Select-String -Path 'C:\Users\danki\Desktop\farpy-frontend\scripts\job-api.mjs' -Pattern 'DATA_DIR|UPLOAD|OUTPUT|RECEIPT|WALLET|jobPath|receipt|download|stripe|btcpay' | Select-Object -First 120
ssh root@farpy.com 'echo SERVICES; systemctl list-units --type=service --all --no-pager | grep farpy || true; systemctl list-units --type=service --all --no-pager | grep caddy || true; echo TIMERS; systemctl list-timers --all --no-pager | grep farpy || true; systemctl list-timers --all --no-pager | grep backup || true; systemctl list-timers --all --no-pager | grep funnel || true'
ssh root@farpy.com 'echo BACKUP_FILES; find /backup /var/backups /root/backups -maxdepth 3 -type f -printf "%TY-%Tm-%Td %TH:%TM %s %p\n" 2>/dev/null | sort -r | head -160'
ssh root@farpy.com 'echo DATA_TOP; du -sh /var/lib/farpy-web-render/* /var/lib/farpy/* 2>/dev/null | sort -h | tail -120; echo WEB_RENDER_DIRS; find /var/lib/farpy-web-render -maxdepth 1 -type d -printf "%p\n" | sort; echo FARPY_DIRS; find /var/lib/farpy -maxdepth 1 -type d -printf "%p\n" | sort'
ssh root@farpy.com 'echo SYSTEMD_FILES; find /etc/systemd/system -maxdepth 2 -type f -name "*farpy*" -printf "%p\n" | sort; echo CADDY; ls -la /etc/caddy; echo ETC_FARPY; find /etc/farpy -maxdepth 2 -type f -printf "%m %u:%g %p\n" | sort'
ssh root@farpy.com 'echo BACKUP_DIRS; for p in /backup /var/backups /root/backups /opt/farpy/backups; do echo ---$p; ls -la $p 2>/dev/null | head -80 || true; done'
ssh root@farpy.com 'echo RECENT_BACKUP_NAMES; find /backup /var/backups /root/backups /opt/farpy/backups -maxdepth 4 -print 2>/dev/null | grep -i farpy | head -200'
ssh root@farpy.com 'echo WEB_RENDER_COUNTS; for d in jobs uploads outputs receipts wallet stripe-events btcpay-events nodes recovery work; do p=/var/lib/farpy-web-render/$d; if [ -d $p ]; then printf "%s " $d; find $p -type f 2>/dev/null | wc -l; fi; done; echo FARPY_COUNTS; for d in auth ledger jobs inputs receipts stripe topups btcpay nodemuncher nodes workers; do p=/var/lib/farpy/$d; if [ -d $p ]; then printf "%s " $d; find $p -type f 2>/dev/null | wc -l; fi; done'
ssh root@farpy.com 'echo ACTIVE_SERVICE_FILES; systemctl show farpy-web-render-api.service farpy-jobs-api.service farpy-stripe-webhook.service farpy-node-api.service farpy-node-pair.service farpy-leaderboard.service caddy.service -p FragmentPath -p DropInPaths --no-pager'
ssh root@farpy.com 'echo BACKUP_DB; ls -la /backup/db 2>/dev/null | tail -80; echo BACKUP_CONFIG_LATEST; ls -lt /backup/config 2>/dev/null | head -20; echo BACKUP_CODE_LATEST; ls -lt /backup/code 2>/dev/null | head -20'
ssh root@farpy.com 'echo STATIC_PERMS; ls -ld /opt/farpy.com/out; echo STATIC_SAMPLE; find /opt/farpy.com/out -maxdepth 1 -printf "%m %u:%g %p\n" | head -40; echo OPT_CODE; ls -ld /opt/farpy-web-render /opt/farpy-node /opt/farpy.com/out'
ssh root@farpy.com 'echo CADDY_VALIDATE; caddy validate --config /etc/caddy/Caddyfile 2>&1 | tail -20; echo HEALTH; curl -fsS -m 8 https://farpy.com/ >/dev/null && echo farpy.com_ok || echo farpy.com_fail; curl -fsS -m 8 https://api.farpy.com/healthz >/dev/null && echo api_health_ok || echo api_health_fail; curl -fsS -m 8 https://farpy.com/node/v1/leaderboard/stats >/dev/null && echo leaderboard_ok || echo leaderboard_fail'
```
