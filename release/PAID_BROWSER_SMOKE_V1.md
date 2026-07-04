# PAID_BROWSER_SMOKE_V1

Status: BLOCKED

## Objective

Run one logged-in real production render and capture ZIP plus delivery receipt proof.

## Result

The smoke was not executed because the currently logged-in browser session is not safely accessible to automation.

No Farpy application failure was found in this step.

## Evidence

- Running Chrome and Edge processes were found.
- No existing browser DevTools endpoint was available on the checked local ports.
- Running browser process command lines did not expose `--remote-debugging-port`.
- The in-app browser connector is unavailable in this environment because the local Node REPL kernel exits before browser setup.
- A known-good render input exists:
  - `C:\Users\danki\Desktop\farpy-frontend\public\smoke\real-smoke.blend`

## Commands run

```powershell
Get-NetTCPConnection -LocalPort 9222,9223,9224,9225,9226 -ErrorAction SilentlyContinue
Get-Process msedge,chrome -ErrorAction SilentlyContinue
Get-CimInstance Win32_Process | Where-Object { $_.Name -in @('chrome.exe','msedge.exe') }
Get-ChildItem -Path public,public\smoke -Filter *.blend -Recurse -ErrorAction SilentlyContinue
```

## Security posture

- No cookies were printed.
- No cookies were extracted from the browser profile.
- No auth bypass was attempted.
- No payment bypass was attempted.
- No backend/database repair was attempted.

## Required operational input

One of the following is required to complete the paid browser smoke:

- A logged-in browser launched with a local DevTools port for this run, without exposing secrets in logs.
- The operator manually runs the browser flow and provides the resulting job/download/receipt proof fields.
- A dedicated smoke session mechanism explicitly approved for this purpose.

## Next status

Blocked on authenticated browser/session control, not on product code.
