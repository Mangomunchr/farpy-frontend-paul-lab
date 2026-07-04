# AUTH_INVOICE_500_ROOT_CAUSE_V1

Status: GREEN for production fail-closed invoice-route behavior.

## Files changed

- `scripts/job-api.mjs`

## Hashes / diff result

- Local pre-fix SHA256: `B5F083C18A5FA36488D1B30CDA3F07AAC7D9FDB2DD49DCBDFA789AE8FCABC6BB`
- Production pre-fix SHA256: `b5f083c18a5fa36488d1b30cda3f07aac7d9fdb2dd49dcbdfa789ae8fcabc6bb`
- Result: production matched local before the fix.
- Production post-fix SHA256: `d6d0fe8a8450a08208e48597060428828cafb33e68ad9d12bd7767b44536bcf3`
- Production backup: `/opt/farpy-web-render/scripts/job-api.mjs.bak.auth_invoice_500_root_cause.20260627T011201Z`

## Exact root cause

The production `POST /node/v1/web-render/btcpay/invoice` route parsed JSON inline with `JSON.parse(...)` before calling the auth-gated invoice helper.

A malformed request body raised a `SyntaxError` at `scripts/job-api.mjs` line 2160 and fell through the top-level handler as:

```json
{"ok":false,"err":"internal_error"}
```

The missing-cookie path was not the root cause. `parseCookies(header)` already uses `String(header || "")` locally and in production. With valid JSON and no cookie, production correctly returns `401 auth_required`.

## Exact patch

The BTCPay invoice route now wraps only its JSON body parse in a local `try/catch`:

- malformed JSON returns `400 {"ok":false,"error":"invalid_json"}`
- valid unauthenticated JSON continues to return `401 {"ok":false,"error":"auth_required"}`
- invoice creation still requires a real signed-in session

No auth bypass, fake cookie, wallet injection, or BTCPay shortcut was added.

## Commands run

```powershell
Get-FileHash -Algorithm SHA256 -LiteralPath C:\Users\danki\Desktop\farpy-frontend\scripts\job-api.mjs
ssh root@farpy.com "sha256sum /opt/farpy-web-render/scripts/job-api.mjs"
ssh root@farpy.com "curl -i -sS -X POST https://farpy.com/node/v1/web-render/btcpay/invoice -H 'content-type: application/json' --data-binary @/tmp/farpy-valid-invoice.json"
ssh root@farpy.com "curl -i -sS -X POST https://farpy.com/node/v1/web-render/btcpay/invoice -H 'content-type: application/json' --data-binary @/tmp/farpy-invalid-invoice.json"
node --check C:\Users\danki\Desktop\farpy-frontend\scripts\job-api.mjs
scp C:\Users\danki\Desktop\farpy-frontend\scripts\job-api.mjs root@farpy.com:/tmp/job-api.mjs.auth-invoice-500-fix
ssh root@farpy.com "cp /opt/farpy-web-render/scripts/job-api.mjs /opt/farpy-web-render/scripts/job-api.mjs.bak.auth_invoice_500_root_cause.20260627T011201Z && install -m 0644 /tmp/job-api.mjs.auth-invoice-500-fix /opt/farpy-web-render/scripts/job-api.mjs && node --check /opt/farpy-web-render/scripts/job-api.mjs && systemctl restart farpy-web-render-api.service"
```

## Production auth results

- Valid JSON, no Cookie:
  - `HTTP 401`
  - `{"ok":false,"error":"auth_required"}`
- Malformed JSON:
  - `HTTP 400`
  - `{"ok":false,"error":"invalid_json"}`
- Unsigned BTCPay webhook:
  - `HTTP 400`
  - `{"ok":false,"error":"invalid_signature"}`
- Wrong BTCPay webhook signature:
  - `HTTP 400`
  - `{"ok":false,"error":"invalid_signature"}`

## Deploy status

- `farpy-web-render-api.service`: restarted and active.
- Static `/topup`: production returns `HTTP 200` and contains the Card / Bitcoin Lightning selector from the current build.

## Remaining blocker before $1 Lightning payment

A real signed-in browser/session test must create a `$1` BTCPay invoice through `/topup`. No cookie impersonation or forged `farpy_user` session was used during this fix.
## Current launch clarification

As of `LIGHTNING_UI_GATED_V1` / `LIGHTNING_DOCS_ALIGNED_V1`, public Lightning top-up UI is gated and disabled by default.

- `FARPY_LIGHTNING_ENABLED=true` is required at frontend build time to expose the Lightning controls.
- Default production builds do not show Lightning invoice buttons or Lightning claims on `/topup`.
- Lightning remains blocked for public launch until liquidity/channels and a full invoice -> webhook -> wallet-credit smoke are proven GREEN.
- Card/Stripe remains the enabled public top-up rail.