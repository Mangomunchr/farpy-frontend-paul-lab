param(
  [string]$BaseUrl = "https://farpy.com",
  [string]$OutputPath = ""
)

$ErrorActionPreference = "Stop"
$timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
$base = $BaseUrl.TrimEnd("/")
$results = @()

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

function Add-Result {
  param(
    [string]$Area,
    [string]$Check,
    [string]$Status,
    [string]$Evidence,
    [string]$Notes = "",
    [Nullable[int]]$HttpStatus = $null
  )
  $script:results += [pscustomobject]@{
    timestamp = $script:timestamp
    area = $Area
    check = $Check
    status = $Status
    http_status = $HttpStatus
    evidence = $Evidence
    notes = $Notes
  }
}

function Resolve-SmokeUrl {
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
    $uri = [Uri](Resolve-SmokeUrl $Url)
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
  $resolved = Resolve-SmokeUrl $Url
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

function Test-PublicRoute {
  param([string]$Area, [string]$Check, [string]$Path)
  $url = "$script:base$Path"
  try {
    $response = Invoke-WebRequest -Method GET -Uri $url -UseBasicParsing -TimeoutSec 25 -MaximumRedirection 5
    $code = [int]$response.StatusCode
    if ($code -eq 200) {
      Add-Result $Area $Check "PASS" $url "" $code
    } else {
      Add-Result $Area $Check "FAIL" $url "expected 200 got $code" $code
    }
  } catch {
    $response = $_.Exception.Response
    if ($response) {
      Add-Result $Area $Check "FAIL" $url "expected 200 got $([int]$response.StatusCode)" ([int]$response.StatusCode)
    } else {
      Add-Result $Area $Check "FAIL" $url $_.Exception.Message
    }
  }
}

function Test-OptionalJobStatus {
  $raw = [Environment]::GetEnvironmentVariable("FARPY_AUDIT_JOB_STATUS_URL")
  if ([string]::IsNullOrWhiteSpace($raw)) {
    Add-Result "Job status" "Tokenized job status URL" "SKIP" "FARPY_AUDIT_JOB_STATUS_URL" "set env var to verify a real customer job"
    return
  }
  $url = Resolve-SmokeUrl $raw
  try {
    $job = Invoke-RestMethod -Method GET -Uri $url -TimeoutSec 30
    if ($job.ok -and $job.job_id -and $job.status) {
      Add-Result "Job status" "Tokenized job status URL" "PASS" (Redact-Url $url) "job_id=$($job.job_id); status=$($job.status)" 200
    } else {
      Add-Result "Job status" "Tokenized job status URL" "FAIL" (Redact-Url $url) "missing ok/job_id/status" 200
    }
  } catch {
    $response = $_.Exception.Response
    $code = if ($response) { [int]$response.StatusCode } else { $null }
    Add-Result "Job status" "Tokenized job status URL" "FAIL" (Redact-Url $url) $_.Exception.Message $code
  }
}

function Test-OptionalDownload {
  $raw = [Environment]::GetEnvironmentVariable("FARPY_AUDIT_DOWNLOAD_URL")
  if ([string]::IsNullOrWhiteSpace($raw)) {
    Add-Result "Download" "Tokenized ZIP download URL" "SKIP" "FARPY_AUDIT_DOWNLOAD_URL" "set env var to verify a real completed render download"
    return
  }
  $url = Resolve-SmokeUrl $raw
  try {
    $response = Invoke-WebRequest -Method GET -Uri $url -UseBasicParsing -TimeoutSec 60
    $code = [int]$response.StatusCode
    $contentType = [string]$response.Headers["content-type"]
    $disposition = [string]$response.Headers["content-disposition"]
    $sha = [string]$response.Headers["x-farpy-output-sha256"]
    $bytes = if ($response.RawContentLength -gt 0) { $response.RawContentLength } else { $response.Content.Length }
    $zipLike = $contentType -match "zip|octet-stream" -or $disposition -match "attachment|\.zip"
    if ($code -eq 200 -and $bytes -gt 0 -and $zipLike) {
      Add-Result "Download" "Tokenized ZIP download URL" "PASS" (Redact-Url $url) "bytes=$bytes; content_type=$contentType; sha256_header_present=$([bool]$sha)" $code
    } else {
      Add-Result "Download" "Tokenized ZIP download URL" "FAIL" (Redact-Url $url) "expected 200 nonempty zip-like response; bytes=$bytes; content_type=$contentType; disposition=$disposition" $code
    }
  } catch {
    $response = $_.Exception.Response
    $code = if ($response) { [int]$response.StatusCode } else { $null }
    $notes = $_.Exception.Message
    if ($code -eq 404) { $notes = "$notes; $(Get-CanonicalUrlHint 'download')" }
    Add-Result "Download" "Tokenized ZIP download URL" "FAIL" (Redact-Url $url) $notes $code
  }
}

function Test-OptionalReceipt {
  $raw = [Environment]::GetEnvironmentVariable("FARPY_AUDIT_RECEIPT_URL")
  if ([string]::IsNullOrWhiteSpace($raw)) {
    Add-Result "Receipt" "Tokenized receipt URL" "SKIP" "FARPY_AUDIT_RECEIPT_URL" "set env var to verify a real completed render receipt"
    return
  }
  $browserUrl = Resolve-SmokeUrl $raw
  $url = Resolve-ReceiptJsonUrl $raw
  try {
    $receipt = Invoke-RestMethod -Method GET -Uri $url -TimeoutSec 30
    $hasCoreFields = $receipt.receipt_id -and $receipt.job_id -and $receipt.output_sha256
    if ($hasCoreFields) {
      Add-Result "Receipt" "Tokenized receipt URL" "PASS" (Redact-Url $browserUrl) "receipt_id=$($receipt.receipt_id); job_id=$($receipt.job_id); output_sha256_present=True; json=$(Redact-Url $url)" 200
    } else {
      Add-Result "Receipt" "Tokenized receipt URL" "FAIL" (Redact-Url $browserUrl) "missing receipt_id/job_id/output_sha256; json=$(Redact-Url $url)" 200
    }
  } catch {
    $response = $_.Exception.Response
    $code = if ($response) { [int]$response.StatusCode } else { $null }
    $notes = $_.Exception.Message
    if ($code -eq 404) { $notes = "$notes; $(Get-CanonicalUrlHint 'receipt')" }
    Add-Result "Receipt" "Tokenized receipt URL" "FAIL" (Redact-Url $browserUrl) $notes $code
  }
}

Test-PublicRoute "Landing" "farpy.com loads" "/"
Test-PublicRoute "Workspace" "Workspace route loads" "/workspace"
Test-PublicRoute "Account/session" "Account route loads" "/account"
Test-PublicRoute "Account/session" "Signin route loads" "/signin"
Test-PublicRoute "Receipt" "Receipt shell route loads" "/receipt"

Test-OptionalJobStatus
Test-OptionalDownload
Test-OptionalReceipt

Test-PublicRoute "History persistence" "Account route still loads after smoke" "/account"

$failures = @($results | Where-Object { $_.status -eq "FAIL" })
$skips = @($results | Where-Object { $_.status -eq "SKIP" })
$passes = @($results | Where-Object { $_.status -eq "PASS" })
$verdict = if ($failures.Count -gt 0) { "RED" } elseif ($skips.Count -gt 0) { "YELLOW" } else { "GREEN" }

Write-Host "PUBLIC_USER_SMOKE_V1"
Write-Host "TIMESTAMP=$timestamp"
Write-Host "BASE_URL=$base"
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
  $jsonPath = Join-Path (Get-Location) "public-user-smoke-v1-$safeStamp.json"
}
@($results) | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $jsonPath -Encoding UTF8
Write-Host ""
Write-Host "EVIDENCE_FILE=$jsonPath"

if ($verdict -eq "RED") {
  exit 1
}
