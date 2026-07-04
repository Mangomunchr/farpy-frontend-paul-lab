# DEPLOYMENT_TIMELINE_V1

Status: ACTIVE

Date: 2026-06-30

Mode: Documentation only. No code, config, production, or deploy changes.

## Purpose

Document every known Farpy production deployment path by product surface:

- Frontend
- Backend
- NodeMuncher
- Benchmark
- Blender Add-on

For each path this document records:

- build
- backup
- deploy
- verify
- rollback

## Executive Summary

Farpy has several proven deployment paths, but they are not yet one unified pipeline.

Most public website work deploys by building static output locally, archiving `out`, copying it to Node A, backing up `/opt/farpy.com/out`, and swapping or extracting the new static output.

Backend work deploys by backing up the production script or config, copying the updated file, restarting the affected systemd service, and running health/fail-closed checks.

Benchmark and Blender Add-on are artifact deployments through the static frontend `/downloads` surface.

NodeMuncher remains controlled alpha. Its broad-public deploy/update path is not frozen.

Important static deploy rule:

- Clean frontend deploys must deploy a preserved staging directory, not raw `out`.
- Raw `out` clean deploys are unsafe unless all production-generated artifacts have been regenerated into `out` or explicitly proven unnecessary.
- Use `scripts/prepare-static-deploy-preserve-v1.ps1` before archiving static output.

## Common Production Roles

| Host | Deployment Role |
|---|---|
| Node A | Production control plane: website, APIs, wallet, auth, jobs, uploads, receipts, static artifacts |
| Node B | Warm standby, restore tests, synthetic monitoring, canary deploy target |
| Node C | Payments / BTCPay, future render worker migration target |
| Storage Box | Encrypted backup destination, not yet fully proven for current-data restore |

## Frontend Static Website

Scope:

- Homepage
- Workspace
- Account
- Top-up
- Receipt shell
- Status
- Docs/legal
- Downloads
- Add-on page
- Benchmark public pages when statically exported

Source:

- `C:\Users\danki\Desktop\farpy-frontend`

Production target:

- `/opt/farpy.com/out`

### Build

Known command:

```powershell
Set-Location 'C:\Users\danki\Desktop\farpy-frontend'
npm.cmd run build
```

Clean rebuild pattern when stale generated HTML is suspected:

```powershell
Remove-Item .next -Recurse -Force
Remove-Item out -Recurse -Force
npm.cmd run build
```

Evidence:

- `release/HOMEPAGE_PACKAGE_LABEL_FLOW_DEPLOY_V1.md`
- `release/WORKSPACE_PRODUCTION_DEPLOY_V3.md`
- `release/ADDON_PRODUCTION_DEPLOY_V1.md`
- `release/FIRST_RENDER_GREEN_DEPLOY_V1.md`

### Backup

Known static backup pattern:

```bash
backup="/opt/farpy.com/out.bak.<milestone>.<timestamp>"
cp -a /opt/farpy.com/out "$backup"
```

Alternative clean swap pattern:

```bash
newdir="/opt/farpy.com/out.new.<milestone>.<timestamp>"
backup="/opt/farpy.com/out.bak.<milestone>.<timestamp>"
tar -xzf "$archive" -C "$newdir"
mv /opt/farpy.com/out "$backup"
mv "$newdir" /opt/farpy.com/out
```

Evidence examples:

- `/opt/farpy.com/out.bak.homepage_package_label_flow_deploy_v1_final.20260630T110429Z`
- `/opt/farpy.com/out.bak.workspace_production_deploy_v3.20260629T174955`
- `/opt/farpy.com/out.bak.addon_production_deploy_v1.20260629T173703`

### Deploy

Required clean static deploy preparation:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/prepare-static-deploy-preserve-v1.ps1 -EvidencePath C:\tmp\static-deploy-preserve-fix-v1-latest.json
```

Use the `stage_root` from `C:\tmp\static-deploy-preserve-fix-v1-latest.json` as the deploy source.

This step:

- copies local `out` into a timestamped staging directory
- generates a read-only manifest from production `/opt/farpy.com/out`
- preserves production-only artifacts such as `downloads/`, add-on ZIPs, `.sha256` sidecars, generated status/audit JSON, `proof/`, `node/`, `project-status/`, and `receipt-static/`
- runs `static-preservation-guard-v1.ps1 -Mode PreDeploy` against the prepared stage
- performs no production deploy

Unsafe legacy archive/upload pattern:

```powershell
tar -czf C:\tmp\farpy-out-<milestone>-<timestamp>.tar.gz -C C:\Users\danki\Desktop\farpy-frontend\out .
scp -q C:\tmp\farpy-out-<milestone>-<timestamp>.tar.gz root@farpy.com:/tmp/farpy-out-<milestone>-<timestamp>.tar.gz
```

Do not use raw `out` as the archive source for a clean deploy unless the preservation guard is GREEN against raw `out` or all protected artifacts are intentionally regenerated.

Preserved-stage archive/upload pattern:

```powershell
$proof = Get-Content C:\tmp\static-deploy-preserve-fix-v1-latest.json -Raw | ConvertFrom-Json
tar -czf C:\tmp\farpy-out-<milestone>-<timestamp>.tar.gz -C $proof.stage_root .
scp -q C:\tmp\farpy-out-<milestone>-<timestamp>.tar.gz root@farpy.com:/tmp/farpy-out-<milestone>-<timestamp>.tar.gz
```

Known remote extraction/swap pattern:

```bash
archive="/tmp/farpy-out-<milestone>-<timestamp>.tar.gz"
newdir="/opt/farpy.com/out.new.<milestone>.<timestamp>"
backup="/opt/farpy.com/out.bak.<milestone>.<timestamp>"
mkdir -p "$newdir"
tar -xzf "$archive" -C "$newdir"
mv /opt/farpy.com/out "$backup"
mv "$newdir" /opt/farpy.com/out
```

Some artifact-only deploys extract into the existing static root after backing it up:

```bash
cp -a /opt/farpy.com/out "$backup"
tar -xzf /tmp/<artifact-update>.tgz -C /opt/farpy.com/out
```

### Verify

Minimum public checks:

```bash
curl -I https://farpy.com/
curl -I https://farpy.com/signin
curl -I https://farpy.com/account
curl -I https://farpy.com/workspace
curl -I https://farpy.com/topup
curl -I https://farpy.com/status
curl -I https://farpy.com/downloads
curl -I https://farpy.com/receipt
```

Common content checks:

- required copy present
- forbidden stale copy absent
- `/downloads` and `/downloads/` both succeed or redirect correctly
- no stale generated homepage HTML
- mobile overflow checks when homepage/workspace changed

Evidence:

- `release/HOMEPAGE_PACKAGE_LABEL_FLOW_DEPLOY_V1.md`
- `release/MOBILE_HOMEPAGE_DEPLOY_V1.md`
- `release/DOWNLOADS_TRAILING_SLASH_FIX_V1.md`

### Rollback

Known rollback pattern:

```bash
mv /opt/farpy.com/out /opt/farpy.com/out.bad.<timestamp>
mv /opt/farpy.com/out.bak.<known-good-timestamp> /opt/farpy.com/out
curl -I https://farpy.com/
```

Gap:

- Selecting the latest known-good backup is still operator judgment.
- A single canonical frontend rollback command has not been frozen.

## Backend / API Services

Scope:

- web-render API
- jobs API
- upload API
- auth
- checkout/top-up/payment endpoints
- worker endpoints
- ops summary

Common production script:

- `/opt/farpy-web-render/scripts/job-api.mjs`

Common service:

- `farpy-web-render-api.service`

Other services referenced by recovery docs:

- `caddy`
- `farpy-auth`
- `farpy-checkout-api`
- `farpy-stripe-webhook`
- `farpy-topup`
- `farpy-jobs-api`
- `farpy-upload-api`
- `farpy-leaderboard`

### Build / Check

Known syntax check:

```powershell
node --check scripts\job-api.mjs
```

If frontend also changed:

```powershell
npm.cmd run build
```

Backend changes should not proceed without targeted route checks for the changed path.

### Backup

Known production backup pattern:

```bash
cp -a /opt/farpy-web-render/scripts/job-api.mjs /opt/farpy-web-render/scripts/job-api.mjs.bak.<milestone>.<timestamp>
```

For Caddy changes:

```bash
cp -a /etc/caddy/caddy.real.json /etc/caddy/caddy.real.json.bak.<milestone>.<timestamp>
```

For systemd/env changes:

```bash
cp -a /etc/systemd/system/<service>.service.d /root/<milestone>-systemd-backup-<timestamp>/
cp -a /etc/farpy/<env-file> /root/<milestone>-env-backup-<timestamp>/
```

Secret rule:

- never paste secret values into release notes or the Book
- env files must remain protected

### Deploy

Known script deploy pattern:

```powershell
scp -q C:\Users\danki\Desktop\farpy-frontend\scripts\job-api.mjs root@farpy.com:/opt/farpy-web-render/scripts/job-api.mjs
```

Known service restart:

```bash
systemctl restart farpy-web-render-api.service
systemctl status farpy-web-render-api.service --no-pager -l
```

Known systemd reload when unit/drop-in changes:

```bash
systemctl daemon-reload
systemctl restart <service>
systemctl status <service> --no-pager -l
```

Known Caddy validation/reload pattern:

```bash
caddy validate --config /etc/caddy/Caddyfile
systemctl restart caddy
systemctl status caddy --no-pager -l
```

### Verify

Minimum health checks:

```bash
curl -I https://api.farpy.com/healthz
curl -I https://api.farpy.com/readyz
systemctl is-active caddy farpy-auth farpy-checkout-api farpy-stripe-webhook farpy-topup farpy-web-render-api farpy-jobs-api farpy-upload-api farpy-leaderboard
```

Route-specific checks depend on changed endpoint. Examples from prior fixes:

```bash
curl -i -X POST https://farpy.com/checkout -H "content-type: application/json" --data '{bad json'
curl -i -X POST https://farpy.com/checkout -H "content-type: application/json" --data '{"amount_cents":1000}'
curl -i -X POST https://farpy.com/node/v1/web-render/btcpay/invoice -H "content-type: application/json" --data '{"tier":"usd_1"}'
curl -i -X POST https://farpy.com/node/v1/web-render/btcpay/webhook --data '{}'
```

Expected fail-closed examples:

- malformed JSON returns `400 invalid_json`
- unauthenticated checkout/invoice returns `401 auth_required`
- unsigned BTCPay webhook returns `400 invalid_signature`
- worker/node routes reject missing or invalid tokens

### Rollback

Known rollback pattern:

```bash
cp -a /opt/farpy-web-render/scripts/job-api.mjs.bak.<known-good> /opt/farpy-web-render/scripts/job-api.mjs
node --check /opt/farpy-web-render/scripts/job-api.mjs
systemctl restart farpy-web-render-api.service
curl -I https://api.farpy.com/healthz
```

Gap:

- `scripts/job-api.mjs` is a monolithic critical file.
- A canonical backend rollback matrix by endpoint has not been frozen.
- Known-good selection still requires operator judgment.

## NodeMuncher

Scope:

- NodeMuncher desktop app
- pairing
- heartbeat
- lease peek/claim
- local Blender execution
- ZIP upload/complete/failure report
- earnings/history display

Status:

- controlled alpha only
- broad public launch: no

Source:

- `C:\Users\danki\Desktop\nodemuncher-codex`

### Build

Known checks from prior NodeMuncher work:

```powershell
npm.cmd run build
npm.cmd run build:nodemuncher
npm.cmd run tauri -- build
```

Exact build command may vary by active package scripts. If `build:nodemuncher` is unavailable, inspect `package.json` before choosing a substitute.

### Backup

Before replacing public/internal artifacts:

- record artifact path
- record SHA256
- preserve previous MSI/NSIS/ZIP artifacts
- preserve release note evidence

Known artifact proof pattern:

```powershell
Get-FileHash -Algorithm SHA256 <artifact>
```

### Deploy

Current state:

- NodeMuncher is not broad-public deployed as a normal customer download.
- Internal alpha artifacts and local install smokes exist.
- Do not publish NodeMuncher broadly without a separate launch milestone.

If deploying an internal alpha artifact:

1. build artifact
2. compute SHA256
3. place artifact in intended internal distribution location
4. document path and SHA
5. run local install/launch/uninstall smoke

### Verify

Minimum controlled-alpha checks:

- installer hash recorded
- app launches without console flash
- pairing screen or existing node state appears
- paired node heartbeats
- lease auth rejects missing/invalid token
- known-good render path still works if running E2E
- uninstall leaves no unexpected application binary

Evidence:

- `release/NODEMUNCHER_FRESH_INSTALL_V1.md`
- `release/NODEMUNCHER_LEASE_FAILURE_REPORT_V1.md`
- `release/NODEMUNCHER_LAUNCH_AUDIT_V1.md`
- `docs/FARPY_BOOK/TECH_DEBT_REGISTER.md`

### Rollback

Current rollback posture:

- manual artifact rollback only
- no broad public auto-update rollback path is frozen

Required before broad launch:

- signed installer/update strategy
- versioned artifact manifest
- downgrade/rollback instructions
- token persistence recovery behavior

## Benchmark

Scope:

- Farpy Benchmark Windows desktop utility
- public Windows EXE/MSI downloads
- SHA sidecars
- public benchmark pages/API

Source:

- `C:\Users\danki\Desktop\nodemuncher-codex`

Public artifact URLs:

- `https://farpy.com/downloads/farpy-benchmark-windows-amd64.exe`
- `https://farpy.com/downloads/farpy-benchmark-windows-amd64.exe.sha256`
- `https://farpy.com/downloads/farpy-benchmark-windows-amd64.msi`
- `https://farpy.com/downloads/farpy-benchmark-windows-amd64.msi.sha256`

### Build

Known commands:

```powershell
npm.cmd run build
npm.cmd run tauri -- build
```

Known artifact locations:

```text
C:\Users\danki\Desktop\nodemuncher-codex\src-tauri\target\release\bundle\nsis\Farpy Benchmark_0.1.0_x64-setup.exe
C:\Users\danki\Desktop\nodemuncher-codex\src-tauri\target\release\bundle\msi\Farpy Benchmark_0.1.0_x64_en-US.msi
```

### Backup

Before replacing public Benchmark artifacts:

```bash
backup="/opt/farpy.com/out.backup-benchmark-<milestone>.<timestamp>"
cp -a /opt/farpy.com/out "$backup"
```

Local artifact hashes must be recorded:

```powershell
Get-FileHash -Algorithm SHA256 '<artifact>'
```

### Deploy

Known pattern:

1. copy rebuilt EXE/MSI into `farpy-frontend/public/downloads`
2. regenerate `.sha256` sidecars
3. run frontend build
4. archive relevant static output/artifacts
5. upload archive to Node A
6. extract into `/opt/farpy.com/out` after backing up static root

Evidence:

- `release/BENCHMARK_PUBLIC_DOWNLOADS_V1.md`
- `release/BENCHMARK_PUBLIC_DEPLOY_VERIFY_V1.md`
- `release/BENCHMARK_PUBLIC_REPUBLISH_BLENDER_REQUIRED_V1.md`
- `release/BENCHMARK_PUBLIC_REPUBLISH_RUNTIME_FIX_V1.md`

### Verify

Known checks:

```bash
curl -I https://farpy.com/downloads
curl -I https://farpy.com/benchmark
curl -I https://farpy.com/downloads/farpy-benchmark-windows-amd64.exe
curl -I https://farpy.com/downloads/farpy-benchmark-windows-amd64.exe.sha256
curl -I https://farpy.com/downloads/farpy-benchmark-windows-amd64.msi
curl -I https://farpy.com/downloads/farpy-benchmark-windows-amd64.msi.sha256
```

Hash verification:

- redownload production artifact
- compute SHA256
- compare with sidecar and release note

Runtime smoke evidence from `BENCHMARK_PUBLIC_REPUBLISH_RUNTIME_FIX_V1`:

- installer exit code `0`
- app opened
- no recent `cmd.exe` process/window
- Run Test showed `Preparing...`
- benchmark completed
- score shown
- Share button enabled

### Rollback

Known rollback pattern:

- restore previous `/opt/farpy.com/out` backup
- or replace only Benchmark artifacts and sidecars from previous known-good backup

Gap:

- Benchmark signing/update path remains deferred.
- Benchmark promotion is separate from Farpy retail alpha.

## Blender Add-on

Scope:

- `/addon` static page
- `/downloads/Farpy-Blender-Addon-unified.zip`
- `/downloads/Farpy-Blender-Addon-unified.zip.sha256`

Source artifact:

```text
C:\Users\danki\Desktop\farpy-frontend\public\downloads\Farpy-Blender-Addon-unified.zip
```

Latest deployed hash evidence:

```text
BE2312CE5E77A1E62C1255A95765AE1C89BEF73E5CEDF114B9E7D75A6DAA7708
```

### Build

If only the page/static ZIP changes:

```powershell
Set-Location 'C:\Users\danki\Desktop\farpy-frontend'
npm.cmd run build
```

If the add-on Python changes:

- run Python syntax check on add-on source
- rebuild ZIP
- compute SHA256
- update page and sidecar
- run frontend build

Known gap:

- canonical editable add-on source/package script is not fully consolidated in the Farpy Book.

### Backup

Known static backup pattern:

```bash
backup="/opt/farpy.com/out.bak.addon_production_deploy_v1.<timestamp>"
cp -a /opt/farpy.com/out "$backup"
```

### Deploy

Known deploy pattern from `ADDON_PRODUCTION_DEPLOY_V1`:

```powershell
tar -czf C:\tmp\farpy-out-addon-production-deploy-v1-<timestamp>.tar.gz -C C:\Users\danki\Desktop\farpy-frontend\out .
scp -q C:\tmp\farpy-out-addon-production-deploy-v1-<timestamp>.tar.gz root@farpy.com:/tmp/farpy-out-addon-production-deploy-v1-<timestamp>.tar.gz
```

Remote:

```bash
cp -a /opt/farpy.com/out /opt/farpy.com/out.bak.addon_production_deploy_v1.<timestamp>
tar -xzf /tmp/farpy-out-addon-production-deploy-v1-<timestamp>.tar.gz -C /opt/farpy.com/out
test -f /opt/farpy.com/out/addon.html
test -f /opt/farpy.com/out/downloads/Farpy-Blender-Addon-unified.zip
test -f /opt/farpy.com/out/downloads/Farpy-Blender-Addon-unified.zip.sha256
```

### Verify

Known checks:

```bash
curl -I https://farpy.com/addon
curl -I https://farpy.com/downloads
curl -I https://farpy.com/downloads/Farpy-Blender-Addon-unified.zip
curl -I https://farpy.com/downloads/Farpy-Blender-Addon-unified.zip.sha256
```

Content/hash checks:

- `/addon` contains `Farpy Render Delivery`
- `/addon` contains `Download Blender Add-on`
- `/addon` displays current SHA256
- old hashes absent
- live downloaded ZIP hash matches sidecar

Install smoke:

- verify ZIP hash
- install in Blender
- enable add-on
- confirm panel copy appears
- confirm no traceback

Evidence:

- `release/ADDON_PRODUCTION_DEPLOY_V1.md`
- `release/ADDON_INSTALL_SMOKE_V1.md`
- `release/BLENDER_ADDON_FINAL_AUDIT_V1.md`

### Rollback

Known rollback pattern:

- restore previous `/opt/farpy.com/out` backup
- or restore previous add-on ZIP, sidecar, `/addon` page, and chunks from known-good static backup

Gap:

- versioned add-on artifact manifest should be made canonical before broader add-on promotion.

## Caddy / Route Deployments

Some frontend deployments require Caddy/static route support.

Example:

- `WORKSPACE_PRODUCTION_DEPLOY_V3` added a narrow route for `/workspace/JOB-*`.

### Build

No build unless static source changed.

### Backup

```bash
cp -a /etc/caddy/caddy.real.json /etc/caddy/caddy.real.json.bak.<milestone>.<timestamp>
```

### Deploy

1. edit config
2. validate
3. restart/reload Caddy

```bash
caddy validate --config /etc/caddy/Caddyfile
systemctl restart caddy
```

### Verify

```bash
curl -I https://farpy.com/
curl -I https://farpy.com/<changed-route>
systemctl status caddy --no-pager -l
```

### Rollback

```bash
cp -a /etc/caddy/caddy.real.json.bak.<known-good> /etc/caddy/caddy.real.json
caddy validate --config /etc/caddy/Caddyfile
systemctl restart caddy
```

Gap:

- exact Caddy source-of-truth and generated/adapted config relationship should be documented in a dedicated Caddy runbook.

## Product Deployment Timeline

| Product | Current Deploy Class | Build Proof | Backup Proof | Deploy Proof | Verify Proof | Rollback Proof |
|---|---|---|---|---|---|---|
| Frontend | Static `out` to `/opt/farpy.com/out` | YES | YES | YES | YES | PARTIAL |
| Backend | Script/config + systemd restart | YES for changed scripts | YES | YES | YES | PARTIAL |
| NodeMuncher | Controlled alpha artifact | PARTIAL | PARTIAL | INTERNAL ONLY | PARTIAL | UNKNOWN |
| Benchmark | Tauri build + static download artifact | YES | YES | YES | YES | PARTIAL |
| Add-on | ZIP + static page/download | YES | YES | YES | YES | PARTIAL |

## Known Deployment Gaps

P1:

1. Backend rollback matrix is not canonical.
2. `scripts/job-api.mjs` needs change guardrails because it spans auth, wallet, payments, jobs, receipts, downloads, workers, and ops.
3. Production config templates for Caddy/systemd/env files are not fully source-controlled.
4. NodeMuncher broad public deployment/update/rollback path is not ready.

P2:

1. Static frontend rollback needs a single “known good” selection procedure.
2. Add-on artifact version manifest should be canonical.
3. Benchmark artifact manifest should be canonical.
4. Deployment notes should eventually be consolidated into a `RUNBOOK_DEPLOY_AND_ROLLBACK.md`.

## Related Evidence

- `release/HOMEPAGE_PACKAGE_LABEL_FLOW_DEPLOY_V1.md`
- `release/WORKSPACE_PRODUCTION_DEPLOY_V3.md`
- `release/ADDON_PRODUCTION_DEPLOY_V1.md`
- `release/BENCHMARK_PUBLIC_REPUBLISH_RUNTIME_FIX_V1.md`
- `release/BENCHMARK_PUBLIC_DEPLOY_VERIFY_V1.md`
- `release/BENCHMARK_PUBLIC_DOWNLOADS_V1.md`
- `docs/FARPY_BOOK/RUNBOOK_STATUS.md`
- `docs/FARPY_BOOK/CONSOLIDATION_REPORT.md`
- `docs/FARPY_BOOK/SECOND_OPERATOR_GAPS.md`
- `docs/FARPY_BOOK/CONFIG_AUDIT_V1.md`
- `docs/FARPY_BOOK/CODE_MAP.md`

## Commands Run

```powershell
Get-Content -LiteralPath 'C:\Users\danki\Desktop\farpy-frontend\docs\FARPY_BOOK\CONSOLIDATION_REPORT.md' -Raw
Get-Content -LiteralPath 'C:\Users\danki\Desktop\farpy-frontend\docs\FARPY_BOOK\RUNBOOK_STATUS.md' -Raw
Get-ChildItem -LiteralPath 'C:\Users\danki\Desktop\farpy-frontend\release' -File | Where-Object { $_.Name -match 'DEPLOY|REBUILD|REPUBLISH|DOWNLOAD|ADDON|BENCHMARK|NODEMUNCHER|FRONTEND|WORKSPACE|HOMEPAGE' } | Sort-Object LastWriteTime -Descending | Select-Object Name,LastWriteTime,Length
Get-Content -LiteralPath 'C:\Users\danki\Desktop\farpy-frontend\docs\FARPY_BOOK\12_DEPLOYMENT.md' -Raw
Get-Content -LiteralPath 'C:\Users\danki\Desktop\farpy-frontend\release\HOMEPAGE_PACKAGE_LABEL_FLOW_DEPLOY_V1.md' -Raw
Get-Content -LiteralPath 'C:\Users\danki\Desktop\farpy-frontend\release\WORKSPACE_PRODUCTION_DEPLOY_V3.md' -Raw
Get-Content -LiteralPath 'C:\Users\danki\Desktop\farpy-frontend\release\ADDON_PRODUCTION_DEPLOY_V1.md' -Raw
Get-Content -LiteralPath 'C:\Users\danki\Desktop\farpy-frontend\release\BENCHMARK_PUBLIC_REPUBLISH_RUNTIME_FIX_V1.md' -Raw
```

No production changes were made.
No code was changed.
