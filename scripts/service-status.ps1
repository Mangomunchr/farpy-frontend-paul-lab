$ErrorActionPreference = "Continue"

$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$Runtime = Join-Path $Root ".farpy-runtime"
$Base = "http://127.0.0.1:19102/node/v1"

function Test-RunningPid {
  param([string]$Name)
  $PidFile = Join-Path $Runtime "$Name.pid"
  if (!(Test-Path -LiteralPath $PidFile)) { return $false }
  $RawPid = (Get-Content -LiteralPath $PidFile -Raw).Trim()
  if ($RawPid -notmatch '^\d+$') { return $false }
  return [bool](Get-Process -Id ([int]$RawPid) -ErrorAction SilentlyContinue)
}

function Get-Json {
  param([string]$Url)
  try {
    return (Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5).Content
  } catch {
    return "{""ok"":false,""error"":""$($_.Exception.Message.Replace('"','\"'))""}"
  }
}

Write-Host "API running: $(if (Test-RunningPid 'job-api') { 'yes' } else { 'no' })"
Write-Host "Worker running: $(if (Test-RunningPid 'render-worker') { 'yes' } else { 'no' })"
Write-Host "API health JSON:"
Write-Host (Get-Json "$Base/health")
Write-Host "Worker status JSON:"
Write-Host (Get-Json "$Base/worker/status")
