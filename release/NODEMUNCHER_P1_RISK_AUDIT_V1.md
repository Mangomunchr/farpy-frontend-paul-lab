# NODEMUNCHER_P1_RISK_AUDIT_V1

Status: YELLOW

Date: 2026-07-01

Scope: audit only. No production changes. No product code changes.

Objective: audit remaining NodeMuncher P1 risks only:

- earnings authority
- signing/update path
- MSI reliability
- local token storage
- GPU heartbeat metadata
- status UI accuracy

## Summary

NodeMuncher is past the previous P0 safety blockers for controlled alpha, but it is not ready for broad public worker launch.

The remaining risks are P1 rather than P0 because they do not currently prove that customer money, receipts, or render packages are unsafe. They do, however, reduce trust, supportability, and install reliability for external users.

Controlled alpha: YES.

Broad public launch: NO.

## Risk Table

| Area | Status | Launch risk | Evidence | Required next action |
| --- | --- | --- | --- | --- |
| Earnings authority | YELLOW | NodeMuncher can show receipt/history proof, but authoritative earnings amount/payout state is not guaranteed in the desktop UI. | `src-tauri/src/main.rs` probes `/node/v1/nodemuncher/history`, `/earnings`, and `/jobs/completed`; completion marks `earnings_status=not_returned_by_complete_response` if cents are absent. `src-nodemuncher/NodeMuncherApp.tsx` shows "Earnings amount pending. Receipt recorded." | Freeze one canonical production earnings/history endpoint and make desktop display canonical earnings cents plus payout status. |
| Signing/update path | YELLOW | Manual alpha distribution is acceptable, but broad launch lacks signed update/rollback trust. | `src-tauri/tauri.nodemuncher.conf.json` has bundle targets but no updater config. `release/RELEASE_CANDIDATE_V1.md` records code signing not present, EV signing incomplete, and macOS DMG unsigned. | Complete Authenticode/EV signing decision and define signed update or hash-pinned manual rollback path before broad launch. |
| MSI reliability | YELLOW | MSI is not the safest friend-install path. | `release/NODEMUNCHER_CLEAN_INSTALL_SMOKE_V1.md` records MSI error 1925 / exit 1603 in the tested environment; NSIS user-scope install passed. | Use NSIS for controlled alpha. Keep MSI hidden/internal until admin/elevation path is intentionally supported and re-smoked. |
| Local token storage | YELLOW | Node token is stored as plaintext local JSON. Acceptable only for controlled alpha testers. | `src-tauri/src/main.rs` writes `node_token` into `%LOCALAPPDATA%\\FarpyNode\\node.json`; UI reports only `token_present`. | Move node token to OS credential storage or encrypted-at-rest platform storage before broad public worker launch. |
| GPU heartbeat metadata | YELLOW | UI-detected GPU data and production heartbeat metadata can diverge. | Pairing stores `gpu_name=UNKNOWN_GPU`; heartbeat sends `node.gpu_name`; UI separately probes GPUs through `collect_system_probe`. | Send current probed GPU/vendor/VRAM metadata in heartbeat, then update local node metadata after successful probe. |
| Status UI accuracy | YELLOW | Status page can imply worker is not running even during manual render work. | `read_worker_status()` returns `worker_running:false` and `process_count:0`; UI displays those fields. Settings copy still says production render-job controls are not enabled while Run Render exists. | Either remove untrue worker/process claims or wire them to actual active render state; update Settings copy to match current alpha controls. |

## Current Alpha Boundary

Accepted for controlled alpha:

- operator-supervised installs
- known testers only
- NSIS preferred over MSI
- explicit artifact hash shared with tester
- plaintext token risk disclosed
- earnings verified by backend/operator when needed
- manual rollback

Not accepted for broad public launch:

- unsigned or reputation-poor installer
- no signed update path
- plaintext node token as default public posture
- non-authoritative earnings display
- misleading status fields
- MSI path with known privilege caveat

## Findings

### 1. Earnings Authority

Status: YELLOW.

NodeMuncher can prove that a render completed through receipt/history data, but desktop earnings are not yet authoritative.

Evidence:

- `C:\\Users\\danki\\Desktop\\nodemuncher-codex\\src-tauri\\src\\main.rs`:
  - `backend_node_history()` tries `/node/v1/nodemuncher/history`, `/node/v1/nodemuncher/earnings`, and `/node/v1/nodemuncher/jobs/completed`.
  - The complete result reports `earnings_status=not_returned_by_complete_response` when earnings fields are absent.
- `C:\\Users\\danki\\Desktop\\nodemuncher-codex\\src-nodemuncher\\NodeMuncherApp.tsx`:
  - `formatEarnings()` returns "Earnings amount pending. Receipt recorded." when no amount is present.

Impact:

- A tester can verify a receipt exists.
- A tester cannot always verify canonical earning amount or payout state from the desktop alone.

Recommendation:

- Before broad launch, expose one canonical NodeMuncher earnings/history endpoint that returns `job_id`, `receipt_id`, `completed_at`, `earning_cents`, `payout_status`, and immutable receipt reference.

### 2. Signing / Update Path

Status: YELLOW.

The app can be distributed internally, but the public trust path is incomplete.

Evidence:

- `C:\\Users\\danki\\Desktop\\nodemuncher-codex\\src-tauri\\tauri.nodemuncher.conf.json`:
  - bundle targets are `msi` and `nsis`
  - no updater configuration is present
  - no signing metadata is present
- `C:\\Users\\danki\\Desktop\\nodemuncher-codex\\release\\RELEASE_CANDIDATE_V1.md`:
  - code signing is not present
  - EV signing is not complete
  - macOS DMG is unsigned

Impact:

- External installs may trigger Windows trust warnings.
- A bad public build would require manual replacement.
- There is no signed emergency update or rollback channel.

Recommendation:

- Keep NodeMuncher controlled alpha.
- Finish EV/AuthentiCode signing or document a deliberate non-EV policy.
- Add a signed updater or freeze a hash-pinned manual update/rollback process before broad launch.

### 3. MSI Reliability

Status: YELLOW.

NSIS is the current proven Windows installer path. MSI remains weaker.

Evidence:

- `C:\\Users\\danki\\Desktop\\nodemuncher-codex\\release\\NODEMUNCHER_CLEAN_INSTALL_SMOKE_V1.md`:
  - NSIS install/launch/uninstall passed.
  - MSI required elevated all-users install privileges and returned Windows Installer error 1925 / exit 1603 in the tested environment.

Impact:

- Sending MSI to a friend tester may fail before pairing.
- Installer confusion increases support load.

Recommendation:

- Controlled alpha should distribute NSIS only unless MSI is the specific thing being tested.
- MSI should stay internal until the admin/elevation behavior is documented and revalidated.

### 4. Local Token Storage

Status: YELLOW.

Node identity persists locally, but token storage is not hardened.

Evidence:

- `C:\\Users\\danki\\Desktop\\nodemuncher-codex\\src-tauri\\src\\main.rs`:
  - `node_data_dir()` resolves `%LOCALAPPDATA%\\FarpyNode`.
  - pair confirmation writes `node_token` into `node.json`.
- `C:\\Users\\danki\\Desktop\\farpy-frontend\\docs\\FARPY_BOOK\\04_NODEMUNCHER.md` records plaintext local JSON as acceptable for controlled alpha only.

Impact:

- Local malware or another local user with filesystem access may be able to copy the node token.
- This is not acceptable as the default posture for a broad worker network.

Recommendation:

- Move token storage to Windows Credential Manager / OS credential storage before broad public launch.
- Until then, keep testers trusted and document `Forget Node` / local data cleanup.

### 5. GPU Heartbeat Metadata

Status: YELLOW.

NodeMuncher has local GPU probing, but heartbeat metadata may not reflect it.

Evidence:

- Pairing writes `gpu_name: "UNKNOWN_GPU"` to local node metadata.
- `send_heartbeat_once()` sends `gpu_name` from stored local node metadata.
- `NodeMuncherApp.tsx` separately calls `collect_system_probe()` and displays probed GPU names.

Impact:

- Production eligibility/status can be less accurate than what the desktop UI sees.
- Operators may need manual confirmation for node capability.

Recommendation:

- Send current probe GPU names/vendor/VRAM with each heartbeat.
- Persist the most recent successful GPU probe into node metadata.

### 6. Status UI Accuracy

Status: YELLOW.

Some status fields are still not truthful enough for broad external users.

Evidence:

- `read_worker_status()` returns:
  - `worker_running: false`
  - `process_count: 0`
- `NodeMuncherApp.tsx` displays these values.
- Settings tab still says "Production render-job controls are not enabled in this bootstrap" while the app exposes Check for Job, Claim Job, and Run Render.

Impact:

- A tester may see contradictory status while a render path exists.
- Support diagnosis becomes harder.

Recommendation:

- Track active render command state and show it truthfully, or remove worker-running/process-count rows from the UI.
- Replace stale Settings copy with alpha-accurate settings/status text.

## Ship Risk

| Launch mode | Recommendation | Reason |
| --- | --- | --- |
| Controlled alpha | YES | P0 worker-safety issues are GREEN; remaining items are manageable with known testers and operator supervision. |
| Friend install | YES, limited | Use NSIS, share SHA256, disclose alpha risks, and monitor first render. |
| Broad public launch | NO | Signing/update, token storage, earnings authority, MSI reliability, and status accuracy are not launch-grade yet. |

## Next Actions

1. Keep NodeMuncher in controlled alpha and distribute NSIS only.
2. Implement canonical earnings/history display before promising earnings self-service.
3. Decide signing/update path before public worker launch.
4. Harden local token storage with OS credential storage.
5. Make GPU heartbeat metadata and status UI truthful.

## Commands Run

```powershell
$p='C:\\Users\\danki\\Desktop\\farpy-frontend\\docs\\FARPY_BOOK\\04_NODEMUNCHER.md'; Get-Content -LiteralPath $p -Raw
$p='C:\\Users\\danki\\Desktop\\farpy-frontend\\docs\\FARPY_BOOK\\NODEMUNCHER_ALPHA_GATE.md'; Get-Content -LiteralPath $p -Raw
$p='C:\\Users\\danki\\Desktop\\nodemuncher-codex\\release\\NODEMUNCHER_LAUNCH_AUDIT_V1.md'; Get-Content -LiteralPath $p -Raw
$p='C:\\Users\\danki\\Desktop\\nodemuncher-codex\\src-tauri\\src\\main.rs'; $lines=Get-Content -LiteralPath $p; foreach($range in @(@(619,623),@(1090,1125),@(1160,1195),@(1250,1278),@(1284,1312),@(1488,1505),@(1538,1558))){ Write-Host "--- $($range[0])-$($range[1])"; for($i=$range[0]; $i -le $range[1] -and $i -le $lines.Count; $i++){ '{0}:{1}' -f $i,$lines[$i-1] } }
$p='C:\\Users\\danki\\Desktop\\nodemuncher-codex\\src-nodemuncher\\NodeMuncherApp.tsx'; rg -n "earnings|completed|worker_running|process_count|gpu|collect_system_probe|Heartbeat|token_present|not_returned|No completed|pending|Status|Settings|Run Render" $p
Get-Content -LiteralPath 'C:\\Users\\danki\\Desktop\\nodemuncher-codex\\src-tauri\\tauri.nodemuncher.conf.json' -Raw
$p='C:\\Users\\danki\\Desktop\\nodemuncher-codex\\release\\NODEMUNCHER_CLEAN_INSTALL_SMOKE_V1.md'; if(Test-Path -LiteralPath $p){ Select-String -LiteralPath $p -Pattern 'MSI|NSIS|1603|1925|PASS|FAIL|Uninstall|Artifact|SHA|leftover|LEFTOVER' | ForEach-Object { "$($_.LineNumber):$($_.Line)" } } else { 'MISSING NODEMUNCHER_CLEAN_INSTALL_SMOKE_V1.md' }
$p='C:\\Users\\danki\\Desktop\\nodemuncher-codex\\release\\RELEASE_CANDIDATE_V1.md'; if(Test-Path -LiteralPath $p){ Select-String -LiteralPath $p -Pattern 'sign|EV|unsigned|MSI|NSIS|update|SHA|installer' | ForEach-Object { "$($_.LineNumber):$($_.Line)" } } else { 'MISSING RELEASE_CANDIDATE_V1.md' }
$root='C:\\Users\\danki\\Desktop\\nodemuncher-codex'; rg -n "UNKNOWN_GPU|worker_running|process_count|node_token|earnings_status|not_returned_by_complete_response|updater|sign|csp" "$root\\src-tauri" "$root\\src-nodemuncher"
```

## Final Verdict

YELLOW.

No P0 blocker found in the scoped P1 re-audit. The remaining risks are accepted only for controlled alpha. They block broad public NodeMuncher launch.
