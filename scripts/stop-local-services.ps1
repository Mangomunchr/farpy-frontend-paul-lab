$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$Runtime = Join-Path $Root ".farpy-runtime"

function Stop-ServiceProcess {
  param([string]$Name)
  $PidFile = Join-Path $Runtime "$Name.pid"
  if (!(Test-Path -LiteralPath $PidFile)) {
    Write-Host "$Name not running"
    return
  }

  $RawPid = (Get-Content -LiteralPath $PidFile -Raw).Trim()
  if ($RawPid -match '^\d+$') {
    $Process = Get-Process -Id ([int]$RawPid) -ErrorAction SilentlyContinue
    if ($Process) {
      Stop-Process -Id $Process.Id -Force
      Write-Host "$Name stopped pid=$RawPid"
    } else {
      Write-Host "$Name pid=$RawPid not found"
    }
  }
  Remove-Item -LiteralPath $PidFile -Force -ErrorAction SilentlyContinue
}

Stop-ServiceProcess -Name "render-worker"
Stop-ServiceProcess -Name "job-api"
