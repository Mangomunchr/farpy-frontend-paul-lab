$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$Runtime = Join-Path $Root ".farpy-runtime"
New-Item -ItemType Directory -Force -Path $Runtime | Out-Null

function Test-RunningPid {
  param([string]$PidFile)
  if (!(Test-Path -LiteralPath $PidFile)) { return $false }
  $RawPid = (Get-Content -LiteralPath $PidFile -Raw).Trim()
  if ($RawPid -notmatch '^\d+$') { return $false }
  return [bool](Get-Process -Id ([int]$RawPid) -ErrorAction SilentlyContinue)
}

function Start-ServiceProcess {
  param(
    [string]$Name,
    [string]$Script
  )
  $PidFile = Join-Path $Runtime "$Name.pid"
  $OutLog = Join-Path $Runtime "$Name.out.log"
  $ErrLog = Join-Path $Runtime "$Name.err.log"

  if (Test-RunningPid $PidFile) {
    $ExistingPid = (Get-Content -LiteralPath $PidFile -Raw).Trim()
    Write-Host "$Name already running pid=$ExistingPid"
    return
  }

  $Process = Start-Process -FilePath "node" `
    -ArgumentList $Script `
    -WorkingDirectory $Root `
    -WindowStyle Hidden `
    -RedirectStandardOutput $OutLog `
    -RedirectStandardError $ErrLog `
    -PassThru
  Set-Content -LiteralPath $PidFile -Value $Process.Id -Encoding ASCII
  Write-Host "$Name started pid=$($Process.Id)"
}

Start-ServiceProcess -Name "job-api" -Script "scripts/job-api.mjs"
Start-ServiceProcess -Name "render-worker" -Script "scripts/render-worker.mjs"
