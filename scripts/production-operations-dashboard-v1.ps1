param(
  [string]$OutputPath = "",
  [string]$BaseUrl = "https://farpy.com"
)

$ErrorActionPreference = "Stop"
$timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
$base = $BaseUrl.TrimEnd("/")
$results = @()

function Redact-Url {
  param([string]$Url)
  if ([string]::IsNullOrWhiteSpace($Url)) { return $Url }
  return ($Url -replace '(token|secret|key|session|cookie)=([^&]+)', '$1=REDACTED')
}

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
    evidence = Redact-Url $Evidence
    notes = $Notes
    required = $Required
  }
}

function Test-Http {
  param(
    [string]$Area,
    [string]$Check,
    [string]$Path,
    [int[]]$Expected = @(200),
    [string]$Method = "GET",
    [hashtable]$Headers = @{},
    [string]$Body = "",
    [bool]$Required = $true
  )
  $url = if ($Path -match "^https?://") { $Path } else { "$script:base$Path" }
  try {
    $request = @{
      Method = $Method
      Uri = $url
      Headers = $Headers
      UseBasicParsing = $true
      TimeoutSec = 25
      MaximumRedirection = 5
    }
    if (![string]::IsNullOrEmpty($Body)) { $request.Body = $Body }
    $response = Invoke-WebRequest @request
    $code = [int]$response.StatusCode
    if ($Expected -contains $code) {
      Add-Result $Area $Check "PASS" $url "" $code $Required
    } else {
      Add-Result $Area $Check "FAIL" $url "expected $($Expected -join '/') got $code" $code $Required
    }
  } catch {
    $response = $_.Exception.Response
    if ($response) {
      $code = [int]$response.StatusCode
      if ($Expected -contains $code) {
        Add-Result $Area $Check "PASS" $url "" $code $Required
      } else {
        Add-Result $Area $Check "FAIL" $url "expected $($Expected -join '/') got $code" $code $Required
      }
    } else {
      Add-Result $Area $Check "FAIL" $url $_.Exception.Message $null $Required
    }
  }
}

function Test-OptionalJson {
  param([string]$Area, [string]$Check, [string]$EnvName, [string[]]$AnyFields = @())
  $url = [Environment]::GetEnvironmentVariable($EnvName)
  if ([string]::IsNullOrWhiteSpace($url)) {
    Add-Result $Area $Check "SKIP" $EnvName "set $EnvName for richer live/private metrics" $null $false
    return
  }
  try {
    $json = Invoke-RestMethod -Method GET -Uri $url -TimeoutSec 25
    if ($AnyFields.Count -gt 0) {
      $found = @($AnyFields | Where-Object { $null -ne $json.$_ })
      if ($found.Count -eq 0) {
        Add-Result $Area $Check "FAIL" $url "none of expected fields present: $($AnyFields -join ',')" 200 $false
        return
      }
    }
    Add-Result $Area $Check "PASS" $url "json ok" 200 $false
  } catch {
    $response = $_.Exception.Response
    $code = if ($response) { [int]$response.StatusCode } else { $null }
    Add-Result $Area $Check "FAIL" $url $_.Exception.Message $code $false
  }
}

Test-Http "WEBSITE" "Homepage" "/"
Test-Http "WEBSITE" "Workspace" "/workspace"
Test-Http "WEBSITE" "Account" "/account"
Test-Http "WEBSITE" "Status page" "/status"
Test-Http "RECEIPTS" "Receipt shell" "/receipt"
Test-Http "DOWNLOADS" "Downloads page" "/downloads/"
Test-Http "DOWNLOADS" "Addon page" "/addon"
Test-Http "JOBS" "Web render health" "/node/v1/web-render/health"
Test-Http "JOBS" "Worker status" "/node/v1/web-render/worker/status"
Test-Http "BENCHMARK" "Benchmark leaderboard page" "/benchmark/leaderboard"
Test-Http "BENCHMARK" "Leaderboard top API" "/node/v1/leaderboard/top"
Test-Http "BENCHMARK" "Leaderboard stats API" "/node/v1/leaderboard/stats"
Test-Http "NODES" "NodeMuncher lease peek rejects missing token" "/node/v1/nodemuncher/lease/peek" @(403) "POST"
Test-Http "NODES" "NodeMuncher lease claim rejects missing token" "/node/v1/nodemuncher/lease/claim" @(403) "POST"

foreach ($path in @("/api", "/faq", "/docs", "/privacy", "/terms", "/refunds", "/contact", "/dmca", "/acceptable-use", "/security", "/files", "/pricing")) {
  Test-Http "DOCS/LEGAL" "Route $path" $path
}

Test-OptionalJson "ALERTS" "Ops status JSON" "FARPY_OPS_STATUS_JSON_URL" @("ok", "status", "healthy")
Test-OptionalJson "JOBS" "Ops jobs JSON" "FARPY_OPS_JOBS_JSON_URL" @("jobs", "counts", "submitted", "running")
Test-OptionalJson "BENCHMARK" "Ops leaderboard stats override" "FARPY_OPS_LEADERBOARD_STATS_URL" @("ok", "total", "count", "submissions")
Test-OptionalJson "RECEIPTS" "Recent receipt JSON" "FARPY_OPS_RECENT_RECEIPT_URL" @("receipt_id", "job_id", "output_sha256")

$downloadUrl = [Environment]::GetEnvironmentVariable("FARPY_OPS_RECENT_DOWNLOAD_URL")
if ([string]::IsNullOrWhiteSpace($downloadUrl)) {
  Add-Result "DOWNLOADS" "Recent download ZIP" "SKIP" "FARPY_OPS_RECENT_DOWNLOAD_URL" "set env var for recent tokenized download proof" $null $false
} else {
  Test-Http "DOWNLOADS" "Recent download ZIP" $downloadUrl @(200) "GET" @{} "" $false
}

$failures = @($results | Where-Object { $_.status -eq "FAIL" })
$requiredFailures = @($results | Where-Object { $_.required -and $_.status -eq "FAIL" })
$skips = @($results | Where-Object { $_.status -eq "SKIP" })
$passes = @($results | Where-Object { $_.status -eq "PASS" })
$verdict = if ($requiredFailures.Count -gt 0) { "RED" } elseif ($failures.Count -gt 0) { "YELLOW" } else { "GREEN" }

function Area-State {
  param([string]$Area)
  $items = @($results | Where-Object { $_.area -eq $Area })
  if (($items | Where-Object { $_.status -eq "FAIL" -and $_.required }).Count -gt 0) { return "RED" }
  if (($items | Where-Object { $_.status -eq "FAIL" }).Count -gt 0) { return "YELLOW" }
  return "GREEN"
}

Write-Host "PRODUCTION_OPERATIONS_DASHBOARD_V1"
Write-Host "TIMESTAMP=$timestamp"
Write-Host "VERDICT=$verdict"
Write-Host ""
foreach ($area in @("WEBSITE", "JOBS", "NODES", "RECEIPTS", "DOWNLOADS", "BENCHMARK", "ALERTS")) {
  Write-Host ("{0}: {1}" -f $area, (Area-State $area))
}
Write-Host ""
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
  $jsonPath = Join-Path (Get-Location) "production-operations-dashboard-v1-$safeStamp.json"
}
@($results) | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $jsonPath -Encoding UTF8
Write-Host ""
Write-Host "EVIDENCE_FILE=$jsonPath"

if ($verdict -eq "RED") {
  exit 1
}
