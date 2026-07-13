param(
  [string]$OutputPath = "",
  [string]$AddonZipPath = "C:\Users\danki\Desktop\Farpy-Blender-Addon-unified.zip",
  [string]$BaseUrl = "https://farpy.com"
)

$ErrorActionPreference = "Stop"
$timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
$base = $BaseUrl.TrimEnd("/")
$results = @()
$expectedSha = "1679B392CE7ECC54C4E9AD31A04A2A92AFF826468CA8383CB7200011117176D5"

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

function Test-Http {
  param([string]$Area, [string]$Check, [string]$Url, [bool]$Required = $true)
  try {
    $response = Invoke-WebRequest -Method GET -Uri $Url -UseBasicParsing -TimeoutSec 25 -MaximumRedirection 5
    $code = [int]$response.StatusCode
    if ($code -eq 200) {
      Add-Result $Area $Check "PASS" $Url "" $code $Required
    } else {
      Add-Result $Area $Check "FAIL" $Url "expected 200 got $code" $code $Required
    }
  } catch {
    $response = $_.Exception.Response
    if ($response) {
      Add-Result $Area $Check "FAIL" $Url "expected 200 got $([int]$response.StatusCode)" ([int]$response.StatusCode) $Required
    } else {
      Add-Result $Area $Check "FAIL" $Url $_.Exception.Message $null $Required
    }
  }
}

function Find-Blender {
  $candidates = @(
    $env:BLENDER_EXE,
    "C:\Program Files\Blender Foundation\Blender 4.5\blender.exe",
    "C:\Program Files\Blender Foundation\Blender 4.4\blender.exe",
    "C:\Program Files\Blender Foundation\Blender 4.3\blender.exe",
    "C:\Program Files\Blender Foundation\Blender 4.2\blender.exe",
    "C:\Program Files\Blender Foundation\Blender 4.1\blender.exe"
  ) | Where-Object { $_ }
  foreach ($candidate in $candidates) {
    if (Test-Path -LiteralPath $candidate) { return $candidate }
  }
  return $null
}

function Expand-AddonZip {
  param([string]$ZipPath)
  $temp = Join-Path $env:TEMP ("farpy-addon-audit-" + [guid]::NewGuid().ToString("N"))
  New-Item -ItemType Directory -Force -Path $temp | Out-Null
  Expand-Archive -LiteralPath $ZipPath -DestinationPath $temp -Force
  return $temp
}

if (Test-Path -LiteralPath $AddonZipPath) {
  $item = Get-Item -LiteralPath $AddonZipPath
  Add-Result "Package" "Addon ZIP exists locally" "PASS" $AddonZipPath "length=$($item.Length); modified=$($item.LastWriteTime.ToString('s'))"
  $hash = (Get-FileHash -LiteralPath $AddonZipPath -Algorithm SHA256).Hash.ToUpperInvariant()
  if ($hash -eq $expectedSha) {
    Add-Result "Package" "Addon ZIP frozen SHA256" "PASS" $AddonZipPath "sha256=$hash"
  } else {
    Add-Result "Package" "Addon ZIP frozen SHA256" "FAIL" $AddonZipPath "expected $expectedSha got $hash"
  }
} else {
  Add-Result "Package" "Addon ZIP exists locally" "FAIL" $AddonZipPath "file not found"
}

$expanded = $null
if (Test-Path -LiteralPath $AddonZipPath) {
  try {
    $expanded = Expand-AddonZip $AddonZipPath
    Add-Result "Package" "Addon ZIP is valid" "PASS" $AddonZipPath "expanded=$expanded"

    $initFile = Join-Path $expanded "farpy_render\__init__.py"
    if (Test-Path -LiteralPath $initFile) {
      Add-Result "Package" "Expected addon entry file exists" "PASS" $initFile
      $source = Get-Content -LiteralPath $initFile -Raw
      if ($source -match "bl_info" -and $source -match "version") {
        Add-Result "Version" "Addon manifest/version present" "PASS" $initFile "bl_info/version present"
      } else {
        Add-Result "Version" "Addon manifest/version present" "FAIL" $initFile "missing bl_info or version"
      }

      $placeholderHits = Select-String -LiteralPath $initFile -Pattern "TODO|FIXME|localhost|example\.com|changeme" -CaseSensitive:$false -ErrorAction SilentlyContinue
      if ($placeholderHits) {
        Add-Result "Package" "No placeholder strings in addon package" "FAIL" $initFile (($placeholderHits | ForEach-Object { "line $($_.LineNumber): $($_.Line.Trim())" }) -join "; ")
      } else {
        Add-Result "Package" "No placeholder strings in addon package" "PASS" $initFile
      }
    } else {
      Add-Result "Package" "Expected addon entry file exists" "FAIL" $initFile "missing"
    }
  } catch {
    Add-Result "Package" "Addon ZIP is valid" "FAIL" $AddonZipPath $_.Exception.Message
  }
}

Test-Http "Public route" "Addon page returns 200" "$base/addon"
Test-Http "Public route" "Downloads page returns 200" "$base/downloads/"

$publicZipUrl = [Environment]::GetEnvironmentVariable("FARPY_ADDON_PUBLIC_ZIP_URL")
if ([string]::IsNullOrWhiteSpace($publicZipUrl)) {
  Add-Result "Public download" "Public addon ZIP URL" "SKIP" "FARPY_ADDON_PUBLIC_ZIP_URL" "set env var if addon ZIP is published directly" $null $false
} else {
  Test-Http "Public download" "Public addon ZIP URL" $publicZipUrl
}

Test-Http "Docs" "Addon README/docs route" "$base/addon" $false

$blender = Find-Blender
if ($blender -and $expanded) {
  $scriptPath = Join-Path $env:TEMP ("farpy-addon-import-smoke-" + [guid]::NewGuid().ToString("N") + ".py")
  $modulePath = (Join-Path $expanded "farpy_render").Replace("\", "\\")
  @"
import importlib.util
spec = importlib.util.spec_from_file_location("farpy_render", r"$modulePath\\__init__.py")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
print("FARPY_ADDON_IMPORT_OK")
"@ | Set-Content -LiteralPath $scriptPath -Encoding UTF8
  try {
    $proc = Start-Process -FilePath $blender -ArgumentList @("--background", "--python", $scriptPath) -NoNewWindow -Wait -PassThru -RedirectStandardOutput "$scriptPath.out" -RedirectStandardError "$scriptPath.err"
    $out = if (Test-Path "$scriptPath.out") { Get-Content "$scriptPath.out" -Raw } else { "" }
    $err = if (Test-Path "$scriptPath.err") { Get-Content "$scriptPath.err" -Raw } else { "" }
    if ($proc.ExitCode -eq 0 -and $out -match "FARPY_ADDON_IMPORT_OK") {
      Add-Result "Runtime" "Blender background import smoke" "PASS" $blender "exit=0"
    } else {
      Add-Result "Runtime" "Blender background import smoke" "FAIL" $blender "exit=$($proc.ExitCode); stdout=$out; stderr=$err"
    }
  } catch {
    Add-Result "Runtime" "Blender background import smoke" "FAIL" $blender $_.Exception.Message
  }
} else {
  Add-Result "Runtime" "Blender background import smoke" "SKIP" "BLENDER_EXE" "Blender executable unavailable or ZIP expansion failed" $null $false
}

$failures = @($results | Where-Object { $_.status -eq "FAIL" })
$requiredFailures = @($results | Where-Object { $_.required -and $_.status -eq "FAIL" })
$skips = @($results | Where-Object { $_.status -eq "SKIP" })
$passes = @($results | Where-Object { $_.status -eq "PASS" })
$runtimeSkippedOnly = $requiredFailures.Count -eq 0 -and $failures.Count -eq 0 -and ($skips.Count -eq 1 -or ($skips.Count -eq 2 -and -not $publicZipUrl))
$verdict = if ($requiredFailures.Count -gt 0 -or $failures.Count -gt 0) { "RED" } elseif ($skips.Count -gt 0) { "YELLOW" } else { "GREEN" }

Write-Host "BLENDER_ADDON_PRODUCTION_AUDIT_V1"
Write-Host "TIMESTAMP=$timestamp"
Write-Host "VERDICT=$verdict"
Write-Host "PASS_COUNT=$($passes.Count)"
Write-Host "FAIL_COUNT=$($failures.Count)"
Write-Host "SKIP_COUNT=$($skips.Count)"
Write-Host ""

foreach ($result in $results) {
  $statusText = if ($null -ne $result.http_status) { $result.http_status } else { "-" }
  Write-Host ("{0}`t{1}`t{2}`t{3}`t{4}" -f $result.status, $statusText, $result.area, $result.check, $result.evidence)
  if ($result.notes) { Write-Host ("  notes: {0}" -f $result.notes) }
}

if ($OutputPath) {
  $jsonPath = $OutputPath
} else {
  $safeStamp = $timestamp.Replace(":", "").Replace("-", "")
  $jsonPath = Join-Path (Get-Location) "blender-addon-production-audit-v1-$safeStamp.json"
}
@($results) | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $jsonPath -Encoding UTF8
Write-Host ""
Write-Host "EVIDENCE_FILE=$jsonPath"

if ($verdict -eq "RED") {
  exit 1
}
