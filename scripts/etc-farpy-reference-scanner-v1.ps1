param(
  [string]$ProductionHost = "root@farpy.com",
  [string]$RepoRoot = (Split-Path $PSScriptRoot -Parent),
  [string]$OutputPath = "C:\tmp\etc-farpy-reference-scanner-v1-latest.json",
  [switch]$SkipProduction
)

$ErrorActionPreference = "Stop"

function Write-JsonFile {
  param([string]$Path, [object]$Data)
  $dir = Split-Path -Parent $Path
  if ($dir) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
  $Data | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $Path -Encoding UTF8
}

function Invoke-RemoteJson {
  param([string]$Script)
  if ($SkipProduction) { throw "production skipped" }
  $raw = & ssh $ProductionHost $Script
  if ($LASTEXITCODE -ne 0) {
    throw "ssh command failed with exit code $LASTEXITCODE"
  }
  ($raw -join "`n") | ConvertFrom-Json
}

function Get-ManifestPaths {
  param([string]$RepoRoot)
  $manifest = Join-Path $RepoRoot "docs\FARPY_BOOK\ETC_FARPY_MANIFEST.md"
  if (!(Test-Path -LiteralPath $manifest)) { return @() }
  $text = Get-Content -LiteralPath $manifest -Raw
  @([regex]::Matches($text, '/etc/farpy/[^`\|\s]+') | ForEach-Object { $_.Value.TrimEnd([char[]]@('`', '.')) } | Sort-Object -Unique)
}

$timestamp = (Get-Date).ToUniversalTime().ToString("o")

try {
  $manifestPaths = @(Get-ManifestPaths -RepoRoot $RepoRoot)
  $manifestSet = @{}
  foreach ($p in $manifestPaths) { $manifestSet[$p] = $true }

  if ($SkipProduction) {
    $result = [ordered]@{
      ok = $true
      verdict = "YELLOW"
      generated_at = $timestamp
      production_host = $null
      manifest_count = $manifestPaths.Count
      note = "SkipProduction set; no production scan performed."
    }
    Write-JsonFile -Path $OutputPath -Data $result
    Write-Host "ETC_FARPY_REFERENCE_SCANNER_V1"
    Write-Host "VERDICT=YELLOW"
    Write-Host "EVIDENCE=$OutputPath"
    exit 0
  }

  $remoteScript = @'
find /etc/farpy -type f -printf 'FILE\t%p\t0o%m\t%u:%g\t%s\n' 2>/dev/null | sort
for sr in /etc/systemd/system /opt /usr/local/bin /var/lib/farpy /var/lib/farpy-web-render /opt/farpy-web-render /opt/farpy-node; do
  test -e "$sr" || continue
  find "$sr" \
    -path '*/node_modules' -prune -o \
    -path '*/.git' -prune -o \
    -path '*/__pycache__' -prune -o \
    -path '*/.next' -prune -o \
    -path '*/out' -prune -o \
    -type f -size -2048k \
    ! -name '*.png' ! -name '*.jpg' ! -name '*.jpeg' ! -name '*.gif' \
    ! -name '*.zip' ! -name '*.msi' ! -name '*.exe' ! -name '*.dmg' \
    ! -name '*.db' ! -name '*.sqlite' ! -name '*.pyc' \
    -exec grep -I -H -o -E "/etc/farpy/[A-Za-z0-9._+/@=-]+" {} + 2>/dev/null |
    while IFS=: read -r ref match; do
      printf 'REF\t%s\t%s\n' "$match" "$ref"
    done
done
'@

  $lines = & ssh $ProductionHost $remoteScript
  if ($LASTEXITCODE -ne 0) {
    throw "ssh command failed with exit code $LASTEXITCODE"
  }
  $byPath = @{}
  foreach ($line in $lines) {
    $parts = $line -split "`t"
    if ($parts.Count -ge 5 -and $parts[0] -eq "FILE") {
      $byPath[$parts[1]] = [ordered]@{ path = $parts[1]; mode = $parts[2]; owner = $parts[3]; bytes = [int64]$parts[4]; references = @() }
    } elseif ($parts.Count -ge 3 -and $parts[0] -eq "REF") {
      if ($byPath.ContainsKey($parts[1])) {
        $byPath[$parts[1]].references += $parts[2]
      }
    }
  }
  $items = @($byPath.Values | Sort-Object { $_.path })
  $missingManifest = @($items | Where-Object { -not $manifestSet.ContainsKey([string]$_.path) })
  $orphan = @($items | Where-Object { @($_.references).Count -eq 0 })
  $referenced = @($items | Where-Object { @($_.references).Count -gt 0 })

  $serviceMap = @(
    foreach ($item in $referenced) {
      [ordered]@{
        path = $item.path
        mode = $item.mode
        owner = $item.owner
        references = @($item.references)
        reference_count = @($item.references).Count
        in_manifest = $manifestSet.ContainsKey([string]$item.path)
      }
    }
  )

  $result = [ordered]@{
    ok = $true
    verdict = if ($missingManifest.Count -gt 0) { "YELLOW" } else { "GREEN" }
    generated_at = $timestamp
    production_host = $ProductionHost
    manifest_count = $manifestPaths.Count
    production_file_count = $items.Count
    referenced_count = $referenced.Count
    orphan_count = $orphan.Count
    missing_manifest_count = $missingManifest.Count
    referenced = $serviceMap
    orphan_paths = @($orphan | ForEach-Object { $_.path })
    missing_manifest_paths = @($missingManifest | ForEach-Object { $_.path })
  }

  Write-JsonFile -Path $OutputPath -Data $result

  Write-Host "ETC_FARPY_REFERENCE_SCANNER_V1"
  Write-Host ("VERDICT=" + $result.verdict)
  Write-Host ("PRODUCTION_FILE_COUNT=" + $result.production_file_count)
  Write-Host ("REFERENCED_COUNT=" + $result.referenced_count)
  Write-Host ("ORPHAN_COUNT=" + $result.orphan_count)
  Write-Host ("MISSING_MANIFEST_COUNT=" + $result.missing_manifest_count)
  Write-Host "EVIDENCE=$OutputPath"
  exit 0
} catch {
  $result = [ordered]@{
    ok = $false
    verdict = "RED"
    generated_at = $timestamp
    error = $_.Exception.Message
  }
  Write-JsonFile -Path $OutputPath -Data $result
  Write-Host "ETC_FARPY_REFERENCE_SCANNER_V1"
  Write-Host "VERDICT=RED"
  Write-Host ("ERROR=" + $_.Exception.Message)
  Write-Host "EVIDENCE=$OutputPath"
  exit 1
}
