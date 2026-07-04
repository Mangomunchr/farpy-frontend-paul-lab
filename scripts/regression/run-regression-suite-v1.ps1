param(
  [string]$BaseUrl = "https://farpy.com",
  [string]$ApiBaseUrl = "https://api.farpy.com",
  [string]$OutputPath = "C:\tmp\farpy-regression-suite-v1-latest.json"
)

$ErrorActionPreference = "Stop"
$script:Results = New-Object System.Collections.Generic.List[object]

function Normalize-BaseUrl {
  param([string]$Url)
  return ([string]$Url).TrimEnd("/")
}

function Join-TestUrl {
  param(
    [string]$Base,
    [string]$Path
  )
  if ($Path -match "^https?://") {
    return $Path
  }
  if (-not $Path.StartsWith("/")) {
    $Path = "/" + $Path
  }
  return "$Base$Path"
}

function Add-RegressionResult {
  param(
    [string]$Area,
    [string]$Check,
    [ValidateSet("PASS", "WARN", "FAIL")]
    [string]$Status,
    [string]$Evidence,
    [string]$Notes = "",
    [Nullable[int]]$HttpStatus = $null
  )

  $row = [ordered]@{
    area = $Area
    check = $Check
    status = $Status
    http_status = $HttpStatus
    evidence = $Evidence
    notes = $Notes
  }
  $script:Results.Add([pscustomobject]$row) | Out-Null
  $statusText = if ($HttpStatus -ne $null) { "$Status [$HttpStatus]" } else { $Status }
  Write-Host ("{0,-10} {1,-14} {2,-32} {3}" -f $statusText, $Area, $Check, $Evidence)
  if ($Notes) {
    Write-Host ("           {0}" -f $Notes)
  }
}

function Invoke-RegressionRequest {
  param(
    [ValidateSet("GET", "HEAD")]
    [string]$Method,
    [string]$Url,
    [hashtable]$Headers = @{}
  )

  try {
    $response = Invoke-WebRequest `
      -Method $Method `
      -Uri $Url `
      -UseBasicParsing `
      -TimeoutSec 20 `
      -MaximumRedirection 5 `
      -Headers $Headers

    return [pscustomobject]@{
      status_code = [int]$response.StatusCode
      content = [string]$response.Content
      headers = $response.Headers
      error = $null
    }
  } catch {
    $statusCode = 0
    if ($_.Exception.Response) {
      try {
        $statusCode = [int]$_.Exception.Response.StatusCode
      } catch {
        $statusCode = 0
      }
    }

    return [pscustomobject]@{
      status_code = $statusCode
      content = ""
      headers = @{}
      error = $_.Exception.Message
    }
  }
}

function Test-PublicPage {
  param(
    [string]$Area,
    [string]$Path,
    [string[]]$ExpectedText = @()
  )

  $url = Join-TestUrl $script:BaseUrl $Path
  $response = Invoke-RegressionRequest -Method GET -Url $url

  if ($response.status_code -ne 200) {
    Add-RegressionResult -Area $Area -Check "route loads" -Status FAIL -Evidence $url -HttpStatus $response.status_code -Notes $response.error
    return
  }

  Add-RegressionResult -Area $Area -Check "route loads" -Status PASS -Evidence $url -HttpStatus $response.status_code

  foreach ($needle in $ExpectedText) {
    if ($response.content -like "*$needle*") {
      Add-RegressionResult -Area $Area -Check "UI contains '$needle'" -Status PASS -Evidence $url -HttpStatus $response.status_code
    } else {
      Add-RegressionResult -Area $Area -Check "UI contains '$needle'" -Status WARN -Evidence $url -HttpStatus $response.status_code -Notes "Expected launch copy was not found in returned HTML."
    }
  }
}

function Test-PublicAsset {
  param(
    [string]$Area,
    [string]$Path,
    [bool]$Required = $true
  )

  $url = Join-TestUrl $script:BaseUrl $Path
  $response = Invoke-RegressionRequest -Method HEAD -Url $url

  if ($response.status_code -lt 200 -or $response.status_code -ge 400) {
    $response = Invoke-RegressionRequest -Method GET -Url $url -Headers @{ Range = "bytes=0-0" }
  }

  if ($response.status_code -ge 200 -and $response.status_code -lt 400) {
    Add-RegressionResult -Area $Area -Check "asset reachable" -Status PASS -Evidence $url -HttpStatus $response.status_code
  } else {
    $status = if ($Required) { "FAIL" } else { "WARN" }
    Add-RegressionResult -Area $Area -Check "asset reachable" -Status $status -Evidence $url -HttpStatus $response.status_code -Notes $response.error
  }
}

function Test-OptionalPrivateUrl {
  param(
    [string]$Area,
    [string]$Check,
    [string[]]$EnvNames,
    [string[]]$ExpectedText = @()
  )

  $value = $null
  $source = $null
  foreach ($envName in $EnvNames) {
    $candidate = [Environment]::GetEnvironmentVariable($envName)
    if ($candidate) {
      $value = $candidate
      $source = $envName
      break
    }
  }

  if (-not $value) {
    Add-RegressionResult -Area $Area -Check $Check -Status WARN -Evidence ($EnvNames -join " or ") -Notes "Private/tokenized check skipped because no env var was provided."
    return
  }

  $response = Invoke-RegressionRequest -Method GET -Url $value
  if ($response.status_code -ne 200) {
    Add-RegressionResult -Area $Area -Check $Check -Status FAIL -Evidence $source -HttpStatus $response.status_code -Notes $response.error
    return
  }

  Add-RegressionResult -Area $Area -Check $Check -Status PASS -Evidence $source -HttpStatus $response.status_code

  foreach ($needle in $ExpectedText) {
    if ($response.content -like "*$needle*") {
      Add-RegressionResult -Area $Area -Check "private response contains '$needle'" -Status PASS -Evidence $source -HttpStatus $response.status_code
    } else {
      Add-RegressionResult -Area $Area -Check "private response contains '$needle'" -Status WARN -Evidence $source -HttpStatus $response.status_code -Notes "Private URL loaded, but expected proof text was not found."
    }
  }
}

function Test-NodeHealth {
  $pairHealthUrl = Join-TestUrl $script:BaseUrl "/node/v1/pair/health"
  $pairHealth = Invoke-RegressionRequest -Method GET -Url $pairHealthUrl
  if ($pairHealth.status_code -eq 200) {
    Add-RegressionResult -Area "Node health" -Check "pair health" -Status PASS -Evidence $pairHealthUrl -HttpStatus $pairHealth.status_code
  } else {
    Add-RegressionResult -Area "Node health" -Check "pair health" -Status FAIL -Evidence $pairHealthUrl -HttpStatus $pairHealth.status_code -Notes $pairHealth.error
  }

  $apiHealthUrl = Join-TestUrl $script:ApiBaseUrl "/healthz"
  $apiHealth = Invoke-RegressionRequest -Method GET -Url $apiHealthUrl
  if ($apiHealth.status_code -eq 200) {
    Add-RegressionResult -Area "Node health" -Check "api healthz" -Status PASS -Evidence $apiHealthUrl -HttpStatus $apiHealth.status_code
  } else {
    Add-RegressionResult -Area "Node health" -Check "api healthz" -Status WARN -Evidence $apiHealthUrl -HttpStatus $apiHealth.status_code -Notes "API healthz may not be public on this host; pair health remains the required node check."
  }
}

$script:BaseUrl = Normalize-BaseUrl $BaseUrl
$script:ApiBaseUrl = Normalize-BaseUrl $ApiBaseUrl
$startedAt = (Get-Date).ToUniversalTime().ToString("o")

Write-Host "FARPY REGRESSION SUITE V1"
Write-Host "Started: $startedAt"
Write-Host "BaseUrl: $script:BaseUrl"
Write-Host "ApiBaseUrl: $script:ApiBaseUrl"
Write-Host ""

Test-PublicPage -Area "Homepage" -Path "/" -ExpectedText @("Send package", "Render Partner", "Receipt-backed")
Test-PublicPage -Area "Sign in" -Path "/signin" -ExpectedText @("Continue with Google", "email")
Test-PublicPage -Area "Account" -Path "/account" -ExpectedText @("Wallet", "package history")
Test-PublicPage -Area "Workspace" -Path "/workspace" -ExpectedText @("Track your render from upload to download", "Package received")
Test-PublicPage -Area "Upload" -Path "/" -ExpectedText @("Upload package", "Drop a .blend or .orbx package here")
Test-PublicPage -Area "Wallet" -Path "/topup" -ExpectedText @("wallet", "Card")
Test-PublicPage -Area "Topup" -Path "/topup" -ExpectedText @("Card", "Bitcoin")
Test-PublicPage -Area "Receipt" -Path "/receipt" -ExpectedText @("Delivery Receipt", "Verification Details")
Test-PublicPage -Area "Download" -Path "/downloads" -ExpectedText @("Download", "Benchmark")
Test-PublicPage -Area "Status" -Path "/status" -ExpectedText @("Website", "Wallet", "Receipts")
Test-PublicPage -Area "Add-on" -Path "/addon" -ExpectedText @("Farpy Render Delivery", "Download Blender Add-on")
Test-PublicPage -Area "Benchmark" -Path "/benchmark" -ExpectedText @("Benchmark", "Download Farpy Benchmark")

Test-PublicAsset -Area "Add-on" -Path "/downloads/Farpy-Blender-Addon-unified.zip" -Required $true
Test-PublicAsset -Area "Add-on" -Path "/downloads/Farpy-Blender-Addon-unified.zip.sha256" -Required $true
Test-PublicAsset -Area "Benchmark" -Path "/downloads/farpy-benchmark-windows-amd64.exe.sha256" -Required $true
Test-PublicAsset -Area "Benchmark" -Path "/downloads/farpy-benchmark-windows-amd64.msi.sha256" -Required $true

Test-OptionalPrivateUrl -Area "Workspace" -Check "completed job status" -EnvNames @("FARPY_REGRESSION_JOB_STATUS_URL", "FARPY_AUDIT_JOB_STATUS_URL") -ExpectedText @("job_id")
Test-OptionalPrivateUrl -Area "Receipt" -Check "tokenized receipt" -EnvNames @("FARPY_REGRESSION_RECEIPT_URL", "FARPY_AUDIT_RECEIPT_URL") -ExpectedText @("receipt", "sha")
Test-OptionalPrivateUrl -Area "Download" -Check "tokenized download" -EnvNames @("FARPY_REGRESSION_DOWNLOAD_URL", "FARPY_AUDIT_DOWNLOAD_URL")

Test-NodeHealth

$passCount = @($script:Results | Where-Object { $_.status -eq "PASS" }).Count
$warnCount = @($script:Results | Where-Object { $_.status -eq "WARN" }).Count
$failCount = @($script:Results | Where-Object { $_.status -eq "FAIL" }).Count
$verdict = if ($failCount -gt 0) { "FAIL" } elseif ($warnCount -gt 0) { "WARN" } else { "PASS" }
$finishedAt = (Get-Date).ToUniversalTime().ToString("o")

$summary = [ordered]@{
  suite = "REGRESSION_SUITE_IMPLEMENTATION_V1"
  started_at = $startedAt
  finished_at = $finishedAt
  base_url = $script:BaseUrl
  api_base_url = $script:ApiBaseUrl
  verdict = $verdict
  pass_count = $passCount
  warn_count = $warnCount
  fail_count = $failCount
  results = $script:Results
}

$outputDir = Split-Path -Parent $OutputPath
if ($outputDir) {
  New-Item -ItemType Directory -Force -Path $outputDir | Out-Null
}
$summary | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $OutputPath -Encoding UTF8

Write-Host ""
Write-Host ("SUMMARY PASS={0} WARN={1} FAIL={2}" -f $passCount, $warnCount, $failCount)
Write-Host "VERDICT=$verdict"
Write-Host "EVIDENCE=$OutputPath"

if ($failCount -gt 0) {
  exit 1
}
