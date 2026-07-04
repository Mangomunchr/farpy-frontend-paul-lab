param(
  [ValidateSet("GenerateManifest", "PreDeploy", "PostDeploy", "All")]
  [string]$Mode = "PreDeploy",

  [string]$ProductionHost = "root@farpy.com",
  [string]$ProductionRoot = "/opt/farpy.com/out",
  [string]$LocalOut = (Join-Path (Split-Path $PSScriptRoot -Parent) "out"),
  [string]$ManifestPath = "C:\tmp\static-preservation-manifest-v1.json",
  [string]$OutputPath = "C:\tmp\static-preservation-guard-v1-latest.json",
  [switch]$SkipProduction
)

$ErrorActionPreference = "Stop"

function New-Check {
  param(
    [string]$Name,
    [string]$Status,
    [string]$Evidence,
    [string]$Notes = ""
  )
  [ordered]@{
    name = $Name
    status = $Status
    evidence = $Evidence
    notes = $Notes
  }
}

function Get-Category {
  param([string]$RelPath)
  $p = $RelPath.Replace("\", "/")
  if ($p -like "downloads/*") { return "downloads" }
  if ($p -like "receipt-static/*") { return "receipt_static" }
  if ($p -like "project-status/*") { return "project_status" }
  if ($p -like "node/*.json") { return "node_json" }
  if ($p -like "status/*.json") { return "status_json" }
  if ($p -like "proof/*.json") { return "proof_json" }
  if ($p -match "audit|proof|reconcile|status") { return "audit_or_status" }
  if (($p -notmatch "/") -and ($p -like "*.json")) { return "root_json" }
  if ($p -like "*.sha256") { return "sidecar_hash" }
  return "other"
}

function Test-ProtectedArtifact {
  param([string]$RelPath)
  $p = $RelPath.Replace("\", "/")
  if ($p -like "downloads/*") { return $true }
  if ($p -like "receipt-static/*") { return $true }
  if ($p -like "project-status/*.json") { return $true }
  if ($p -like "node/*.json") { return $true }
  if ($p -like "status/*.json") { return $true }
  if ($p -like "proof/*.json") { return $true }
  if (($p -notmatch "/") -and ($p -like "*.json")) { return $true }
  if ($p -match "audit|proof|reconcile|status") { return $true }
  if ($p -like "*.sha256") { return $true }
  return $false
}

function Get-LocalArtifacts {
  param([string]$Root)
  if (!(Test-Path -LiteralPath $Root)) {
    throw "LocalOut does not exist: $Root"
  }

  $rootItem = Get-Item -LiteralPath $Root
  Get-ChildItem -LiteralPath $Root -Recurse -File -Force | ForEach-Object {
    $rel = $_.FullName.Substring($rootItem.FullName.Length).TrimStart("\", "/").Replace("\", "/")
    if (Test-ProtectedArtifact $rel) {
      [ordered]@{
        rel = $rel
        size = $_.Length
        mtime_utc = $_.LastWriteTimeUtc.ToString("o")
        category = Get-Category $rel
        source = "local"
      }
    }
  }
}

function Get-ProductionArtifacts {
  param(
    [string]$RemoteHost,
    [string]$Root
  )

  $remote = @"
cd '$Root' 2>/dev/null || exit 44
{
  find downloads status proof node project-status receipt-static -type f \( -name '*.json' -o -name '*.zip' -o -name '*.sha256' -o -name '*.msi' -o -name '*.exe' -o -name '*.dmg' -o -name '*.deb' -o -name '*.rpm' \) -printf '%p\t%s\t%T@\n' 2>/dev/null
  find . -maxdepth 1 -type f -name '*.json' -printf '%p\t%s\t%T@\n' 2>/dev/null
} | sort -u
"@

  $lines = & ssh $RemoteHost $remote
  if ($LASTEXITCODE -ne 0) {
    throw "ssh production artifact inventory failed with exit code $LASTEXITCODE"
  }

  foreach ($line in $lines) {
    if ([string]::IsNullOrWhiteSpace($line)) { continue }
    $parts = $line -split "`t"
    if ($parts.Count -lt 3) { continue }
    $rel = $parts[0].TrimStart("./").Replace("\", "/")
    if (!(Test-ProtectedArtifact $rel)) { continue }
    [ordered]@{
      rel = $rel
      size = [int64]$parts[1]
      mtime_epoch = [double]$parts[2]
      category = Get-Category $rel
      source = "production"
    }
  }
}

function Write-JsonFile {
  param(
    [string]$Path,
    [object]$Data
  )
  $dir = Split-Path -Parent $Path
  if ($dir) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
  $Data | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $Path -Encoding UTF8
}

function Read-Manifest {
  param([string]$Path)
  if (!(Test-Path -LiteralPath $Path)) {
    throw "Manifest not found: $Path"
  }
  Get-Content -LiteralPath $Path -Raw | ConvertFrom-Json
}

$checks = New-Object System.Collections.Generic.List[object]
$timestamp = (Get-Date).ToUniversalTime().ToString("o")
$productionArtifacts = @()
$localArtifacts = @()
$missingFromLocal = @()
$missingAfterDeploy = @()

try {
  if ($Mode -in @("GenerateManifest", "PreDeploy", "All")) {
    if ($SkipProduction) {
      $checks.Add((New-Check "production_inventory" "SKIP" "SkipProduction set" "No production manifest generated."))
    } else {
      $productionArtifacts = @(Get-ProductionArtifacts -RemoteHost $ProductionHost -Root $ProductionRoot)
      $manifest = [ordered]@{
        generated_at = $timestamp
        production_host = $ProductionHost
        production_root = $ProductionRoot
        protected_count = $productionArtifacts.Count
        artifacts = $productionArtifacts
      }
      Write-JsonFile -Path $ManifestPath -Data $manifest
      $checks.Add((New-Check "production_manifest_generated" "PASS" $ManifestPath "$($productionArtifacts.Count) protected artifacts recorded."))
    }
  }

  if ($Mode -in @("PreDeploy", "All")) {
    $localArtifacts = @(Get-LocalArtifacts -Root $LocalOut)
    $checks.Add((New-Check "local_out_inventory" "PASS" $LocalOut "$($localArtifacts.Count) protected local artifacts found."))

    if ($productionArtifacts.Count -eq 0 -and (Test-Path -LiteralPath $ManifestPath)) {
      $existing = Read-Manifest -Path $ManifestPath
      $productionArtifacts = @($existing.artifacts)
    }

    if ($productionArtifacts.Count -eq 0) {
      $checks.Add((New-Check "predeploy_compare" "SKIP" $ManifestPath "No production manifest available."))
    } else {
      $localByRel = @{}
      foreach ($a in $localArtifacts) { $localByRel[$a.rel] = $a }
      $missingFromLocal = @($productionArtifacts | Where-Object { -not $localByRel.ContainsKey([string]$_.rel) })
      if ($missingFromLocal.Count -gt 0) {
        $checks.Add((New-Check "predeploy_preservation_required" "FAIL" $ManifestPath "$($missingFromLocal.Count) protected production artifacts are missing from LocalOut. Preserve or regenerate before clean deploy."))
      } else {
        $checks.Add((New-Check "predeploy_preservation_required" "PASS" $LocalOut "LocalOut contains all protected production artifacts from manifest."))
      }
    }
  }

  if ($Mode -in @("PostDeploy", "All")) {
    if ($SkipProduction) {
      $checks.Add((New-Check "postdeploy_production_verify" "SKIP" "SkipProduction set" "No production verification performed."))
    } else {
      $manifestObj = Read-Manifest -Path $ManifestPath
      $expected = @($manifestObj.artifacts)
      $actual = @(Get-ProductionArtifacts -RemoteHost $ProductionHost -Root $ProductionRoot)
      $actualByRel = @{}
      foreach ($a in $actual) { $actualByRel[$a.rel] = $a }
      $missingAfterDeploy = @($expected | Where-Object { -not $actualByRel.ContainsKey([string]$_.rel) })
      if ($missingAfterDeploy.Count -gt 0) {
        $checks.Add((New-Check "postdeploy_preservation_verify" "FAIL" $ManifestPath "$($missingAfterDeploy.Count) protected artifacts missing after deploy."))
      } else {
        $checks.Add((New-Check "postdeploy_preservation_verify" "PASS" $ManifestPath "All manifest artifacts still present after deploy."))
      }
    }
  }

  $failCount = @($checks | Where-Object { $_.status -eq "FAIL" }).Count
  $skipCount = @($checks | Where-Object { $_.status -eq "SKIP" }).Count
  $passCount = @($checks | Where-Object { $_.status -eq "PASS" }).Count
  $verdict = if ($failCount -gt 0) { "RED" } elseif ($skipCount -gt 0) { "YELLOW" } else { "GREEN" }

  $result = [ordered]@{
    ok = ($failCount -eq 0)
    verdict = $verdict
    generated_at = $timestamp
    mode = $Mode
    local_out = $LocalOut
    production_host = if ($SkipProduction) { $null } else { $ProductionHost }
    production_root = $ProductionRoot
    manifest_path = $ManifestPath
    output_path = $OutputPath
    pass_count = $passCount
    fail_count = $failCount
    skip_count = $skipCount
    checks = $checks
    preserve_required = $missingFromLocal
    missing_after_deploy = $missingAfterDeploy
  }

  Write-JsonFile -Path $OutputPath -Data $result

  Write-Host "STATIC_PRESERVATION_GUARD_V1"
  Write-Host "MODE=$Mode"
  Write-Host "VERDICT=$verdict"
  Write-Host "PASS_COUNT=$passCount"
  Write-Host "FAIL_COUNT=$failCount"
  Write-Host "SKIP_COUNT=$skipCount"
  Write-Host "MANIFEST=$ManifestPath"
  Write-Host "EVIDENCE=$OutputPath"

  if ($missingFromLocal.Count -gt 0) {
    Write-Host "PRESERVE_REQUIRED_COUNT=$($missingFromLocal.Count)"
    $missingFromLocal | Select-Object -First 20 | ForEach-Object { Write-Host ("PRESERVE_REQUIRED " + $_.rel) }
  }

  if ($failCount -gt 0) { exit 1 }
  exit 0
} catch {
  $result = [ordered]@{
    ok = $false
    verdict = "RED"
    generated_at = $timestamp
    mode = $Mode
    error = $_.Exception.Message
    checks = $checks
  }
  Write-JsonFile -Path $OutputPath -Data $result
  Write-Host "STATIC_PRESERVATION_GUARD_V1"
  Write-Host "VERDICT=RED"
  Write-Host ("ERROR=" + $_.Exception.Message)
  Write-Host "EVIDENCE=$OutputPath"
  exit 1
}
