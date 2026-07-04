# LIGHTNING_PUBLIC_SAFE_HOLD_V1

Status: GREEN

## Reason

Lightning top-up is in public hold because:

- BTCPay emits BTC-LN invoices with `0` route hints.
- Wallets report the receiving node is private/unreachable and requires RouteHints.
- BTCPay host admin visibility is blocked.

## Files changed

- `src/components/TopUpPage.tsx`
- `release/LIGHTNING_PUBLIC_SAFE_HOLD_V1.md`

## UI behavior

- Card remains the default top-up method.
- Stripe/card top-up buttons remain visible and usable for signed-in users.
- Bitcoin Lightning is labeled `Beta` and disabled in the public UI.
- If Lightning panel is ever selected in code state, it shows:

```text
Bitcoin Lightning is temporarily unavailable while we verify routing.
```

- The public UI no longer exposes Lightning invoice amount buttons.
- The public UI no longer exposes a `Create invoice` button.

## Backend behavior preserved

No backend route was removed.

- Invoice endpoint remains auth-protected and fail-closed.
- Webhook endpoint remains live and signature-protected.

## Build

Command:

```powershell
npm.cmd run build
```

Result:

```text
Compiled successfully
Finished TypeScript
Generated static pages (37/37)
```

## Deploy

Commands run:

```powershell
tar -C C:\Users\danki\Desktop\farpy-frontend\out -czf C:\tmp\farpy-out-lightning-safe-hold-<timestamp>.tgz .
scp C:\tmp\farpy-out-lightning-safe-hold-<timestamp>.tgz root@farpy.com:/tmp/farpy-out-lightning-safe-hold.tgz
ssh root@farpy.com "cp -a /opt/farpy.com/out /opt/farpy.com/out.bak.lightning_safe_hold.20260627T020548Z && tar -xzf /tmp/farpy-out-lightning-safe-hold.tgz -C /tmp/farpy-out-lightning-safe-hold-new && cp -a /tmp/farpy-out-lightning-safe-hold-new/. /opt/farpy.com/out/"
```

Production static backup:

```text
/opt/farpy.com/out.bak.lightning_safe_hold.20260627T020548Z
```

## Production checks

### Public route

```text
https://farpy.com/topup -> HTTP 200
https://farpy.com/ -> HTTP 200
```

### Referenced live `/topup` chunk

The live `/topup` HTML references chunk:

```text
/_next/static/chunks/2vbj-__ysok8l.js
```

That referenced chunk contains:

```text
Bitcoin Lightning is temporarily unavailable while we verify routing.
```

That referenced chunk does not contain:

```text
Create invoice
```

It still contains card top-up copy:

```text
Add funds
```

Note: stale unreferenced chunks remain on disk because production static deploy overlays instead of deleting protected `receipt-static` files. `/topup` does not reference the stale Lightning invoice chunk.

### Backend fail-closed checks

Unauthenticated invoice request:

```text
POST https://farpy.com/node/v1/web-render/btcpay/invoice
HTTP 401
{"ok":false,"error":"auth_required"}
```

Unsigned webhook:

```text
POST https://farpy.com/node/v1/web-render/btcpay/webhook
HTTP 400
{"ok":false,"error":"invalid_signature"}
```

## Verdict

LIGHTNING_PUBLIC_SAFE_HOLD_V1 = GREEN

Public users cannot create new unpaid/unpayable Lightning invoices from `/topup`. Card remains default and available. Backend Lightning endpoints remain fail-closed for future operator testing.