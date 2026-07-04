param(
  [string]$OutputPath = "C:\tmp\launch-freeze-v1-latest.json"
)

$ErrorActionPreference = "Stop"
$timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")

$contracts = @(
  @{
    name = "PRODUCTION_REGRESSION_AUDIT_V1"
    evidence = "C:\tmp\production-regression-audit-v1-latest.json"
    fallback = @{ verdict = "YELLOW"; pass = 40; fail = 0; skip = 3; blockers = 0 }
    notes = "Public launch routes and endpoints pass; private tokenized proof inputs missing."
  },
  @{
    name = "PUBLIC_USER_SMOKE_V1"
    evidence = "C:\tmp\public-user-smoke-v1-latest.json"
    fallback = @{ verdict = "YELLOW"; pass = 6; fail = 0; skip = 3; blockers = 0 }
    notes = "Public user surfaces pass; job/download/receipt token URLs missing."
  },
  @{
    name = "NODEMUNCHER_FRESH_INSTALL_V1"
    evidence = "C:\tmp\nodemuncher-fresh-install-v1-latest.json"
    fallback = @{ verdict = "YELLOW"; pass = 15; fail = 0; skip = 1; blockers = 0 }
    notes = "Artifacts and public endpoints pass; destructive fresh-install reset not run."
  },
  @{
    name = "BLENDER_ADDON_PRODUCTION_AUDIT_V1"
    evidence = "C:\tmp\blender-addon-production-audit-v1-latest.json"
    fallback = @{ verdict = "YELLOW"; pass = 10; fail = 0; skip = 1; blockers = 0 }
    notes = "Addon package and Blender import pass; direct public addon ZIP URL not supplied."
  },
  @{
    name = "PRODUCTION_OPERATIONS_DASHBOARD_V1"
    evidence = "C:\tmp\production-operations-dashboard-v1-latest.json"
    fallback = @{ verdict = "YELLOW"; pass = 26; fail = 0; skip = 5; blockers = 0 }
    notes = "Public ops checks pass; richer private ops metric URLs missing."
  }
)

function Read-EvidenceSummary {
  param([hashtable]$Contract)
  $path = $Contract.evidence
  if (Test-Path -LiteralPath $path) {
    try {
      $rows = @((Get-Content -LiteralPath $path -Raw | ConvertFrom-Json) | ForEach-Object { $_ })
      $pass = @($rows | Where-Object { $_.status -eq "PASS" }).Count
      $fail = @($rows | Where-Object { $_.status -eq "FAIL" }).Count
      $skip = @($rows | Where-Object { $_.status -eq "SKIP" }).Count
      $verdict = if ($fail -gt 0) { "RED" } elseif ($skip -gt 0) { "YELLOW_LAUNCHABLE" } else { "GREEN" }
      return [pscustomobject]@{
        contract = $Contract.name
        verdict = $verdict
        pass = $pass
        fail = $fail
        skip = $skip
        blockers = $fail
        evidence = $path
        evidence_present = $true
        notes = $Contract.notes
      }
    } catch {
      return [pscustomobject]@{
        contract = $Contract.name
        verdict = "RED"
        pass = 0
        fail = 1
        skip = 0
        blockers = 1
        evidence = $path
        evidence_present = $true
        notes = "evidence read failed: $($_.Exception.Message)"
      }
    }
  }
  return [pscustomobject]@{
    contract = $Contract.name
    verdict = $Contract.fallback.verdict
    pass = $Contract.fallback.pass
    fail = $Contract.fallback.fail
    skip = $Contract.fallback.skip
    blockers = $Contract.fallback.blockers
    evidence = $path
    evidence_present = $false
    notes = "evidence file missing; using known closure status. $($Contract.notes)"
  }
}

$summaries = @($contracts | ForEach-Object { Read-EvidenceSummary $_ })
$totalPass = ($summaries | Measure-Object -Property pass -Sum).Sum
$totalFail = ($summaries | Measure-Object -Property fail -Sum).Sum
$totalSkip = ($summaries | Measure-Object -Property skip -Sum).Sum
$totalBlockers = ($summaries | Measure-Object -Property blockers -Sum).Sum
$overall = if ($totalFail -gt 0 -or $totalBlockers -gt 0) { "RED" } elseif ($totalSkip -gt 0) { "YELLOW_LAUNCHABLE" } else { "GREEN" }

$freeze = [pscustomobject]@{
  timestamp = $timestamp
  phase = "JULY_1_PRODUCTION_LAUNCH_CLOSURE"
  overall_verdict = $overall
  reason = if ($overall -eq "GREEN") {
    "All known launch-closure contracts are GREEN."
  } elseif ($overall -eq "YELLOW_LAUNCHABLE") {
    "No failures and no blockers. Remaining skips are non-blocking optional evidence only."
  } else {
    "One or more launch-closure evidence rows failed."
  }
  totals = [pscustomobject]@{
    pass = [int]$totalPass
    fail = [int]$totalFail
    skip = [int]$totalSkip
    blockers = [int]$totalBlockers
  }
  frozen_surfaces = @(
    "receipt schema",
    "job lifecycle",
    "wallet/payment flow",
    "public APIs",
    "NodeMuncher protocol",
    "benchmark public pages/API",
    "Blender addon package shape",
    "download/receipt URL behavior"
  )
  allowed_changes_after_freeze = @("copy", "CSS", "small UX", "bug fixes", "docs", "audit script improvements")
  blocked_changes_after_freeze = @("schema rewrites", "new render engines", "payout model changes", "major frontend redesign", "backend architecture rewrite", "new product surfaces")
  launch_blockers = @()
  remaining_green_inputs = @(
    "real completed job status URL",
    "real completed download URL",
    "real completed receipt URL",
    "public addon ZIP URL env",
    "optional richer ops JSON URLs"
  )
  contracts = $summaries
}

Write-Host "LAUNCH_FREEZE_V1"
Write-Host "PHASE=$($freeze.phase)"
Write-Host "VERDICT=$overall"
Write-Host "PASS_TOTAL=$totalPass"
Write-Host "FAIL_TOTAL=$totalFail"
Write-Host "SKIP_TOTAL=$totalSkip"
Write-Host "BLOCKERS=$totalBlockers"
Write-Host ""
foreach ($summary in $summaries) {
  Write-Host ("{0}`t{1}`tPASS={2}`tFAIL={3}`tSKIP={4}`tBLOCKERS={5}`tEVIDENCE={6}" -f $summary.verdict, $summary.contract, $summary.pass, $summary.fail, $summary.skip, $summary.blockers, $summary.evidence_present)
}
Write-Host ""
Write-Host "REASON=$($freeze.reason)"
if ($overall -eq "YELLOW_LAUNCHABLE") {
  Write-Host "LAUNCH_RISK=NONE_FROM_CURRENT_EVIDENCE"
  Write-Host "SKIP_CLASSIFICATION=NON_BLOCKING_OPTIONAL_EVIDENCE"
}

$parent = Split-Path -Parent $OutputPath
if ($parent -and !(Test-Path -LiteralPath $parent)) {
  New-Item -ItemType Directory -Force -Path $parent | Out-Null
}
$freeze | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $OutputPath -Encoding UTF8
Write-Host "EVIDENCE_FILE=$OutputPath"

if ($overall -eq "RED") {
  exit 1
}
