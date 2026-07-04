# NODEMUNCHER_STATUS_UI_TRUTH_AUDIT_V1

Status: YELLOW

Date: 2026-07-01

Scope: audit only. No code changes. No production changes.

Objective: audit NodeMuncher UI status truth across paired, idle, claimed, rendering, failed, offline, earnings, and GPU metadata states.

## Verdict

NodeMuncher status UI is acceptable for controlled alpha, but not truthful enough for broad public launch.

Good:

- Paired / not paired is grounded in local node identity and token presence.
- Heartbeat auth/network states are separated clearly.
- Lease idle/available/auth-error states are mostly grounded in production responses.
- Render success/failure comes from the execution command result.
- Earnings amount does not fake money when unavailable.

Needs work:

- `Worker running` and `Worker processes` are hardcoded false/zero.
- Settings copy says production render-job controls are not enabled even though Check for Job, Claim Job, and Run Render exist.
- GPU displayed in UI can diverge from GPU metadata sent in heartbeat.
- `Ready` means paired plus last heartbeat accepted, not necessarily eligible, idle, configured, or currently able to render.
- `Leased` can be inferred from lease metadata, but there is no rich persistent render lifecycle state in the UI.

## Status Truth Table

| State / copy | Current source | Truth rating | Evidence | Risk |
| --- | --- | --- | --- | --- |
| `Not paired` | `read_node_status()` checks missing local `node.json` or missing `node_id`/`node_token`. | GREEN | `read_node_status()` returns `paired:false`, `token_present:false` when no node file exists. | Low. |
| `Paired` | Local `node.json` contains both `node_id` and `node_token`. | GREEN for local identity, YELLOW for token health | Does not prove token is still valid until heartbeat succeeds. | User may think paired means production accepts the node. |
| `Ready` | `paired && heartbeat.ok`. | YELLOW | Header uses `ready ? "Ready" : paired ? "Paired" : "Not paired"`. | "Ready" may overstate render eligibility because it does not verify Blender path, active lease state, GPU eligibility, or current worker availability. |
| Heartbeat `Accepted` | `send_heartbeat_once()` response `ok`. | GREEN | `heartbeatLabel()` returns `Accepted` only when `heartbeat.ok`. | Good. |
| Heartbeat `Auth error` | HTTP 401/403. | GREEN | `heartbeatLabel()` maps 401/403 to `Auth error`. | Good. |
| Heartbeat `Network error` | thrown error or no HTTP status. | GREEN | `heartbeatLabel()` maps `heartbeat.error` to `Network error`. | Good enough. |
| Idle | Lease peek returns `ok` and no job. | GREEN | `leaseLabel()` returns `Idle` when `lease.ok` and no job. | Good. |
| Available | Lease response has `job_id` without `lease_id`/running status. | GREEN | `leaseLabel()` returns `Available` when `lease.job?.job_id`. | Good. |
| Claimed / leased | Lease response has `lease_id` or `status === "running"`. | YELLOW | `leaseLabel()` returns `Leased`. | It does not distinguish claimed, running, rendering, reporting, or stuck. |
| Rendering | Local `busy === "execute"` and `execution.stage`. | YELLOW | Run button shows `Rendering`; execution box shows `Render status` with stage. | Not persisted across restart; stage is coarse and not tied to production progress. |
| Failed | `execute_nodemuncher_job` throws or returns error. | GREEN for immediate UI, YELLOW for post-restart/history | Execution box shows `Render failed` if `execution.error`. | Failed state is not represented as a durable history row unless production/local history carries it. |
| Offline | Header shows `Paired` rather than offline when paired but heartbeat missing/failed. | YELLOW | `statusPill` class is `ready ? "ready" : paired ? "paired" : "offline"`. | A paired node with failed heartbeat is not visually "offline"; it is "Paired" with heartbeat status elsewhere. |
| Earnings | Amount fields if returned; otherwise pending copy. | YELLOW | `jobEarnings()` returns `Earnings amount pending. Receipt recorded.` when receipt exists but no amount. | Honest, but not authoritative. |
| GPU metadata | UI probe first; fallback local `node.gpu_name`; heartbeat sends stored local `gpu_name`. | YELLOW | UI uses `collect_system_probe()`; heartbeat sends `node.gpu_name`, often `UNKNOWN_GPU`. | UI can display a GPU while production receives UNKNOWN. |
| Worker running | Hardcoded false. | RED for truth, P1 severity | `read_worker_status()` returns `worker_running:false`. | Misleading during active manual render. |
| Worker processes | Hardcoded zero. | RED for truth, P1 severity | `read_worker_status()` returns `process_count:0`. | Misleading during active manual render. |
| Settings copy | Static stub. | RED for truth, P1 severity | `Production render-job controls are not enabled in this bootstrap.` while live controls exist. | Contradicts current app behavior. |

## Findings

### 1. Paired / Not Paired

Status: mostly truthful.

Source:

```text
C:\Users\danki\Desktop\nodemuncher-codex\src-tauri\src\main.rs
```

Evidence:

```text
995:#[tauri::command]
996:fn read_node_status() -> Value {
1001:    let node_path = data_dir.join("node.json");
1002:    if !node_path.is_file() {
1003:        return json!({ "ok": true, "paired": false, "token_present": false, "node_path": node_path.to_string_lossy().to_string() });
...
1016:        "paired": !node_id.is_empty() && !node_token.is_empty(),
1017:        "node_id": node_id,
1018:        "token_present": !node_token.is_empty(),
```

Assessment:

- `Paired` truthfully means local identity and token exist.
- It does not prove the token is currently valid with production. The UI handles that separately through heartbeat.

Recommended copy:

- Keep `Paired`.
- Consider helper copy: `Stored node identity found. Heartbeat confirms production access.`

### 2. Ready

Status: partially truthful.

Source:

```text
C:\Users\danki\Desktop\nodemuncher-codex\src-nodemuncher\NodeMuncherApp.tsx
```

Evidence:

```text
366:  const paired = Boolean(node.paired);
368:  const ready = paired && Boolean(heartbeat.ok);
383:          <span className={`statusPill ${ready ? "ready" : paired ? "paired" : "offline"}`}>
384:            {ready ? "Ready" : paired ? "Paired" : "Not paired"}
```

Assessment:

- `Ready` means last heartbeat was accepted.
- It does not mean Blender exists, no active lease is present, GPU metadata is production-accurate, or render execution is currently safe.

Recommended copy:

- Controlled alpha: acceptable.
- Broad launch: change to `Heartbeat accepted` or add a separate eligibility check before showing `Ready`.

### 3. Idle / Available / Leased

Status: mostly truthful, but coarse.

Evidence:

```text
155:function leaseLabel(lease: LeaseResponse) {
156:  if (!lease.ok && lease.status === "not_paired") return "Not paired";
157:  if (!lease.ok && (lease.http_status === 401 || lease.http_status === 403)) return "Auth error";
158:  if (!lease.ok && lease.http_status) return `HTTP ${lease.http_status}`;
159:  if (!lease.ok && lease.error) return "Network error";
160:  if (lease.job?.lease_id || lease.job?.status === "running") return "Leased";
161:  if (lease.job?.job_id) return "Available";
162:  if (lease.ok) return "Idle";
163:  return "Not checked";
164:}
```

Assessment:

- `Idle` is truthful for successful no-work response.
- `Available` is truthful when a compatible job is returned.
- `Leased` is coarse. It can mean claimed/running/lease metadata exists, but not necessarily that Blender is rendering.

Recommended broad-launch states:

- `Idle`
- `Package available`
- `Claimed`
- `Downloading input`
- `Rendering`
- `Uploading result`
- `Reported complete`
- `Reported failed`

Do not add fake progress; only show stages already known locally.

### 4. Rendering / Failed

Status: immediate state is truthful, but not persistent enough.

Evidence:

```text
327:  async function executeJob() {
330:    setBusy("execute");
331:    setExecution({ stage: "starting" });
333:      const result = await invoke<ExecutionResponse>("execute_nodemuncher_job", { jobId });
334:      setExecution(result);
...
337:    } catch (error) {
338:      setExecution({ ok: false, stage: "execute", error: error instanceof Error ? error.message : String(error) });
```

UI:

```text
457:              {(execution.stage || execution.job_id) && (
458:                <div className={`executionBox ${execution.ok ? "ok" : execution.error ? "fail" : ""}`}>
459:                  <span>{execution.ok ? "Render complete" : execution.error ? "Render failed" : "Render status"}</span>
460:                  <strong>{execution.ok ? value(execution.job_id) : value(execution.stage)}</strong>
```

Assessment:

- During a manual run, the UI truthfully shows busy/rendering and error if returned.
- It does not expose durable failed history or active recovery decision in the main UI after restart.
- Startup recovery writes proof/logs in earlier milestones, but this UI does not show a recovery result row.

Recommended next UI truth fix:

- Show latest startup recovery decision if `startup-recovery.json` exists.
- Show latest failed render report state if local work log records it.

### 5. Offline

Status: partially misleading.

Current behavior:

- If unpaired: header says `Not paired`.
- If paired but heartbeat failed/not sent: header says `Paired`, not `Offline`.
- Detailed status grid shows heartbeat status separately.

Risk:

- A normal tester may miss that the node is not currently accepted/online.

Recommendation:

- For paired but heartbeat not accepted, show `Offline` or `Heartbeat needed` as the pill.
- Keep `Paired` as identity state in details.

### 6. Earnings

Status: honest but not authoritative.

Evidence:

```text
190:function jobEarnings(job: CompletedJob) {
191:  const amount = job.earnings_cents ?? job.earning_cents ?? job.payout_cents;
192:  if (amount === undefined || amount === null || amount === "") {
193:    return job.receipt_id ? "Earnings amount pending. Receipt recorded." : "Not available";
194:  }
195:  return moneyCents(amount);
196:}
```

Assessment:

- Good: no fake money.
- Good: receipt proof is distinguished from amount.
- Still P1: canonical payout ledger/endpoint is not wired as authoritative source.

Recommendation:

- Keep controlled alpha wording.
- Before public launch, change tab/section to reflect authoritative source, e.g. `Earnings from Farpy ledger`.

### 7. GPU Metadata

Status: partially misleading.

UI evidence:

```text
367:  const gpuList = useMemo(() => probe.gpu_names?.filter(Boolean).join(", ") || node.gpu_name || "Not detected", [probe.gpu_names, node.gpu_name]);
479:              <div><span>GPUs</span><strong>{gpuList}</strong></div>
```

Heartbeat evidence:

```text
1228:    let body = json!({
1229:        "node_id": node_id,
1230:        "gpu_name": node.get("gpu_name").and_then(|v| v.as_str()).unwrap_or("UNKNOWN_GPU"),
1231:        "version": node.get("version").and_then(|v| v.as_str()).unwrap_or("0.1.0")
1232:    });
```

Pairing evidence:

```text
1117:                    "gpu_name": "UNKNOWN_GPU"
```

Assessment:

- UI may show detected GPU via local probe.
- Production heartbeat may still receive `UNKNOWN_GPU`.
- This can confuse operator eligibility and tester trust.

Recommendation:

- Send probed GPU metadata in heartbeat.
- Label UI as `Detected locally` until backend confirms the same GPU metadata.

### 8. Worker Running / Worker Processes

Status: misleading.

Evidence:

```text
1540:#[tauri::command]
1541:fn read_worker_status() -> Value {
...
1547:    json!({
1548:        "ok": true,
1549:        "worker_running": false,
1550:        "process_count": 0,
1551:        "last_heartbeat_log": read_last_log_line(&log_dir.join("heartbeat.log")),
1552:        "last_claim_log": read_last_log_line(&log_dir.join("claim-loop.log"))
1553:    })
1554:}
```

UI:

```text
500:              <dt>Worker running</dt><dd>{value(worker.worker_running)}</dd>
501:              <dt>Worker processes</dt><dd>{value(worker.process_count)}</dd>
```

Assessment:

- These fields are hardcoded, so they are not truthful.
- They should be removed or connected to actual active execution state.

Recommendation:

- Controlled alpha: document as known P1.
- Broad launch: do not ship these fields unless they are real.

### 9. Settings Copy

Status: misleading.

Evidence:

```text
527:        {tab === "settings" && <Stub title="Settings" body="Production render-job controls are not enabled in this bootstrap." />}
```

But the Home tab exposes:

```text
427:                  <button className="secondary" onClick={checkForJob} disabled={!ready || Boolean(busy)}>{busy === "peek" ? "Checking" : "Check for Job"}</button>
454:                  <button onClick={claimJob} disabled={!ready || !leaseJob?.job_id || Boolean(busy)}>{busy === "claim" ? "Claiming" : "Claim Job"}</button>
455:                  <button onClick={executeJob} disabled={!ready || !leaseJob?.job_id || Boolean(busy)}>{busy === "execute" ? "Rendering" : "Run Render"}</button>
```

Assessment:

- This is contradictory.

Recommended copy:

```text
Alpha controls are manual. Pair this PC, heartbeat, check for a package, then run render when an operator is watching.
```

## P1 Fix List

No code was changed in this milestone. Recommended future fixes:

1. Replace `Worker running` / `Worker processes` with actual active render state or remove them.
2. Replace stale Settings copy.
3. Change header pill for paired-but-not-heartbeating from `Paired` to `Offline` or `Heartbeat needed`.
4. Split `Ready` into:
   - `Paired`
   - `Heartbeat accepted`
   - `Eligible`
   - `Rendering`
5. Send local GPU probe metadata in heartbeat or label UI GPU as local-only.
6. Surface latest recovery/failure report decision after startup recovery.
7. Keep earnings pending wording until canonical earnings endpoint is wired.

## Controlled Alpha Recommendation

Controlled alpha: YES.

Reason:

- The misleading areas are visible/status confidence issues, not current proof that NodeMuncher fabricates work, receipts, or earnings.
- Operator supervision can compensate.

Broad public launch: NO.

Reason:

- Status UI includes hardcoded worker fields and stale contradictory copy.
- GPU and readiness claims can be misread by external users.

## Commands Run

```powershell
$p='C:\Users\danki\Desktop\nodemuncher-codex\src-nodemuncher\NodeMuncherApp.tsx'; $lines=Get-Content -LiteralPath $p; foreach($range in @(@(1,140),@(140,260),@(260,380),@(380,535),@(535,620))){ Write-Host "--- $($range[0])-$($range[1])"; for($i=$range[0]; $i -le $range[1] -and $i -le $lines.Count; $i++){ '{0}:{1}' -f $i,$lines[$i-1] } }
$p='C:\Users\danki\Desktop\nodemuncher-codex\src-tauri\src\main.rs'; $lines=Get-Content -LiteralPath $p; foreach($range in @(@(990,1025),@(1165,1245),@(1284,1318),@(1325,1355),@(1488,1505),@(1540,1554))){ Write-Host "--- $($range[0])-$($range[1])"; for($i=$range[0]; $i -le $range[1] -and $i -le $lines.Count; $i++){ '{0}:{1}' -f $i,$lines[$i-1] } }
$paths=@('C:\Users\danki\Desktop\farpy-frontend\docs\FARPY_BOOK\04_NODEMUNCHER.md','C:\Users\danki\Desktop\farpy-frontend\docs\FARPY_BOOK\NODEMUNCHER_ALPHA_GATE.md','C:\Users\danki\Desktop\farpy-frontend\release\NODEMUNCHER_P1_RISK_AUDIT_V1.md','C:\Users\danki\Desktop\nodemuncher-codex\release\NODEMUNCHER_LAUNCH_AUDIT_V1.md'); foreach($p in $paths){ if(Test-Path -LiteralPath $p){ Write-Host "--- $p"; Select-String -LiteralPath $p -Pattern 'status UI|Worker running|process_count|GPU|heartbeat|earnings|Settings|hardcoded|Ready|idle|leased|failed|offline|truth' | ForEach-Object { "$($_.LineNumber):$($_.Line)" } } }
$root='C:\Users\danki\Desktop\nodemuncher-codex'; rg -n "Ready|Paired|Not paired|Idle|Leased|Available|Network error|Auth error|Render complete|Render failed|Worker running|Worker processes|Production render-job controls|Earnings amount pending|UNKNOWN_GPU|Not detected" "$root\src-nodemuncher" "$root\src-tauri\src\main.rs"
```

## Final Classification

YELLOW.

NodeMuncher status UI is honest enough for supervised controlled alpha, but it has P1 truth gaps that should be fixed before broader tester distribution or public launch.
