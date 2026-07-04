param(
  [string]$ProductionHost = "root@farpy.com",
  [string]$ProductionRoot = "/opt/farpy.com/out",
  [string]$RepoRoot = (Split-Path $PSScriptRoot -Parent),
  [string]$LocalOut = "",
  [string]$StageRoot = "",
  [string]$ManifestPath = "C:\tmp\static-preservation-manifest-v1.json",
  [string]$EvidencePath = "C:\tmp\static-deploy-preserve-fix-v1-latest.json",
  [switch]$SkipProductionFetch
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($LocalOut)) {
  $LocalOut = Join-Path $RepoRoot "out"
}
if ([string]::IsNullOrWhiteSpace($StageRoot)) {
  $stamp = (Get-Date).ToUniversalTime().ToString("yyyyMMddTHHmmssZ")
  $StageRoot = "C:\tmp\farpy-static-deploy-preserved-$stamp"
}

function Write-JsonFile {
  param([string]$Path, [object]$Data)
  $dir = Split-Path -Parent $Path
  if ($dir) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
  $Data | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $Path -Encoding UTF8
}

function Get-StageRelSet {
  param([string]$Root)
  $set = @{}
  $rootItem = Get-Item -LiteralPath $Root
  Get-ChildItem -LiteralPath $Root -Recurse -File -Force | ForEach-Object {
    $rel = $_.FullName.Substring($rootItem.FullName.Length).TrimStart("\", "/").Replace("\", "/")
    $set[$rel] = $true
  }
  $set
}

function Invoke-StaticGuard {
  param([string]$Mode, [string]$OutRoot, [string]$Output)
  $guard = Join-Path $RepoRoot "scripts\static-preservation-guard-v1.ps1"
  & powershell -NoProfile -ExecutionPolicy Bypass -File $guard -Mode $Mode -ProductionHost $ProductionHost -ProductionRoot $ProductionRoot -LocalOut $OutRoot -ManifestPath $ManifestPath -OutputPath $Output
  $code = $LASTEXITCODE
  if (Test-Path -LiteralPath $Output) {
    return [ordered]@{ exit_code = $code; output = (Get-Content -LiteralPath $Output -Raw | ConvertFrom-Json) }
  }
  return [ordered]@{ exit_code = $code; output = $null }
}

$timestamp = (Get-Date).ToUniversalTime().ToString("o")

try {
  if (!(Test-Path -LiteralPath $LocalOut)) {
    throw "LocalOut does not exist: $LocalOut"
  }
  if (Test-Path -LiteralPath $StageRoot) {
    throw "StageRoot already exists; choose a new path: $StageRoot"
  }

  New-Item -ItemType Directory -Force -Path $StageRoot | Out-Null
  Copy-Item -Path (Join-Path $LocalOut "*") -Destination $StageRoot -Recurse -Force

  $manifestGuard = Invoke-StaticGuard -Mode "GenerateManifest" -OutRoot $StageRoot -Output "C:\tmp\static-preservation-guard-v1-preservefix-generate.json"
  if ($manifestGuard.exit_code -ne 0) {
    throw "GenerateManifest failed; see C:\tmp\static-preservation-guard-v1-preservefix-generate.json"
  }
  if (!(Test-Path -LiteralPath $ManifestPath)) {
    throw "Static preservation manifest was not created: $ManifestPath"
  }

  $manifest = Get-Content -LiteralPath $ManifestPath -Raw | ConvertFrom-Json
  $stageSet = Get-StageRelSet -Root $StageRoot
  $missing = @($manifest.artifacts | Where-Object { -not $stageSet.ContainsKey([string]$_.rel) })
  $missingListPath = "C:\tmp\static-preservation-missing-v1.txt"
  [System.IO.File]::WriteAllText(
    $missingListPath,
    (($missing | ForEach-Object { [string]$_.rel }) -join "`n") + "`n",
    [System.Text.Encoding]::ASCII
  )

  $fetched = 0
  if ($missing.Count -gt 0) {
    if ($SkipProductionFetch) {
      throw "$($missing.Count) protected artifacts are missing from stage and SkipProductionFetch is set."
    }
    $fetchStamp = (Get-Date).ToUniversalTime().ToString("yyyyMMddTHHmmssZ")
    $fetchTarPath = "C:\tmp\static-preservation-fetch-$fetchStamp.tar"
    $tarCmd = "cd $ProductionRoot && tar -cf - -T -"
    $cmdLine = "ssh $ProductionHost `"$tarCmd`" < `"$missingListPath`" > `"$fetchTarPath`""
    & cmd.exe /d /c $cmdLine
    if ($LASTEXITCODE -ne 0) {
      throw "Preserved artifact fetch failed."
    }
    & tar -xf $fetchTarPath -C $StageRoot
    if ($LASTEXITCODE -ne 0) {
      throw "Preserved artifact extract failed."
    }
    $stageSet = Get-StageRelSet -Root $StageRoot
    $remainingAfterFetch = @($manifest.artifacts | Where-Object { -not $stageSet.ContainsKey([string]$_.rel) })
    $fetched = $missing.Count - $remainingAfterFetch.Count
    if ($remainingAfterFetch.Count -gt 0) {
      throw "Preserved artifact fetch left $($remainingAfterFetch.Count) protected artifacts missing from stage."
    }
  }

  $predeployGuard = Invoke-StaticGuard -Mode "PreDeploy" -OutRoot $StageRoot -Output "C:\tmp\static-preservation-guard-v1-preservefix-predeploy.json"
  $predeployVerdict = if ($predeployGuard.output) { $predeployGuard.output.verdict } else { "UNKNOWN" }

  $result = [ordered]@{
    ok = ($predeployGuard.exit_code -eq 0)
    verdict = $predeployVerdict
    generated_at = $timestamp
    local_out = $LocalOut
    stage_root = $StageRoot
    manifest_path = $ManifestPath
    missing_before_fetch_count = $missing.Count
    fetched_count = $fetched
    missing_list_path = $missingListPath
    predeploy_guard_output = "C:\tmp\static-preservation-guard-v1-preservefix-predeploy.json"
    production_deploy_performed = $false
  }
  Write-JsonFile -Path $EvidencePath -Data $result

  Write-Host "STATIC_DEPLOY_PRESERVE_FIX_V1"
  Write-Host "VERDICT=$predeployVerdict"
  Write-Host "STAGE_ROOT=$StageRoot"
  Write-Host "MISSING_BEFORE_FETCH=$($missing.Count)"
  Write-Host "FETCHED=$fetched"
  Write-Host "EVIDENCE=$EvidencePath"

  if ($predeployGuard.exit_code -ne 0) { exit 1 }
  exit 0
} catch {
  $result = [ordered]@{
    ok = $false
    verdict = "RED"
    generated_at = $timestamp
    error = $_.Exception.Message
    local_out = $LocalOut
    stage_root = $StageRoot
    production_deploy_performed = $false
  }
  Write-JsonFile -Path $EvidencePath -Data $result
  Write-Host "STATIC_DEPLOY_PRESERVE_FIX_V1"
  Write-Host "VERDICT=RED"
  Write-Host ("ERROR=" + $_.Exception.Message)
  Write-Host "EVIDENCE=$EvidencePath"
  exit 1
}
