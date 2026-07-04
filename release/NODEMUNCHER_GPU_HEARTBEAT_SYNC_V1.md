# NODEMUNCHER_GPU_HEARTBEAT_SYNC_V1

Status: GREEN

Date: 2026-07-01

Scope: NodeMuncher desktop heartbeat metadata only. No backend API changes. No lease logic changes.

## Objective

Make NodeMuncher heartbeat GPU metadata match the detected local probe where available.

Requirements:

- do not fake GPU data
- do not block heartbeat if probe is unavailable
- use detected GPU/VRAM when available
- fallback to stored/default metadata only when probe is missing
- log fallback clearly

## Files Changed

- `C:\Users\danki\Desktop\nodemuncher-codex\src-tauri\src\main.rs`
- `C:\Users\danki\Desktop\farpy-frontend\release\NODEMUNCHER_GPU_HEARTBEAT_SYNC_V1.md`

Related previously changed file still present in the same working tree:

- `C:\Users\danki\Desktop\nodemuncher-codex\src-nodemuncher\NodeMuncherApp.tsx`

## Implementation

`send_heartbeat_once()` now calls the existing local `collect_system_probe()` before creating the heartbeat body.

If detected GPU names are available:

- heartbeat `gpu_name` is built from detected probe names
- heartbeat includes `gpu_names`
- heartbeat includes `gpu_vendor`
- heartbeat includes `vram_gb`
- heartbeat includes `driver_version`
- heartbeat includes `gpu_metadata_source=detected_probe`

If detected GPU names are missing:

- heartbeat falls back to stored `node.gpu_name`
- if stored value is also missing, heartbeat uses `UNKNOWN_GPU`
- heartbeat includes `gpu_metadata_source=stored_fallback`
- stderr logs:

```text
NODEMUNCHER_HEARTBEAT_GPU_FALLBACK reason=probe_missing
```

Heartbeat is not blocked by missing GPU probe data.

## Payload Inspection

Token handling remains header-only.

Source inspection shows token is not embedded into the JSON heartbeat body:

```text
641:if ($token) { $headers['x-farpy-node-token'] = $token }
```

Final heartbeat GPU fields:

```text
1230:.get("gpu_names")
1250:eprintln!("NODEMUNCHER_HEARTBEAT_GPU_FALLBACK reason=probe_missing");
1263:"gpu_names": detected_gpus,
1264:"gpu_metadata_source": gpu_source,
1265:"gpu_vendor": probe.get("gpu_vendor").cloned().unwrap_or(Value::Null),
1266:"vram_gb": probe.get("vram_gb").cloned().unwrap_or(Value::Null),
1267:"driver_version": probe.get("driver_version").cloned().unwrap_or(Value::Null),
1287:"gpu_metadata_source": gpu_source,
1288:"vram_gb": probe.get("vram_gb").cloned().unwrap_or(Value::Null),
```

Redacted local node inspection:

```text
NODE_JSON_EXISTS true
NODE_ID_PRESENT True
NODE_TOKEN_PRESENT True
NODE_TOKEN_REDACTED <redacted>
STORED_GPU NVIDIA GeForce RTX 3080
```

Local GPU probe evidence:

```text
Name          : NVIDIA GeForce RTX 3080
AdapterRAM    : 4293918720
DriverVersion : 32.0.15.9636
```

## Behavior Before

Heartbeat sent:

```json
{
  "node_id": "...",
  "gpu_name": "UNKNOWN_GPU or stored node.json value",
  "version": "0.1.0"
}
```

The UI could show a detected GPU while production heartbeat still received stale/default metadata.

## Behavior After

Heartbeat sends detected probe metadata when available:

```json
{
  "node_id": "...",
  "gpu_name": "NVIDIA GeForce RTX 3080",
  "gpu_names": ["NVIDIA GeForce RTX 3080"],
  "gpu_metadata_source": "detected_probe",
  "gpu_vendor": "...",
  "vram_gb": 4,
  "driver_version": "32.0.15.9636",
  "version": "0.1.0"
}
```

If probe is unavailable:

```json
{
  "gpu_name": "stored value or UNKNOWN_GPU",
  "gpu_names": [],
  "gpu_metadata_source": "stored_fallback"
}
```

No fake GPU is invented. Fallback is explicit.

## Validation

```powershell
npm.cmd run build:nodemuncher
```

Result: PASS.

```powershell
npm.cmd run tauri:nodemuncher
```

Result: PASS.

Built application:

```text
C:\Users\danki\Desktop\nodemuncher-codex\src-tauri\target\release\farpy-nodemuncher.exe
```

Built bundles:

```text
C:\Users\danki\Desktop\nodemuncher-codex\src-tauri\target\release\bundle\msi\Farpy NodeMuncher_0.1.0_x64_en-US.msi
C:\Users\danki\Desktop\nodemuncher-codex\src-tauri\target\release\bundle\nsis\Farpy NodeMuncher_0.1.0_x64-setup.exe
```

## Commands Run

```powershell
$p='C:\Users\danki\Desktop\nodemuncher-codex\src-tauri\src\main.rs'; rg -n "collect_system_probe|send_heartbeat_once|gpu_name|vram|driver|probe|UNKNOWN_GPU|post_node_json_with_curl|run_json_web_request" $p
$p='C:\Users\danki\Desktop\nodemuncher-codex\src-tauri\src\main.rs'; $lines=Get-Content -LiteralPath $p; foreach($range in @(@(760,835),@(1214,1252))){ Write-Host "--- $($range[0])-$($range[1])"; for($i=$range[0]; $i -le $range[1] -and $i -le $lines.Count; $i++){ '{0}:{1}' -f $i,$lines[$i-1] } }
git -C 'C:\Users\danki\Desktop\nodemuncher-codex' diff -- src-tauri/src/main.rs src-nodemuncher/NodeMuncherApp.tsx
$p='C:\Users\danki\Desktop\nodemuncher-codex\src-tauri\src\main.rs'; $lines=Get-Content -LiteralPath $p; for($i=1214; $i -le 1288 -and $i -le $lines.Count; $i++){ '{0}:{1}' -f $i,$lines[$i-1] }
git -C 'C:\Users\danki\Desktop\nodemuncher-codex' diff -- src-tauri/src/main.rs src-nodemuncher/NodeMuncherApp.tsx | Select-String -Pattern 'send_heartbeat_once|gpu_metadata_source|gpu_names|vram_gb|NODEMUNCHER_HEARTBEAT_GPU_FALLBACK|Heartbeat accepted|Worker running|Production render-job controls' -Context 3,3
npm.cmd run build:nodemuncher
npm.cmd run tauri:nodemuncher
Get-CimInstance Win32_VideoController -ErrorAction SilentlyContinue | Select-Object Name,AdapterRAM,DriverVersion | Format-List
$p='C:\Users\danki\Desktop\nodemuncher-codex\src-tauri\src\main.rs'; Select-String -LiteralPath $p -Pattern 'NODEMUNCHER_HEARTBEAT_GPU_FALLBACK|gpu_metadata_source|gpu_names|gpu_vendor|vram_gb|driver_version|x-farpy-node-token' | ForEach-Object { "$($_.LineNumber):$($_.Line.Trim())" }
$file=Join-Path (Join-Path $env:LOCALAPPDATA 'FarpyNode') 'node.json'; if(Test-Path -LiteralPath $file){ $json=Get-Content -LiteralPath $file -Raw | ConvertFrom-Json; Write-Host 'NODE_JSON_EXISTS true'; Write-Host ('NODE_ID_PRESENT ' + [bool]$json.node_id); Write-Host ('NODE_TOKEN_PRESENT ' + [bool]$json.node_token); Write-Host 'NODE_TOKEN_REDACTED <redacted>'; Write-Host ('STORED_GPU ' + $(if($json.gpu_name){$json.gpu_name}else{'<missing>'})) } else { Write-Host 'NODE_JSON_EXISTS false' }
git -C 'C:\Users\danki\Desktop\nodemuncher-codex' status --short -- src-tauri/src/main.rs src-nodemuncher/NodeMuncherApp.tsx dist-nodemuncher src-tauri/target/release/farpy-nodemuncher.exe src-tauri/target/release/bundle
```

## Result

GREEN.

Heartbeat GPU metadata now prefers detected local probe data and explicitly reports fallback when probe data is unavailable. Token values were not printed.
