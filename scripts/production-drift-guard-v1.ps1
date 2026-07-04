param(
  [string]$ProductionHost = "root@farpy.com",
  [string]$RepoRoot = (Split-Path $PSScriptRoot -Parent),
  [string]$LocalOut = "",
  [string]$OutputPath = "C:\tmp\production-drift-guard-v1-latest.json",
  [string]$StaticManifestPath = "C:\tmp\static-preservation-manifest-v1.json",
  [switch]$SkipProduction
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($LocalOut)) {
  $LocalOut = Join-Path $RepoRoot "out"
}

function New-Check {
  param(
    [string]$Name,
    [string]$Status,
    [string]$Evidence,
    [string]$Notes = ""
  )
  [ordered]@{
    name = $Name
    status = $Status
    evidence = $Evidence
    notes = $Notes
  }
}

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

function Get-LocalHash {
  param([string]$Path)
  if (!(Test-Path -LiteralPath $Path)) { return $null }
  (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash.ToLowerInvariant()
}

$checks = New-Object System.Collections.Generic.List[object]
$timestamp = (Get-Date).ToUniversalTime().ToString("o")
$details = [ordered]@{}

try {
  $caddyTemplatePath = Join-Path $RepoRoot "infra\caddy\caddy.real.template.json"
  $systemdRoot = Join-Path $RepoRoot "infra\systemd"
  $etcManifestPath = Join-Path $RepoRoot "docs\FARPY_BOOK\ETC_FARPY_MANIFEST.md"
  $staticGuardPath = Join-Path $RepoRoot "scripts\static-preservation-guard-v1.ps1"

  # 1. Caddy template vs production shape.
  $requiredCaddySignals = @(
    "/workspace/JOB-*",
    "/downloads",
    "/benchmark",
    "/node/v1/web-render",
    "/v1/auth",
    "/checkout",
    "/funnel-event",
    "/real"
  )

  if (!(Test-Path -LiteralPath $caddyTemplatePath)) {
    $checks.Add((New-Check "caddy_template_exists" "FAIL" $caddyTemplatePath "Missing Caddy template."))
  } else {
    $templateText = Get-Content -LiteralPath $caddyTemplatePath -Raw
    $templateJson = $templateText | ConvertFrom-Json
    $missingTemplateSignals = @($requiredCaddySignals | Where-Object { $templateText -notlike "*$_*" })
    if ($missingTemplateSignals.Count -gt 0) {
      $checks.Add((New-Check "caddy_template_shape" "FAIL" $caddyTemplatePath ("Missing signals: " + ($missingTemplateSignals -join ", "))))
    } else {
      $checks.Add((New-Check "caddy_template_shape" "PASS" $caddyTemplatePath "Required route families are represented."))
    }
    $details.caddy_template_status = $templateJson._template.status
  }

  if ($SkipProduction) {
    $checks.Add((New-Check "caddy_production_shape" "SKIP" "SkipProduction set" "No production Caddy inventory."))
  } else {
    $remoteCaddySignals = @("/workspace/JOB-", "/downloads", "/benchmark", "/node/v1/web-render", "/v1/auth", "/checkout", "/funnel-event", "/real")
    $remoteCaddyScript = @'
for s in /workspace/JOB- /downloads /benchmark /node/v1/web-render /v1/auth /checkout /funnel-event /real; do
  if grep -R -F -q -- "$s" /etc/caddy 2>/dev/null; then
    printf 'SIGNAL\t%s\t1\n' "$s"
  else
    printf 'SIGNAL\t%s\t0\n' "$s"
  fi
done
for f in /etc/caddy/caddy.real.json /etc/caddy/Caddyfile; do
  if test -f "$f"; then
    sha=$(sha256sum "$f" | awk '{print $1}')
    bytes=$(wc -c < "$f")
    printf 'FILE\t%s\t%s\t%s\n' "$f" "$sha" "$bytes"
  else
    printf 'FILE\t%s\tMISSING\t0\n' "$f"
  fi
done
'@
    $caddyLines = & ssh $ProductionHost $remoteCaddyScript
    if ($LASTEXITCODE -ne 0) { throw "ssh Caddy inventory failed with exit code $LASTEXITCODE" }
    $prodCaddySignals = @{}
    $prodCaddyFiles = @{}
    foreach ($line in $caddyLines) {
      $parts = $line -split "`t"
      if ($parts.Count -ge 3 -and $parts[0] -eq "SIGNAL") { $prodCaddySignals[$parts[1]] = ($parts[2] -eq "1") }
      if ($parts.Count -ge 4 -and $parts[0] -eq "FILE") { $prodCaddyFiles[$parts[1]] = [ordered]@{ sha256 = $parts[2]; bytes = $parts[3] } }
    }
    $missingProdSignals = @($remoteCaddySignals | Where-Object { -not $prodCaddySignals.ContainsKey($_) -or $prodCaddySignals[$_] -ne $true })
    if ($missingProdSignals.Count -gt 0) {
      $checks.Add((New-Check "caddy_production_shape" "FAIL" "/etc/caddy" ("Production missing signals: " + ($missingProdSignals -join ", "))))
    } else {
      $checks.Add((New-Check "caddy_production_shape" "PASS" "/etc/caddy" "Production contains required route signals."))
    }
    $details.caddy_production = $prodCaddyFiles
  }

  # 2. systemd template coverage.
  $criticalUnits = @(
    "caddy.service",
    "farpy-auth.service",
    "farpy-checkout-api.service",
    "farpy-upload-api.service",
    "farpy-jobs-api.service",
    "farpy-web-render-api.service",
    "farpy-stripe-webhook.service",
    "farpy-node-pair.service",
    "farpy-node-api.service",
    "farpy-leaderboard.service",
    "farpy-public-api-adapter.service",
    "farpy-funnel-report.timer",
    "farpy-status-json.timer",
    "farpy-web-backup.timer"
  )
  $missingLocalTemplates = @()
  foreach ($unit in $criticalUnits) {
    $templateName = "$unit.template"
    if (!(Test-Path -LiteralPath (Join-Path $systemdRoot $templateName))) {
      $missingLocalTemplates += $templateName
    }
  }
  if ($missingLocalTemplates.Count -gt 0) {
    $checks.Add((New-Check "systemd_template_coverage" "FAIL" $systemdRoot ("Missing templates: " + ($missingLocalTemplates -join ", "))))
  } else {
    $checks.Add((New-Check "systemd_template_coverage" "PASS" $systemdRoot "All critical unit templates exist."))
  }

  if ($SkipProduction) {
    $checks.Add((New-Check "systemd_production_coverage" "SKIP" "SkipProduction set" "No production systemd inventory."))
  } else {
    $unitList = $criticalUnits -join " "
    $remoteSystemdScript = "python3 - <<'PY'`nimport json, subprocess`nunits = '''$unitList'''.split()`nout = {}`nfor u in units:`n    cp = subprocess.run(['systemctl','is-enabled',u], text=True, capture_output=True)`n    cp2 = subprocess.run(['systemctl','is-active',u], text=True, capture_output=True)`n    out[u] = {'enabled': cp.stdout.strip() or cp.stderr.strip(), 'active': cp2.stdout.strip() or cp2.stderr.strip()}`nprint(json.dumps(out))`nPY"
    $prodUnits = Invoke-RemoteJson $remoteSystemdScript
    $missingProdUnits = @($criticalUnits | Where-Object { -not $prodUnits.PSObject.Properties.Name.Contains($_) })
    if ($missingProdUnits.Count -gt 0) {
      $checks.Add((New-Check "systemd_production_coverage" "FAIL" "systemctl" ("Missing production units: " + ($missingProdUnits -join ", "))))
    } else {
      $checks.Add((New-Check "systemd_production_coverage" "PASS" "systemctl" "Critical production units returned systemd state."))
    }
    $details.systemd_production = $prodUnits
  }

  # 3. /etc/farpy manifest coverage.
  if (!(Test-Path -LiteralPath $etcManifestPath)) {
    $checks.Add((New-Check "etc_farpy_manifest_exists" "FAIL" $etcManifestPath "Missing /etc/farpy manifest."))
  } else {
    $etcText = Get-Content -LiteralPath $etcManifestPath -Raw
    $manifestPaths = @([regex]::Matches($etcText, '/etc/farpy/[^`\|\s]+') | ForEach-Object { $_.Value.TrimEnd([char[]]@('`', '.')) } | Sort-Object -Unique)
    $checks.Add((New-Check "etc_farpy_manifest_exists" "PASS" $etcManifestPath "$($manifestPaths.Count) paths documented."))
    if ($SkipProduction) {
      $checks.Add((New-Check "etc_farpy_production_coverage" "SKIP" "SkipProduction set" "No production /etc/farpy inventory."))
    } else {
      $remoteEtcScript = @'
find /etc/farpy -type f -printf '%p\t%m\t%u:%g\t%s\n' 2>/dev/null | sort
'@
      $etcLines = & ssh $ProductionHost $remoteEtcScript
      if ($LASTEXITCODE -ne 0) { throw "ssh /etc/farpy inventory failed with exit code $LASTEXITCODE" }
      $prodEtc = @(
        foreach ($line in $etcLines) {
          $parts = $line -split "`t"
          if ($parts.Count -ge 4) {
            [ordered]@{ path = $parts[0]; mode = ("0o" + $parts[1]); owner = $parts[2]; bytes = $parts[3] }
          }
        }
      )
      $manifestSet = @{}
      foreach ($p in $manifestPaths) { $manifestSet[$p] = $true }
      $unexpectedEtc = @($prodEtc | Where-Object { -not $manifestSet.ContainsKey([string]$_.path) })
      $unsafeSecretModes = @($prodEtc | Where-Object { $_.path -match '(env|key|token|secret|ssh|pem|btcpay|stripe|webhook)' -and $_.path -notmatch '\.pub$' -and $_.mode -ne '0o600' })
      if ($unsafeSecretModes.Count -gt 0) {
        $checks.Add((New-Check "etc_farpy_secret_permissions" "FAIL" "/etc/farpy" "$($unsafeSecretModes.Count) secret-like files are not 0600."))
      } else {
        $checks.Add((New-Check "etc_farpy_secret_permissions" "PASS" "/etc/farpy" "Secret-like production files are 0600."))
      }
      if ($unexpectedEtc.Count -gt 0) {
        $checks.Add((New-Check "etc_farpy_production_coverage" "WARN" $etcManifestPath "$($unexpectedEtc.Count) production files are not documented in manifest."))
      } else {
        $checks.Add((New-Check "etc_farpy_production_coverage" "PASS" $etcManifestPath "Production /etc/farpy files are covered by manifest."))
      }
      $details.etc_farpy = [ordered]@{
        production_count = $prodEtc.Count
        unexpected_count = $unexpectedEtc.Count
        unsafe_secret_mode_count = $unsafeSecretModes.Count
        unexpected_paths = @($unexpectedEtc | ForEach-Object { $_.path })
        unsafe_secret_mode_paths = @($unsafeSecretModes | ForEach-Object { [ordered]@{ path = $_.path; mode = $_.mode; owner = $_.owner } })
      }
    }
  }

  # 4. Static preservation manifest.
  if (!(Test-Path -LiteralPath $staticGuardPath)) {
    $checks.Add((New-Check "static_preservation_guard_exists" "FAIL" $staticGuardPath "Missing static preservation guard script."))
  } else {
    $checks.Add((New-Check "static_preservation_guard_exists" "PASS" $staticGuardPath "Static preservation guard script exists."))
    if ($SkipProduction) {
      $checks.Add((New-Check "static_preservation_manifest" "SKIP" "SkipProduction set" "No production static manifest generated."))
    } else {
      & powershell -NoProfile -ExecutionPolicy Bypass -File $staticGuardPath -Mode GenerateManifest -LocalOut $LocalOut -ManifestPath $StaticManifestPath -OutputPath "C:\tmp\static-preservation-guard-from-drift.json" | Out-Null
      if ($LASTEXITCODE -ne 0) {
        $checks.Add((New-Check "static_preservation_manifest" "FAIL" $StaticManifestPath "Static preservation manifest generation failed."))
      } elseif (Test-Path -LiteralPath $StaticManifestPath) {
        $m = Get-Content -LiteralPath $StaticManifestPath -Raw | ConvertFrom-Json
        $checks.Add((New-Check "static_preservation_manifest" "PASS" $StaticManifestPath "$($m.protected_count) protected static artifacts inventoried."))
        $details.static_preservation_manifest = [ordered]@{ protected_count = $m.protected_count; path = $StaticManifestPath }
      } else {
        $checks.Add((New-Check "static_preservation_manifest" "FAIL" $StaticManifestPath "Static preservation manifest was not created."))
      }
    }
  }

  # 5. Local out vs production sample hashes.
  if (!(Test-Path -LiteralPath $LocalOut)) {
    $checks.Add((New-Check "local_out_exists" "FAIL" $LocalOut "Local out directory missing."))
  } else {
    $checks.Add((New-Check "local_out_exists" "PASS" $LocalOut "Local out directory exists."))
    $sampleRel = @(
      "index.html",
      "downloads/Farpy-Blender-Addon-unified.zip",
      "downloads/Farpy-Blender-Addon-unified.zip.sha256",
      "downloads/farpy-benchmark-windows-amd64.exe",
      "downloads/farpy-benchmark-windows-amd64.msi"
    )
    $localSamples = @{}
    foreach ($rel in $sampleRel) {
      $localSamples[$rel] = Get-LocalHash (Join-Path $LocalOut ($rel -replace '/', '\'))
    }
    if ($SkipProduction) {
      $checks.Add((New-Check "local_vs_production_sample_hashes" "SKIP" "SkipProduction set" "No production sample hashes."))
    } else {
      $remoteHashScript = @'
cd /opt/farpy.com/out 2>/dev/null || exit 44
for rel in index.html downloads/Farpy-Blender-Addon-unified.zip downloads/Farpy-Blender-Addon-unified.zip.sha256 downloads/farpy-benchmark-windows-amd64.exe downloads/farpy-benchmark-windows-amd64.msi; do
  if test -f "$rel"; then
    sha=$(sha256sum "$rel" | awk '{print $1}')
    bytes=$(wc -c < "$rel")
    printf 'HASH\t%s\t1\t%s\t%s\n' "$rel" "$sha" "$bytes"
  else
    printf 'HASH\t%s\t0\t\t0\n' "$rel"
  fi
done
'@
      $hashLines = & ssh $ProductionHost $remoteHashScript
      if ($LASTEXITCODE -ne 0) { throw "ssh sample hash inventory failed with exit code $LASTEXITCODE" }
      $prodHashes = @{}
      foreach ($line in $hashLines) {
        $parts = $line -split "`t"
        if ($parts.Count -ge 5 -and $parts[0] -eq "HASH") {
          $prodHashes[$parts[1]] = [ordered]@{ exists = ($parts[2] -eq "1"); sha256 = $parts[3]; bytes = $parts[4] }
        }
      }
      $mismatches = @()
      foreach ($rel in $sampleRel) {
        $lh = $localSamples[$rel]
        if ($null -eq $lh -or -not $prodHashes.ContainsKey($rel) -or $prodHashes[$rel].exists -ne $true) {
          $mismatches += "$rel missing locally or production"
        } elseif ($lh -ne $prodHashes[$rel].sha256) {
          $mismatches += "$rel hash differs"
        }
      }
      if ($mismatches.Count -gt 0) {
        $checks.Add((New-Check "local_vs_production_sample_hashes" "WARN" $LocalOut ($mismatches -join "; ")))
      } else {
        $checks.Add((New-Check "local_vs_production_sample_hashes" "PASS" $LocalOut "Sample static hashes match production."))
      }
      $details.local_sample_hashes = $localSamples
      $details.production_sample_hashes = $prodHashes
    }
  }

  $failCount = @($checks | Where-Object { $_.status -eq "FAIL" }).Count
  $warnCount = @($checks | Where-Object { $_.status -eq "WARN" }).Count
  $skipCount = @($checks | Where-Object { $_.status -eq "SKIP" }).Count
  $passCount = @($checks | Where-Object { $_.status -eq "PASS" }).Count
  $verdict = if ($failCount -gt 0) { "RED" } elseif ($warnCount -gt 0 -or $skipCount -gt 0) { "YELLOW" } else { "GREEN" }

  $result = [ordered]@{
    ok = ($failCount -eq 0)
    verdict = $verdict
    generated_at = $timestamp
    production_host = if ($SkipProduction) { $null } else { $ProductionHost }
    repo_root = $RepoRoot
    local_out = $LocalOut
    output_path = $OutputPath
    pass_count = $passCount
    warn_count = $warnCount
    fail_count = $failCount
    skip_count = $skipCount
    checks = $checks
    details = $details
  }
  Write-JsonFile -Path $OutputPath -Data $result

  Write-Host "PRODUCTION_DRIFT_GUARD_V1"
  Write-Host "VERDICT=$verdict"
  Write-Host "PASS_COUNT=$passCount"
  Write-Host "WARN_COUNT=$warnCount"
  Write-Host "FAIL_COUNT=$failCount"
  Write-Host "SKIP_COUNT=$skipCount"
  Write-Host "EVIDENCE=$OutputPath"

  if ($failCount -gt 0) { exit 1 }
  exit 0
} catch {
  $result = [ordered]@{
    ok = $false
    verdict = "RED"
    generated_at = $timestamp
    error = $_.Exception.Message
    checks = $checks
  }
  Write-JsonFile -Path $OutputPath -Data $result
  Write-Host "PRODUCTION_DRIFT_GUARD_V1"
  Write-Host "VERDICT=RED"
  Write-Host ("ERROR=" + $_.Exception.Message)
  Write-Host "EVIDENCE=$OutputPath"
  exit 1
}
