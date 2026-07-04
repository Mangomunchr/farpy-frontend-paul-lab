# CONFIG_AUDIT_V1

Status: YELLOW

Mode: audit only. No edits, no deploy, no production mutation.

Date: 2026-06-30

## Scope

Inventoried configuration across:

- `C:\Users\danki\Desktop\farpy-frontend`
- `C:\Users\danki\Desktop\nodemuncher-codex`
- release notes and Farpy Book references for production-only Caddy/systemd/env config

This audit did not SSH into production and did not read live secret values.

## Summary

Farpy configuration is functional but spread across code constants, systemd templates, protected production env files, release notes, Caddy JSON/Caddyfile history, static build config, desktop/Tauri config, smoke scripts, and local runtime JSON state.

The biggest issue is not one broken config. It is configuration drift risk: multiple places define Farpy URLs, ports, data directories, payment flags, timeout values, worker endpoints, and product identities. Production has been repaired through several milestone-specific drop-ins and Caddy edits, but there is no single canonical config manifest that says which variable lives where and which host owns it.

Overall verdict: YELLOW.

No P0 was proven. P1 centralization should happen before more operators or broader NodeMuncher rollout.

## Inventory

### `.env` / Env Files

No repo-root `.env` file was found in the local source inventory.

Production env files are documented in release notes, especially:

- `/etc/farpy/stripe.env`
- `/etc/farpy/btcpay.env`
- `/etc/farpy/farpy.env`
- `/etc/farpy/web-render-worker.env`
- `/etc/farpy/backup-age-recipient.txt`

Evidence:

- `release/PROD_ENV_SECRET_PERMISSION_HARDENING_V1.md`
- `release/LIGHTNING_RUNTIME_CONFIG_ENABLE_V1.md`
- `release/BTCPAY_HOST_ACCESS_AUDIT_V1.md`
- `release/WEB_RENDER_BACKUP_ENCRYPTION_PLAN_V1.md`
- `release/OCTANE_READINESS_AUDIT_V1.md`

Assessment:

- Good: secrets are mostly externalized from source into protected env files.
- Risk: exact authoritative env ownership is spread across release docs and systemd drop-ins.
- Recommendation: create `docs/FARPY_BOOK/CONFIGURATION.md` or `release/CONFIG_MANIFEST_V1.md` listing every runtime variable, owner host, default, secret/non-secret classification, and consuming service.

### JSON

Found source/build JSON config:

- `farpy-frontend/package.json`
- `farpy-frontend/package-lock.json`
- `farpy-frontend/tsconfig.json`
- `nodemuncher-codex/package.json`
- `nodemuncher-codex/package-lock.json`
- `nodemuncher-codex/tsconfig.json`
- `nodemuncher-codex/src-tauri/tauri.conf.json`
- `nodemuncher-codex/src-tauri/tauri.nodemuncher.conf.json`
- `nodemuncher-codex/src/core/*.contract.json`
- Tauri generated schema JSON files under `src-tauri/gen/schemas/`

Found runtime/state JSON inside local repo tree:

- `farpy-frontend/.farpy-jobs/*.json`
- `farpy-frontend/.farpy-receipts/*.json`
- `farpy-frontend/.farpy-runtime/prod-web-render-data*/jobs/*.json`
- `farpy-frontend/.farpy-runtime/prod-web-render-data*/receipts/*.json`
- `farpy-frontend/.farpy-worker-status.json`
- `nodemuncher-codex/proof/*.json`
- `nodemuncher-codex/release-dryrun/*.json`

Assessment:

- Good: Tauri app identity is explicit in JSON.
- Risk: local `.farpy-*` runtime stores live inside the source tree. These appear to be local/dev artifacts, but they make config/state boundaries blurry.
- Recommendation: keep source config separate from runtime state. Add `.farpy-*` stores to a documented dev-only cleanup/ignore policy if not already ignored.

### YAML

Found:

- `nodemuncher-codex/.github/workflows/nodemuncher-macos-build-v1.yml`
- `nodemuncher-codex/.github/workflows/nodemuncher-windows-installer-v1.yml`

Assessment:

- These define build/release behavior for NodeMuncher artifacts.
- Recommendation: document whether GitHub Actions are authoritative for NodeMuncher builds or merely historical/internal alpha. Artifact signing and release URLs should not be inferred from workflow names alone.

### Systemd

Local deploy templates:

- `farpy-frontend/deploy/systemd/farpy-web-render-api.service`
- `farpy-frontend/deploy/systemd/farpy-web-render-worker.service`

Key current template values:

- `WorkingDirectory=/opt/farpy-web-render`
- `ExecStart=/usr/bin/env node /opt/farpy-web-render/scripts/job-api.mjs`
- `ExecStart=/usr/bin/env node /opt/farpy-web-render/scripts/render-worker.mjs`
- `FARPY_WEB_RENDER_HOST=127.0.0.1`
- `FARPY_WEB_RENDER_PORT=19102`
- `FARPY_WEB_RENDER_DATA_DIR=/var/lib/farpy-web-render`
- `BLENDER_EXE=/usr/local/bin/blender`
- `FARPY_PUBLIC_SITE_URL=https://farpy.com`
- `EnvironmentFile=-/etc/farpy/stripe.env`

Production drop-ins documented in release notes:

- `/etc/systemd/system/farpy-web-render-api.service.d/80-btcpay-env.conf`
- `EnvironmentFile=/etc/farpy/btcpay.env`
- `FARPY_OPS_TOKEN` configured via systemd env drop-in
- env hardening moved sensitive values into protected files

Assessment:

- Good: service templates bind API to localhost and use env files for Stripe.
- Risk: local templates lag production. BTCPay and ops token drop-ins are documented in release notes, not represented in deploy templates.
- Recommendation: maintain a canonical `deploy/systemd/drop-ins/` directory with non-secret examples for every production drop-in.

### Caddy

No live Caddyfile exists in the local source tree. Caddy configuration is documented through release notes and production paths:

- `/etc/caddy/Caddyfile`
- `/etc/caddy/caddy.real.json`
- backups such as `/etc/caddy/caddy.real.json.bak.*`

Relevant release notes:

- `release/DOWNLOADS_TRAILING_SLASH_FIX_V1.md`
- `release/WORKSPACE_PRODUCTION_DEPLOY_V3.md`
- `release/FARPY_TOPUP_CHECKOUT_BUTTON_WIRE_V1.md`
- `release/SECURITY_GOLD_AUDIT_V1.md`
- `release/FOUNDER_ABSENCE_FIX_V1.md`

Assessment:

- Good: Caddy validate/restart/backup discipline is documented in release notes.
- Risk: active Caddy config is not versioned as a normal deploy artifact in the repo. Several launch fixes depended on direct Caddy edits.
- Recommendation: store sanitized canonical Caddy config under `deploy/caddy/` and treat production edits as patches against that file.

### Hardcoded Constants

Important hardcoded/defaulted constants found:

#### Web/render API

In `scripts/job-api.mjs`:

- `FARPY_WEB_RENDER_PORT || FARPY_JOB_API_PORT || 19102`
- `FARPY_WEB_RENDER_HOST || FARPY_JOB_API_HOST || "127.0.0.1"`
- local fallback dirs `.farpy-jobs`, `.farpy-uploads`, `.farpy-outputs`, `.farpy-receipts`, `.farpy-wallet`, `.farpy-work`
- `MAX_UPLOAD_MB || FARPY_MAX_UPLOAD_MB || 100`
- `FARPY_QUEUE_CAP || 25`
- `FARPY_BASE_RENDER_TIMEOUT_SECONDS || 600`
- `FARPY_PER_FRAME_RENDER_TIMEOUT_SECONDS || 180`
- ops thresholds: submitted stuck 5 minutes, worker stale 60 seconds, disk/inode 90 percent
- Lightning tiers: `usd_1`, `usd_5`, `usd_10`
- wallet top-up amounts: `1000`, `2500`, `5000`, `10000`
- `FARPY_PUBLIC_SITE_URL || "https://farpy.com"`

#### Frontend

- `src/lib/webRenderApi.ts`: `NEXT_PUBLIC_WEB_RENDER_API_BASE || "/node/v1/web-render"`
- `src/lib/site.ts`: `NEXT_PUBLIC_SITE_URL || "https://farpy.com"`
- `src/lib/site.ts`: pricing constants `PRICE_NORMAL = 0.01`, `PRICE_FAST = 0.02`
- `next.config.ts`: `FARPY_LIGHTNING_ENABLED` build-time flag

#### Benchmark / NodeMuncher

- `scripts/public-leaderboard-api.cjs`: host `127.0.0.1`, port `19002`, body limit `16 * 1024`
- `scripts/generate-benchmark-sitemap.cjs`: `SITE_ORIGIN = "https://farpy.com"`
- `scripts/nodemuncher-public-e2e-smoke.mjs`: default `https://farpy.com`, `https://api.farpy.com/node/heartbeat`, local node path `%LOCALAPPDATA%\FarpyNode\node.json`
- `src-tauri/src/main.rs`: `BENCHMARK_RENDER_TIMEOUT_SECS = 600`
- `src-tauri/tauri.conf.json`: Benchmark product name/version/window dimensions/resources
- `src-tauri/tauri.nodemuncher.conf.json`: NodeMuncher product name/version/window dimensions/resources
- `vite.config.ts` and `vite.nodemuncher.config.ts`: dev server `127.0.0.1:1420`

Assessment:

- Good: many constants have env overrides.
- Risk: pricing, site origin, timeout, API origin, and product identity live in separate files. Some are duplicated between frontend, backend, scripts, and release/audit tooling.
- Recommendation: centralize non-secret public constants into a versioned config module/manifest and generate typed imports for frontend/scripts where practical.

## Duplicate / Drift-Prone Config

| Config | Current Locations | Risk | Recommendation |
| --- | --- | --- | --- |
| Farpy origin | `src/lib/site.ts`, `scripts/job-api.mjs`, benchmark sitemap generator, smoke scripts, release docs | Canonical URL drift, wrong public checkout/receipt URLs | One `FARPY_PUBLIC_SITE_URL` contract, with frontend `NEXT_PUBLIC_SITE_URL` derived at build time. |
| Web-render API base | `src/lib/webRenderApi.ts`, job API service, smoke scripts, NodeMuncher script defaults | Frontend and scripts may test different route shapes | Document `/node/v1/web-render` as canonical; env override only for staging. |
| API host/port | `deploy/systemd`, `scripts/job-api.mjs`, Caddy config, smoke scripts | Direct port exposure/route mismatch if one changes | Canonical service manifest: internal bind host/port + Caddy upstream route. |
| Data dirs | `scripts/job-api.mjs`, systemd templates, release docs, backup plans | Backup/restore can miss a store if env changes | Single storage manifest for jobs/uploads/outputs/receipts/wallet/events/nodes. |
| Payment config | `/etc/farpy/stripe.env`, `/etc/farpy/btcpay.env`, job-api constants, release notes | Payment rail enablement can drift from UI flags | `payments.env.example` plus config manifest: Stripe live, Bitcoin on-chain, Lightning gated, PayPal deferred. |
| Lightning flag | `next.config.ts`, `/topup` UI, BTCPay env, docs | UI could expose unpayable rail if build flag misunderstood | Keep frontend flag default false; add deploy preflight showing `FARPY_LIGHTNING_ENABLED`. |
| Pricing | frontend `PRICE_NORMAL/FAST`, job API price logic, homepage examples/docs | Customer price display may drift from backend charge | Backend should expose price quote; frontend constants should be display-only or generated. |
| Timeouts | job API render timeout, NodeMuncher watchdog, Benchmark timeout | Jobs may time out differently across planes | One timeout table: benchmark, customer render, NodeMuncher lease, Octane, ops alert. |
| NodeMuncher endpoints | Tauri Rust, smoke script, lease API docs | Desktop can point at stale route or heartbeat host | Central NodeMuncher endpoint config in Rust with one documented env/dev override. |
| Caddy routing | production config/release notes only | Static/export route fixes may be lost | Version sanitized Caddy config under `deploy/caddy/`. |

## Recommended Centralization

### 1. Create a versioned config manifest

Recommended path:

`deploy/config/farpy-config-manifest.md`

Include:

- variable name
- owner service
- host role: Node A, Node B, Node C, worker, local desktop
- secret: yes/no
- default
- production value source
- restart required
- backup category
- validation command

### 2. Add env examples, not real secrets

Recommended paths:

- `deploy/env/farpy-web-render.env.example`
- `deploy/env/stripe.env.example`
- `deploy/env/btcpay.env.example`
- `deploy/env/ops.env.example`
- `deploy/env/web-render-worker.env.example`
- `deploy/env/leaderboard.env.example`

### 3. Version production service drop-in templates

Recommended paths:

- `deploy/systemd/drop-ins/farpy-web-render-api/80-btcpay-env.conf.example`
- `deploy/systemd/drop-ins/farpy-web-render-api/90-ops-token.conf.example`
- `deploy/systemd/drop-ins/farpy-web-render-api/70-storage.conf.example`

### 4. Version sanitized Caddy config

Recommended path:

- `deploy/caddy/Caddyfile.example` or `deploy/caddy/caddy.real.json.example`

Rules:

- no secrets
- no host-private credentials
- include route comments for `/node/v1/*`, `/auth/google`, `/downloads`, `/workspace`, `/receipt`, `/real` redirect
- deploy runbook must use `caddy validate` before restart

### 5. Move stage flags into one table

Recommended path:

- `docs/FARPY_BOOK/CONFIGURATION.md`

Track:

- `FARPY_LIGHTNING_ENABLED=false`
- PayPal deferred
- NodeMuncher controlled alpha
- Benchmark promotion status
- Octane frame policy
- public proof status

## Priority

### P0

None proven.

No active config was proven to be broken by this local audit.

### P1

1. Local deploy templates do not reflect all production drop-ins.
   - Evidence: `deploy/systemd/farpy-web-render-api.service` includes Stripe env only; BTCPay/ops env drop-ins are documented separately in release notes.
   - Risk: rebuild or restore from repo alone misses payment/ops runtime config.

2. Caddy config is not versioned as a canonical source artifact.
   - Evidence: release docs reference `/etc/caddy/Caddyfile`, `/etc/caddy/caddy.real.json`, and direct production backups/edits.
   - Risk: route fixes can be lost or impossible for a non-founder to reconstruct quickly.

3. Runtime state exists under local repo `.farpy-*` directories.
   - Evidence: `.farpy-jobs`, `.farpy-receipts`, `.farpy-runtime/prod-web-render-data*`.
   - Risk: source tree mixes code/config/state; accidental archive/deploy/commit risk.

4. Pricing and timeout constants are duplicated across frontend/backend/desktop.
   - Evidence: `src/lib/site.ts` pricing constants; `scripts/job-api.mjs` pricing/runtime constants; `src-tauri/src/main.rs` benchmark timeout.
   - Risk: display vs charge vs timeout drift.

5. Endpoint defaults are spread across app, scripts, and desktop.
   - Evidence: `src/lib/webRenderApi.ts`, `scripts/nodemuncher-public-e2e-smoke.mjs`, `scripts/prod-web-render-smoke.mjs`, Tauri code.
   - Risk: smoke tests can pass against a different route than production UI uses.

### P2

1. Add schema validation for env at service startup.
2. Generate a redacted config dump for ops dashboard.
3. Add `npm run config:audit` to list required/provided vars without values.
4. Consolidate all launch-stage flags into Farpy Book.
5. Add a storage manifest to backup/restore scripts.

## Commands Run

```powershell
rg --files C:\Users\danki\Desktop\farpy-frontend | rg "(^|\\|/)(\.env[^\\/]*|.*\.(json|ya?ml|toml|conf|service|timer|env|ini|caddy|Caddyfile|ps1|mjs|cjs|ts|tsx|js|jsx|rs))$" -i
```

```powershell
rg --files C:\Users\danki\Desktop\nodemuncher-codex | rg "(^|\\|/)(\.env[^\\/]*|.*\.(json|ya?ml|toml|conf|service|timer|env|ini|caddy|Caddyfile|ps1|mjs|cjs|ts|tsx|js|jsx|rs))$" -i
```

Note: the two `rg --files | rg ...` commands returned no rows because the filter was too strict for this PowerShell invocation, so PowerShell inventory was used next.

```powershell
Get-ChildItem -LiteralPath C:\Users\danki\Desktop\farpy-frontend -Force | Select-Object Name,Mode,Length,LastWriteTime
Get-ChildItem -LiteralPath C:\Users\danki\Desktop\nodemuncher-codex -Force | Select-Object Name,Mode,Length,LastWriteTime
```

```powershell
Get-ChildItem -LiteralPath C:\Users\danki\Desktop\farpy-frontend -Recurse -Force -File | Where-Object { $_.FullName -notmatch '\\node_modules\\|\\out\\|\\.next\\|\\.git\\' -and ($_.Name -match '^\.env' -or $_.Extension -match '^\.(json|ya?ml|toml|conf|service|timer|env|ini|mjs|cjs|ps1|ts|tsx|js|jsx)$' -or $_.Name -match 'Caddyfile|caddy') } | Select-Object FullName,Length,LastWriteTime | Sort-Object FullName
```

```powershell
Get-ChildItem -LiteralPath C:\Users\danki\Desktop\nodemuncher-codex -Recurse -Force -File | Where-Object { $_.FullName -notmatch '\\node_modules\\|\\target\\|\\dist\\|\\.git\\' -and ($_.Name -match '^\.env' -or $_.Extension -match '^\.(json|ya?ml|toml|conf|service|timer|env|ini|mjs|cjs|ps1|ts|tsx|js|jsx|rs)$' -or $_.Name -match 'Caddyfile|caddy') } | Select-Object FullName,Length,LastWriteTime | Sort-Object FullName
```

```powershell
rg -n "process\.env|import\.meta\.env|VITE_|NEXT_PUBLIC_|FARPY_|BTCPAY_|STRIPE_|PAYPAL_|GOOGLE_|CADDY|PORT|HOST|MAX_|TIMEOUT|URL|STORE|DIR|PATH|TOKEN|SECRET|API_BASE|PUBLIC_SITE|localhost|127\.0\.0\.1|0\.0\.0\.0|farpy\.com|api\.farpy\.com" C:\Users\danki\Desktop\farpy-frontend\src C:\Users\danki\Desktop\farpy-frontend\scripts C:\Users\danki\Desktop\farpy-frontend\next.config.ts C:\Users\danki\Desktop\farpy-frontend\package.json C:\Users\danki\Desktop\nodemuncher-codex\src C:\Users\danki\Desktop\nodemuncher-codex\src-nodemuncher C:\Users\danki\Desktop\nodemuncher-codex\src-tauri C:\Users\danki\Desktop\nodemuncher-codex\scripts C:\Users\danki\Desktop\nodemuncher-codex\*.config.ts C:\Users\danki\Desktop\nodemuncher-codex\package.json -S --glob '!target/**' --glob '!node_modules/**' --glob '!out/**'
```

Note: the command above returned useful matches but also scanned some build artifacts because one glob/path pattern was interpreted unexpectedly.

```powershell
Get-Content -LiteralPath C:\Users\danki\Desktop\farpy-frontend\deploy\systemd\farpy-web-render-api.service -Raw
Get-Content -LiteralPath C:\Users\danki\Desktop\farpy-frontend\deploy\systemd\farpy-web-render-worker.service -Raw
Get-Content -LiteralPath C:\Users\danki\Desktop\farpy-frontend\next.config.ts -Raw
Get-Content -LiteralPath C:\Users\danki\Desktop\farpy-frontend\package.json -Raw
Get-Content -LiteralPath C:\Users\danki\Desktop\farpy-frontend\src\lib\webRenderApi.ts -Raw
Get-Content -LiteralPath C:\Users\danki\Desktop\farpy-frontend\src\lib\site.ts -Raw
Get-Content -LiteralPath C:\Users\danki\Desktop\nodemuncher-codex\package.json -Raw
Get-Content -LiteralPath C:\Users\danki\Desktop\nodemuncher-codex\src-tauri\tauri.conf.json -Raw
Get-Content -LiteralPath C:\Users\danki\Desktop\nodemuncher-codex\src-tauri\tauri.nodemuncher.conf.json -Raw
Get-Content -LiteralPath C:\Users\danki\Desktop\nodemuncher-codex\vite.config.ts -Raw
Get-Content -LiteralPath C:\Users\danki\Desktop\nodemuncher-codex\vite.nodemuncher.config.ts -Raw
```

```powershell
rg -n "Caddyfile|caddy|systemd|EnvironmentFile|Environment=|/etc/farpy|stripe\.env|btcpay\.env|FARPY_WEB_RENDER|BTCPAY_|STRIPE_|GOOGLE_|PAYPAL_|FARPY_OPS_TOKEN|Caddy config|reverse proxy|drop-in|service\.d|80-|90-|daemon-reload" C:\Users\danki\Desktop\farpy-frontend\release C:\Users\danki\Desktop\farpy-frontend\docs C:\Users\danki\Desktop\farpy-frontend\deploy C:\Users\danki\Desktop\farpy-frontend\scripts -S --glob '!out/**' --glob '!node_modules/**'
```

## Files Changed

- `release/CONFIG_AUDIT_V1.md`

## Final Verdict

YELLOW.

Farpy config works, but it is too distributed for long-term operator safety. Centralize the manifest, version non-secret systemd/Caddy examples, and separate source config from runtime state before broader operations or non-founder recovery.
