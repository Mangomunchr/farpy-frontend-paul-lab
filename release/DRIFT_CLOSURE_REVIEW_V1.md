# DRIFT_CLOSURE_REVIEW_V1

Status: PASS

## Summary

| Item | Status | Files created | Secrets avoided | Production changes | Completeness | Next action |
| --- | --- | --- | --- | --- | --- | --- |
| CADDY_TEMPLATE_SOURCE_CONTROL_V1 | GREEN | Yes | Yes | No | Strong route template and route book entry exist. | Add an automated `caddy adapt`/route diff check. |
| SYSTEMD_TEMPLATE_SOURCE_CONTROL_V1 | YELLOW | Yes | Yes | No | Launch-critical templates exist, but not every historical/static/masked unit is modeled. | Generate a normalized unit manifest and verify templates with `systemd-analyze verify` in a staging path. |
| ETC_FARPY_MANIFEST_V1 | YELLOW | Yes | Yes | No | Manifest lists discovered files and systemd references, but purposes are partly inferred and script-level references are not proven. | Add a no-content scanner that maps `/etc/farpy/*` references across `/opt`, `/usr/local/bin`, and service scripts. |
| STATIC_ARTIFACT_MANIFEST_V1 | YELLOW | Yes | Yes | No | Critical categories and downloads are documented, but full per-file preservation manifest is not generated yet. | Add a deploy preservation manifest generator for `downloads/**`, generated JSON, `receipt-static/**`, and sidecars. |
| PRODUCTION_DRIFT_GUARD_PLAN_V1 | GREEN | Yes | Yes | No | Plan is complete for a plan-only milestone. | Implement `scripts/production-drift-guard-v1.ps1`. |

## Item Reviews

### CADDY_TEMPLATE_SOURCE_CONTROL_V1

Status: GREEN

Files created:

- `infra/caddy/caddy.real.template.json`
- `docs/FARPY_BOOK/CADDY_ROUTES.md`
- `release/CADDY_TEMPLATE_SOURCE_CONTROL_V1.md`

Secrets avoided: yes.

Production changes: no.

Completeness:

- Public routes documented.
- API proxy routes documented.
- Static roots documented.
- Workspace `JOB-*` route documented.
- Downloads routes documented.
- Generated status/audit artifact caveats documented.
- JSON template parse was verified.

Missing proof:

- The template is intentionally not a deployable Caddy config.
- No automated comparison yet between live `caddy adapt` output and the source-controlled template.

Next action:

- Build a read-only Caddy drift check that normalizes production routes and fails on missing P0 route families.

### SYSTEMD_TEMPLATE_SOURCE_CONTROL_V1

Status: YELLOW

Files created:

- `infra/systemd/README.md`
- launch-critical unit templates under `infra/systemd/`
- launch-critical drop-in templates under `infra/systemd/*.service.d/`
- `docs/FARPY_BOOK/SYSTEMD_SERVICES.md`
- `release/SYSTEMD_TEMPLATE_SOURCE_CONTROL_V1.md`

Secrets avoided: yes.

Production changes: no.

Completeness:

- Caddy, auth, checkout/top-up, upload/jobs, web-render API, Stripe webhook, NodeMuncher pair/node API, leaderboard, ops/status/funnel/backup timers are covered.
- Templates use `EnvironmentFile=` boundaries rather than copied inline secret values.

Missing proof:

- Templates have not been rendered into a staging directory and checked with `systemd-analyze verify`.
- Production has many historical/static/masked units that are documented as intentionally out of scope, but not fully classified.
- Some production units still have inline `Environment=` entries; templates model safer target behavior but do not prove production cleanup.

Next action:

- Generate a machine-readable launch-critical unit manifest and validate templates syntactically in a non-production path.

### ETC_FARPY_MANIFEST_V1

Status: YELLOW

Files created:

- `docs/FARPY_BOOK/ETC_FARPY_MANIFEST.md`
- `release/ETC_FARPY_MANIFEST_V1.md`

Secrets avoided: yes.

Production changes: no.

Completeness:

- Lists `/etc/farpy` file paths.
- Includes owner, inferred purpose, systemd service usage, secret classification, and backup priority.
- Did not read or print file contents.

Missing proof:

- Service usage is based on systemd references only.
- Script/application references outside systemd are not mapped.
- Purpose is inferred for some files.
- Historical backup files may contain sensitive material and need a separate permission/content-handling review without printing values.

Next action:

- Add a redacted reference scanner across `/opt/farpy*`, `/var/lib/farpy*`, and `/usr/local/bin` to improve service/purpose mapping.

### STATIC_ARTIFACT_MANIFEST_V1

Status: YELLOW

Files created:

- `docs/FARPY_BOOK/STATIC_ARTIFACT_MANIFEST.md`
- `release/STATIC_ARTIFACT_MANIFEST_V1.md`

Secrets avoided: yes.

Production changes: no.

Completeness:

- Documents `/opt/farpy.com/out`.
- Covers downloads, add-on ZIP, SHA256 sidecars, status JSON, audit/proof JSON, generated root JSON, `node/*.json`, `project-status/*.json`, and `receipt-static/**`.
- Includes observed counts and important public artifact hashes.

Missing proof:

- It is a category manifest, not a full generated per-file manifest.
- No deploy script currently consumes it.
- `proof/recent.json` public-safety handling remains an open question.
- Sidecar contents were not all independently compared against artifact hashes in this review.

Next action:

- Implement a preservation manifest generator and sidecar verifier as part of deploy preflight.

### PRODUCTION_DRIFT_GUARD_PLAN_V1

Status: GREEN

Files created:

- `docs/FARPY_BOOK/PRODUCTION_DRIFT_GUARD.md`
- `release/PRODUCTION_DRIFT_GUARD_PLAN_V1.md`

Secrets avoided: yes.

Production changes: no.

Completeness:

- Plan covers Caddy drift, systemd drift, missing static generated artifacts, unexpected `/etc/farpy` files, and local `out` vs production mismatch.
- Defines RED/YELLOW/GREEN deploy policy.
- Defines future script path and required output shape.

Missing proof:

- No executable guard exists yet.
- No deploy is currently blocked by this plan.

Next action:

- Implement `scripts/production-drift-guard-v1.ps1` and wire it into pre-deploy workflow.

## Overall Verdict

YELLOW.

The drift documentation baseline is now strong, source-controlled, and secret-safe. The remaining gap is execution: there is not yet a runnable deploy-time guard that enforces the manifests before production deploys.

## Top Remaining Drift Risk

A clean static deploy or manual production edit can still erase or diverge from generated production artifacts because the preservation rules are documented but not enforced.

Most sensitive example:

- `downloads/**`
- `receipt-static/**`
- `status/*.json`
- `proof/*.json`
- `project-status/*.json`
- root generated `*.json`

## Next 3 Actions

1. Implement `scripts/production-drift-guard-v1.ps1` as a read-only preflight that emits RED/YELLOW/GREEN and blocks RED.
2. Add a static preservation manifest generator that compares local `out` with `/opt/farpy.com/out` and produces an explicit copy/regenerate list.
3. Add a redacted production reference scanner for `/etc/farpy` usage outside systemd, then update `docs/FARPY_BOOK/ETC_FARPY_MANIFEST.md`.

## Commands Run

```powershell
Get-Item <five release notes>
Get-ChildItem <infra/docs drift files>
rg -n "Status:|Production Changes|No secret|No secrets|PASS|PLAN_ONLY|No service was restarted|No files were modified|not_a_secret_store|not_a_drop_in_replacement" ...
```

## Production Changes

None.

No production checks were needed for this closure review. No secrets were printed.
