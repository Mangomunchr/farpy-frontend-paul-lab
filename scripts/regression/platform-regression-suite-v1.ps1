param(
  [string]$BaseUrl = "https://farpy.com",
  [string]$ApiBaseUrl = "https://farpy.com",
  [string]$HealthBaseUrl = "https://api.farpy.com",
  [string]$OutputPath = "C:\tmp\platform-regression-suite-v1-latest.json"
)

$ErrorActionPreference = "Stop"
$timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
$base = $BaseUrl.TrimEnd("/")
$apiBase = $ApiBaseUrl.TrimEnd("/")
$healthBase = $HealthBaseUrl.TrimEnd("/")
$results = New-Object System.Collections.Generic.List[object]

function Add-Result {
  param(
    [string]$Area,
    [string]$Check,
    [string]$ExpectedHttp,
    [string]$ExpectedUi,
    [string]$ExpectedApi,
    [string]$ExpectedFailureMode,
    [string]$Status,
    [string]$Evidence,
    [string]$Notes = "",
    [Nullable[int]]$HttpStatus = $null,
    [bool]$Required = $true
  )
  $script:results.Add([pscustomobject]@{
    timestamp = $script:timestamp
    area = $Area
    check = $Check
    expected_http = $ExpectedHttp
    expected_ui = $ExpectedUi
    expected_api = $ExpectedApi
    expected_failure_mode = $ExpectedFailureMode
    status = $Status
    http_status = $HttpStatus
    evidence = $Evidence
    notes = $Notes
    required = $Required
  }) | Out-Null
}

function Resolve-Url {
  param([string]$Path, [bool]$Api = $false, [bool]$Health = $false)
  if ($Path -match "^https?://") { return $Path }
  $root = if ($Health) { $script:healthBase } elseif ($Api) { $script:apiBase } else { $script:base }
  if ($Path.StartsWith("/")) { return "$root$Path" }
  return "$root/$Path"
}

function Redact-Url {
  param([string]$Url)
  if ([string]::IsNullOrWhiteSpace($Url)) { return $Url }
  return ($Url -replace '(token|secret|key|session|cookie|download_token|receipt_token)=([^&]+)', '$1=REDACTED')
}

function Test-HttpRoute {
  param(
    [string]$Area,
    [string]$Check,
    [string]$Path,
    [int[]]$ExpectedStatus = @(200),
    [string]$Method = "GET",
    [string]$Body = $null,
    [string[]]$MustContain = @(),
    [string[]]$MustNotContain = @(),
    [bool]$Api = $false,
    [bool]$Required = $true,
    [string]$ExpectedHttp = "200",
    [string]$ExpectedUi = "Route shell loads",
    [string]$ExpectedApi = "No mutation",
    [string]$ExpectedFailureMode = "Non-200 or missing expected text",
    [bool]$Health = $false
  )
  $url = Resolve-Url $Path $Api $Health
  $headers = @{}
  if (![string]::IsNullOrEmpty($Body)) { $headers["content-type"] = "application/json" }
  try {
    $request = @{ Method = $Method; Uri = $url; Headers = $headers; UseBasicParsing = $true; TimeoutSec = 30; MaximumRedirection = 5 }
    if (![string]::IsNullOrEmpty($Body)) { $request.Body = $Body }
    $response = Invoke-WebRequest @request
    $code = [int]$response.StatusCode
    $content = [string]$response.Content
    $ok = $ExpectedStatus -contains $code
    $notes = ""
    foreach ($needle in $MustContain) {
      if ($content -notlike "*$needle*") {
        $ok = $false
        $notes += "missing '$needle'; "
      }
    }
    foreach ($needle in $MustNotContain) {
      if ($content -like "*$needle*") {
        $ok = $false
        $notes += "unexpected '$needle'; "
      }
    }
    if ($ok) {
      Add-Result $Area $Check $ExpectedHttp $ExpectedUi $ExpectedApi $ExpectedFailureMode "PASS" (Redact-Url $url) $notes $code $Required
    } else {
      if ([string]::IsNullOrWhiteSpace($notes)) { $notes = "expected $($ExpectedStatus -join '/') got $code" }
      Add-Result $Area $Check $ExpectedHttp $ExpectedUi $ExpectedApi $ExpectedFailureMode "FAIL" (Redact-Url $url) $notes $code $Required
    }
  } catch {
    $response = $_.Exception.Response
    if ($response) {
      $code = [int]$response.StatusCode
      if ($ExpectedStatus -contains $code) {
        Add-Result $Area $Check $ExpectedHttp $ExpectedUi $ExpectedApi $ExpectedFailureMode "PASS" (Redact-Url $url) "expected failure mode" $code $Required
      } else {
        Add-Result $Area $Check $ExpectedHttp $ExpectedUi $ExpectedApi $ExpectedFailureMode "FAIL" (Redact-Url $url) "expected $($ExpectedStatus -join '/') got $code" $code $Required
      }
    } else {
      Add-Result $Area $Check $ExpectedHttp $ExpectedUi $ExpectedApi $ExpectedFailureMode "FAIL" (Redact-Url $url) $_.Exception.Message $null $Required
    }
  }
}

function Test-OptionalUrl {
  param(
    [string]$Area,
    [string]$Check,
    [string]$EnvName,
    [string]$ExpectedUi,
    [string]$ExpectedApi,
    [string]$ExpectedFailureMode
  )
  $raw = [Environment]::GetEnvironmentVariable($EnvName)
  if ([string]::IsNullOrWhiteSpace($raw)) {
    Add-Result $Area $Check "200" $ExpectedUi $ExpectedApi $ExpectedFailureMode "SKIP" $EnvName "set $EnvName to verify private/tokenized path" $null $false
    return
  }
  Test-HttpRoute $Area $Check $raw @(200) "GET" $null @() @() $false $true "200" $ExpectedUi $ExpectedApi $ExpectedFailureMode
}

function Test-OptionalDownload {
  $raw = [Environment]::GetEnvironmentVariable("FARPY_REGRESSION_DOWNLOAD_URL")
  if ([string]::IsNullOrWhiteSpace($raw)) {
    Add-Result "Download" "Tokenized ZIP download" "200" "ZIP downloads for completed package" "Tokenized download endpoint returns non-empty artifact" "Skip if no completed package token is provided" "SKIP" "FARPY_REGRESSION_DOWNLOAD_URL" "set env var to verify a real completed download" $null $false
    return
  }
  $url = Resolve-Url $raw $false
  try {
    $response = Invoke-WebRequest -Method GET -Uri $url -UseBasicParsing -TimeoutSec 60
    $code = [int]$response.StatusCode
    $bytes = if ($response.RawContentLength -gt 0) { $response.RawContentLength } else { ([string]$response.Content).Length }
    $ctype = [string]$response.Headers["content-type"]
    $disposition = [string]$response.Headers["content-disposition"]
    if ($code -eq 200 -and $bytes -gt 0 -and ($ctype -match "zip|octet-stream" -or $disposition -match "attachment|zip")) {
      Add-Result "Download" "Tokenized ZIP download" "200" "ZIP downloads for completed package" "Tokenized download endpoint returns non-empty artifact" "404/403 for missing or wrong token" "PASS" (Redact-Url $url) "bytes=$bytes; content_type=$ctype" $code $true
    } else {
      Add-Result "Download" "Tokenized ZIP download" "200" "ZIP downloads for completed package" "Tokenized download endpoint returns non-empty artifact" "404/403 for missing or wrong token" "FAIL" (Redact-Url $url) "expected non-empty zip-like response; bytes=$bytes; content_type=$ctype; disposition=$disposition" $code $true
    }
  } catch {
    $response = $_.Exception.Response
    $code = if ($response) { [int]$response.StatusCode } else { $null }
    Add-Result "Download" "Tokenized ZIP download" "200" "ZIP downloads for completed package" "Tokenized download endpoint returns non-empty artifact" "404/403 for missing or wrong token" "FAIL" (Redact-Url $url) $_.Exception.Message $code $true
  }
}

function Test-OptionalReceipt {
  $raw = [Environment]::GetEnvironmentVariable("FARPY_REGRESSION_RECEIPT_URL")
  if ([string]::IsNullOrWhiteSpace($raw)) {
    Add-Result "Receipt" "Tokenized receipt page" "200" "Delivery receipt renders" "Receipt JSON/page exposes verified fields to owner/token holder" "Skip if no receipt URL is provided" "SKIP" "FARPY_REGRESSION_RECEIPT_URL" "set env var to verify a real receipt" $null $false
    return
  }
  Test-HttpRoute "Receipt" "Tokenized receipt page" $raw @(200) "GET" $null @("Receipt") @() $false $true "200" "Delivery receipt renders" "Receipt JSON/page exposes verified fields to owner/token holder" "404/403 for missing or wrong token"
}

# Public customer routes.
Test-HttpRoute "Homepage" "Homepage loads" "/" @(200) "GET" $null @("Send package") @("Start a render", "Render Factory") $false $true "200" "Hero and primary CTA visible" "Static page" "404/500 or stale CTA language"
Test-HttpRoute "Signin" "Signin loads" "/signin" @(200) "GET" $null @("Google") @() $false $true "200" "Google and email signin options visible" "Auth start routes available from page" "404/500"
Test-HttpRoute "Account" "Account shell loads" "/account" @(200) "GET" $null @("Balance") @() $false $true "200" "Account shell loads; may require session for private data" "No mutation" "Signin prompt or shell, not 500"
Test-HttpRoute "Workspace" "Workspace shell loads" "/workspace" @(200) "GET" $null @("Track your render from upload to download") @("worker", "lease", "backend") $false $true "200" "Package tracker shell visible" "No mutation" "404/500"
Test-HttpRoute "Upload" "Upload/start surface loads" "/" @(200) "GET" $null @("Package", "Output", "Frames", "Delivery", "Summary") @("Render Lane", "Frames to Render") $false $true "200" "Homepage package-label upload flow visible" "No upload mutation in suite" "Missing upload UI"
Test-HttpRoute "Topup" "Topup loads" "/topup" @(200) "GET" $null @("Card") @("Lightning") $false $true "200" "Card visible; Lightning hidden/gated" "No invoice creation in suite" "404/500 or disabled rail shown as live"
Test-HttpRoute "Wallet" "Wallet/account history shell" "/account" @(200) "GET" $null @("Wallet") @() $false $true "200" "Wallet balance/history shell visible" "No mutation" "404/500"
Test-HttpRoute "Receipt" "Receipt shell loads" "/receipt" @(200) "GET" $null @("Delivery Receipt") @() $false $true "200" "Receipt shell loads" "Tokenized receipt checked separately when env provided" "404/500"
Test-HttpRoute "Status" "Status loads" "/status" @(200) "GET" $null @("Website", "Wallet", "Rendering", "Receipts") @() $false $true "200" "Plain status pillars visible" "No mutation" "404/500"
Test-HttpRoute "Addon" "Addon page loads" "/addon" @(200) "GET" $null @("Farpy Render Delivery", "Download Blender Add-on") @() $false $true "200" "Addon install handoff visible" "No mutation" "404/500"
Test-HttpRoute "Benchmark" "Benchmark public page loads" "/benchmark" @(200) "GET" $null @("Benchmark") @() $false $true "200" "Benchmark public surface loads" "Benchmark APIs checked separately" "404/500"

# Public API and fail-closed checks.
Test-HttpRoute "Node health" "API health" "/healthz" @(200) "GET" $null @() @() $false $true "200" "Health endpoint reachable" "GET health returns ok" "Non-200" -Health $true
Test-HttpRoute "Node health" "Ready endpoint" "/readyz" @(200) "GET" $null @() @() $false $false "200" "Ready endpoint reachable if configured" "GET ready returns ok" "Skip/fail indicates deployment mismatch" -Health $true
Test-HttpRoute "Benchmark" "Leaderboard stats API" "/node/v1/leaderboard/stats" @(200) "GET" $null @() @() $true $true "200" "Leaderboard API returns JSON" "GET stats public read-only" "Non-200"
Test-HttpRoute "Benchmark" "Leaderboard top API" "/node/v1/leaderboard/top" @(200) "GET" $null @() @() $true $true "200" "Leaderboard top API returns JSON" "GET top public read-only" "Non-200"
Test-HttpRoute "Upload" "Create job malformed JSON fail-closed" "/node/v1/web-render/jobs/create" @(400) "POST" "{" @() @() $true $true "400 invalid_json" "No UI; API fails closed" "Malformed JSON returns invalid_json" "500 or provider error"
Test-HttpRoute "Topup" "Checkout malformed JSON fail-closed" "/checkout" @(400) "POST" "{" @() @() $false $true "400 invalid_json" "No UI; API fails closed" "Malformed JSON returns invalid_json" "500 or provider error"
Test-HttpRoute "Topup" "Checkout unauth valid JSON auth gate" "/checkout" @(401,403) "POST" '{"amount_cents":1000}' @() @() $false $true "401/403" "No UI; auth required before checkout" "Unauth checkout rejected" "200 without auth"
Test-HttpRoute "Topup" "Bitcoin invoice unauth auth gate" "/node/v1/web-render/btcpay/invoice" @(401,403) "POST" '{"tier":"usd_1"}' @() @() $true $true "401/403" "No UI; auth required before invoice" "Unauth invoice rejected" "200 without auth"
Test-HttpRoute "Node health" "NodeMuncher heartbeat missing token fail-closed" "/node/heartbeat" @(401,403,404) "POST" '{}' @() @() $false $true "401/403/404" "No UI" "Missing node token rejected" "200 without token" -Health $true
Test-HttpRoute "Node health" "NodeMuncher lease peek missing token fail-closed" "/node/v1/nodemuncher/lease/peek" @(401,403) "POST" '{}' @() @() $false $true "401/403" "No UI" "Missing node token rejected" "200 without token" -Health $true

# Optional private/tokenized regression checks.
Test-OptionalUrl "Workspace" "Tokenized/owner job status" "FARPY_REGRESSION_JOB_STATUS_URL" "Completed/running package status can be read by owner/token holder" "Status endpoint returns job status without leaking to unauth users" "Skip if no job status URL is provided"
Test-OptionalDownload
Test-OptionalReceipt

$pass = @($results | Where-Object { $_.status -eq "PASS" }).Count
$fail = @($results | Where-Object { $_.status -eq "FAIL" }).Count
$skip = @($results | Where-Object { $_.status -eq "SKIP" }).Count
$requiredFail = @($results | Where-Object { $_.status -eq "FAIL" -and $_.required }).Count
$verdict = if ($requiredFail -gt 0) { "RED" } elseif ($skip -gt 0) { "YELLOW" } else { "GREEN" }

$summary = [pscustomobject]@{
  suite = "PLATFORM_REGRESSION_SUITE_V1"
  timestamp = $timestamp
  base_url = $base
  api_base_url = $apiBase
  health_base_url = $healthBase
  verdict = $verdict
  pass_count = $pass
  fail_count = $fail
  skip_count = $skip
  required_fail_count = $requiredFail
  results = $results
}

if (![string]::IsNullOrWhiteSpace($OutputPath)) {
  $dir = Split-Path -Parent $OutputPath
  if (![string]::IsNullOrWhiteSpace($dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
  $summary | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $OutputPath -Encoding UTF8
}

Write-Host "PLATFORM_REGRESSION_SUITE_V1"
Write-Host "VERDICT=$verdict PASS=$pass FAIL=$fail SKIP=$skip REQUIRED_FAIL=$requiredFail"
foreach ($r in $results) {
  $http = if ($null -ne $r.http_status) { $r.http_status } else { "-" }
  Write-Host ("{0} [{1}] {2} HTTP={3} {4}" -f $r.status, $r.area, $r.check, $http, $r.evidence)
  if ($r.notes) { Write-Host ("  {0}" -f $r.notes) }
}

if ($requiredFail -gt 0) { exit 1 }
exit 0





