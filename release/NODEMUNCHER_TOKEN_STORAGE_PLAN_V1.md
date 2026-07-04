# NODEMUNCHER_TOKEN_STORAGE_PLAN_V1

Status: PLAN_ONLY

Date: 2026-07-01

Scope: planning only. No code changes. No credential writes. No production changes.

## Objective

Plan migration from plaintext `node_token` JSON storage to Windows Credential Manager.

## Current State

NodeMuncher currently stores paired node identity and token in:

```text
%LOCALAPPDATA%\FarpyNode\node.json
```

Current source evidence:

```text
C:\Users\danki\Desktop\nodemuncher-codex\src-tauri\src\main.rs
```

Key code paths:

```text
619:fn node_data_dir() -> Result<PathBuf, String>
694:fn read_local_node() -> Result<Value, String>
695:let node_path = node_data_dir()?.join("node.json");
1112:"node_token": body.get("node_token").and_then(|v| v.as_str()).unwrap_or(""),
1120:data_dir.join("node.json"),
1142:fn forget_node() -> Value
1145:let node_path = data_dir.join("node.json");
```

Current JSON includes:

```json
{
  "node_id": "NODE-...",
  "node_token": "<secret>",
  "pair_code": "PAIR-...",
  "paired_at": "...",
  "version": "0.1.0",
  "api_base": "https://farpy.com",
  "gpu_name": "..."
}
```

Risk:

- `node_token` is a bearer credential.
- Anyone who can read `node.json` can impersonate that node until token revocation.
- Controlled alpha only; not broad public launch posture.

## Target Credential

Use Windows Credential Manager for the token.

Preferred implementation:

- Rust `keyring` crate, if dependency policy accepts it.
- Direct Windows Credential Manager APIs through the `windows` crate if a narrower Windows-only implementation is preferred.

Credential target:

```text
service: Farpy NodeMuncher
account: <node_id>
secret: <node_token>
```

Suggested internal key format:

```text
Farpy NodeMuncher/node_token/<node_id>
```

Keep `node.json` for non-secret metadata only:

```json
{
  "node_id": "NODE-...",
  "pair_code": "PAIR-...",
  "paired_at": "...",
  "version": "0.1.0",
  "api_base": "https://farpy.com",
  "gpu_name": "..."
}
```

Do not store token in:

- JSON files
- logs
- UI state
- screenshots
- support exports
- release notes

## Migration Steps

### Phase 1: Add Credential Abstraction

Add a small Rust helper layer:

```text
read_node_token(node_id) -> Result<String, String>
write_node_token(node_id, token) -> Result<(), String>
delete_node_token(node_id) -> Result<(), String>
```

Behavior:

- On Windows: read/write/delete Windows Credential Manager.
- In tests/dev only if needed: optional file fallback behind explicit dev-only flag.
- In production build: fail closed if credential read fails and token is not in legacy JSON during migration.

### Phase 2: Fresh Pair Writes Token to Credential Store

Update pair confirmation:

1. Receive `node_id` and `node_token`.
2. Write `node_token` to Credential Manager under `node_id`.
3. Verify readback succeeds.
4. Write metadata-only `node.json`.
5. Return `token_present=true` without exposing token.

If Credential Manager write fails:

- Do not report paired success.
- Return clear error:

```text
Could not store node credential securely.
```

For controlled alpha only, a temporary compatibility fallback may be permitted if explicitly gated and visibly warned, but default should fail closed.

### Phase 3: Legacy Plaintext Migration

On startup or first `read_node_status()`:

1. Read `%LOCALAPPDATA%\FarpyNode\node.json`.
2. If `node_token` exists:
   - write token to Credential Manager
   - verify readback
   - rewrite `node.json` without `node_token`
   - log redacted migration event:

```text
NODE_TOKEN_MIGRATED node_id=<short/redacted> source=node.json target=credential_store
```

3. If credential write fails:
   - leave `node.json` unchanged
   - return paired state with warning only for alpha, or fail closed for public build
   - do not delete the only existing credential

4. If `node.json` has metadata but credential is missing:
   - show auth/setup error
   - do not show Ready
   - ask user to pair again or Forget Node

### Phase 4: Runtime Token Reads

Update all token consumers to:

1. Read metadata from `node.json`.
2. Read token from Credential Manager using `node_id`.
3. Fail closed if token is missing.

Affected paths:

- heartbeat
- lease peek
- lease claim
- input download
- progress report
- complete
- fail
- earnings/history
- startup recovery

### Phase 5: Redacted Status

Keep UI behavior:

```text
Token present: Yes/No
```

Never show:

- token value
- token prefix
- credential target containing token

Optional status detail:

```text
Credential storage: Windows Credential Manager
```

## Forget Node Cleanup

Current `forget_node()` deletes only:

```text
%LOCALAPPDATA%\FarpyNode\node.json
```

After migration, `Forget Node` must:

1. Read `node_id` from metadata if available.
2. Delete Windows Credential Manager secret for that `node_id`.
3. Delete `node.json`.
4. Clear in-memory UI state.
5. Leave logs/work/history unless UI explicitly says local data is being removed.

If credential deletion fails:

- Return visible error.
- Do not say node is forgotten.
- Offer retry.

Optional later improvement:

- Add separate destructive action:

```text
Forget Node and remove local work/logs
```

Do not silently delete render logs during normal Forget Node unless product copy says so.

## Rollback Plan

Rollback must avoid stranding paired alpha nodes.

Safe rollback options:

### Option A: Dual-read temporary compatibility

During rollout window:

1. Prefer Credential Manager.
2. If credential is missing and `node_token` exists in legacy JSON, read legacy token.
3. Attempt migration again.
4. Warn that legacy token storage is active.

This is safest for alpha continuity, but should be time-boxed.

### Option B: Re-pair required

If migration fails or rollback removes credential access:

1. Show clear message:

```text
Node credential unavailable. Please pair this PC again.
```

2. Allow `Forget Node`.
3. User requests a new pair code.

This is cleaner and safer, but more disruptive.

Recommended controlled-alpha rollout:

- Implement dual-read for one migration version.
- Record migration success/failure in logs without secrets.
- Remove legacy JSON token read after the migration window.

Rollback from new build to old build:

- Old build will not read Credential Manager.
- If old build is needed, tester must re-pair or operator must restore legacy JSON from a pre-migration backup.
- Do not automate restoring plaintext token unless explicitly approved for alpha recovery.

## Alpha Caveat

Until this migration is implemented:

- NodeMuncher remains controlled alpha only.
- Testers must be trusted.
- Operator must disclose that node identity is stored locally under `%LOCALAPPDATA%\FarpyNode`.
- Tester should use `Forget Node` before uninstall if local identity cleanup is desired.
- Broad public worker launch remains blocked.

Accepted alpha behavior:

- plaintext token persists in `node.json`
- UI does not display the token
- token-authenticated production APIs still fail closed for missing/invalid tokens

Not accepted for broad launch:

- plaintext token as default storage
- support bundles that include `node.json`
- uninstall copy that implies all identity is removed when local data remains

## Test Plan For Future Implementation

Required tests:

1. Fresh pair stores token in Windows Credential Manager and not in `node.json`.
2. Restart keeps node paired.
3. Heartbeat succeeds after restart.
4. Lease peek succeeds after restart.
5. Existing plaintext `node.json` migrates once.
6. `node.json` after migration does not contain `node_token`.
7. Missing credential shows not ready/auth setup error.
8. Forget Node deletes credential and metadata.
9. Support/log export excludes token.
10. Build passes:

```powershell
npm.cmd run build:nodemuncher
npm.cmd run tauri:nodemuncher
```

## Commands Run

```powershell
$paths=@('C:\Users\danki\Desktop\farpy-frontend\release\NODEMUNCHER_LOCAL_TOKEN_STORAGE_AUDIT_V1.md','C:\Users\danki\Desktop\farpy-frontend\docs\FARPY_BOOK\NODEMUNCHER_ALPHA_GATE.md','C:\Users\danki\Desktop\farpy-frontend\docs\FARPY_BOOK\04_NODEMUNCHER.md'); foreach($p in $paths){ if(Test-Path -LiteralPath $p){ Write-Host "--- $p"; Select-String -LiteralPath $p -Pattern 'node.json|node_token|Credential|Forget Node|plaintext|migration|rollback|alpha' | ForEach-Object { "$($_.LineNumber):$($_.Line)" } } }
$p='C:\Users\danki\Desktop\nodemuncher-codex\src-tauri\src\main.rs'; Select-String -LiteralPath $p -Pattern 'node_data_dir|node.json|node_token|forget_node|read_local_node' | ForEach-Object { "$($_.LineNumber):$($_.Line.Trim())" }
```

## Result

PLAN_ONLY.

No implementation performed.

Next implementation milestone should move `node_token` to Windows Credential Manager, migrate existing alpha installs, and update `Forget Node` cleanup.
