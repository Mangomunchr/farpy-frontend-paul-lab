param(
  [string]$OutputPath = "",
  [switch]$Destructive
)

$ErrorActionPreference = "Stop"
$timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
$results = @()
$frontendRoot = Split-Path -Parent (Split-Path -Parent $PSCommandPath)
$nodeRepo = "C:\Users\danki\Desktop\nodemuncher-codex"
$localNodePath = Join-Path $env:LOCALAPPDATA "FarpyNode\node.json"

function Add-Result {
  param(
    [string]$Area,
    [string]$Check,
    [string]$Status,
    [string]$Evidence,
    [string]$Notes = "",
    [Nullable[int]]$HttpStatus = $null,
    [bool]$Required = $true
  )
  $script:results += [pscustomobject]@{
    timestamp = $script:timestamp
    area = $Area
    check = $Check
    status = $Status
    http_status = $HttpStatus
    evidence = $Evidence
    notes = $Notes
    required = $Required
  }
}

function Test-PathRequired {
  param([string]$Area, [string]$Check, [string]$Path, [bool]$Required = $true)
  if (Test-Path -LiteralPath $Path) {
    $item = Get-Item -LiteralPath $Path
    Add-Result $Area $Check "PASS" $Path "length=$($item.Length); modified=$($item.LastWriteTime.ToString('s'))" $null $Required
  } else {
    Add-Result $Area $Check "FAIL" $Path "missing" $null $Required
  }
}

function Test-Http {
  param(
    [string]$Area,
    [string]$Check,
    [string]$Url,
    [int[]]$Expected = @(200),
    [string]$Method = "GET",
    [hashtable]$Headers = @{},
    [string]$Body = $null,
    [bool]$Required = $true
  )
  try {
    $request = @{
      Method = $Method
      Uri = $Url
      Headers = $Headers
      UseBasicParsing = $true
      TimeoutSec = 25
    }
    if (![string]::IsNullOrEmpty($Body)) {
      $request.Body = $Body
    }
    $response = Invoke-WebRequest @request
    $code = [int]$response.StatusCode
    if ($Expected -contains $code) {
      Add-Result $Area $Check "PASS" $Url "" $code $Required
    } else {
      Add-Result $Area $Check "FAIL" $Url "expected $($Expected -join '/') got $code" $code $Required
    }
  } catch {
    $response = $_.Exception.Response
    if ($response) {
      $code = [int]$response.StatusCode
      if ($Expected -contains $code) {
        Add-Result $Area $Check "PASS" $Url "" $code $Required
      } else {
        Add-Result $Area $Check "FAIL" $Url "expected $($Expected -join '/') got $code" $code $Required
      }
    } else {
      Add-Result $Area $Check "FAIL" $Url $_.Exception.Message $null $Required
    }
  }
}

function Test-JsonFile {
  param([string]$Area, [string]$Check, [string]$Path, [string[]]$Fields, [bool]$Required = $true)
  if (!(Test-Path -LiteralPath $Path)) {
    Add-Result $Area $Check "SKIP" $Path "not present; expected on an already paired local install" $null $false
    return
  }
  try {
    $json = Get-Content -LiteralPath $Path -Raw | ConvertFrom-Json
    $missing = @($Fields | Where-Object { -not $json.$_ })
    if ($missing.Count -eq 0) {
      $nodeId = if ($json.node_id) { $json.node_id } else { "unknown" }
      Add-Result $Area $Check "PASS" $Path "node_id=$nodeId; token_present=$([bool]$json.node_token)" $null $Required
    } else {
      Add-Result $Area $Check "FAIL" $Path "missing fields: $($missing -join ',')" $null $Required
    }
  } catch {
    Add-Result $Area $Check "FAIL" $Path $_.Exception.Message $null $Required
  }
}

function Test-VersionMetadata {
  $packagePath = Join-Path $nodeRepo "package.json"
  $tauriPath = Join-Path $nodeRepo "src-tauri\tauri.nodemuncher.conf.json"
  try {
    $pkg = Get-Content -LiteralPath $packagePath -Raw | ConvertFrom-Json
    $tauri = Get-Content -LiteralPath $tauriPath -Raw | ConvertFrom-Json
    if ($pkg.version -and $tauri.productName -eq "Farpy NodeMuncher" -and $tauri.version) {
      Add-Result "Metadata" "Version/build metadata" "PASS" "$packagePath; $tauriPath" "package=$($pkg.version); product=$($tauri.productName); tauri=$($tauri.version)"
    } else {
      Add-Result "Metadata" "Version/build metadata" "FAIL" "$packagePath; $tauriPath" "missing package version, product name, or tauri version"
    }
  } catch {
    Add-Result "Metadata" "Version/build metadata" "FAIL" "$packagePath; $tauriPath" $_.Exception.Message
  }
}

Test-PathRequired "Installer artifacts" "Public Windows NSIS artifact exists" (Join-Path $frontendRoot "public\downloads\nodemuncher-windows-amd64.exe")
Test-PathRequired "Installer artifacts" "Public Windows MSI artifact exists" (Join-Path $frontendRoot "public\downloads\nodemuncher-windows-amd64.msi")
Test-PathRequired "Installer artifacts" "Public macOS DMG artifact exists" (Join-Path $frontendRoot "public\downloads\nodemuncher-macos-aarch64.dmg")
Test-PathRequired "Installer artifacts" "Windows NSIS sidecar exists" (Join-Path $frontendRoot "public\downloads\nodemuncher-windows-amd64.exe.sha256")
Test-PathRequired "Installer artifacts" "Windows MSI sidecar exists" (Join-Path $frontendRoot "public\downloads\nodemuncher-windows-amd64.msi.sha256")
Test-PathRequired "Installer artifacts" "macOS DMG sidecar exists" (Join-Path $frontendRoot "public\downloads\nodemuncher-macos-aarch64.dmg.sha256")

Test-PathRequired "App dist" "NodeMuncher frontend dist exists" (Join-Path $nodeRepo "dist-nodemuncher\index.nodemuncher.html")
Test-PathRequired "App binary" "Tauri release binary exists" (Join-Path $nodeRepo "src-tauri\target\release\farpy-nodemuncher.exe")
Test-PathRequired "Tauri files" "NodeMuncher Tauri config exists" (Join-Path $nodeRepo "src-tauri\tauri.nodemuncher.conf.json")
Test-PathRequired "Tauri files" "NodeMuncher source entry exists" (Join-Path $nodeRepo "src-nodemuncher\NodeMuncherApp.tsx")
Test-VersionMetadata

Test-Http "Public endpoints" "Farpy web health" "https://farpy.com/node/v1/web-render/health" @(200)
Test-Http "Public endpoints" "NodeMuncher lease auth gate rejects invalid token" "https://farpy.com/node/v1/nodemuncher/lease/peek" @(403) "POST" @{ "x-farpy-node-token" = "invalid-node-token" } "{}"
Test-Http "Public endpoints" "NodeMuncher heartbeat endpoint rejects invalid token" "https://api.farpy.com/node/heartbeat" @(401,403) "POST" @{ "content-type" = "application/json"; "x-farpy-node-token" = "invalid-node-token" } '{"node_id":"NODE-INVALID","gpu_name":"INVALID","version":"audit"}'

Test-JsonFile "Local identity" "Persisted node identity path" $localNodePath @("node_id", "node_token") $false

if ($Destructive) {
  Add-Result "Fresh install mode" "Destructive cleanup requested" "PASS" $localNodePath "destructive mode requested; this script does not delete data automatically"
} else {
  Add-Result "Fresh install mode" "Fresh install destructive reset" "SKIP" "-Destructive" "non-destructive dry run; no local app data was removed" $null $false
}

$failures = @($results | Where-Object { $_.status -eq "FAIL" })
$requiredFailures = @($results | Where-Object { $_.required -and $_.status -eq "FAIL" })
$skips = @($results | Where-Object { $_.status -eq "SKIP" })
$passes = @($results | Where-Object { $_.status -eq "PASS" })
$verdict = if ($requiredFailures.Count -gt 0) { "RED" } elseif ($skips.Count -gt 0 -or -not $Destructive) { "YELLOW" } else { "GREEN" }

Write-Host "NODEMUNCHER_FRESH_INSTALL_V1"
Write-Host "TIMESTAMP=$timestamp"
Write-Host "VERDICT=$verdict"
Write-Host "PASS_COUNT=$($passes.Count)"
Write-Host "FAIL_COUNT=$($failures.Count)"
Write-Host "SKIP_COUNT=$($skips.Count)"
Write-Host ""

foreach ($item in $results) {
  $statusText = if ($null -ne $item.http_status) { $item.http_status } else { "-" }
  Write-Host ("{0}`t{1}`t{2}`t{3}`t{4}" -f $item.status, $statusText, $item.area, $item.check, $item.evidence)
  if ($item.notes) { Write-Host ("  notes: {0}" -f $item.notes) }
}

if ($OutputPath) {
  $jsonPath = $OutputPath
} else {
  $safeStamp = $timestamp.Replace(":", "").Replace("-", "")
  $jsonPath = Join-Path (Get-Location) "nodemuncher-fresh-install-v1-$safeStamp.json"
}
@($results) | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $jsonPath -Encoding UTF8
Write-Host ""
Write-Host "EVIDENCE_FILE=$jsonPath"

if ($verdict -eq "RED") {
  exit 1
}
