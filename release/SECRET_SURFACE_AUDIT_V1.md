# SECRET_SURFACE_AUDIT_V1

Status: DOCUMENTED

Date: 2026-06-30

Mode: Read-only audit. No edits. No production mutations. No secret values printed.

## Objective

Inventory secret locations and classify each by sensitivity.

This report lists only:

- file path
- purpose
- owner
- classification

Secret values were not read, copied, printed, or recorded.

## Classification

- Critical: compromise can directly mutate money, production data, auth, infrastructure, backups, or decrypt/restore sensitive data.
- High: compromise can impersonate a node/operator/customer flow, access private URLs, or expose customer/package data.
- Medium: operationally sensitive or may contain identifiers/tokens in local/dev/test context, but lower blast radius or not proven live production secret.

## Production Secret Surface

| Classification | File Path | Purpose | Owner |
|---|---|---|---|
| Critical | `/etc/farpy/stripe.env` | Stripe secret key and webhook/payment runtime configuration for card checkout and webhooks | Node A / root / Farpy payment services |
| Critical | `/etc/farpy/btcpay.env` | BTCPay URL/store/API/webhook/runtime configuration for Bitcoin invoice creation and webhook validation | Node A / root / `farpy-web-render-api.service` |
| Critical | `/etc/farpy/farpy.env` | General Farpy production runtime secrets and service env configuration | Node A / root / Farpy services |
| Critical | `/etc/farpy/web-render-worker.env` | Remote/render worker runtime token and worker configuration | Node A or worker host / root / worker service |
| Critical | `/etc/systemd/system/farpy-web-render-api.service.d/80-btcpay-env.conf` | Systemd drop-in loading BTCPay env file | Node A / root / systemd |
| Critical | `/etc/systemd/system/farpy-web-render-api.service.d/*ops*` | Systemd drop-in or env file reference for ops token | Node A / root / ops/API service |
| Critical | `/etc/systemd/system/farpy-jobs-api.service.d/*` | Jobs API drop-ins; may reference protected env files or operational settings | Node A / root / jobs API service |
| Critical | `/root/.ssh/id_farpy` | SSH key used by offsite backup transport to Storage Box | Node A / root / backup operator |
| Critical | `/root/.ssh/*` | Production root SSH keys for host access and automation | Node A/B/C / root / infrastructure operator |
| Critical | `/var/lib/caddy/.local/share/caddy` | Caddy certificate/account private material and TLS storage | Node A / caddy / Caddy TLS automation |
| Critical | `/var/lib/farpy-web-render/wallet` | Authoritative wallet ledger and balances | Node A / `farpy-web-render-api.service` |
| Critical | `/var/lib/farpy-web-render/nodes` | NodeMuncher pairing/node identity records if production uses JSON store | Node A / `farpy-web-render-api.service` |
| Critical | `/var/lib/farpy-web-render/node-pair*.sqlite` | NodeMuncher pairing/node identity DB if production uses SQLite store | Node A / `farpy-web-render-api.service` |
| Critical | `/var/lib/farpy-web-render/stripe-events` | Stripe webhook event records used for idempotency/reconciliation | Node A / `farpy-web-render-api.service` |
| Critical | `/var/lib/farpy-web-render/btcpay-events` | BTCPay webhook event records used for idempotency/reconciliation | Node A / `farpy-web-render-api.service` |
| Critical | `/var/lib/farpy` | Production Farpy account/auth/wallet-adjacent data store scope documented in backup plans | Node A / Farpy services |
| Critical | `/var/backups/farpy/current-data-*` | Local same-host backup archives containing production jobs/uploads/receipts/wallet/account data | Node A / root / backup operator |
| Critical | `/etc/farpy/backup-age-recipient.txt` | Backup encryption recipient configuration; public recipient is not a secret, but controls backup encryption target | Node A / root / backup operator |
| Critical | `<sealed backup age identity / private key location>` | Private decryption key for encrypted offsite backups; exact path not proven in docs | Backup key custodian / second operator |
| Critical | `u502913@u502913.your-storagebox.de:<farpy backup paths>` | Offsite backup destination containing encrypted production backups when implemented | Storage Box / backup operator |
| Critical | Node C BTCPay/LND/Core Lightning wallet files | Bitcoin/Lightning wallet and node state for payment rail | Node C / root or BTCPay service account |
| High | `/var/lib/farpy-web-render/jobs` | Job JSON may contain owner identifiers, payment state, download/receipt tokens, upload paths | Node A / `farpy-web-render-api.service` |
| High | `/var/lib/farpy-web-render/receipts` | Receipt JSON, private token references, hashes, cost/frame/job metadata | Node A / `farpy-web-render-api.service` |
| High | `/var/lib/farpy-web-render/uploads` | Customer uploaded `.blend` / `.orbx` packages | Node A / `farpy-web-render-api.service` |
| High | `/var/lib/farpy-web-render/outputs` | Customer completed ZIP outputs | Node A / `farpy-web-render-api.service` |
| High | `/var/lib/farpy-web-render/work` | Temporary render work dirs; may contain customer source and output frames | Node A / render/API service |
| High | `/var/lib/farpy-web-render/worker-status.json` | Worker identity/status metadata | Node A / `farpy-web-render-api.service` |
| High | `/opt/farpy-node/web-render-http-worker.py` | Remote Octane worker code path; not a secret but owns authenticated worker behavior | PR worker / root or `pr-003` |
| High | `/opt/farpy-node/systemd/farpy-web-render-worker.service` | Worker service config; may reference env file/token path | PR worker / root / systemd |
| High | `/etc/systemd/system/farpy-web-render-worker.service*` | Worker unit/drop-ins; may reference worker env/token | Worker host / root / systemd |
| Medium | `/etc/caddy/Caddyfile` | Public routing; generally not secret, but can expose internal topology and route assumptions | Node A / root / Caddy operator |
| Medium | `/etc/caddy/caddy.real.json` | Adapted/effective Caddy routing config; operationally sensitive | Node A / root / Caddy operator |

## Local Source / Developer Secret Surface

| Classification | File Path | Purpose | Owner |
|---|---|---|---|
| High | `C:\Users\danki\Desktop\farpy-frontend\.farpy-jobs\*.json` | Local/dev job JSON; may contain tokenized receipt/download URLs and payment/job metadata | Developer workstation / Farpy dev |
| High | `C:\Users\danki\Desktop\farpy-frontend\.farpy-receipts\*.json` | Local/dev receipt JSON with private proof metadata | Developer workstation / Farpy dev |
| High | `C:\Users\danki\Desktop\farpy-frontend\.farpy-runtime\prod-web-render-data*\jobs\*.json` | Local copied/prod-like job state from smoke/testing | Developer workstation / Farpy dev |
| High | `C:\Users\danki\Desktop\farpy-frontend\.farpy-runtime\prod-web-render-data*\receipts\*.json` | Local copied/prod-like receipt state from smoke/testing | Developer workstation / Farpy dev |
| High | `C:\Users\danki\Desktop\farpy-frontend\.farpy-runtime\prod-web-render-data*\uploads\*` | Local copied/prod-like uploads from smoke/testing | Developer workstation / Farpy dev |
| High | `C:\Users\danki\Desktop\farpy-frontend\.farpy-runtime\prod-web-render-data*\outputs\*` | Local copied/prod-like outputs from smoke/testing | Developer workstation / Farpy dev |
| High | `C:\Users\danki\Desktop\farpy-frontend\.farpy-uploads\*` | Local/dev uploaded render packages | Developer workstation / Farpy dev |
| High | `C:\Users\danki\Desktop\farpy-frontend\.farpy-outputs\*` | Local/dev output ZIPs | Developer workstation / Farpy dev |
| Medium | `C:\Users\danki\Desktop\farpy-frontend\job-api.log` | Local API log; may include IDs, paths, error text | Developer workstation / Farpy dev |
| Medium | `C:\Users\danki\Desktop\farpy-frontend\job-api.err.log` | Local API error log; may include IDs, paths, error text | Developer workstation / Farpy dev |
| Medium | `C:\Users\danki\Desktop\farpy-frontend\render-worker.log` | Local worker log | Developer workstation / Farpy dev |
| Medium | `C:\Users\danki\Desktop\farpy-frontend\render-worker.err.log` | Local worker error log | Developer workstation / Farpy dev |
| Medium | `C:\Users\danki\Desktop\farpy-frontend\.farpy-runtime\*.log` | Local/prod-like runtime logs from smoke/testing | Developer workstation / Farpy dev |
| Medium | `C:\Users\danki\Desktop\farpy-frontend\auth-wiring-out.tgz` | Local archive from auth/static wiring work; may contain built output/config | Developer workstation / Farpy dev |
| Medium | `C:\Users\danki\Desktop\farpy-frontend\farpy-frontend-out.tgz` | Local static build archive | Developer workstation / Farpy dev |
| Medium | `C:\tmp\farpy-out-*.tar.gz` | Local static deploy archives if still present | Developer workstation / Farpy dev |

## NodeMuncher / Benchmark Secret Surface

| Classification | File Path | Purpose | Owner |
|---|---|---|---|
| Critical | `%LOCALAPPDATA%\FarpyNode\node.json` | Persisted NodeMuncher `node_id` and `node_token` used for heartbeat/lease/auth | NodeMuncher desktop user / local OS profile |
| High | `C:\Users\danki\Desktop\nodemuncher-codex\src\db\nodemuncher.db` | Local NodeMuncher/Benchmark DB; may include pairing/history/state in dev copy | Developer workstation / NodeMuncher dev |
| High | `C:\Users\danki\Desktop\nodemuncher-codex\src\db\pairing.sql` | Pairing schema and local DB structure | Developer workstation / NodeMuncher dev |
| Medium | `C:\Users\danki\Desktop\nodemuncher-codex\scripts\nodemuncher-public-e2e-smoke.mjs` | Smoke script reads node token and authenticated cookie env vars; source should not contain values | Developer workstation / NodeMuncher dev |
| Medium | `C:\Users\danki\Desktop\nodemuncher-codex\proof\*.json` | Local proof reports; may contain job IDs, node IDs, paths, and operational metadata | Developer workstation / NodeMuncher dev |
| Medium | `C:\Users\danki\Desktop\nodemuncher-codex\release-dryrun\*.json` | Release dry-run metadata | Developer workstation / NodeMuncher dev |
| Medium | `C:\Users\danki\Desktop\nodemuncher-codex\src-tauri\target\release\bundle\*` | Built installers; not secrets but supply-chain sensitive artifacts | Developer workstation / release operator |

## Runtime Env Variables With Secret Semantics

Paths above are the storage/ownership surface. The following variable names are secret-bearing or secret-adjacent and should only appear in protected env files, secret stores, or redacted docs.

| Classification | Variable Name | Purpose | Owner |
|---|---|---|---|
| Critical | `STRIPE_SECRET` / `STRIPE_SECRET_KEY` | Stripe API authorization | Node A payment services |
| Critical | `STRIPE_WEBHOOK_SECRET` | Stripe webhook signature validation | Node A payment services |
| Critical | `BTCPAY_API_KEY` | BTCPay API authorization | Node A / Node C payment rail |
| Critical | `BTCPAY_WEBHOOK_SECRET` | BTCPay webhook signature validation | Node A / Node C payment rail |
| Critical | `FARPY_OPS_TOKEN` / `FARPY_WEB_RENDER_OPS_TOKEN` | Internal ops summary/dashboard authorization | Node A ops/API |
| Critical | `FARPY_WEB_RENDER_WORKER_TOKEN` | Auth token for remote worker endpoints | Node A / worker hosts |
| Critical | `FARPY_NODE_TOKEN_LOOKUP` | Internal helper env used during node token lookup subprocess | Node A web-render API |
| Critical | `GOOGLE_CLIENT_SECRET` or equivalent OAuth secret | Google OAuth provider secret, if present in production env | Auth service owner |
| High | `FARPY_NODE_JSON` | Path override to persisted NodeMuncher node identity | NodeMuncher smoke/operator |
| High | `FARPY_AUTH_COOKIE` / `FARPY_WEB_RENDER_COOKIE` | Operator-provided browser session cookie for smoke tooling | Smoke operator |
| Medium | `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Public analytics measurement ID; not secret but privacy/config sensitive | Frontend |
| Medium | `NEXT_PUBLIC_FIREHOSE_URL` | Public analytics endpoint; not secret but can affect data flow | Frontend |
| Medium | `FARPY_LIGHTNING_ENABLED` | Build-time feature gate; not secret but payment-surface sensitive | Frontend deploy operator |

## Current Protections Noted

- Production `/etc/farpy` env/key files were previously hardened to `0600 root:root`.
- Sensitive systemd values were moved into protected `EnvironmentFile=` files where proven.
- `systemctl cat` was previously reviewed so secret-like values are not exposed inline for core services.
- Worker/node query-string token fallback was removed in earlier security work.
- Job status no longer exposes private receipt/download URLs to unauthenticated users.

## Gaps

P1:

1. Exact production secret inventory is distributed across release notes rather than a single protected manifest.
2. Second-operator custody for Stripe, BTCPay, Storage Box, DNS/registrar, ops token, SSH keys, and backup decryption key is not proven.
3. Encrypted offsite backup key location/custody is not implemented/proven.
4. Local repo trees contain runtime/dev `.farpy-*` state, logs, uploads, outputs, and receipts; these should remain ignored and treated as sensitive.
5. NodeMuncher node token is alpha-grade local state under `%LOCALAPPDATA%`.

P2:

1. Create secret-owner manifest with owner, rotation process, recovery contact, and storage location, but no values.
2. Add a redacted startup config report for operators.
3. Add periodic scan for accidental secret-like files in repo/build artifacts.
4. Define retention/cleanup for local smoke artifacts.

## Commands Run

```powershell
Get-ChildItem -LiteralPath 'C:\Users\danki\Desktop\farpy-frontend' -Force -File -Filter '*.env*' | Select-Object FullName,Name,Length,LastWriteTime
Get-ChildItem -LiteralPath 'C:\Users\danki\Desktop\farpy-frontend' -Recurse -Force -File -Include '*.env','*.env.*','*.key','*.pem','*.p12','*.crt','*.secret','*.token' -ErrorAction SilentlyContinue | Where-Object { $_.FullName -notmatch '\\node_modules\\|\\.next\\|\\out\\' } | Select-Object FullName,Name,Length,LastWriteTime
rg -n --glob '!node_modules/**' --glob '!out/**' --glob '!.next/**' --glob '!*.map' "EnvironmentFile=|Environment=|process\.env\.|STRIPE_|BTCPAY_|GOOGLE_|OAUTH|SECRET|TOKEN|PASSWORD|API_KEY|WEBHOOK|FARPY_OPS_TOKEN|WORKER_TOKEN" 'C:\Users\danki\Desktop\farpy-frontend'
Get-Content -LiteralPath 'C:\Users\danki\Desktop\farpy-frontend\release\PROD_ENV_SECRET_PERMISSION_HARDENING_V1.md' -Raw
Get-Content -LiteralPath 'C:\Users\danki\Desktop\farpy-frontend\release\CONFIG_AUDIT_V1.md' -Raw
rg -n --glob '!node_modules/**' --glob '!target/**' --glob '!dist/**' --glob '!dist-nodemuncher/**' --glob '!out/**' "token|secret|password|api_key|auth|credential|pair|heartbeat|lease|FARPY_NODE|FARPY_WEB_RENDER_WORKER_TOKEN|STRIPE_|BTCPAY_|GOOGLE_" 'C:\Users\danki\Desktop\nodemuncher-codex\src' 'C:\Users\danki\Desktop\nodemuncher-codex\src-nodemuncher' 'C:\Users\danki\Desktop\nodemuncher-codex\src-tauri' 'C:\Users\danki\Desktop\nodemuncher-codex\scripts'
Get-ChildItem -LiteralPath 'C:\Users\danki\Desktop\nodemuncher-codex' -Recurse -Force -File -Include '*.env','*.env.*','*.key','*.pem','*.p12','*.secret','*.token' -ErrorAction SilentlyContinue | Where-Object { $_.FullName -notmatch '\\node_modules\\|\\target\\|\\dist\\|\\dist-nodemuncher\\' } | Select-Object FullName,Name,Length,LastWriteTime
```

No production changes were made.
No secret values were printed.
