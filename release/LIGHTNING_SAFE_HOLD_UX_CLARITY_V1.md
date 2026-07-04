# LIGHTNING_SAFE_HOLD_UX_CLARITY_V1

Status: GREEN
Timestamp: 2026-06-27T03:23:20Z

## Goal

Make the Lightning safe-hold state obvious on `/topup` while keeping Card as the default usable top-up path.

## Files changed

- `src/components/TopUpPage.tsx`
- `src/app/globals.css`
- `release/LIGHTNING_SAFE_HOLD_UX_CLARITY_V1.md`

## Behavior changed

- Card remains the only active top-up method.
- Bitcoin Lightning remains visible but disabled.
- The Lightning control uses disabled button semantics, lower opacity, and `not-allowed` cursor.
- The UI shows:
  - `Bitcoin Lightning is temporarily unavailable while we verify routing. Please use Card for now.`
- The UI no longer renders Lightning `$1/$5/$10` invoice buttons.
- The top-up client no longer contains a BTCPay invoice request path.

## Behavior preserved

- Stripe/Card top-up flow remains unchanged.
- Backend BTCPay invoice endpoint remains auth-protected and fail-closed.
- Backend BTCPay webhook remains live and signature-protected.

## Build

```powershell
npm.cmd run build
```

Result: PASS

## Deploy commands

```powershell
tar -czf C:\tmp\farpy-out-lightning-safe-hold-ux-20260627T032320Z.tar.gz -C C:\Users\danki\Desktop\farpy-frontend out
scp C:\tmp\farpy-out-lightning-safe-hold-ux-20260627T032320Z.tar.gz root@farpy.com:/tmp/
ssh root@farpy.com 'tar -xzf /tmp/farpy-out-lightning-safe-hold-ux-20260627T032320Z.tar.gz -C /opt/farpy.com'
```

Backup created before deploy attempt:

- `/opt/farpy.com/out.bak.lightning_safe_hold_ux_clarity.20260627T032320Z`

Note: full static replacement was blocked by immutable receipt-static files, so the final production deploy was an overlay extraction of the built `out` directory. No receipt-static files were modified.

## Production checks

| Check | Result |
| --- | --- |
| `/topup` | HTTP 200 |
| `/downloads` | HTTP 200 |
| Lightning hold copy in production chunk | PASS, count `1` |
| Disabled Lightning class in production chunk | PASS, count `1` |
| `Create invoice` in production chunks | PASS, count `0` |
| `btcpay/invoice` in production chunks | PASS, count `0` |
| `usd_1`, `usd_5`, `usd_10` in production chunks | PASS, count `0` |
| Unauthenticated invoice request | HTTP 401 `auth_required` |
| Unsigned webhook request | HTTP 400 `invalid_signature` |

## Final state

`LIGHTNING_SAFE_HOLD_UX_CLARITY_V1 = GREEN`
