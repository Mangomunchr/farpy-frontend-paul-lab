# FOUNDER_ABSENCE_AUDIT_V1

Date: 2026-06-30
Production URL: https://farpy.com
Mode: read-only operational survival audit, except this report file.

## Verdict

RED for founder-absence readiness.

Farpy may continue serving normal traffic for 30 days if no major incident occurs, but it is not founder-independent. The highest-risk gaps are current-data backup/restore proof, failed monitoring services, worker state visibility, offsite backup ambiguity, and undocumented account/renewal access.

## Survival Summary

| Scenario | 30-day survival | Evidence | Risk |
|---|---:|---|---|
| No incident, normal traffic | Likely | Core services active, disk 60%, public routes healthy in prior audits | Depends on no hidden worker/payment failures |
| Static site/Caddy restart | Likely | `caddy.service` active; Caddy config validates | Caddy runs as root; rollback knowledge is founder-heavy |
| Payment route transient failure | Partial | Stripe/topup services active; `/checkout` unauth returns `401 auth_required` | Stripe dashboard/webhook recovery access not proven |
| Worker stall or render partner outage | Weak | worker status returned `running:false` with `running_jobs:1`; failed receipt-verify unit exists | Requires operator diagnosis |
| Disk/log growth incident | Weak | `/var/log` is 19G; logrotate exists but log tree is messy | Alert delivery not proven |
| Production host loss | No | Current web-render data backup/restore proof not found | P0 |
| Domain/TLS issue | Mixed | TLS valid through Aug 2026; domain renewal not proven | Registrar access/renewal unknown |

## P0 Single Points Of Failure

1. Current production data backup coverage is not proven.
   Evidence: backup scripts target old paths and Postgres, while current data lives under `/var/lib/farpy-web-render` and related Farpy JSON/ledger paths. `/var/backups/farpy` was missing during inspection. Backup logs show `pg_dumpall`/`pg_dump` failures because Postgres is not the current data plane.

2. Offsite backup path is ambiguous.
   Evidence: `/etc/cron.d/farpy-offsite-backup` runs `/opt/farpy/bin/farpy-offsite-sshfs-rsync` with source `/var/backups/farpy/`; that source was missing. No mounted sshfs storagebox was observed at inspection time.

3. Restore proof for live wallet/upload/output/receipt data is not proven.
   Evidence: prior restore proof covered representative config/static files, not a full restore of live uploads, outputs, receipts, wallet ledgers, and job state.

4. Monitoring has failed units.
   Evidence: `systemctl --failed` showed `farpy-synthetic-monitor.service`, `farpy-supergreen-guard.service`, `farpy-footer-guard.service`, and `farpy-nodemuncher-receipt-verify.service` failed.

5. Render worker health is not self-healing enough.
   Evidence: `/node/v1/web-render/worker/status` returned `running:false` while reporting `running_jobs:1`. That is a stuck-state smell requiring operator attention.

6. Alert delivery to a non-founder is not proven.
   Evidence: ops/status artifacts exist, but no verified pager/email/Slack route or second operator response path was found.

7. Critical external account access is not proven.
   Evidence: no verified non-founder access/runbook for domain registrar, DNS, Stripe, BTCPay, hosting, storagebox, Google OAuth, or email support/admin accounts.

## P1 Single Points Of Failure

1. TLS is healthy today, but renewal path is split/unclear.
   Evidence: certificates are valid: `farpy.com` until 2026-08-20, `api.farpy.com` until 2026-08-30, `btcpay.farpy.com` until 2026-08-24. Caddy is active and likely manages TLS. However, invoking `certbot` failed with a Python `certifi.core` import error, so any certbot-dependent renewal path is broken.

2. Domain renewal status was not proven.
   Evidence: RDAP/registrar expiry was not captured. Treat domain registrar access and auto-renew as unknown.

3. OS updates are manual.
   Evidence: `unattended-upgrades` is masked/inactive and `apt list --upgradable` counted 253 packages. No reboot was required at inspection time.

4. Cron/timer surface is large and hard to reason about.
   Evidence: many Farpy cron entries and systemd timers exist, including old-path backups, minute-level watchdogs, TTL sweepers, trust monitors, proof generators, stale-job sweepers, and funnel reports. Several scripts reference legacy directories or missing scripts.

5. Logs may grow without clear ownership.
   Evidence: `/var/log` is 19G; `/var/log/farpy` is 1.6G. Large files include `farpy-worker.log` at 141M and old finalize sweep backups at 216M. Repeated `.gz.gz.gz` files indicate logrotate/compression drift.

6. Payment recovery depends on external dashboards and secrets.
   Evidence: Stripe/Card routes fail closed, and BTCPay webhook rejects unsigned requests, but no non-founder dashboard access or recovery runbook was proven.

7. Bitcoin/BTCPay remains operationally complex.
   Evidence: BTCPay invoice and webhook paths are hardened, but Lightning is gated due prior liquidity/channel proof gaps. BTCPay host visibility has previously been a blocker.

8. Render partner access/licensing is a founder-heavy dependency.
   Evidence: Octane PR-003 and NodeMuncher flows were proven historically, but current access, license state, and restart runbooks are not documented as non-founder safe in this audit.

9. Public static root permissions should be reviewed.
   Evidence from prior disaster recovery/security audits: `/opt/farpy.com/out` was observed as broadly writable. If still true, it is not founder-absence safe.

10. Email/support ownership is not proven.
    Evidence: support flows exist, but no proof that another operator can receive, triage, and resolve support without founder access.

## P2 Single Points Of Failure

1. Benchmark and NodeMuncher broad launch remain deferred.
   Impact: not a 30-day Farpy customer-render survival blocker if clearly not promised.

2. PayPal is deferred.
   Impact: not a survival blocker while Card remains primary and Bitcoin is bounded.

3. CSP/rate-limit proof expansion remains deferred.
   Impact: security hardening item, not a demonstrated 30-day outage blocker.

4. EV/macOS signing and public worker auto-update remain deferred.
   Impact: trust/scale blocker for broad worker launch, not immediate Farpy customer render survival.

## Area Audit

### Payments

Current state:
- Card/Stripe route is live and fail-closed: unauthenticated `/checkout` returned `401 auth_required`.
- BTCPay webhook is fail-closed: unsigned webhook returned `400 invalid_signature`.
- BTCPay invoice route did not expose a public success without auth during inspection.

SPOFs:
- Stripe dashboard, webhook secret, API key, dispute/refund access, and payout/banking visibility are not proven accessible to a non-founder.
- BTCPay host/admin access has previously been a blocker.
- Lightning is intentionally gated and should stay hidden until liquidity/channel proof is green.

30-day answer: Card payments likely continue if Stripe/webhook stays healthy. Recovery from payment-provider issues is founder-dependent.

### Workers

Current state:
- Worker/auth endpoints fail closed without tokens.
- Node heartbeat without token returned `403 missing_node_token`.
- Lease peek without token returned `403 forbidden`.

SPOFs:
- Worker status showed `running:false` but `running_jobs:1`.
- Failed receipt verification service exists.
- Remote GPU node access, Octane license, and Blender worker restart runbook are not proven non-founder accessible.

30-day answer: Existing workers may continue, but a stall or license/node issue probably requires founder intervention.

### Uploads

Current state:
- Upload and render data are production-critical under Farpy local state directories.

SPOFs:
- Current upload directory backup is not proven.
- Offsite backup source appears missing or misaligned.
- Restore of uploaded sources was not proven.

30-day answer: Uploads work while host/disk are healthy. Host loss is not survivable from proven evidence.

### Downloads

Current state:
- Download URLs and tokenized outputs have been hardened in prior audits.

SPOFs:
- Output ZIP backup is not proven.
- Disk/log growth can affect output availability.
- Recovery runbook for missing output vs receipt mismatch is not founder-independent.

30-day answer: Downloads likely continue unless disk/state is lost or corrupted.

### Receipts

Current state:
- Receipt-first model exists and previous customer/NodeMuncher smokes reached receipts.

SPOFs:
- `farpy-nodemuncher-receipt-verify.service` is failed.
- Current receipt-store backup and restore are not proven.
- Receipt mismatch alert handling is not proven to reach a non-founder.

30-day answer: Existing receipt creation likely continues, but verification/recovery is weak.

### Renewals

Current state:
- TLS certs are currently valid beyond 30 days from this audit.

SPOFs:
- Domain expiry/registrar auto-renew not proven.
- Caddy-managed TLS likely OK, but certbot path is broken if any route depends on it.
- Payment provider, hosting, DNS, and storagebox billing renewal ownership not proven.

30-day answer: TLS likely survives 30 days. Domain/provider renewal risk is unknown.

### Domains

Current state:
- `farpy.com`, `api.farpy.com`, and `btcpay.farpy.com` are live enough for probes.

SPOFs:
- Registrar/DNS console access not proven.
- DNS change rollback/runbook not proven.

30-day answer: DNS probably stays up if no renewal or provider event occurs. Not founder-independent.

### TLS

Current state:
- Caddy active and config validates.
- Certs valid: `farpy.com` through 2026-08-20, `api.farpy.com` through 2026-08-30, `btcpay.farpy.com` through 2026-08-24.

SPOFs:
- Caddy runs as root.
- Certbot command is broken, though Caddy likely handles active certs.

30-day answer: Good for 30 days, but document exact Caddy renewal ownership.

### Backups

Current state:
- Multiple backup cron jobs exist.
- Some backup roots exist: `/backup`, `/var/backups`, `/home/mangomunchr/backups`.

SPOFs:
- Backup scripts are partly stale and target old app paths/Postgres.
- `/var/backups/farpy` missing while offsite script uses it as source.
- Logs show database backup failures.
- No proof of current uploads/outputs/receipts/wallet restore.

30-day answer: RED. This is the biggest founder-absence risk.

### Monitoring

Current state:
- Status page exists.
- Funnel reports update under `/opt/farpy/reports`.
- Many timers/cron monitors exist.

SPOFs:
- Synthetic monitor and supergreen guard services failed.
- Authenticated ops summary/paging was not proven in this audit.
- No escalation path to a non-founder was proven.

30-day answer: Farpy can observe some data, but it may not alert the right human.

### Alerts

Current state:
- Ops/alert machinery exists from prior work.

SPOFs:
- Failed monitor units undermine alert confidence.
- Alert delivery target and acknowledgment workflow are not proven.
- Some alerts may only live in logs/status pages that require founder checking.

30-day answer: Not no-babysitting ready.

### Disk

Current state:
- Root filesystem: 436G total, 249G used, 166G free, 60% used.
- Inodes: 10% used.

SPOFs:
- `/var/log` is 19G.
- Backup/log sprawl can grow unattended.
- Disk alert delivery not proven.

30-day answer: Probably survives current growth, but no verified alert-to-operator path.

### Logs

Current state:
- Logrotate config exists for many Farpy logs.

SPOFs:
- Log tree contains large files and repeated compressed suffixes.
- Important failures are spread across journald, `/var/log/farpy*`, cron logs, and service-specific logs.
- No one-page log triage runbook found.

30-day answer: Logs will exist, but diagnosing without founder is slow.

### Cron

Current state:
- Root crontab and `/etc/cron.d` contain many Farpy tasks.

SPOFs:
- Several cron jobs point at stale paths or missing scripts.
- Backup cron jobs appear to fail or back up old systems.
- Overlapping monitor/sweeper jobs make side effects hard to reason about.

30-day answer: Cron keeps some housekeeping alive but is brittle and founder-knowledge heavy.

### Updates

Current state:
- No reboot required.

SPOFs:
- `unattended-upgrades` masked/inactive.
- 253 packages upgradable.
- No documented patch owner or 30-day patch policy.

30-day answer: Likely OK for 30 days absent a critical CVE, but not security-mature.

## Required Fixes Before Founder Absence Is Safe

1. Create a real current-data backup set for:
   - `/var/lib/farpy-web-render/uploads`
   - `/var/lib/farpy-web-render/outputs`
   - receipts
   - wallet ledgers
   - job JSON/state
   - Caddy config
   - systemd unit/drop-ins
   - `/etc/farpy` env files, encrypted or access-controlled

2. Fix backup scripts so they target current Farpy paths and stop failing against non-existent Postgres/app paths.

3. Prove a restore into `/tmp/farpy-restore-proof` for live-style uploads, outputs, receipts, wallet events, and job state.

4. Fix failed monitor services or remove them if obsolete:
   - `farpy-synthetic-monitor.service`
   - `farpy-supergreen-guard.service`
   - `farpy-footer-guard.service`
   - `farpy-nodemuncher-receipt-verify.service`

5. Create a non-founder alert route:
   - health RED/YELLOW notification
   - disk >80/90 notification
   - worker stale notification
   - payment webhook failure notification
   - backup failure notification

6. Create break-glass access for a second operator:
   - server SSH
   - DNS/registrar
   - hosting/provider
   - Stripe
   - BTCPay
   - storagebox/offsite backup
   - email/support inbox
   - Google OAuth/admin console

7. Resolve the worker status inconsistency and document the stuck-job recovery command/runbook.

8. Confirm domain auto-renew, payment method, registrar account, and DNS rollback path.

9. Establish OS patching ownership or enable a reviewed unattended security update policy.

10. Reduce cron/timer sprawl into a documented operations map.

## Minimum 30-Day Founder-Absence Runbook

A non-founder operator needs one document with:

1. How to check health:
   - public status URL
   - ops summary URL/token location
   - `systemctl --failed`
   - `df -hT` and `df -ih`

2. How to recover static site/Caddy:
   - config location
   - backup location
   - validate command
   - restart command

3. How to recover render API/jobs:
   - service names
   - logs
   - stuck-job handling
   - worker restart path

4. How to verify money safety:
   - Stripe webhook status
   - wallet ledger location
   - receipt/download proof
   - refund/reversal policy

5. How to restore data:
   - backup source
   - restore target
   - checksum proof
   - final cutover steps

6. How to escalate external providers:
   - DNS/registrar
   - hosting
   - Stripe
   - BTCPay
   - storagebox

## Commands Run

Representative safe/read-only probes used:

```powershell
ssh root@farpy.com "date -u; hostname; df -hT; df -ih; systemctl --failed --no-pager"
ssh root@farpy.com "systemctl list-units --type=service --all --no-pager | grep -i 'farpy\|caddy\|stripe\|btcpay\|worker\|node'"
ssh root@farpy.com "systemctl list-timers --all --no-pager | grep -i 'farpy\|backup\|cert\|logrotate\|monitor'"
ssh root@farpy.com "crontab -l; find /etc/cron.d -maxdepth 1 -type f -print"
ssh root@farpy.com "du -sh /var/log /var/log/farpy /var/lib/farpy-web-render /opt/farpy.com/out /backup /var/backups"
ssh root@farpy.com "caddy validate --config /etc/caddy/Caddyfile"
ssh root@farpy.com "systemctl is-active caddy farpy-checkout-api farpy-stripe-webhook farpy-topup farpy-web-render-api"
ssh root@farpy.com "curl -sS -i -X POST https://farpy.com/checkout -H 'content-type: application/json' --data '{}'"
ssh root@farpy.com "curl -sS -i -X POST https://farpy.com/node/v1/web-render/btcpay/webhook --data '{}'"
ssh root@farpy.com "curl -sS https://farpy.com/node/v1/web-render/worker/status"
ssh root@farpy.com "curl -sS -i -X POST https://api.farpy.com/node/heartbeat --data '{}'"
ssh root@farpy.com "curl -sS -i -X POST https://farpy.com/node/v1/nodemuncher/lease/peek --data '{}'"
ssh root@farpy.com "openssl s_client -servername farpy.com -connect farpy.com:443 </dev/null 2>/dev/null | openssl x509 -noout -subject -issuer -dates"
```

## Final Answer

Would Farpy survive 30 days without the founder?

- If nothing breaks: probably yes.
- If a worker, backup, payment webhook, disk, or provider issue occurs: not reliably.
- If the production host is lost: no proven recovery.

Founder-absence readiness is RED until current-data backups, restore proof, failed monitors, alert delivery, and external account access are fixed.
