# `/etc/farpy` Manifest

Status: production manifest, values redacted.

Purpose: identify what lives under `/etc/farpy`, which services use it, whether it is secret-bearing, and backup priority.

Source: read-only production inventory on 2026-06-30. File contents were not printed.

## Current Permission Status

Latest drift guard status:

```text
/etc/farpy manifest coverage: PASS
/etc/farpy secret permissions: PASS
unsafe_secret_mode_count: 0
```

`ETC_FARPY_PERMISSION_FIX_V1` changed four secret-like files from `0644` to `0600 root:root` without editing file contents or restarting services:

- `/etc/farpy/farpy.env.bak.20251227T145610Z`
- `/etc/farpy/systemd-secret-move-backups-20260628T201245Z/50-worker-token.conf`
- `/etc/farpy/systemd-secret-move-backups-20260628T201245Z/env.conf`
- `/etc/farpy/worker.env.nodeid.1777580359`

The production drift guard currently reports no `/etc/farpy` FAIL rows.

## Backup Priority

| Priority | Meaning |
| --- | --- |
| P0 | Required to restore production identity, auth, payments, wallets, receipts, worker auth, or backups. |
| P1 | Required for monitoring, operations, NodeMuncher control, status, storage, or active service continuity. |
| P2 | Useful config/history/backups; not normally required for first boot restore. |

## Manifest

| Path | Purpose | Owner | Service using it | Secret? | Backup priority |
| --- | --- | --- | --- | --- | --- |
| `/etc/farpy/.env` | General Farpy environment | root:root | Not directly referenced by systemd | yes | P0 |
| `/etc/farpy/BOOT_RECONCILE_OK` | Boot reconcile marker | root:root | Not directly referenced by systemd | no | P2 |
| `/etc/farpy/IMMUTABLE_MANIFEST.json` | Immutable/config integrity manifest | root:root | Not directly referenced by systemd | no | P1 |
| `/etc/farpy/KILL_SWITCH` | Operator kill-switch marker | root:root | Not directly referenced by systemd | unknown | P1 |
| `/etc/farpy/NETWORK_MODE` | Network mode marker | root:root | Not directly referenced by systemd | no | P1 |
| `/etc/farpy/NODE_ROLE` | Node role marker | root:root | Not directly referenced by systemd | no | P1 |
| `/etc/farpy/PAYOUTS_LIVE.ok` | Payout live fuse marker | root:root | payout service drop-ins | no | P2 |
| `/etc/farpy/PAYOUTS_README.txt` | Payout operator note | root:root | Not directly referenced by systemd | no | P2 |
| `/etc/farpy/ROLE` | Host role marker | root:root | Not directly referenced by systemd | no | P1 |
| `/etc/farpy/SYSTEM_STATE.json` | System state marker | root:root | Not directly referenced by systemd | no | P1 |
| `/etc/farpy/accept.env` | Accept service environment | root:root | `farpy-accept.service` | yes | P2 |
| `/etc/farpy/admin.key` | Admin key material | root:root | Not directly referenced by systemd | yes | P0 |
| `/etc/farpy/admin_key` | Admin key material | root:root | Not directly referenced by systemd | yes | P0 |
| `/etc/farpy/agent.env` | Agent/service environment | root:root | Not directly referenced by systemd | yes | P2 |
| `/etc/farpy/alert.env` | Alerting environment | root:root | `farpy-status-watch.service` | yes | P1 |
| `/etc/farpy/analytics-redis.env` | Analytics Redis environment | root:root | Not directly referenced by systemd | yes | P1 |
| `/etc/farpy/api_key.env` | API key environment | root:root | Not directly referenced by systemd | yes | P0 |
| `/etc/farpy/auth-secrets.env` | Auth/session secrets | root:root | `farpy-auth.service.d/90-secret-env.conf` | yes | P0 |
| `/etc/farpy/backup-excludes.txt` | Backup exclusion list | root:root | Not directly referenced by systemd | unknown | P1 |
| `/etc/farpy/backup.env` | Backup runtime config | root:root | `farpy-backup-lean.service` | yes | P0 |
| `/etc/farpy/billing.env` | Billing/payment environment | root:root | Not directly referenced by systemd | yes | P0 |
| `/etc/farpy/btcpay.env` | BTCPay runtime config | root:root | `farpy-jobs-api.service.d/btcpay.conf`; `farpy-web-render-api.service.d/80-btcpay-env.conf` | yes | P0 |
| `/etc/farpy/btcpay.env.bak.20260628T085316Z` | BTCPay env backup | root:root | Not directly referenced by systemd | yes | P1 |
| `/etc/farpy/btcpay.env.bak.public_url_20260629T053043Z` | BTCPay env backup | root:root | Not directly referenced by systemd | yes | P1 |
| `/etc/farpy/bunny.env` | Bunny/storage environment | root:root | `farpy-storage-ttl.service` | yes | P1 |
| `/etc/farpy/dhfm-config.json` | DHFM/config data | root:root | Not directly referenced by systemd | unknown | P2 |
| `/etc/farpy/discord-webhook.env` | Discord webhook/alert config | root:root | Not directly referenced by systemd | yes | P1 |
| `/etc/farpy/dispatcher.env` | Dispatcher env backup/legacy | root:root | `farpy-dispatcher.service.bak` | yes | P2 |
| `/etc/farpy/env` | General Farpy environment | root:root | Not directly referenced by systemd | yes | P0 |
| `/etc/farpy/ezpz_hmac.key` | HMAC key material | root:root | Not directly referenced by systemd | yes | P0 |
| `/etc/farpy/farpy.env` | Farpy PM2/general env | root:root | `pm2-root.service.d/10-farpy-env.conf` | yes | P1 |
| `/etc/farpy/farpy.env.bak.20251227T145610Z` | Farpy env backup | root:root | Not directly referenced by systemd | yes | P2 |
| `/etc/farpy/limits.json` | Runtime limits config | root:root | Not directly referenced by systemd | no | P1 |
| `/etc/farpy/metrics.env` | Metrics environment | root:root | `farpy-observe.service` | yes | P1 |
| `/etc/farpy/nightly.env` | Nightly job environment | root:root | Not directly referenced by systemd | yes | P2 |
| `/etc/farpy/nm-config-gpu0.json` | NodeMuncher GPU0 config | root:root | `farpy-nm-g0.service` | unknown | P1 |
| `/etc/farpy/nm-config-gpu0.json.nofinalize.1777450935` | NodeMuncher GPU0 config backup | root:root | Not directly referenced by systemd | unknown | P2 |
| `/etc/farpy/nm-config-gpu1.json` | NodeMuncher GPU1 config | root:root | `farpy-nm-g1.service`; backup service ref | unknown | P1 |
| `/etc/farpy/nm-config-gpu1.json.nofinalize.1777450935` | NodeMuncher GPU1 config backup | root:root | Not directly referenced by systemd | unknown | P2 |
| `/etc/farpy/nm-metrics.env` | NodeMuncher metrics env | root:root | `caddy.service.d/20-nm-metrics-env.conf` | yes | P1 |
| `/etc/farpy/node.env` | Node environment | root:root | Not directly referenced by systemd | yes | P1 |
| `/etc/farpy/nodemuncher-core.env` | NodeMuncher core env | root:root | `farpy-nodemuncher-core.service`; `farpy-nodemuncher-hmac-rotate.service` | yes | P1 |
| `/etc/farpy/nodemuncher.env` | NodeMuncher/WireGuard env | root:root | `farpy-wg-gateway.service.d/override.conf` | yes | P1 |
| `/etc/farpy/offsite-backup.env` | Offsite backup environment | root:root | `farpy-backups-offsite.service` | yes | P0 |
| `/etc/farpy/offsite-sshfs.env` | Storage Box/SSHFS environment | root:root | `farpy-storagebox.service` | yes | P0 |
| `/etc/farpy/payout-mode` | Payout mode marker | root:root | Not directly referenced by systemd | no | P2 |
| `/etc/farpy/payout.env` | Payout environment | root:root | Not directly referenced by systemd | yes | P2 |
| `/etc/farpy/payouts.env` | Payouts environment | root:root | Not directly referenced by systemd | yes | P2 |
| `/etc/farpy/quarantine.json` | Quarantine config/state | root:root | Not directly referenced by systemd | unknown | P1 |
| `/etc/farpy/secrets.env` | Shared service secrets | root:root | `farpy-node.service.d/override.conf`; `farpy-upload-api.service.d/override.conf` | yes | P0 |
| `/etc/farpy/secrets.env.bak.20260429-124759` | Shared secrets backup | root:root | Not directly referenced by systemd | yes | P1 |
| `/etc/farpy/shards.json` | Shard/config map | root:root | Not directly referenced by systemd | no | P1 |
| `/etc/farpy/slo.policy.json` | SLO policy config | root:root | Not directly referenced by systemd | no | P1 |
| `/etc/farpy/stripe.env` | Stripe API/webhook environment | root:root | `farpy-stripe-webhook.service`; `farpy-web-render-api.service` | yes | P0 |
| `/etc/farpy/stripe.webhook.guard.env` | Stripe webhook guard env | root:root | Not directly referenced by systemd | yes | P0 |
| `/etc/farpy/telemetry.env` | Telemetry environment | root:root | `farpy-telemetry.service` | yes | P1 |
| `/etc/farpy/token` | Generic token file | root:root | Not directly referenced by systemd | yes | P0 |
| `/etc/farpy/trust-metrics.env` | Trust metrics env | root:root | trust metrics services | yes | P1 |
| `/etc/farpy/web-render-api-secrets.env` | Web-render worker/ops auth secrets | root:root | `farpy-web-render-api.service.d/50-worker-token.conf`; `farpy-web-render-api.service.d/70-ops-token.conf` | yes | P0 |
| `/etc/farpy/wg-gateway.env` | WireGuard gateway env | root:root | Not directly referenced by systemd | yes | P1 |
| `/etc/farpy/worker.env` | Worker environment | root:root | Not directly referenced by systemd | yes | P1 |
| `/etc/farpy/worker.env.nodeid.1777580359` | Worker env backup/snapshot | root:root | Not directly referenced by systemd | yes | P2 |
| `/etc/farpy/keys/farpy-receipts-ed25519-20260207.priv.pem` | Receipt signing private key | root:root | Not directly referenced by systemd | yes | P0 |
| `/etc/farpy/keys/node.key` | Node private key | root:root | Not directly referenced by systemd | yes | P0 |
| `/etc/farpy/keys/node.pub` | Node public key | root:root | Not directly referenced by systemd | no | P1 |
| `/etc/farpy/keys/storagebox_ed25519` | Storage Box private SSH key | root:root | Not directly referenced by systemd | yes | P0 |
| `/etc/farpy/keys/storagebox_ed25519.pub` | Storage Box public SSH key | root:root | Not directly referenced by systemd | no | P1 |
| `/etc/farpy/ssh/id_ed25519` | SSH private key | root:root | `farpy-wg-rotate.service` | yes | P0 |
| `/etc/farpy/ssh/id_ed25519.pub` | SSH public key | root:root | Not directly referenced by systemd | no | P1 |
| `/etc/farpy/nodemuncher/config.json` | NodeMuncher config | root:root | `farpy-lease-runner.service` | yes | P1 |
| `/etc/farpy/nodemuncher/config.json.BK.20251224T042124Z` | NodeMuncher config backup | root:root | Not directly referenced by systemd | yes | P2 |
| `/etc/farpy/nodemuncher/config.json.BK.20251224T053800Z` | NodeMuncher config backup | root:root | Not directly referenced by systemd | yes | P2 |
| `/etc/farpy/nodemuncher/config.json.bak.1765668623` | NodeMuncher config backup | root:root | Not directly referenced by systemd | yes | P2 |
| `/etc/farpy/nodemuncher/config.json.bak.1765678945` | NodeMuncher config backup | root:root | Not directly referenced by systemd | yes | P2 |
| `/etc/farpy/systemd-secret-move-backups-20260628T201245Z/50-smtp.conf` | Backup of systemd SMTP drop-in | root:root | Not directly referenced by systemd | yes | P2 |
| `/etc/farpy/systemd-secret-move-backups-20260628T201245Z/50-worker-token.conf` | Backup of worker-token drop-in | root:root | Not directly referenced by systemd | yes | P2 |
| `/etc/farpy/systemd-secret-move-backups-20260628T201245Z/70-ops-token.conf` | Backup of ops-token drop-in | root:root | Not directly referenced by systemd | yes | P2 |
| `/etc/farpy/systemd-secret-move-backups-20260628T201245Z/env.conf` | Backup of systemd env drop-in | root:root | Not directly referenced by systemd | yes | P2 |

## Observations

- Most secret-bearing files are correctly `0600 root:root`.
- Historical backup files with secret-like names are now expected to be `0600 root:root`; drift guard should fail if they regress.
- Some files are not directly referenced by systemd but may be used by scripts, cron, shell tooling, or application code.
- Receipt signing keys, Stripe/BTCPay env, web-render API secrets, backup credentials, and SSH keys are P0 restore material.

## Restore Guidance

1. Restore P0 files first with original path, ownership, and mode.
2. Keep all private keys and env files `0600 root:root`.
3. Restore P1 operational configs before enabling timers/workers.
4. Restore P2 backups only for operator investigation; do not blindly activate stale backups.
5. After restore, run service health checks before accepting payments or render submissions.

## Related Release Notes

- `release/ETC_FARPY_MANIFEST_V1.md`
- `release/ETC_FARPY_REFERENCE_SCANNER_V1.md`
- `release/ETC_FARPY_PERMISSION_FIX_V1.md`
- `release/PRODUCTION_DRIFT_GUARD_V1.md`
