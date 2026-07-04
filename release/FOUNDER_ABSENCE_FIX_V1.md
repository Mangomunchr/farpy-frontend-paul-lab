# FOUNDER_ABSENCE_FIX_V1

Date: 2026-06-30
Production URL: https://farpy.com
Objective: resolve only RED findings from `FOUNDER_ABSENCE_AUDIT_V1`.

## Status

PARTIAL / BLOCKED.

Founder-absence readiness improved operationally, but the acceptance target is not fully met because current production data has not been pushed off-host. The configured offsite destination is reachable, but transmitting live uploads, outputs, receipts, and wallet/job data to the storagebox requires explicit operator approval because it exports production customer data off the primary host.

Current verdict remains RED for full-host-loss recovery until current-data offsite backup is completed and restore-tested from that offsite copy. If operator approves the offsite transfer, the next command is the existing configured transport:

```bash
/opt/farpy/bin/farpy-offsite-sshfs-rsync
```

## Fixes Completed

### 1. Current production backup proof created

Created current-data backup source at:

```text
/var/backups/farpy/current-data-20260630T102558Z
```

Included:

```text
/var/lib/farpy-web-render
/var/lib/farpy
```

Artifacts:

```text
/var/backups/farpy/current-data-20260630T102558Z/farpy-web-render.tar.gz
/var/backups/farpy/current-data-20260630T102558Z/farpy-web-render.tar.gz.sha256
/var/backups/farpy/current-data-20260630T102558Z/farpy.tar.gz
/var/backups/farpy/current-data-20260630T102558Z/farpy.tar.gz.sha256
```

Checksum proof:

```text
/var/backups/farpy/current-data-20260630T102558Z/farpy.tar.gz: OK
/var/backups/farpy/current-data-20260630T102558Z/farpy-web-render.tar.gz: OK
```

Approximate artifact sizes:

```text
farpy-web-render.tar.gz 1.2G
farpy.tar.gz 82M
```

### 2. Local restore proof created

Restore target:

```text
/tmp/farpy-restore-proof/current-data-20260630T102558Z
```

Restore proof:

```text
restored file count: 3821
farpy-web-render restored file count: 3375
farpy restored file count: 446
```

Sample restored source paths prove uploads are inside the backup:

```text
farpy-web-render/uploads/UP-ED0FD30F.blend
farpy-web-render/uploads/UP-1BADB56D.orbx
farpy-web-render/uploads/UP-6DB3DD22.blend
```

This proves a local same-host restore from the backup artifact. It does not prove full-host-loss recovery until the same artifact exists off-host and can be restored from off-host storage.

### 3. Offsite destination reachability checked

Configured offsite transport:

```text
/etc/cron.d/farpy-offsite-backup
/opt/farpy/bin/farpy-offsite-sshfs-rsync
```

Configured destination:

```text
u502913@u502913.your-storagebox.de
port 23
key /root/.ssh/id_farpy
```

Read-only connectivity proof:

```text
ssh to storagebox succeeded
remote pwd: /home
```

Current blocker:

```text
The live current-data backup has not been transmitted off-host because the action exports production uploads, outputs, receipts, and wallet/job data to the storagebox and requires explicit operator approval.
```

### 4. Monitoring repaired / retired

Backed up monitoring scripts and units before changes under:

```text
/root/founder-absence-monitor-backup-20260630T103150Z
/root/founder-absence-monitor-backup-20260630T103206Z
```

Repaired:

```text
/root/farpy-synthetic-monitor.sh
```

The synthetic monitor now checks current launch routes:

```text
https://farpy.com/
https://farpy.com/signin
https://farpy.com/account
https://farpy.com/workspace
https://farpy.com/topup
https://farpy.com/status
https://farpy.com/downloads
https://farpy.com/receipt
https://api.farpy.com/healthz
https://api.farpy.com/readyz
```

Proof:

```text
SYNTHETIC_MONITOR:PASS
farpy-synthetic-monitor.service: status=0/SUCCESS
```

Retired obsolete/stale guard timers:

```text
farpy-supergreen-guard.timer
farpy-footer-guard.timer
farpy-nodemuncher-receipt-verify.timer
```

Reason:

- `farpy-supergreen-guard` checked old launch copy and proof/feed assumptions.
- `farpy-footer-guard` checked obsolete footer token expectations.
- `farpy-nodemuncher-receipt-verify` checked a historical private NodeMuncher artifact path that no longer exists.

Final monitoring proof:

```text
systemctl --failed --no-pager
0 loaded units listed.
```

Remaining active timer from this set:

```text
farpy-synthetic-monitor.timer -> farpy-synthetic-monitor.service
```

### 5. Core service health verified

Proof:

```text
caddy active
farpy-auth active
farpy-checkout-api active
farpy-stripe-webhook active
farpy-topup active
farpy-web-render-api active
farpy-jobs-api active
farpy-upload-api active
farpy-leaderboard active
```

## Items Not Fully Resolved

### Off-host backup proof

Status: BLOCKED.

The storagebox is reachable, and current backup artifacts exist locally, but current data has not been pushed off-host in this run. Explicit operator approval is required before exporting live production data.

Required next proof after approval:

```bash
/opt/farpy/bin/farpy-offsite-sshfs-rsync
ssh -p 23 -i /root/.ssh/id_farpy u502913@u502913.your-storagebox.de '<list current-data backup artifact>'
restore current-data tarballs from storagebox into /tmp/farpy-restore-proof-offsite/<timestamp>
sha256sum -c *.sha256
```

### Full restore from offsite backup

Status: BLOCKED by offsite transfer.

Same-host restore proof exists. Full-host-loss recovery remains unproven until the backup is restored from offsite storage.

### Domain auto-renew / registrar

Status: NOT PROVEN.

TLS certs were previously verified as valid beyond the next 30 days, but domain registrar, expiration, and auto-renew evidence were not captured in this fix run. RDAP parsing did not return usable fields from the local probe.

Required recovery contact:

```text
Domain registrar/DNS administrator with access to farpy.com registration, nameservers, billing, and auto-renew settings.
```

### Stripe access recovery

Status: NOT PROVEN.

Runtime routes remain healthy/fail-closed, but non-founder Stripe dashboard/API/webhook recovery access was not proven.

Required recovery contact:

```text
Stripe administrator with access to checkout, webhook delivery, refunds, disputes, payout/bank status, and API key rotation.
```

### BTCPay access recovery

Status: NOT PROVEN.

Webhook fail-closed behavior is already hardened from prior work, but non-founder BTCPay admin access and host access were not proven in this fix run.

Required recovery contact:

```text
BTCPay/Node C administrator with access to store, API keys, webhook settings, Bitcoin node, Lightning node, and reverse proxy configuration.
```

### Alert delivery to additional operator

Status: NOT PROVEN.

The repaired synthetic monitor produces pass/fail state in logs and systemd, but delivery to a second human operator was not proven.

Required recovery contact:

```text
At least one non-founder operator receiving production alerts by email, SMS, pager, or chat, with confirmed access to the ops runbook.
```

## Recovery Runbook

### Health check

```bash
systemctl --failed --no-pager
systemctl is-active caddy farpy-auth farpy-checkout-api farpy-stripe-webhook farpy-topup farpy-web-render-api farpy-jobs-api farpy-upload-api farpy-leaderboard
/root/farpy-synthetic-monitor.sh
df -hT
df -ih
```

### Static site / Caddy recovery

```bash
caddy validate --config /etc/caddy/Caddyfile
systemctl restart caddy
systemctl status caddy --no-pager -l
curl -I https://farpy.com/
```

### Current data backup

```bash
TS=$(date -u +%Y%m%dT%H%M%SZ)
BASE=/var/backups/farpy/current-data-$TS
mkdir -p "$BASE"
tar --warning=no-file-changed --one-file-system -czf "$BASE/farpy-web-render.tar.gz" -C /var/lib farpy-web-render
tar --warning=no-file-changed --one-file-system -czf "$BASE/farpy.tar.gz" -C /var/lib farpy
sha256sum "$BASE"/*.tar.gz > "$BASE/SHA256SUMS"
```

### Same-host restore proof

```bash
BASE=/var/backups/farpy/current-data-20260630T102558Z
RESTORE=/tmp/farpy-restore-proof/$(basename "$BASE")
mkdir -p "$RESTORE"
tar -xzf "$BASE/farpy-web-render.tar.gz" -C "$RESTORE"
tar -xzf "$BASE/farpy.tar.gz" -C "$RESTORE"
sha256sum -c "$BASE"/*.sha256
find "$RESTORE" -type f | wc -l
```

### Offsite backup transport

Requires explicit operator approval because it exports live production data.

```bash
/opt/farpy/bin/farpy-offsite-sshfs-rsync
```

### Monitor repair rollback

Backups are under:

```text
/root/founder-absence-monitor-backup-20260630T103150Z
/root/founder-absence-monitor-backup-20260630T103206Z
```

Restore example:

```bash
cp -a /root/founder-absence-monitor-backup-20260630T103206Z/farpy-synthetic-monitor.sh /root/farpy-synthetic-monitor.sh
systemctl daemon-reload
systemctl restart farpy-synthetic-monitor.service
```

Retired guard timers can be re-enabled if their checks are updated to current product truth:

```bash
systemctl enable --now farpy-supergreen-guard.timer
systemctl enable --now farpy-footer-guard.timer
systemctl enable --now farpy-nodemuncher-receipt-verify.timer
```

Do not re-enable them without updating stale checks; they were producing false production-degraded state.

## Commands Run

```powershell
ssh root@farpy.com 'grep -R . /etc/cron.d/farpy-backup-lite /etc/cron.d/farpy-backups /etc/cron.d/farpy-offsite-backup'
ssh root@farpy.com 'sed -n "1,180p" /root/farpy-backup-lite-v1.sh'
ssh root@farpy.com 'sed -n "1,220p" /opt/farpy/bin/farpy-offsite-sshfs-rsync'
ssh root@farpy.com '<create current-data tarballs under /var/backups/farpy/current-data-20260630T102558Z>'
ssh root@farpy.com 'sha256sum -c /var/backups/farpy/current-data-20260630T102558Z/*.sha256'
ssh root@farpy.com '<restore tarballs under /tmp/farpy-restore-proof/current-data-20260630T102558Z>'
ssh root@farpy.com 'ssh -p 23 -i /root/.ssh/id_farpy -o BatchMode=yes u502913@u502913.your-storagebox.de pwd'
scp C:\tmp\farpy-synthetic-monitor.sh root@farpy.com:/root/farpy-synthetic-monitor.sh
ssh root@farpy.com 'bash -n /root/farpy-synthetic-monitor.sh; /root/farpy-synthetic-monitor.sh; systemctl restart farpy-synthetic-monitor.service'
ssh root@farpy.com 'systemctl disable --now farpy-supergreen-guard.timer farpy-footer-guard.timer farpy-nodemuncher-receipt-verify.timer'
ssh root@farpy.com 'systemctl --failed --no-pager'
ssh root@farpy.com 'systemctl is-active caddy farpy-auth farpy-checkout-api farpy-stripe-webhook farpy-topup farpy-web-render-api farpy-jobs-api farpy-upload-api farpy-leaderboard'
```

## Final Verdict

Founder-absence verdict: RED -> PARTIAL, still RED for full-host-loss recovery.

Operational readiness improved:

- current data backup artifacts exist
- same-host restore proof exists
- synthetic monitor is repaired and green
- obsolete failed guard timers are retired
- systemd failed state is clean
- core services are active
- offsite storagebox is reachable

Still blocking YELLOW:

- current-data offsite backup not pushed due required explicit operator approval
- offsite restore proof not performed
- domain registrar/auto-renew not proven
- Stripe/BTCPay non-founder recovery access not proven
- alert delivery to an additional operator not proven

Next required operator action:

Explicitly approve offsite transfer of `/var/backups/farpy/current-data-20260630T102558Z` to the configured storagebox, then run the offsite restore proof.
