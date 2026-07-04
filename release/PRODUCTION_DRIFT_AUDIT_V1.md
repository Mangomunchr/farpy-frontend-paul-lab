# PRODUCTION_DRIFT_AUDIT_V1

Status: DOCUMENTED

Date: 2026-06-30

Mode: Read-only audit. No production changes. No secret values printed.

## Objective

Compare repository assumptions against production and identify:

- production-only changes
- repo-only changes
- undocumented drift

Rank findings:

- P1: should resolve before broader operations, second-operator handoff, or repeated unattended deploys.
- P2: document/clean up after launch; not a current customer blocker.

## Executive Summary

Backend source parity is good for the most critical monolithic file:

- Local `scripts/job-api.mjs` hash matches production `/opt/farpy-web-render/scripts/job-api.mjs`.

Primary drift is operational/configuration drift:

1. Production systemd has many drop-ins not represented by repo templates.
2. Production Caddy config is not represented as a source-controlled sanitized template.
3. Production static output differs from local `out` hashes.
4. Production `/etc/farpy` has many env/config files not captured in a single repo manifest.
5. Production static root contains generated status JSON files not in local static output.

No active P0 was proven. The drift is P1/P2 operational risk, not a currently proven broken user flow.

## High-Signal Hash Comparison

| Surface | Local | Production | Result |
|---|---|---|---|
| `scripts/job-api.mjs` | `b5bed297b233a92075c991ac530f560a015581c4ed723386e1bca1ec7f9eb858` | `b5bed297b233a92075c991ac530f560a015581c4ed723386e1bca1ec7f9eb858` | MATCH |
| `out/index.html` | `41FB43B863DAB6949EADAD23C7D702D7F10FFE041B5E36189921D41F9F7...` | `101ff1fb41c6248380d5ae7fb389d951f09577cd5cfc511df28ee77d583ddafe` | DRIFT |
| `out/topup.html` | `3D686A328ABD43396756B881B8A854829B876C84BDBF861835F63C27330...` | `ddca363563ef28119c3e958152398135087aac51dd7c375b202470cdfb021c7d` | DRIFT |
| `out/workspace.html` | `B156783DD8DD14F30934DC9AA810E3BFDE035D37D9D8865FB5F4641CE82...` | `93263d2aed81df04cbb9dfb5d30155a694b3ae452126218da03c1c1688051d4e` | DRIFT |
| `out/downloads.html` | `76D0AB1EB9B1BD8C794F5E67F9963C594829EB2F086D4A5710C7F414933...` | `07cfb9adc2187bacaf75f9f3b00c298f22b26c3bd3260fd74259d4358afe3eb3` | DRIFT |

Note:

- The local hash output was truncated by PowerShell display for sampled pages. The result is still sufficient to prove mismatch.
- Static hash drift can be harmless if local source has moved since the last deploy, but it is still a deploy-state drift that should be recorded.

## P1 Findings

| Finding | Type | Evidence | Risk | Recommended Fix |
|---|---|---|---|---|
| Production systemd drop-ins are not represented in repo templates | Production-only / undocumented drift | Production `systemctl cat` showed many drop-ins for `farpy-web-render-api.service`, `farpy-jobs-api.service`, auth, upload, checkout. Local `deploy/systemd` has only base templates. | Rebuilding from repo alone can miss BTCPay, ops token, node-pair store, queue limits, rate limits, bind overrides, and auth secret env wiring. | Add sanitized `deploy/systemd/drop-ins/` templates and a config manifest. |
| Production Caddy config is not source-controlled as a canonical template | Production-only / undocumented drift | Production hashes exist for `/etc/caddy/Caddyfile` and `/etc/caddy/caddy.real.json`; local repo has no active Caddy config template. | Route fixes, redirects, static rewrites, and security headers can be lost during restore or second-operator handoff. | Add sanitized `deploy/caddy/Caddyfile.example` or `caddy.real.json.example`; document generated/adapted config flow. |
| Production `/etc/farpy` env/config surface is much larger than repo assumptions | Production-only / undocumented drift | Production listed many files: `auth-secrets.env`, `btcpay.env`, `stripe.env`, `web-render-api-secrets.env`, `secrets.env`, `offsite-backup.env`, `discord-webhook.env`, `bunny.env`, `worker.env`, etc. | Secret/config restore depends on production inspection and founder/operator memory. | Create `docs/FARPY_BOOK/CONFIGURATION.md` or `CONFIG_MANIFEST_V1` with path, purpose, owner, secret/non-secret, service consumer. |
| Some production secret-like backup/config files are `0644` | Production-only / possible security drift | Production listing showed examples: `/etc/farpy/farpy.env.bak.20251227T145610Z` mode `644`, `/etc/farpy/worker.env.nodeid.1777580359` mode `644`. Values were not read. | If these contain secret material, group/world readability violates secret-hardening intent. | Inspect only names/contents under controlled secret-handling; chmod/remove stale secret backups if confirmed sensitive. |
| Production jobs API has conflicting historical bind drop-ins | Production-only / undocumented drift | `farpy-jobs-api.service` has `20-bind-all.conf` and `99-wg-bind.conf` with `HOST=0.0.0.0`, plus later `127.0.0.1` drop-ins. | Effective order may currently be safe, but stale contradictory drop-ins make future restarts/edits fragile. | Replace accumulated drop-ins with one canonical localhost-bind drop-in after backup and verification. |
| Production static output hash differs from local `out` for key pages | Repo/prod deploy-state drift | `index.html`, `topup.html`, `workspace.html`, `downloads.html` hashes differ between local and production. | Operator cannot assume current local `out` exactly matches production. A deploy may unintentionally change pages beyond the intended patch. | Before next deploy, rebuild clean, diff output inventory/hashes, and archive production current state. |
| Production static root contains live status JSON not present in local `out` | Production-only / operational drift | Production root includes `e2e-surface-status.json`, `money-loop-status.json`, `nodemuncher-status.json`, `output-reconcile-status.json`, `render-loop-audit.json`, `share-proof-generate-status.json`. Local `out` did not list these. | Clean static root swaps can delete operational status artifacts unless recreated elsewhere. | Decide whether these are generated runtime artifacts, move them outside static root, or include regeneration in deploy runbook. |
| Production auth service depends on `/opt/farpy/config/google-auth.env` plus `/etc/farpy/auth-secrets.env` | Production-only / undocumented drift | `farpy-auth.service` base unit uses `EnvironmentFile=/opt/farpy/config/google-auth.env`; drop-in uses `/etc/farpy/auth-secrets.env`. | Auth restore requires two config roots, not just `/etc/farpy`. | Add auth config roots to backup/restore manifest and config inventory. |

## P2 Findings

| Finding | Type | Evidence | Risk | Recommended Fix |
|---|---|---|---|---|
| Local deploy systemd templates are stale compared to production | Repo-only assumption drift | Local `deploy/systemd/farpy-web-render-api.service` includes Stripe env only; production adds BTCPay/ops/node-pair drop-ins. | New operator may treat local templates as complete when they are base-only. | Label local files as base templates and add drop-in examples. |
| Release/Farpy Book docs are ahead of production source tree but not deployed artifacts | Repo-only docs drift | Many Book docs created locally; no evidence they are deployed to public site. | Not a product issue, but second-operator docs may live only on workstation unless backed up. | Include docs in recovery USB/offsite source backup. |
| Production static root timestamps differ from current local generated output | Deploy-state drift | Production files timestamped around `2026-06-30T13:03:43`; local `out` around `2026-06-30 13:13`. | Normal if local rebuild happened after deploy; confusing during drift audits. | Record deploy artifact hash manifest per deploy. |
| Production `/etc/farpy` includes legacy/historical files | Production-only drift | Names include backups and historical flags such as `*.bak.*`, `*.nofinalize.*`, `PAYOUTS_*`, `KILL_SWITCH`, role markers. | Clutter increases restore and secret audit complexity. | Create a safe-retention inventory; do not delete without owner review. |
| NodeMuncher/Benchmark repo contains local DB/proof/build artifacts | Repo-local drift | Prior scans showed `src\db\nodemuncher.db`, proof JSON, release-dryrun JSON, and build artifacts. | Can confuse source vs runtime state. | Keep ignored and document as dev/proof artifacts. |

## Production-Only Changes Observed

| Path / Surface | Observed Production-Only State | Classification |
|---|---|---|
| `/etc/systemd/system/farpy-web-render-api.service.d/50-worker-token.conf` | references moved secret env pattern | P1 |
| `/etc/systemd/system/farpy-web-render-api.service.d/60-node-pair-store.conf` | production node-pair SQLite path | P1 |
| `/etc/systemd/system/farpy-web-render-api.service.d/70-ops-token.conf` | ops token env file wiring | P1 |
| `/etc/systemd/system/farpy-web-render-api.service.d/80-btcpay-env.conf` | BTCPay env file wiring | P1 |
| `/etc/systemd/system/farpy-jobs-api.service.d/*` | many accumulated queue/bind/capability/rate-limit/drop-in files | P1 |
| `/etc/systemd/system/farpy-auth.service.d/*` | SMTP, operator magic, auth secret env, base URL, Google client ID | P1 |
| `/etc/farpy/*` | many production env/config files beyond repo templates | P1 |
| `/etc/caddy/Caddyfile`, `/etc/caddy/caddy.real.json` | active routing config only observed on production | P1 |
| `/opt/farpy.com/out/*status*.json`, `*audit*.json`, `*reconcile*.json` | runtime/status files in static root | P1/P2 depending on current consumer |

## Repo-Only Changes / Assumptions Observed

| Path / Surface | Repo-Only State | Classification |
|---|---|---|
| `deploy/systemd/farpy-web-render-api.service` | base service template without production drop-ins | P2 |
| `deploy/systemd/farpy-web-render-worker.service` | base worker template; production remote worker state is host-specific | P2 |
| local `out/*.html` | hashes differ from production for sampled pages | P1 before next deploy |
| `docs/FARPY_BOOK/*.md` | many new Book docs not proven deployed to production | P2 |
| `release/*.md` | local release evidence is richer than production config manifests | P2 |

## Undocumented Drift

| Drift | Why It Matters | Priority |
|---|---|---|
| Accumulated systemd drop-ins with conflicting bind intent | A future drop-in ordering change can re-expose or misconfigure services. | P1 |
| Static root contains generated operational JSON | Clean static deploy can erase live operator artifacts. | P1 |
| `/etc/farpy` has many files not mapped in a single manifest | Restore and second-operator handoff are incomplete. | P1 |
| Caddy route/security header config not represented in source | Reverse proxy is critical and source-of-truth is production-only. | P1 |
| Local `out` no longer matches production | Next deploy may include unintended page changes unless diffed. | P1 |

## Current Good News

1. Critical backend `job-api.mjs` matches local source and production exactly.
2. Production services have secret-bearing config mostly in protected env files rather than inline systemd values.
3. Backend port bind hardening appears to have effective localhost drop-ins present, despite stale contradictory files.
4. Production static root has the expected launch pages and artifacts.
5. Production env files listed mostly use `0600 root:root`.

## Recommended Next Actions

1. Create `CONFIG_MANIFEST_V1` listing every `/etc/farpy` file, purpose, owner, consumer service, and secret/non-secret class without values.
2. Create sanitized source templates for production Caddy and systemd drop-ins.
3. Clean up or explicitly retire stale jobs-api bind/capability drop-ins after backup and verification.
4. Move generated status/audit JSON out of `/opt/farpy.com/out` or document deploy regeneration.
5. Before the next static deploy, run a clean local build and compare file/hash manifest against production so unintended changes are visible.

## Commands Run

```powershell
Get-FileHash -Algorithm SHA256 'C:\Users\danki\Desktop\farpy-frontend\scripts\job-api.mjs','C:\Users\danki\Desktop\farpy-frontend\deploy\systemd\farpy-web-render-api.service','C:\Users\danki\Desktop\farpy-frontend\deploy\systemd\farpy-web-render-worker.service'
Get-ChildItem -LiteralPath 'C:\Users\danki\Desktop\farpy-frontend\deploy' -Recurse -File
```

```bash
ssh root@farpy.com "sha256sum /opt/farpy-web-render/scripts/job-api.mjs; find /opt/farpy-web-render ...; systemctl cat ...; sha256sum /etc/caddy/Caddyfile /etc/caddy/caddy.real.json; find /etc/farpy ..."
```

```powershell
Get-ChildItem -LiteralPath 'C:\Users\danki\Desktop\farpy-frontend\release' -File | Sort-Object LastWriteTime -Descending | Select-Object -First 80 Name,LastWriteTime,Length
```

```powershell
Get-ChildItem -LiteralPath 'C:\Users\danki\Desktop\farpy-frontend\out' -File | Select-Object Name,Length,LastWriteTime
Get-FileHash -Algorithm SHA256 'C:\Users\danki\Desktop\farpy-frontend\out\index.html','C:\Users\danki\Desktop\farpy-frontend\out\topup.html','C:\Users\danki\Desktop\farpy-frontend\out\workspace.html','C:\Users\danki\Desktop\farpy-frontend\out\downloads.html'
```

```bash
ssh root@farpy.com "sha256sum /opt/farpy.com/out/index.html /opt/farpy.com/out/topup.html /opt/farpy.com/out/workspace.html /opt/farpy.com/out/downloads.html; find /opt/farpy.com/out ..."
```

No production changes were made.
No secret values were printed.

## Final Status

P1 drift exists.

No customer-facing P0 was proven.

Production should not be considered fully reproducible from repo alone until Caddy, systemd drop-ins, `/etc/farpy` ownership, and static-root runtime artifacts are represented in source-controlled templates or a protected restore manifest.
