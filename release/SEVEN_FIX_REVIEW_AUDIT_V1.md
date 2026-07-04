# SEVEN_FIX_REVIEW_AUDIT_V1

Date: 2026-06-30

## Summary Table

| Item | Status | Ship Risk | Next Action |
| --- | --- | --- | --- |
| WEB_RENDER_BACKUP_ENCRYPTION_PLAN_V1 | RED | High operational recovery risk: milestone evidence not found. | Create the missing backup encryption plan and prove current encrypted/offsite path. |
| WEB_RENDER_INVALID_JSON_FIX_V1 | YELLOW | Malformed JSON fix is live, but full requested auth behavior is not met. | Decide whether unauthenticated valid `/jobs/create` is intentional; if not, add auth gate separately. |
| BENCHMARK_HARD_TIMEOUT_V1 | GREEN | Low. Timeout code and builds are documented; no scoring change found. | Freeze or run an optional forced-timeout smoke before next Benchmark republish. |
| BLENDER_ADDON_AUTH_CLARITY_V1 | YELLOW | Medium-low. Source copy is partly clearer, but no milestone note/package proof found. | Run a focused add-on auth clarity milestone and rebuild/deploy ZIP if changed. |
| OCTANE_FRAME_POLICY_SYNC_V1 | YELLOW | Medium. Local source/build aligned, but production `/addon` and ZIP sidecar are stale. | Deploy updated static output and add-on ZIP/hash, then rescan public pages. |
| NODEMUNCHER_LEASE_FAILURE_REPORT_V1 | YELLOW | Medium. Endpoint and desktop reporter exist, but no real failed lease proof yet. | Run one controlled claimed-lease failure smoke. |
| NODEMUNCHER_STARTUP_RECOVERY_V1 | YELLOW | Medium. Startup scan/logging works in simulation, but no real interrupted lease proof yet. | Run one controlled interrupted real lease smoke after installing rebuilt NodeMuncher. |

## Overall Verdict

YELLOW.

Most implementation work exists, but only `BENCHMARK_HARD_TIMEOUT_V1` is cleanly complete against its acceptance criteria. Several items are implemented locally or partially deployed but still need production/live proof. One item, `WEB_RENDER_BACKUP_ENCRYPTION_PLAN_V1`, has no matching release note or implementation evidence in the inspected repos.

## Highest-Risk Remaining Item

`WEB_RENDER_BACKUP_ENCRYPTION_PLAN_V1`.

Reason: no matching plan/report was found, and backup encryption/offsite recovery is a survival issue rather than a cosmetic launch polish issue.

## Recommended Next 3 Commands/Milestones

1. `WEB_RENDER_BACKUP_ENCRYPTION_PLAN_V1`: create the missing plan with source paths, encryption method, destination, retention, restore command, and operator approval gates.
2. `OCTANE_FRAME_POLICY_SYNC_DEPLOY_V1`: deploy updated `/addon`, homepage/static output, add-on ZIP, and SHA sidecar; verify stale public copy is gone.
3. `NODEMUNCHER_FAILURE_RECOVERY_PROOF_V1`: run one controlled real claimed lease failure and one controlled interrupted-startup lease to prove `failed/retryable`, no receipt, and no earning.

## 1. WEB_RENDER_BACKUP_ENCRYPTION_PLAN_V1

Status: RED

Files changed:

- No matching release note or implementation file found.

Commands run:

- Searched Farpy and NodeMuncher release/source trees for `WEB_RENDER_BACKUP_ENCRYPTION`, `BACKUP_ENCRYPTION`, encrypted backup terms, and common backup tools.

Build/check result:

- Not applicable.

Deploy status:

- No deploy expected for a plan.

Production impact:

- None from this audit.

Acceptance criteria met:

- Not met. The requested plan artifact was not found.

Missing proof:

- No documented source paths.
- No encryption method.
- No destination/retention statement.
- No restore command.
- No risk note.

Risks introduced:

- None by this audit.

Next required action:

- Create `WEB_RENDER_BACKUP_ENCRYPTION_PLAN_V1` or confirm the exact filename/location if it exists outside the inspected repos.

## 2. WEB_RENDER_INVALID_JSON_FIX_V1

Status: YELLOW

Files changed:

- `C:\Users\danki\Desktop\farpy-frontend\scripts\job-api.mjs`
- `C:\Users\danki\Desktop\farpy-frontend\release\WEB_RENDER_INVALID_JSON_FIX_V1.md`

Commands run:

- Read release note.
- Inspected `scripts/job-api.mjs`.
- Safe production probes:
  - `GET https://farpy.com/node/v1/web-render/health`
  - malformed JSON `POST https://farpy.com/node/v1/web-render/jobs/create`

Build/check result:

- Release note records production `node --check` pass.

Deploy status:

- Deployed per release note.
- Production backup recorded: `/opt/farpy-web-render/scripts/job-api.mjs.bak.web-render-invalid-json-fix-v1.20260630T193914Z`.

Production impact:

- Positive: malformed JSON now fails closed.

Acceptance criteria:

- `malformed JSON -> 400 invalid_json`: met. Live probe returned `400 {"ok":false,"error":"invalid_json"}`.
- `health -> 200`: met. Live probe returned `200`.
- `valid unauth JSON -> 401 auth_required`: not met per release note. Prior validation created `JOB-0DFB7C4F` with `200 OK`.

Missing proof:

- No current non-mutating proof that valid unauth JSON is blocked, because repeating that test would create another production job.

Risks introduced:

- The JSON fix itself is narrow. The remaining risk is pre-existing unauthenticated job creation behavior, not this patch.

Next required action:

- Decide whether unauthenticated valid job creation is intentional. If not, run a separate auth-gate fix.

## 3. BENCHMARK_HARD_TIMEOUT_V1

Status: GREEN

Files changed:

- `C:\Users\danki\Desktop\nodemuncher-codex\src-tauri\src\main.rs`
- `C:\Users\danki\Desktop\nodemuncher-codex\release\BENCHMARK_HARD_TIMEOUT_V1.md`

Commands run:

- Read release note.
- Inspected timeout code.

Build/check result:

- Release note records:
  - `npm.cmd run build`: PASS
  - `npm.cmd run tauri -- build`: PASS

Deploy status:

- Desktop artifacts built locally; no production web deploy required for this fix.

Production impact:

- None until installers are republished/installed.

Acceptance criteria:

- Timeout exists around Blender child process: met. `BENCHMARK_RENDER_TIMEOUT_SECS = 600` and `run_hidden_with_timeout` are present.
- Human-readable failure: met. Code returns `Benchmark timed out after 600 seconds. Blender was stopped before it could finish.`
- Build passes: met per release note.
- No scoring distortion: met by code path; timeout returns failure with `render_time_ms=0`, successful scoring path unchanged.

Missing proof:

- Optional forced-timeout runtime smoke not found.

Risks introduced:

- Low. A 10-minute cap may fail very slow legitimate benchmark runs, but it prevents indefinite hangs.

Next required action:

- Optional: run a forced-timeout smoke before republishing Benchmark installers again.

## 4. BLENDER_ADDON_AUTH_CLARITY_V1

Status: YELLOW

Files changed:

- No matching `BLENDER_ADDON_AUTH_CLARITY_V1.md` found.
- Existing add-on source inspected:
  - `C:\Users\danki\Desktop\farpy_blender_addon_octane_export\farpy_render\__init__.py`

Commands run:

- Searched add-on source for `api_key`, `token`, `secret`, `password`, `auth`, `session`, `localhost`, and `127.0.0.1`.
- Inspected add-on UI copy around session/auth/token fields.

Build/check result:

- No build/check proof found for this named milestone.

Deploy status:

- Not proven.
- Live add-on SHA sidecar still reports old hash `BE2312CE5E77A1E62C1255A95765AE1C89BEF73E5CEDF114B9E7D75A6DAA7708`, not the newer local ZIP hash from `OCTANE_FRAME_POLICY_SYNC_V1`.

Production impact:

- None proven from this named milestone.

Acceptance criteria:

- No fake token generation: met by source inspection.
- Auth copy clear: partially met. Add-on shows `Check Farpy Sign-in`, `Please sign in to Farpy before sending a package.`, and settings are under `Advanced connection`.
- Package ZIP rebuilt if add-on changed: not proven for this milestone.
- Live `/addon` hash updated if ZIP changed: not met/proven; live sidecar still old.

Missing proof:

- No release note.
- No package rebuild tied to this milestone.
- No install smoke tied to this milestone.
- No live `/addon` proof tied to this milestone.

Risks introduced:

- No new code risk proven, but auth/token UX may still confuse users because the field remains named `API key/token`.

Next required action:

- Run a focused `BLENDER_ADDON_AUTH_CLARITY_V1`: rename/clarify the token field if needed, rebuild ZIP, update hash, and publish if approved.

## 5. OCTANE_FRAME_POLICY_SYNC_V1

Status: YELLOW

Files changed:

- `C:\Users\danki\Desktop\farpy-frontend\src\components\HomeRenderFlow.tsx`
- `C:\Users\danki\Desktop\farpy-frontend\src\components\AddonPage.tsx`
- `C:\Users\danki\Desktop\farpy-frontend\src\app\downloads\page.tsx`
- `C:\Users\danki\Desktop\farpy-frontend\public\downloads\Farpy-Blender-Addon-unified.zip`
- `C:\Users\danki\Desktop\farpy-frontend\public\downloads\Farpy-Blender-Addon-unified.zip.sha256`
- `C:\Users\danki\Desktop\Farpy-Blender-Addon-unified.zip`
- `C:\Users\danki\Desktop\farpy_blender_addon_octane_export\farpy_render\__init__.py`
- `C:\Users\danki\Desktop\farpy-frontend\release\OCTANE_FRAME_POLICY_SYNC_V1.md`

Commands run:

- Read release note.
- Inspected source.
- Safe production probes of `/`, `/addon`, `/docs`, `/faq`, `/files`.
- Fetched live add-on SHA sidecar.

Build/check result:

- Release note records `npm.cmd run build`: PASS.
- Release note records add-on ZIP SHA verification.

Deploy status:

- Not deployed/proven.
- Live `/addon` still contains stale copy: `Octane .orbx packages should be sent from`.
- Live add-on SHA sidecar still reports old hash: `BE2312CE5E77A1E62C1255A95765AE1C89BEF73E5CEDF114B9E7D75A6DAA7708`.

Production impact:

- Local/source policy is aligned, but public `/addon` remains stale until deployment.

Acceptance criteria:

- One consistent local/source policy: met.
- No stale still-only vs multi-frame contradiction in inspected source/build: met per release note.
- Public consistency: not met because live `/addon` is stale.

Missing proof:

- Static deploy proof.
- Live ZIP/hash update.
- Live scan proving stale copy absent.

Risks introduced:

- Users may still see stale add-on wording until deployment.

Next required action:

- Deploy updated static output and add-on ZIP/hash; verify `/addon` and `/downloads/Farpy-Blender-Addon-unified.zip.sha256`.

## 6. NODEMUNCHER_LEASE_FAILURE_REPORT_V1

Status: YELLOW

Files changed:

- `C:\Users\danki\Desktop\nodemuncher-codex\src-tauri\src\main.rs`
- `C:\Users\danki\Desktop\farpy-frontend\scripts\job-api.mjs`
- `C:\Users\danki\Desktop\farpy-frontend\release\NODEMUNCHER_LEASE_FAILURE_REPORT_V1.md`

Commands run:

- Read release note.
- Inspected backend and desktop code.
- Safe production probes:
  - missing token fail route
  - invalid token fail route
  - valid paired token with nonexistent job
  - health

Build/check result:

- Release note records:
  - `node --check scripts\job-api.mjs`
  - `npm.cmd run build`
  - `npm.cmd run build:nodemuncher`
  - `cargo check`
  - `npm.cmd run tauri:nodemuncher`

Deploy status:

- Backend deployed.
- Production backup recorded: `/opt/farpy-web-render/scripts/job-api.mjs.bak.nodemuncher_lease_failure_report_v1.20260630T201657Z`.

Production impact:

- Positive: authenticated fail route now exists and fails closed.

Acceptance criteria:

- Local render fail reports to production fail endpoint: implemented in code, but not proven with a real failing claimed lease.
- Leased job becomes failed/retryable, not stranded: endpoint implements this, but real job proof missing.
- Logs show failure reason: desktop writes `render-log.txt`; real failure proof missing.
- No receipt produced: endpoint deletes receipt fields and does not mint receipt; real job proof missing.
- No payout/earning recorded: no desktop earning on failure; real job proof missing.

Missing proof:

- Controlled real claimed lease failure.
- Production job JSON showing `failed/retryable`.
- Wallet/receipt/earning proof after a real failure.

Risks introduced:

- Low-to-medium. The endpoint is auth/ownership-scoped, but it is new production mutation logic and should be exercised against a real controlled job.

Next required action:

- Run a controlled NodeMuncher failure smoke with a real claimed smoke job.

## 7. NODEMUNCHER_STARTUP_RECOVERY_V1

Status: YELLOW

Files changed:

- `C:\Users\danki\Desktop\nodemuncher-codex\src-tauri\src\main.rs`
- `C:\Users\danki\Desktop\nodemuncher-codex\release\NODEMUNCHER_STARTUP_RECOVERY_V1.md`

Commands run:

- Read release note.
- Inspected startup recovery code.
- Release note records:
  - `npm.cmd run build:nodemuncher`
  - `cargo check`
  - `npm.cmd run tauri:nodemuncher`
  - isolated temp-profile startup smoke

Build/check result:

- Tauri build passed per release note.

Deploy status:

- Local desktop artifacts rebuilt.
- Not installed/published as a public NodeMuncher update in this milestone.

Production impact:

- None until the rebuilt NodeMuncher is installed by an operator/node.

Acceptance criteria:

- Interrupted active lease handled on startup: implemented and simulated locally.
- No duplicate receipt/earning: startup code does not complete jobs or write earnings; real proof missing.
- App launches normally: simulated smoke launched rebuilt app.

Missing proof:

- Real production interrupted lease accepted as `reported_failed`.
- Installed-app smoke on actual NodeMuncher profile.
- Production job proof of no duplicate receipt/earning after recovery.

Risks introduced:

- Medium. Startup recovery uses `curl.exe`; this is simple and direct on Windows, but it adds a runtime dependency on standard Windows curl availability.
- Simulated fake job produced `404 not_found`, which proves detection/logging but not successful production recovery.

Next required action:

- Install rebuilt NodeMuncher and run a controlled real interrupted lease smoke.

## Commands Run During This Audit

- `rg` searches across `C:\Users\danki\Desktop\farpy-frontend`
- `rg` searches across `C:\Users\danki\Desktop\nodemuncher-codex`
- `rg` searches across `C:\Users\danki\Desktop\farpy_blender_addon_octane_export`
- Safe production `GET https://farpy.com/node/v1/web-render/health`
- Safe production malformed JSON `POST https://farpy.com/node/v1/web-render/jobs/create`
- Safe production missing-token `POST https://farpy.com/node/v1/web-render/nodemuncher/jobs/JOB-NONEXISTENT/fail`
- Safe production public page reads for `/`, `/addon`, `/docs`, `/faq`, `/files`
- Safe production read of `/downloads/Farpy-Blender-Addon-unified.zip.sha256`

No secrets were printed. No production deployment was performed during this audit. No production mutation was intentionally performed; malformed JSON and nonexistent-job fail probes are fail-closed checks.
