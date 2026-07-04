param(
  [string]$BaseUrl = "https://farpy.com",
  [string]$ApiBaseUrl = "https://api.farpy.com",
  [string]$OutputPath = "C:\tmp\nightly-platform-smoke-v1-latest.json"
)

$ErrorActionPreference = "Stop"
$script:Results = New-Object System.Collections.Generic.List[object]

function Normalize-BaseUrl {
  param([string]$Url)
  return ([string]$Url).TrimEnd("/")
}

function Join-SmokeUrl {
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

function Invoke-SmokeRequest {
  param(
    [ValidateSet("GET", "HEAD", "POST")]
    [string]$Method,
    [string]$Url,
    [hashtable]$Headers = @{},
    [string]$Body = $null
  )

  try {
    $params = @{
      Method = $Method
      Uri = $Url
      UseBasicParsing = $true
      TimeoutSec = 20
      MaximumRedirection = 5
      Headers = $Headers
    }
    if ($PSBoundParameters.ContainsKey("Body")) {
      $params.Body = $Body
      $params.ContentType = "application/json"
    }
    $response = Invoke-WebRequest @params
    return [pscustomobject]@{
      status_code = [int]$response.StatusCode
      content = [string]$response.Content
      headers = $response.Headers
      error = $null
    }
  } catch {
    $statusCode = 0
    $content = ""
    if ($_.Exception.Response) {
      try {
        $statusCode = [int]$_.Exception.Response.StatusCode
      } catch {
        $statusCode = 0
      }
      try {
        $stream = $_.Exception.Response.GetResponseStream()
        if ($stream) {
          $reader = New-Object System.IO.StreamReader($stream)
          $content = $reader.ReadToEnd()
        }
      } catch {
        $content = ""
      }
    }
    return [pscustomobject]@{
      status_code = $statusCode
      content = $content
      headers = @{}
      error = $_.Exception.Message
    }
  }
}

function Add-SmokeResult {
  param(
    [string]$Area,
    [string]$Check,
    [ValidateSet("PASS", "WARN", "FAIL")]
    [string]$Status,
    [string]$Evidence,
    [Nullable[int]]$HttpStatus = $null,
    [string]$Notes = ""
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
  Write-Host ("{0,-10} {1,-12} {2,-28} {3}" -f $statusText, $Area, $Check, $Evidence)
  if ($Notes) {
    Write-Host ("           {0}" -f $Notes)
  }
}

function Test-Page {
  param(
    [string]$Area,
    [string]$Path,
    [string[]]$ExpectedText = @()
  )

  $url = Join-SmokeUrl $script:BaseUrl $Path
  $response = Invoke-SmokeRequest -Method GET -Url $url
  if ($response.status_code -ne 200) {
    Add-SmokeResult -Area $Area -Check "route loads" -Status FAIL -Evidence $url -HttpStatus $response.status_code -Notes $response.error
    return
  }

  Add-SmokeResult -Area $Area -Check "route loads" -Status PASS -Evidence $url -HttpStatus $response.status_code
  foreach ($needle in $ExpectedText) {
    if ($response.content -like "*$needle*") {
      Add-SmokeResult -Area $Area -Check "contains '$needle'" -Status PASS -Evidence $url -HttpStatus $response.status_code
    } else {
      Add-SmokeResult -Area $Area -Check "contains '$needle'" -Status WARN -Evidence $url -HttpStatus $response.status_code -Notes "Route loaded, but expected launch copy was not found in the returned shell."
    }
  }
}

function Test-NonMutatingPostGate {
  param(
    [string]$Area,
    [string]$Path,
    [int[]]$AllowedStatusCodes
  )

  $url = Join-SmokeUrl $script:BaseUrl $Path
  $response = Invoke-SmokeRequest -Method POST -Url $url -Body "{"
  if ($AllowedStatusCodes -contains $response.status_code) {
    Add-SmokeResult -Area $Area -Check "malformed JSON gate" -Status PASS -Evidence $url -HttpStatus $response.status_code
  } else {
    Add-SmokeResult -Area $Area -Check "malformed JSON gate" -Status FAIL -Evidence $url -HttpStatus $response.status_code -Notes "Expected one of: $($AllowedStatusCodes -join ', '). $($response.content)"
  }
}

function Test-OptionalUrl {
  param(
    [string]$Area,
    [string]$Check,
    [string[]]$EnvNames
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
    Add-SmokeResult -Area $Area -Check $Check -Status WARN -Evidence ($EnvNames -join " or ") -Notes "Skipped: no tokenized/private URL env var provided."
    return
  }

  $response = Invoke-SmokeRequest -Method GET -Url $value
  if ($response.status_code -eq 200) {
    Add-SmokeResult -Area $Area -Check $Check -Status PASS -Evidence $source -HttpStatus $response.status_code
  } else {
    Add-SmokeResult -Area $Area -Check $Check -Status FAIL -Evidence $source -HttpStatus $response.status_code -Notes $response.error
  }
}

function Test-Asset {
  param(
    [string]$Area,
    [string]$Path
  )

  $url = Join-SmokeUrl $script:BaseUrl $Path
  $response = Invoke-SmokeRequest -Method HEAD -Url $url

  if ($response.status_code -ge 200 -and $response.status_code -lt 400) {
    Add-SmokeResult -Area $Area -Check "asset reachable" -Status PASS -Evidence $url -HttpStatus $response.status_code
  } else {
    Add-SmokeResult -Area $Area -Check "asset reachable" -Status FAIL -Evidence $url -HttpStatus $response.status_code -Notes $response.error
  }
}

$script:BaseUrl = Normalize-BaseUrl $BaseUrl
$script:ApiBaseUrl = Normalize-BaseUrl $ApiBaseUrl
$startedAt = (Get-Date).ToUniversalTime().ToString("o")

Write-Host "FARPY NIGHTLY PLATFORM SMOKE V1"
Write-Host "Started: $startedAt"
Write-Host "BaseUrl: $script:BaseUrl"
Write-Host "ApiBaseUrl: $script:ApiBaseUrl"
Write-Host ""

Test-Page -Area "Homepage" -Path "/" -ExpectedText @("Send package", "Receipt-backed")
Test-Page -Area "Upload" -Path "/" -ExpectedText @("Upload package", "Drop a .blend or .orbx package here")
Test-NonMutatingPostGate -Area "Upload" -Path "/node/v1/web-render/jobs/create" -AllowedStatusCodes @(400, 401, 403)
Test-Page -Area "Wallet" -Path "/topup" -ExpectedText @("Wallet", "Card")
Test-NonMutatingPostGate -Area "Wallet" -Path "/checkout" -AllowedStatusCodes @(400, 401, 403)
Test-Page -Area "Receipt" -Path "/receipt" -ExpectedText @("Delivery Receipt")
Test-OptionalUrl -Area "Receipt" -Check "tokenized receipt URL" -EnvNames @("FARPY_NIGHTLY_RECEIPT_URL", "FARPY_REGRESSION_RECEIPT_URL", "FARPY_AUDIT_RECEIPT_URL")
Test-Page -Area "Download" -Path "/downloads" -ExpectedText @("Download")
Test-OptionalUrl -Area "Download" -Check "tokenized download URL" -EnvNames @("FARPY_NIGHTLY_DOWNLOAD_URL", "FARPY_REGRESSION_DOWNLOAD_URL", "FARPY_AUDIT_DOWNLOAD_URL")
Test-Page -Area "Benchmark" -Path "/benchmark" -ExpectedText @("Benchmark")
Test-Asset -Area "Benchmark" -Path "/downloads/farpy-benchmark-windows-amd64.exe.sha256"
Test-Page -Area "Status" -Path "/status" -ExpectedText @("Website", "Wallet", "Receipts")

$nodeHealthUrl = Join-SmokeUrl $script:BaseUrl "/node/v1/pair/health"
$nodeHealth = Invoke-SmokeRequest -Method GET -Url $nodeHealthUrl
if ($nodeHealth.status_code -eq 200) {
  Add-SmokeResult -Area "Node health" -Check "pair health" -Status PASS -Evidence $nodeHealthUrl -HttpStatus $nodeHealth.status_code
} else {
  Add-SmokeResult -Area "Node health" -Check "pair health" -Status FAIL -Evidence $nodeHealthUrl -HttpStatus $nodeHealth.status_code -Notes $nodeHealth.error
}

$apiHealthUrl = Join-SmokeUrl $script:ApiBaseUrl "/healthz"
$apiHealth = Invoke-SmokeRequest -Method GET -Url $apiHealthUrl
if ($apiHealth.status_code -eq 200) {
  Add-SmokeResult -Area "Node health" -Check "api healthz" -Status PASS -Evidence $apiHealthUrl -HttpStatus $apiHealth.status_code
} else {
  Add-SmokeResult -Area "Node health" -Check "api healthz" -Status WARN -Evidence $apiHealthUrl -HttpStatus $apiHealth.status_code -Notes "api.farpy.com healthz is optional when pair health passes."
}

$passCount = @($script:Results | Where-Object { $_.status -eq "PASS" }).Count
$warnCount = @($script:Results | Where-Object { $_.status -eq "WARN" }).Count
$failCount = @($script:Results | Where-Object { $_.status -eq "FAIL" }).Count
$verdict = if ($failCount -gt 0) { "FAIL" } elseif ($warnCount -gt 0) { "WARN" } else { "PASS" }
$finishedAt = (Get-Date).ToUniversalTime().ToString("o")

$summary = [ordered]@{
  suite = "NIGHTLY_PLATFORM_SMOKE_V1"
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
