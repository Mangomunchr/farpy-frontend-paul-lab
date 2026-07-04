# NODEMUNCHER_EARNINGS_AUTHORITY_AUDIT_V1

Status: YELLOW

Date: 2026-07-01

Scope: audit only. No code changes. No production changes.

Objective: determine whether NodeMuncher earnings display is authoritative, estimated, or placeholder.

## Verdict

NodeMuncher earnings display is currently receipt/history-backed but not authoritative for money.

It is not fake: the UI does not invent earnings amounts. If an amount is unavailable, it says:

```text
Earnings amount pending. Receipt recorded.
```

But it is also not authoritative: there is no proven canonical production earnings/payout ledger endpoint wired to the desktop that guarantees `earning_cents` and `payout_status` for each completed NodeMuncher package.

Controlled alpha: acceptable with operator verification.

Broad public NodeMuncher launch: blocked until earnings authority is made explicit.

## Source of Earnings Data

### Desktop completion path

File:

```text
C:\Users\danki\Desktop\nodemuncher-codex\src-tauri\src\main.rs
```

Observed behavior:

- After upload/complete, NodeMuncher reads the complete endpoint response.
- It sets `earnings_status` to `returned` only if the complete response contains one of:
  - `earnings`
  - `earning_cents`
  - `payout_cents`
- Otherwise it sets:

```text
not_returned_by_complete_response
```

Evidence:

```text
1493:Send-Result ([pscustomobject]@{
1494:  ok=$true; stage='complete'; node_id=$nodeId; job_id=$job.job_id; lease_id=$job.lease_id;
1495:  receipt_id=$(if ($receipt -and $receipt.receipt_id) { $receipt.receipt_id } elseif ($complete.receipt_id) { $complete.receipt_id } else { $null });
1496:  download_url=$downloadUrl; receipt_url=$receiptUrl; output_sha256=$complete.output_sha256; zip_sha256=$zipHash;
1497:  rendered_file_count=$frames.Count; work_root=$workRoot;
1498:  earnings_status=$(if ($complete.earnings -or $complete.earning_cents -or $complete.payout_cents) { 'returned' } else { 'not_returned_by_complete_response' });
1499:  history_status=$(if ($receipt -or $receiptUrl) { 'receipt_queryable' } else { 'receipt_url_not_returned' })
1500:})
```

Classification: completion response is not a reliable authoritative earnings source today.

### Desktop history path

File:

```text
C:\Users\danki\Desktop\nodemuncher-codex\src-tauri\src\main.rs
```

Observed behavior:

- The desktop tries three possible backend paths in order:
  - `/node/v1/nodemuncher/history`
  - `/node/v1/nodemuncher/earnings`
  - `/node/v1/nodemuncher/jobs/completed`
- It accepts whichever response exposes an array under:
  - `jobs`
  - `history`
  - `earnings`
  - `items`
- If none responds, it falls back to local completed job history.

Evidence:

```text
1253:fn backend_node_history(node: &Value, node_token: &str) -> Option<Value> {
1254:    for path in [
1255:        "/node/v1/nodemuncher/history",
1256:        "/node/v1/nodemuncher/earnings",
1257:        "/node/v1/nodemuncher/jobs/completed",
...
1268:        let rows = body
1269:            .get("jobs")
1270:            .or_else(|| body.get("history"))
1271:            .or_else(|| body.get("earnings"))
1272:            .or_else(|| body.get("items"));
...
1301:    if !node_token.is_empty() {
1302:        if let Some(remote) = backend_node_history(&node, node_token) {
...
1311:    json!({
1312:        "ok": true,
1313:        "paired": true,
1314:        "source": "local",
1315:        "jobs": local_node_history()
```

Classification: history lookup is best-effort, not a frozen API contract.

### Backend route availability

File searched:

```text
C:\Users\danki\Desktop\farpy-frontend\scripts\job-api.mjs
```

Observed behavior:

- NodeMuncher lease/input/progress/complete/fail routes exist.
- Search did not find implemented route handlers for:
  - `/node/v1/nodemuncher/history`
  - `/node/v1/nodemuncher/earnings`
  - `/node/v1/nodemuncher/jobs/completed`
- The only `payout_status` field found in the active job API is receipt metadata:

```text
513:    payout_status: "not_applicable_dev",
```

NodeMuncher complete route returns `publicJob(minted.job)`:

```text
2368:    const nodeCompleteMatch = pathname.match(/^\/node\/v1\/(?:web-render\/)?nodemuncher\/jobs\/([^/]+)\/complete$/);
...
2399:      const minted = await mintReceipt(job.job_id);
2400:      return send(res, 200, publicJob(minted.job));
```

Classification: backend complete proves receipt/output state, not payout ledger authority.

## Payout Ledger Source

Authoritative payout ledger source: not proven.

Evidence:

- `scripts/job-api.mjs` contains render job state, receipt minting, wallet debit/refund, and NodeMuncher lease completion.
- It does not expose a proven NodeMuncher payout ledger endpoint in the searched route table.
- Existing Farpy Book and alpha gate docs classify earnings amount/status as incomplete:

```text
docs/FARPY_BOOK/04_NODEMUNCHER.md:
| Earnings | Desktop can show receipt/history proof, but authoritative earnings amount/status remains incomplete or pending. | Controlled alpha only. |

docs/FARPY_BOOK/NODEMUNCHER_ALPHA_GATE.md:
| Earnings amount/status not fully authoritative in UI | Receipt/history proof works, but desktop earnings amount may be pending. | Operator verifies backend ledger/receipt after each alpha render. |
```

Conclusion:

- Receipt generation is proven separately.
- Customer wallet debit/refund behavior is separate from NodeMuncher earnings.
- NodeMuncher earnings/payout authority is not yet a contract.

## UI Wording

File:

```text
C:\Users\danki\Desktop\nodemuncher-codex\src-nodemuncher\NodeMuncherApp.tsx
```

Observed behavior:

```text
190:function jobEarnings(job: CompletedJob) {
191:  const amount = job.earnings_cents ?? job.earning_cents ?? job.payout_cents;
192:  if (amount === undefined || amount === null || amount === "") {
193:    return job.receipt_id ? "Earnings amount pending. Receipt recorded." : "Not available";
194:  }
195:  return moneyCents(amount);
196:}
```

Completed job rows show:

```text
596:                <span>Earnings</span>
597:                <strong>{jobEarnings(job)}</strong>
```

Assessment:

- Good: UI does not show fake money.
- Good: UI distinguishes receipt proof from earnings amount.
- Risk: section title `Earnings` can still imply authority even when data source is local history or receipt-only proof.

Recommended wording before broad launch:

- If no canonical payout data exists:

```text
Receipt recorded. Earnings pending.
```

- If canonical payout data exists:

```text
$0.01 earned
Payout status: pending / paid / held
```

## Mismatch Risk

| Risk | Severity | Why it matters | Current mitigation |
| --- | --- | --- | --- |
| Receipt exists but no earnings amount returned | P1 | NodeMuncher can prove work happened but not what it earned. | UI says amount pending instead of fabricating. |
| Local completed history differs from backend | P1 | Desktop may show stale/partial rows if backend history endpoints are unavailable. | Source label displays backend path or local source. |
| Complete response does not include payout fields | P1 | User expects immediate earning proof after render, but complete route returns job/receipt state. | `earnings_status` says not returned by complete response. |
| Payout ledger source not frozen | P1 | Broad public workers need auditable payout status. | Controlled alpha requires operator verification. |
| UI section title over-promises | P2 | "Earnings" tab may feel more final than the data is. | Pending copy is honest. |

## Classification

| Question | Answer |
| --- | --- |
| Is earnings display fake? | No. It does not invent amounts. |
| Is earnings display placeholder? | Partially. It has real receipt/history rows, but amount can be pending. |
| Is earnings display estimated? | Not by calculation. It only displays amount fields if returned. |
| Is earnings display authoritative? | No, not yet proven. |
| Is payout ledger source frozen? | No. |
| Is this acceptable for controlled alpha? | Yes, with operator verification. |
| Is this acceptable for broad public launch? | No. |

## Required Fix Before Broad Launch

Create or verify one canonical NodeMuncher earnings endpoint that returns only server-authoritative data:

```text
GET /node/v1/nodemuncher/earnings
Auth: paired node token
```

Minimum response fields:

```json
{
  "ok": true,
  "node_id": "NODE-...",
  "items": [
    {
      "job_id": "JOB-...",
      "receipt_id": "RID-...",
      "completed_at": "2026-07-01T00:00:00.000Z",
      "rendered_file_count": 1,
      "output_sha256": "...",
      "earning_cents": 1,
      "payout_status": "pending",
      "ledger_event_id": "..."
    }
  ]
}
```

Rules:

- Do not derive earnings from desktop local history.
- Do not derive earnings from receipt existence alone.
- Do not show payout as paid unless payout ledger says paid.
- Keep receipt/history display as supporting proof.

## Commands Run

```powershell
$root='C:\Users\danki\Desktop\nodemuncher-codex'; rg -n "earnings|earning|payout|completed-jobs|history|receipt|wallet|ledger" "$root\src-tauri" "$root\src-nodemuncher" "$root\release"
$root='C:\Users\danki\Desktop\farpy-frontend'; rg -n "nodemuncher.*earn|earnings|payout|wallet.*credit|ledger|node.*history|completed.*jobs" "$root\scripts" "$root\release" "$root\docs\FARPY_BOOK"
$p='C:\Users\danki\Desktop\nodemuncher-codex\src-tauri\src\main.rs'; $lines=Get-Content -LiteralPath $p; foreach($range in @(@(1253,1318),@(1488,1500))){ Write-Host "--- $($range[0])-$($range[1])"; for($i=$range[0]; $i -le $range[1] -and $i -le $lines.Count; $i++){ '{0}:{1}' -f $i,$lines[$i-1] } }
$p='C:\Users\danki\Desktop\nodemuncher-codex\src-nodemuncher\NodeMuncherApp.tsx'; $lines=Get-Content -LiteralPath $p; foreach($range in @(@(185,198),@(560,606))){ Write-Host "--- $($range[0])-$($range[1])"; for($i=$range[0]; $i -le $range[1] -and $i -le $lines.Count; $i++){ '{0}:{1}' -f $i,$lines[$i-1] } }
$p='C:\Users\danki\Desktop\farpy-frontend\scripts\job-api.mjs'; Select-String -LiteralPath $p -Pattern 'nodemuncher.*history|nodemuncher.*earnings|jobs/completed|earning_cents|payout_cents|payout_status|not_applicable_dev' | ForEach-Object { "$($_.LineNumber):$($_.Line)" }
$p='C:\Users\danki\Desktop\farpy-frontend\scripts\job-api.mjs'; Select-String -LiteralPath $p -Pattern 'nodemuncher|lease|complete|fail|payout_status|earning|earnings|payout' | ForEach-Object { "$($_.LineNumber):$($_.Line)" }
$root='C:\Users\danki\Desktop\farpy-frontend'; rg -n "node/v1/nodemuncher/(history|earnings|jobs/completed)|nodemuncher/history|nodemuncher/earnings|jobs/completed" "$root\scripts" "$root\src" "$root\docs" "$root\release"
```

## Final Recommendation

Keep the current UI for controlled alpha because it is honest and does not fake amounts.

Do not market NodeMuncher earnings as self-service or authoritative until a canonical server-side earnings/payout endpoint exists and the desktop uses it as the primary source.
