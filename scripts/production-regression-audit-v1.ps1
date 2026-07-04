param(
  [string]$BaseUrl = "https://farpy.com",
  [string]$OutputPath = ""
)

$ErrorActionPreference = "Stop"
$timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
$base = $BaseUrl.TrimEnd("/")
$results = New-Object System.Collections.Generic.List[object]

function Add-Result {
  param(
    [string]$Area,
    [string]$Check,
    [string]$Status,
    [string]$Evidence,
    [string]$Notes = "",
    [Nullable[int]]$HttpStatus = $null,
    [bool]$P0 = $false
  )
  $script:results.Add([pscustomobject]@{
    timestamp = $script:timestamp
    area = $Area
    check = $Check
    status = $Status
    http_status = $HttpStatus
    evidence = $Evidence
    notes = $Notes
    p0 = $P0
  }) | Out-Null
}

function Redact-Url {
  param([string]$Url)
  if ([string]::IsNullOrWhiteSpace($Url)) { return $Url }
  try {
    $uri = [UriBuilder]$Url
    if ($uri.Query) {
      $pairs = [System.Web.HttpUtility]::ParseQueryString($uri.Query.TrimStart("?"))
      foreach ($key in @($pairs.AllKeys)) {
        if ($key -match "token|secret|key|session|cookie") {
          $pairs[$key] = "REDACTED"
        }
      }
      $uri.Query = $pairs.ToString()
    }
    return $uri.Uri.AbsoluteUri
  } catch {
    return ($Url -replace '(token|secret|key|session|cookie)=([^&]+)', '$1=REDACTED')
  }
}

function Resolve-AuditUrl {
  param([string]$Value)
  if ($Value -match "^https?://") { return $Value }
  if ($Value.StartsWith("/")) { return "$script:base$Value" }
  return $Value
}

function Get-CanonicalUrlHint {
  param([string]$Kind)
  if ($Kind -eq "download") {
    return "Canonical download URL: /node/v1/web-render/jobs/<JOB_ID>/download?token=<download_token>"
  }
  if ($Kind -eq "receipt") {
    return "Canonical receipt page URL: /receipt?job_id=<JOB_ID>&receipt_token=<receipt_token>&download_token=<download_token>; raw JSON: /node/v1/web-render/jobs/<JOB_ID>/receipt?token=<receipt_token>"
  }
  return ""
}

function Get-QueryValue {
  param([string]$Url, [string]$Name)
  try {
    $uri = [Uri](Resolve-AuditUrl $Url)
    $query = $uri.Query.TrimStart("?")
    foreach ($part in ($query -split "&")) {
      if ([string]::IsNullOrWhiteSpace($part)) { continue }
      $kv = $part -split "=", 2
      $key = [Uri]::UnescapeDataString($kv[0])
      if ($key -eq $Name) {
        if ($kv.Count -lt 2) { return "" }
        return [Uri]::UnescapeDataString(($kv[1] -replace "\+", " "))
      }
    }
    return $null
  } catch {
    return $null
  }
}

function Resolve-ReceiptJsonUrl {
  param([string]$Url)
  $resolved = Resolve-AuditUrl $Url
  try {
    $uri = [Uri]$resolved
    if ($uri.AbsolutePath -eq "/receipt") {
      $jobId = Get-QueryValue $resolved "job_id"
      $receiptToken = Get-QueryValue $resolved "receipt_token"
      if ([string]::IsNullOrWhiteSpace($receiptToken)) {
        $receiptToken = Get-QueryValue $resolved "token"
      }
      if ($jobId -and $receiptToken) {
        return "$script:base/node/v1/web-render/jobs/$([Uri]::EscapeDataString($jobId))/receipt?token=$([Uri]::EscapeDataString($receiptToken))"
      }
    }
  } catch {}
  return $resolved
}

function Test-Http {
  param(
    [string]$Area,
    [string]$Check,
    [string]$Path,
    [int[]]$Expected = @(200),
    [string]$Method = "GET",
    [hashtable]$Headers = @{},
    [bool]$P0 = $false
  )
  $url = if ($Path -match "^https?://") { $Path } else { "$script:base$Path" }
  try {
    $response = Invoke-WebRequest -Method $Method -Uri $url -Headers $Headers -UseBasicParsing -TimeoutSec 25 -MaximumRedirection 5
    $code = [int]$response.StatusCode
    if ($Expected -contains $code) {
      Add-Result $Area $Check "PASS" $url "" $code $P0
    } else {
      Add-Result $Area $Check "FAIL" $url "expected $($Expected -join '/') got $code" $code $P0
    }
  } catch {
    $response = $_.Exception.Response
    if ($response) {
      $code = [int]$response.StatusCode
      if ($Expected -contains $code) {
        Add-Result $Area $Check "PASS" $url "" $code $P0
      } else {
        Add-Result $Area $Check "FAIL" $url "expected $($Expected -join '/') got $code" $code $P0
      }
    } else {
      Add-Result $Area $Check "FAIL" $url $_.Exception.Message $null $P0
    }
  }
}

function Test-LocalHash {
  param(
    [string]$Area,
    [string]$Check,
    [string]$Path,
    [string]$ExpectedSha256,
    [bool]$P0 = $false
  )
  if (!(Test-Path -LiteralPath $Path)) {
    Add-Result $Area $Check "FAIL" $Path "file not found" $null $P0
    return
  }
  $hash = (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash.ToUpperInvariant()
  if ($hash -eq $ExpectedSha256.ToUpperInvariant()) {
    Add-Result $Area $Check "PASS" $Path "sha256=$hash" $null $P0
  } else {
    Add-Result $Area $Check "FAIL" $Path "expected $ExpectedSha256 got $hash" $null $P0
  }
}

function Test-OptionalUrl {
  param(
    [string]$Area,
    [string]$Check,
    [string]$EnvName
  )
  $url = [Environment]::GetEnvironmentVariable($EnvName)
  if ([string]::IsNullOrWhiteSpace($url)) {
    Add-Result $Area $Check "SKIP" $EnvName "set $EnvName to verify this private/tokenized surface"
    return
  }
  Test-Http $Area $Check $url @(200) "GET" @{} $false
}

function Test-OptionalDownload {
  $raw = [Environment]::GetEnvironmentVariable("FARPY_AUDIT_DOWNLOAD_URL")
  if ([string]::IsNullOrWhiteSpace($raw)) {
    Add-Result "Download" "Private tokenized download URL" "SKIP" "FARPY_AUDIT_DOWNLOAD_URL" "set FARPY_AUDIT_DOWNLOAD_URL to verify a real completed render download; $(Get-CanonicalUrlHint 'download')"
    return
  }
  $url = Resolve-AuditUrl $raw
  try {
    $response = Invoke-WebRequest -Method GET -Uri $url -UseBasicParsing -TimeoutSec 60
    $code = [int]$response.StatusCode
    $contentType = [string]$response.Headers["content-type"]
    $disposition = [string]$response.Headers["content-disposition"]
    $bytes = if ($response.RawContentLength -gt 0) { $response.RawContentLength } else { $response.Content.Length }
    $zipLike = $contentType -match "zip|octet-stream" -or $disposition -match "attachment|\.zip"
    if ($code -eq 200 -and $bytes -gt 0 -and $zipLike) {
      Add-Result "Download" "Private tokenized download URL" "PASS" (Redact-Url $url) "bytes=$bytes; content_type=$contentType" $code $false
    } else {
      Add-Result "Download" "Private tokenized download URL" "FAIL" (Redact-Url $url) "expected 200 nonempty zip-like response; bytes=$bytes; content_type=$contentType; disposition=$disposition" $code $false
    }
  } catch {
    $response = $_.Exception.Response
    $code = if ($response) { [int]$response.StatusCode } else { $null }
    $notes = $_.Exception.Message
    if ($code -eq 404) { $notes = "$notes; $(Get-CanonicalUrlHint 'download')" }
    Add-Result "Download" "Private tokenized download URL" "FAIL" (Redact-Url $url) $notes $code $false
  }
}

function Test-OptionalReceipt {
  $raw = [Environment]::GetEnvironmentVariable("FARPY_AUDIT_RECEIPT_URL")
  if ([string]::IsNullOrWhiteSpace($raw)) {
    Add-Result "Receipt" "Private tokenized receipt URL" "SKIP" "FARPY_AUDIT_RECEIPT_URL" "set FARPY_AUDIT_RECEIPT_URL to verify a real completed render receipt; $(Get-CanonicalUrlHint 'receipt')"
    return
  }
  $browserUrl = Resolve-AuditUrl $raw
  $url = Resolve-ReceiptJsonUrl $raw
  try {
    $receipt = Invoke-RestMethod -Method GET -Uri $url -TimeoutSec 30
    $hasCoreFields = $receipt.receipt_id -and $receipt.job_id -and $receipt.output_sha256
    if ($hasCoreFields) {
      Add-Result "Receipt" "Private tokenized receipt URL" "PASS" (Redact-Url $browserUrl) "receipt_id=$($receipt.receipt_id); job_id=$($receipt.job_id); output_sha256_present=True; json=$(Redact-Url $url)" 200 $false
    } else {
      Add-Result "Receipt" "Private tokenized receipt URL" "FAIL" (Redact-Url $browserUrl) "missing receipt_id/job_id/output_sha256; json=$(Redact-Url $url)" 200 $false
    }
  } catch {
    $response = $_.Exception.Response
    $code = if ($response) { [int]$response.StatusCode } else { $null }
    $notes = $_.Exception.Message
    if ($code -eq 404) { $notes = "$notes; $(Get-CanonicalUrlHint 'receipt')" }
    Add-Result "Receipt" "Private tokenized receipt URL" "FAIL" (Redact-Url $browserUrl) $notes $code $false
  }
}

$publicRoutes = @(
  @("Website", "Homepage", "/"),
  @("Workspace", "Workspace page", "/workspace"),
  @("Account", "Account page", "/account"),
  @("Payment/wallet", "Top up page", "/topup"),
  @("Account", "Sign in page", "/signin"),
  @("Receipt", "Receipt page shell", "/receipt"),
  @("Docs/legal", "API page", "/api"),
  @("Blender Addon", "Addon page", "/addon"),
  @("Blender Addon", "Downloads page", "/downloads/"),
  @("Benchmark", "Benchmark leaderboard page", "/benchmark/leaderboard"),
  @("Benchmark", "Benchmark latest page", "/benchmark/latest"),
  @("Benchmark", "Benchmark search page", "/benchmark/search"),
  @("Benchmark", "Benchmark API docs page", "/benchmark/api"),
  @("Leaderboard", "Legacy leaderboard page", "/leaderboard"),
  @("Docs/legal", "FAQ page", "/faq"),
  @("Docs/legal", "Docs page", "/docs"),
  @("Docs/legal", "DMCA page", "/dmca"),
  @("Docs/legal", "Pricing page", "/pricing"),
  @("Docs/legal", "Privacy page", "/privacy"),
  @("Docs/legal", "Terms page", "/terms"),
  @("Docs/legal", "Refunds page", "/refunds"),
  @("Docs/legal", "Contact page", "/contact"),
  @("Status", "Status page", "/status"),
  @("Docs/legal", "Acceptable use page", "/acceptable-use"),
  @("Docs/legal", "Security page", "/security"),
  @("Docs/legal", "Files page", "/files")
)

foreach ($route in $publicRoutes) {
  Test-Http $route[0] $route[1] $route[2] @(200) "GET" @{} $true
}

$apiChecks = @(
  @("Status", "Web render health", "/node/v1/web-render/health", @(200), "GET"),
  @("Status", "Worker status", "/node/v1/web-render/worker/status", @(200), "GET"),
  @("Leaderboard", "Leaderboard top API", "/node/v1/leaderboard/top", @(200), "GET"),
  @("Leaderboard", "Leaderboard stats API", "/node/v1/leaderboard/stats", @(200), "GET"),
  @("Leaderboard", "Leaderboard latest API", "/node/v1/leaderboard/latest?limit=3", @(200), "GET"),
  @("NodeMuncher", "Lease peek rejects missing token", "/node/v1/nodemuncher/lease/peek", @(403), "POST"),
  @("NodeMuncher", "Lease claim rejects missing token", "/node/v1/nodemuncher/lease/claim", @(403), "POST")
)

foreach ($check in $apiChecks) {
  Test-Http $check[0] $check[1] $check[2] $check[3] $check[4] @{} $true
}

$artifactChecks = @(
  @("NodeMuncher", "Windows NSIS installer URL", "/downloads/nodemuncher-windows-amd64.exe"),
  @("NodeMuncher", "Windows MSI URL", "/downloads/nodemuncher-windows-amd64.msi"),
  @("NodeMuncher", "macOS DMG URL", "/downloads/nodemuncher-macos-aarch64.dmg"),
  @("NodeMuncher", "Windows NSIS sha256 sidecar", "/downloads/nodemuncher-windows-amd64.exe.sha256"),
  @("NodeMuncher", "Windows MSI sha256 sidecar", "/downloads/nodemuncher-windows-amd64.msi.sha256"),
  @("NodeMuncher", "macOS DMG sha256 sidecar", "/downloads/nodemuncher-macos-aarch64.dmg.sha256")
)

foreach ($artifact in $artifactChecks) {
  Test-Http $artifact[0] $artifact[1] $artifact[2] @(200) "HEAD" @{} $true
}

Test-LocalHash "Blender Addon" "Frozen addon ZIP SHA256" "C:\Users\danki\Desktop\Farpy-Blender-Addon-unified.zip" "03B9F6039396C06AB83C87E71F7846975DE661D0F2CA216BC60C0ACC4B14A4BF" $false

Test-OptionalUrl "Upload" "Private upload smoke job status URL" "FARPY_AUDIT_JOB_STATUS_URL"
Test-OptionalDownload
Test-OptionalReceipt

$p0Failures = @($results | Where-Object { $_.p0 -and $_.status -eq "FAIL" })
$failures = @($results | Where-Object { $_.status -eq "FAIL" })
$skips = @($results | Where-Object { $_.status -eq "SKIP" })
$verdict = if ($p0Failures.Count -gt 0) { "RED" } elseif ($failures.Count -gt 0) { "YELLOW" } else { "GREEN" }

Write-Host "PRODUCTION_REGRESSION_AUDIT_V1"
Write-Host "TIMESTAMP=$timestamp"
Write-Host "BASE_URL=$base"
Write-Host "VERDICT=$verdict"
Write-Host "PASS_COUNT=$(($results | Where-Object { $_.status -eq 'PASS' }).Count)"
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
  $jsonPath = Join-Path (Get-Location) "production-regression-audit-v1-$safeStamp.json"
}
$results | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $jsonPath -Encoding UTF8
Write-Host ""
Write-Host "EVIDENCE_FILE=$jsonPath"

if ($p0Failures.Count -gt 0) {
  exit 1
}
