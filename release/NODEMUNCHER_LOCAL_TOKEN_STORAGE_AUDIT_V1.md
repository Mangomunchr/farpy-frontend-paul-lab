# NODEMUNCHER_LOCAL_TOKEN_STORAGE_AUDIT_V1

Status: YELLOW

Date: 2026-07-01

Scope: audit only. No code changes. No production changes. No token values printed.

Objective: audit local NodeMuncher node token storage.

## Verdict

NodeMuncher currently stores the paired node token in plaintext JSON at:

```text
%LOCALAPPDATA%\FarpyNode\node.json
```

This is acceptable only for controlled alpha with trusted testers.

It is not acceptable as the default posture for broad public NodeMuncher launch.

Recommended target: migrate the node token to Windows Credential Manager or a Rust keyring-backed abstraction, while keeping non-secret node metadata in `node.json`.

## Current Path

Source:

```text
C:\Users\danki\Desktop\nodemuncher-codex\src-tauri\src\main.rs
```

Code:

```text
619:fn node_data_dir() -> Result<PathBuf, String> {
620:    env::var_os("LOCALAPPDATA")
621:        .map(|root| PathBuf::from(root).join("FarpyNode"))
622:        .ok_or_else(|| "LOCALAPPDATA is not available".to_string())
623:}
```

Current local file:

```text
C:\Users\danki\AppData\Local\FarpyNode\node.json
```

Runtime redacted probe:

```text
DIR C:\Users\danki\AppData\Local\FarpyNode EXISTS True
FILE C:\Users\danki\AppData\Local\FarpyNode\node.json EXISTS True
FILE_LENGTH 275
HAS_NODE_ID True
HAS_NODE_TOKEN True
TOKEN_LENGTH_REDACTED 35
```

The token value was not printed.

## Current Write Behavior

Source:

```text
C:\Users\danki\Desktop\nodemuncher-codex\src-tauri\src\main.rs
```

Code:

```text
1107:        match node_data_dir() {
1108:            Ok(data_dir) => {
1109:                let _ = fs::create_dir_all(&data_dir);
1110:                let node = json!({
1111:                    "node_id": body.get("node_id").and_then(|v| v.as_str()).unwrap_or(""),
1112:                    "node_token": body.get("node_token").and_then(|v| v.as_str()).unwrap_or(""),
1113:                    "pair_code": body.get("pair_code").and_then(|v| v.as_str()).unwrap_or(""),
1114:                    "paired_at": body.get("ts").and_then(|v| v.as_str()).unwrap_or(""),
1115:                    "version": "0.1.0",
1116:                    "api_base": "https://farpy.com",
1117:                    "gpu_name": "UNKNOWN_GPU"
1118:                });
1119:                if let Err(err) = fs::write(
1120:                    data_dir.join("node.json"),
1121:                    serde_json::to_string_pretty(&node).unwrap_or_else(|_| "{}".to_string()),
```

Classification:

- `node_id`: non-secret identifier
- `pair_code`: historical pairing metadata; should be considered low/medium sensitivity
- `node_token`: secret bearer credential
- `api_base`, `gpu_name`, `version`, `paired_at`: non-secret metadata

## Current Read Behavior

Source:

```text
C:\Users\danki\Desktop\nodemuncher-codex\src-tauri\src\main.rs
```

Code:

```text
694:fn read_local_node() -> Result<Value, String> {
695:    let node_path = node_data_dir()?.join("node.json");
696:    let text = fs::read_to_string(&node_path).map_err(|e| e.to_string())?;
697:    serde_json::from_str(text.trim_start_matches('\u{feff}')).map_err(|e| e.to_string())
698:}
```

The entire JSON file is read and parsed whenever local node identity/token is needed.

## Current Forget Behavior

Source:

```text
C:\Users\danki\Desktop\nodemuncher-codex\src-tauri\src\main.rs
```

Code:

```text
1142:fn forget_node() -> Value {
1143:    match node_data_dir() {
1144:        Ok(data_dir) => {
1145:            let node_path = data_dir.join("node.json");
1146:            if node_path.is_file() {
1147:                if let Err(err) = fs::remove_file(&node_path) {
1148:                    return json!({ "ok": false, "error": err.to_string() });
1149:                }
1150:            }
1151:            json!({ "ok": true, "paired": false })
```

Current `Forget Node` deletes `node.json`. If the token moves to Credential Manager, `forget_node()` must delete both:

- metadata file
- credential-store secret

## File Permissions

Observed local ACL for directory and file:

```text
C:\Users\danki\AppData\Local\FarpyNode
MANGOMUNCHR\CodexSandboxUsers ReadAndExecute, Synchronize Allow Inherited
NT AUTHORITY\SYSTEM FullControl Allow Inherited
BUILTIN\Administrators FullControl Allow Inherited
MANGOMUNCHR\danki FullControl Allow Inherited

C:\Users\danki\AppData\Local\FarpyNode\node.json
MANGOMUNCHR\CodexSandboxUsers ReadAndExecute, Synchronize Allow Inherited
NT AUTHORITY\SYSTEM FullControl Allow Inherited
BUILTIN\Administrators FullControl Allow Inherited
MANGOMUNCHR\danki FullControl Allow Inherited
```

Interpretation:

- Normal Windows user profile ACLs restrict access to the user, Administrators, and SYSTEM.
- On this machine, `CodexSandboxUsers` also has inherited read access. That may be environment-specific, but it proves the app should not rely on local JSON privacy for a bearer credential.
- The file is not protected by application-level encryption or OS credential APIs.

## Plaintext Risk

Risk:

- The node token is a bearer credential.
- Anyone who can read `node.json` can potentially impersonate that node until token revocation.
- The token is likely included in backups or support bundles if `%LOCALAPPDATA%\FarpyNode` is copied wholesale.
- Crash logs/support screenshots could accidentally expose file contents if a tester opens the JSON.
- Uninstall may leave `%LOCALAPPDATA%\FarpyNode` behind unless `Forget Node` or manual cleanup is used.

Current mitigating factors:

- The UI only shows `token_present`, not the token value.
- NodeMuncher is controlled alpha, not broad public.
- `Forget Node` exists and removes `node.json`.
- Production node APIs require token auth; missing/invalid token behavior is separately hardened.

Remaining gap:

- Local secret at rest is not hardened.

## Existing Documentation Alignment

`docs/FARPY_BOOK/04_NODEMUNCHER.md` says:

```text
The paired node identity persists locally under `%LOCALAPPDATA%\FarpyNode\node.json`.
The local node token is not shown in the UI, but it is still stored as plaintext JSON for alpha.
```

`docs/FARPY_BOOK/NODEMUNCHER_ALPHA_GATE.md` says:

```text
Plaintext local node token | Token is stored in `%LOCALAPPDATA%\FarpyNode\node.json`. | Use trusted testers only; provide Forget Node/local data cleanup guidance.
```

`release/NODEMUNCHER_P1_RISK_AUDIT_V1.md` says:

```text
Move node token to OS credential storage or encrypted-at-rest platform storage before broad public worker launch.
```

The current audit agrees with those classifications.

## Windows Credential Store Feasibility

Feasible approaches:

1. Use the Rust `keyring` crate.
   - Pros: cross-platform abstraction for Windows Credential Manager, macOS Keychain, Linux Secret Service where available.
   - Cons: adds dependency and platform-specific behavior to test.

2. Use Windows Credential Manager directly through the `windows` crate.
   - APIs: `CredWriteW`, `CredReadW`, `CredDeleteW`.
   - Pros: direct control on Windows.
   - Cons: Windows-only implementation; needs separate strategy for future macOS/Linux.

3. Use DPAPI-encrypted local file.
   - APIs: `CryptProtectData` / `CryptUnprotectData`.
   - Pros: simple encrypted-at-rest file tied to current user/machine.
   - Cons: still file-based; migration/export behavior is trickier; less clean than Credential Manager for a bearer token.

Recommended approach:

- Use a small internal credential abstraction.
- Windows implementation: Credential Manager, preferably through `keyring` unless dependency constraints reject it.
- Keep `node.json` as metadata only:

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

- Store token under a credential key such as:

```text
service: Farpy NodeMuncher
account: <node_id>
secret: <node_token>
```

Do not store token in frontend state, logs, support exports, screenshots, or release notes.

## Migration Approach

Minimal safe migration:

1. On startup, read `node.json`.
2. If `node_token` exists in `node.json`:
   - write it to Windows Credential Manager under the paired `node_id`
   - verify it can be read back
   - rewrite `node.json` without `node_token`
   - keep a one-time redacted log:

```text
NODE_TOKEN_MIGRATED node_id=<redacted/short> source=node.json target=credential_store
```

3. If credential write fails:
   - keep controlled-alpha behavior temporarily
   - show a clear warning in Status/Settings:

```text
Node token is stored locally for alpha. Credential storage failed.
```

4. Update all token reads to:
   - read metadata from `node.json`
   - read token from credential store
   - fail closed if metadata exists but token is missing

5. Update `Forget Node` to:
   - delete credential-store token
   - delete `node.json`
   - leave logs/work only if the UI clearly says local data is preserved

6. Add migration smoke:
   - existing plaintext paired node migrates
   - heartbeat still works
   - lease peek still works
   - app restart still paired
   - `node.json` no longer contains `node_token`
   - `Forget Node` removes credential and metadata

## Required Tests Before Broad Launch

| Test | Required result |
| --- | --- |
| Fresh pair | token stored in Credential Manager, not JSON |
| Restart | node remains paired and heartbeat succeeds |
| Existing alpha install migration | plaintext token migrates once and is removed from JSON |
| Missing credential | app shows unpaired/auth error; no silent ready state |
| Forget Node | credential and metadata removed |
| Uninstall | documented whether credential/local data persists |
| Support export | no token included |
| Log scan | no node token printed |

## Classification

| Area | Status | Notes |
| --- | --- | --- |
| Current path known | GREEN | `%LOCALAPPDATA%\FarpyNode\node.json` |
| Token value hidden from UI | GREEN | UI shows only `token_present` |
| Token at rest | YELLOW | Plaintext JSON |
| File permissions | YELLOW | User/admin/SYSTEM plus environment-specific inherited read group observed |
| Credential-store feasibility | GREEN | Windows Credential Manager is appropriate and feasible |
| Migration plan | GREEN | Straightforward metadata/token split |
| Broad public readiness | RED | Plaintext token blocks broad worker launch |
| Controlled alpha readiness | YELLOW | Acceptable only with trusted testers and cleanup guidance |

## Commands Run

```powershell
$p='C:\Users\danki\Desktop\nodemuncher-codex\src-tauri\src\main.rs'; $lines=Get-Content -LiteralPath $p; foreach($range in @(@(619,650),@(1000,1020),@(1090,1125),@(1130,1138))){ Write-Host "--- $($range[0])-$($range[1])"; for($i=$range[0]; $i -le $range[1] -and $i -le $lines.Count; $i++){ '{0}:{1}' -f $i,$lines[$i-1] } }
$root='C:\Users\danki\Desktop\nodemuncher-codex'; rg -n "node.json|node_token|LOCALAPPDATA|Credential|keyring|secret|token_present|Forget|forget" "$root\src-tauri" "$root\src-nodemuncher" "$root\release"
$dir=Join-Path $env:LOCALAPPDATA 'FarpyNode'; $file=Join-Path $dir 'node.json'; Write-Host "DIR $dir EXISTS $(Test-Path -LiteralPath $dir)"; if(Test-Path -LiteralPath $dir){ Get-Acl -LiteralPath $dir | Select-Object -ExpandProperty Access | Select-Object IdentityReference,FileSystemRights,AccessControlType,IsInherited | Format-Table -AutoSize }; Write-Host "FILE $file EXISTS $(Test-Path -LiteralPath $file)"; if(Test-Path -LiteralPath $file){ $item=Get-Item -LiteralPath $file; Write-Host "FILE_LENGTH $($item.Length)"; Write-Host "FILE_LASTWRITE $($item.LastWriteTime.ToString('s'))"; $json=Get-Content -LiteralPath $file -Raw | ConvertFrom-Json; Write-Host "HAS_NODE_ID $([bool]$json.node_id)"; Write-Host "HAS_NODE_TOKEN $([bool]$json.node_token)"; Write-Host "TOKEN_LENGTH_REDACTED $($(if($json.node_token){$json.node_token.Length}else{0}))"; Get-Acl -LiteralPath $file | Select-Object -ExpandProperty Access | Select-Object IdentityReference,FileSystemRights,AccessControlType,IsInherited | Format-Table -AutoSize }
$p='C:\Users\danki\Desktop\nodemuncher-codex\src-tauri\src\main.rs'; $lines=Get-Content -LiteralPath $p; foreach($range in @(@(690,710),@(1142,1155))){ Write-Host "--- $($range[0])-$($range[1])"; for($i=$range[0]; $i -le $range[1] -and $i -le $lines.Count; $i++){ '{0}:{1}' -f $i,$lines[$i-1] } }
$paths=@('C:\Users\danki\Desktop\farpy-frontend\docs\FARPY_BOOK\04_NODEMUNCHER.md','C:\Users\danki\Desktop\farpy-frontend\docs\FARPY_BOOK\NODEMUNCHER_ALPHA_GATE.md','C:\Users\danki\Desktop\farpy-frontend\release\NODEMUNCHER_P1_RISK_AUDIT_V1.md'); foreach($p in $paths){ if(Test-Path -LiteralPath $p){ Write-Host "--- $p"; Select-String -LiteralPath $p -Pattern 'token|plaintext|Credential|Forget Node|local data|node.json' | ForEach-Object { "$($_.LineNumber):$($_.Line)" } } }
```

## Final Recommendation

Do not broaden NodeMuncher beyond controlled alpha while `node_token` is stored in plaintext JSON.

Next implementation milestone should move `node_token` to Windows Credential Manager, migrate existing alpha installs, and ensure `Forget Node` removes both metadata and credential-store secret.
