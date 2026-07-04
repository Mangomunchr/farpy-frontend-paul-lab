param(
  [string]$BaseUrl = "https://farpy.com",
  [string]$OutputPath = ""
)

$ErrorActionPreference = "Stop"
$timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
$base = $BaseUrl.TrimEnd("/")
$results = @()

$requiredEnv = @(
  @{ name = "FARPY_SMOKE_EMAIL"; description = "Fresh customer smoke account email address"; secret = $false },
  @{ name = "FARPY_SMOKE_AUTH_METHOD"; description = "Legitimate auth method: manual_magic_link, google_oauth, or session_cookie"; secret = $false },
  @{ name = "FARPY_SMOKE_STRIPE_MODE"; description = "Stripe mode for this smoke: test or live"; secret = $false },
  @{ name = "FARPY_SMOKE_BLEND_PATH"; description = "Local path to a small known-good .blend file"; secret = $false },
  @{ name = "FARPY_SMOKE_TOPUP_AMOUNT_CENTS"; description = "Expected Card top-up amount in cents"; secret = $false },
  @{ name = "FARPY_SMOKE_PAYMENT_APPROVED"; description = "Must be true to confirm operator approval for a real Card checkout"; secret = $false }
)

$optionalEnv = @(
  @{ name = "FARPY_SMOKE_SESSION_COOKIE"; description = "Required only when FARPY_SMOKE_AUTH_METHOD=session_cookie"; secret = $true },
  @{ name = "FARPY_AUDIT_JOB_STATUS_URL"; description = "Tokenized completed job status URL after smoke"; secret = $true },
  @{ name = "FARPY_AUDIT_DOWNLOAD_URL"; description = "Tokenized completed ZIP download URL after smoke"; secret = $true },
  @{ name = "FARPY_AUDIT_RECEIPT_URL"; description = "Tokenized completed receipt URL after smoke"; secret = $true }
)

function Add-Result {
  param(
    [string]$Area,
    [string]$Check,
    [string]$Status,
    [string]$Evidence,
    [string]$Notes = ""
  )
  $script:results += [pscustomobject]@{
    timestamp = $script:timestamp
    area = $Area
    check = $Check
    status = $Status
    evidence = $Evidence
    notes = $Notes
  }
}

function Env-Value {
  param([string]$Name)
  return [Environment]::GetEnvironmentVariable($Name)
}

function Env-Present {
  param([string]$Name)
  $value = Env-Value $Name
  return -not [string]::IsNullOrWhiteSpace($value)
}

foreach ($item in $requiredEnv) {
  if (Env-Present $item.name) {
    Add-Result "Prerequisite" $item.name "PASS" $item.name $item.description
  } else {
    Add-Result "Prerequisite" $item.name "BLOCKED_MISSING_ENV" $item.name $item.description
  }
}

$authMethod = (Env-Value "FARPY_SMOKE_AUTH_METHOD")
if ($authMethod) {
  $allowedAuth = @("manual_magic_link", "google_oauth", "session_cookie")
  if ($allowedAuth -contains $authMethod) {
    Add-Result "Prerequisite" "FARPY_SMOKE_AUTH_METHOD value" "PASS" "FARPY_SMOKE_AUTH_METHOD" "value=$authMethod"
  } else {
    Add-Result "Prerequisite" "FARPY_SMOKE_AUTH_METHOD value" "BLOCKED_INVALID_ENV" "FARPY_SMOKE_AUTH_METHOD" "expected one of: $($allowedAuth -join ', ')"
  }
  if ($authMethod -eq "session_cookie") {
    if (Env-Present "FARPY_SMOKE_SESSION_COOKIE") {
      Add-Result "Prerequisite" "FARPY_SMOKE_SESSION_COOKIE" "PASS" "FARPY_SMOKE_SESSION_COOKIE" "present; value redacted"
    } else {
      Add-Result "Prerequisite" "FARPY_SMOKE_SESSION_COOKIE" "BLOCKED_MISSING_ENV" "FARPY_SMOKE_SESSION_COOKIE" "required when FARPY_SMOKE_AUTH_METHOD=session_cookie"
    }
  }
}

$stripeMode = (Env-Value "FARPY_SMOKE_STRIPE_MODE")
if ($stripeMode) {
  if (@("test", "live") -contains $stripeMode) {
    Add-Result "Prerequisite" "FARPY_SMOKE_STRIPE_MODE value" "PASS" "FARPY_SMOKE_STRIPE_MODE" "value=$stripeMode"
  } else {
    Add-Result "Prerequisite" "FARPY_SMOKE_STRIPE_MODE value" "BLOCKED_INVALID_ENV" "FARPY_SMOKE_STRIPE_MODE" "expected test or live"
  }
}

$blendPath = (Env-Value "FARPY_SMOKE_BLEND_PATH")
if ($blendPath) {
  if ((Test-Path -LiteralPath $blendPath -PathType Leaf) -and ($blendPath -match '\.blend$')) {
    $item = Get-Item -LiteralPath $blendPath
    Add-Result "Prerequisite" "Known-good blend file" "PASS" "FARPY_SMOKE_BLEND_PATH" "bytes=$($item.Length)"
  } else {
    Add-Result "Prerequisite" "Known-good blend file" "BLOCKED_INVALID_ENV" "FARPY_SMOKE_BLEND_PATH" "file must exist and end with .blend"
  }
}

$topupAmount = (Env-Value "FARPY_SMOKE_TOPUP_AMOUNT_CENTS")
if ($topupAmount) {
  $amount = 0
  if ([int]::TryParse($topupAmount, [ref]$amount) -and $amount -gt 0) {
    Add-Result "Prerequisite" "Top-up amount" "PASS" "FARPY_SMOKE_TOPUP_AMOUNT_CENTS" "amount_cents=$amount"
  } else {
    Add-Result "Prerequisite" "Top-up amount" "BLOCKED_INVALID_ENV" "FARPY_SMOKE_TOPUP_AMOUNT_CENTS" "must be a positive integer number of cents"
  }
}

$paymentApproved = (Env-Value "FARPY_SMOKE_PAYMENT_APPROVED")
if ($paymentApproved) {
  if ($paymentApproved -eq "true") {
    Add-Result "Prerequisite" "Payment approval" "PASS" "FARPY_SMOKE_PAYMENT_APPROVED" "operator approved real checkout"
  } else {
    Add-Result "Prerequisite" "Payment approval" "BLOCKED_INVALID_ENV" "FARPY_SMOKE_PAYMENT_APPROVED" "must be true"
  }
}

foreach ($item in $optionalEnv) {
  if (Env-Present $item.name) {
    Add-Result "Optional proof" $item.name "PASS" $item.name "present; value redacted"
  } else {
    Add-Result "Optional proof" $item.name "SKIP" $item.name $item.description
  }
}

try {
  $response = Invoke-WebRequest -Method GET -Uri "$base/" -UseBasicParsing -TimeoutSec 20
  Add-Result "Public preflight" "Homepage reachable" "PASS" "$base/" "http_status=$([int]$response.StatusCode)"
} catch {
  Add-Result "Public preflight" "Homepage reachable" "FAIL" "$base/" $_.Exception.Message
}

try {
  $response = Invoke-WebRequest -Method GET -Uri "$base/signin" -UseBasicParsing -TimeoutSec 20
  Add-Result "Public preflight" "Signin reachable" "PASS" "$base/signin" "http_status=$([int]$response.StatusCode)"
} catch {
  Add-Result "Public preflight" "Signin reachable" "FAIL" "$base/signin" $_.Exception.Message
}

try {
  $response = Invoke-WebRequest -Method GET -Uri "$base/topup" -UseBasicParsing -TimeoutSec 20
  Add-Result "Public preflight" "Topup reachable" "PASS" "$base/topup" "http_status=$([int]$response.StatusCode)"
} catch {
  Add-Result "Public preflight" "Topup reachable" "FAIL" "$base/topup" $_.Exception.Message
}

$blocking = @($results | Where-Object { $_.status -in @("BLOCKED_MISSING_ENV", "BLOCKED_INVALID_ENV", "FAIL") })
$missing = @($results | Where-Object { $_.status -eq "BLOCKED_MISSING_ENV" })
$invalid = @($results | Where-Object { $_.status -eq "BLOCKED_INVALID_ENV" })
$failures = @($results | Where-Object { $_.status -eq "FAIL" })
$passes = @($results | Where-Object { $_.status -eq "PASS" })
$skips = @($results | Where-Object { $_.status -eq "SKIP" })

$verdict = if ($failures.Count -gt 0) { "FAIL" } elseif ($missing.Count -gt 0) { "BLOCKED_MISSING_ENV" } elseif ($invalid.Count -gt 0) { "BLOCKED_INVALID_ENV" } else { "PASS_PREFLIGHT_READY" }

Write-Host "FRESH_CUSTOMER_E2E_SMOKE_PREFLIGHT_V1"
Write-Host "TIMESTAMP=$timestamp"
Write-Host "BASE_URL=$base"
Write-Host "VERDICT=$verdict"
Write-Host "PASS_COUNT=$($passes.Count)"
Write-Host "BLOCKED_MISSING_ENV_COUNT=$($missing.Count)"
Write-Host "BLOCKED_INVALID_ENV_COUNT=$($invalid.Count)"
Write-Host "FAIL_COUNT=$($failures.Count)"
Write-Host "SKIP_COUNT=$($skips.Count)"
Write-Host ""

foreach ($item in $results) {
  Write-Host ("{0}`t{1}`t{2}`t{3}" -f $item.status, $item.area, $item.check, $item.evidence)
  if ($item.notes) { Write-Host ("  notes: {0}" -f $item.notes) }
}

if ($OutputPath) {
  $jsonPath = $OutputPath
} else {
  $safeStamp = $timestamp.Replace(":", "").Replace("-", "")
  $jsonPath = Join-Path (Get-Location) "fresh-customer-e2e-smoke-preflight-v1-$safeStamp.json"
}
@($results) | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $jsonPath -Encoding UTF8
Write-Host ""
Write-Host "EVIDENCE_FILE=$jsonPath"

if ($verdict -ne "PASS_PREFLIGHT_READY") {
  exit 2
}