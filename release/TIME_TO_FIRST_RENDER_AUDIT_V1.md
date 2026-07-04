# TIME_TO_FIRST_RENDER_AUDIT_V1

Status: YELLOW

Date: 2026-07-01

Mode: read-only audit. No production mutation.

## Objective

Measure Time To First Render.

Start:

- Landing page

End:

- Receipt opened

## Measurement Boundary

This audit measured public shell response time and reviewed the first-render journey.

It did not execute a real paid render because that requires a fresh authenticated account, wallet/card payment, upload, render partner execution, ZIP generation, and receipt creation. Those steps must be measured in `FRESH_NEW_ACCOUNT_E2E_PROOF_V1` or `PAID_BROWSER_SMOKE_V1`.

## Public Route Timing

Measured with read-only `Invoke-WebRequest`.

| Route | HTTP | Time |
|---|---:|---:|
| `/` | 200 | 993 ms |
| `/signin` | 200 | 215 ms |
| `/topup` | 200 | 217 ms |
| `/workspace` | 200 | 206 ms |
| `/receipt` | 200 | 221 ms |
| `/account` | 200 | 220 ms |

Conclusion:

Static shell load time is not the largest Time To First Render risk. The likely delay is user decision/payment/render wait, not public page response time.

## Journey Timing Model

| Step | Expected Time | Evidence | Risk |
|---|---:|---|---|
| Landing page understand + choose package | 30s-2m | Homepage route fast; first-15 audit found terminology friction | Medium |
| Sign in | 30s-5m | Google/email sign-in available; email delay possible | Medium |
| Wallet/topup | 1m-5m | Topup route fast; Card primary; wallet model may confuse | High |
| Upload small `.blend` | 30s-3m | Homepage upload flow present | Medium |
| Workspace payment/start | 30s-2m | Workspace supports Sign in to Pay, Top Up, Pay and send package | Medium |
| Render | Unknown | Depends on file, render partner, frame count, queue, Blender/Octane behavior | High |
| Download ZIP | 15s-2m | Download routes exist; real file size dependent | Medium |
| Receipt opened | 15s-1m | Receipt shell route fast | Low |

Estimated best-case first render:

- 5-10 minutes for a prepared user with a small known-good package, existing fast Google sign-in, successful card top-up, available render partner, and one-frame render.

Estimated typical controlled-alpha first user:

- 10-20 minutes.

Not proven:

- Actual fresh user paid render stopwatch from landing to receipt.

## Largest Delays

### 1. Payment/wallet setup

Why:

- User must understand wallet balance before render.
- User may expect direct payment per package.
- Topup/Card checkout is an external flow.

Evidence:

- `FIRST_15_MINUTES_AUDIT_V1` P1: wallet model is a first-run mental hurdle.
- `src/components/TopUpPage.tsx` copy says `Add wallet balance for future render packages.`

High-impact improvement:

- Add one plain line near the wallet balance:
  - `Your wallet pays for render packages. Unused balance stays in your account.`

### 2. Sign-in and return path

Why:

- User can choose/upload before signing in, then later must sign in to pay.
- Email magic-link delay can dominate total time.

Evidence:

- `src/components/AuthPage.tsx` supports Google and email.
- `src/components/Workspace.tsx` shows `Sign in to Pay` when needed.

High-impact improvement:

- Near homepage send button:
  - `You can choose a package first. Sign in is required before payment.`

### 3. Render wait

Why:

- Render duration depends on file, frame count, queue, and render partner availability.
- No fake percentage should be shown.

Evidence:

- Workspace shows frame progress when available and `Waiting for first frame...` otherwise.

High-impact improvement:

- During running state, keep the current honest message but add a first-render reassurance:
  - `Small packages usually finish faster. You can leave this page and come back from Account history.`

Do not add fake ETA.

## Most Confusing Step

Wallet/topup.

Reason:

It is the first moment where Farpy differs from a simple "upload then checkout" flow. A user may not understand why they are adding balance, whether unused funds stay available, or whether the current package is already paid.

Recommended fix:

- Explain wallet in one sentence on `/topup`.
- On workspace payment, show package cost and available balance together:
  - `This package costs $X. Your wallet balance is $Y.`

## Most Likely Abandonment Point

Topup/payment handoff.

Why:

- External checkout creates a context switch.
- Wallet model requires trust.
- Bitcoin tab is visible and can distract a first user from Card.
- If the user does not understand why funds are needed, they may stop before sending the package.

Recommended fix:

- Make Card visually primary for first render.
- Add helper copy:
  - `Use Card for the fastest first top-up.`
- Keep Bitcoin available but secondary.
- Keep Lightning hidden/gated.

## Secondary Abandonment Point

Workspace after package creation but before payment/render start.

Why:

- Depending on state, the user may see `Sign in to Pay`, `Top Up`, `Pay and send package`, or `Send package`.
- This is correct behavior, but the path can feel branched.

Recommended fix:

- Add one stable payment explanation on workspace:
  - `Next: pay for this package, then Farpy sends it to a render partner.`

## High-Impact Improvements Only

1. Add a wallet explainer sentence on `/topup`.
2. Add sign-in-before-payment hint near homepage send button.
3. Make Card the explicitly recommended first top-up method.
4. Simplify workspace payment copy into one "next step" explanation.
5. Fix remaining workspace mojibake after completed render because it appears at the trust moment.

## What Not To Do

- Do not add fake ETA.
- Do not hide real render wait.
- Do not claim instant delivery.
- Do not enable Lightning for speed claims.
- Do not redesign the flow before Alpha User #1.
- Do not add advanced receipt/hash education before first render completes.

## Commands Run

```powershell
Get-Content -LiteralPath C:\Users\danki\Desktop\farpy-frontend\release\FIRST_15_MINUTES_AUDIT_V1.md -Raw
$urls='https://farpy.com/','https://farpy.com/signin','https://farpy.com/topup','https://farpy.com/workspace','https://farpy.com/receipt','https://farpy.com/account'; $rows=@(); foreach($u in $urls){ $sw=[Diagnostics.Stopwatch]::StartNew(); try{ $r=Invoke-WebRequest -Uri $u -UseBasicParsing -TimeoutSec 20; $sw.Stop(); $rows += [pscustomobject]@{Url=$u;Status=[int]$r.StatusCode;Ms=$sw.ElapsedMilliseconds;Bytes=([Text.Encoding]::UTF8.GetByteCount([string]$r.Content));Error=''} } catch { $sw.Stop(); $rows += [pscustomobject]@{Url=$u;Status=0;Ms=$sw.ElapsedMilliseconds;Bytes=0;Error=$_.Exception.Message} } }; $rows | Format-Table -AutoSize
```

## Verdict

YELLOW.

The public site is responsive enough. Time To First Render risk is concentrated in wallet/payment comprehension and actual render wait, not public route latency.

Next proof required:

- Run one real stopwatch test from landing page to receipt opened with a fresh user and small known-good `.blend`.
