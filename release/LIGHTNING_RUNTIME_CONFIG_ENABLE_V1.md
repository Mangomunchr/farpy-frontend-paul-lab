# LIGHTNING_RUNTIME_CONFIG_ENABLE_V1

Status: YELLOW / READY FOR SIGNED-IN OPERATOR INVOICE TEST

## Goal

Load BTCPay runtime config into `farpy-web-render-api.service` so authenticated Lightning invoice creation can work.

## Drop-in path

- `/etc/systemd/system/farpy-web-render-api.service.d/80-btcpay-env.conf`

Content:

```ini
[Service]
EnvironmentFile=/etc/farpy/btcpay.env
```

## Service restart

Commands run:

```bash
mkdir -p /etc/systemd/system/farpy-web-render-api.service.d
cat > /etc/systemd/system/farpy-web-render-api.service.d/80-btcpay-env.conf
chmod 0644 /etc/systemd/system/farpy-web-render-api.service.d/80-btcpay-env.conf
systemctl daemon-reload
systemctl restart farpy-web-render-api.service
```

Result:

- Service: `farpy-web-render-api.service`
- Active: `active`
- Main PID after restart: `1057839`
- Started: `Sat 2026-06-27 03:37:26 CEST`

## Redacted runtime env names present

Running process environment contains these names, values redacted:

```text
BTCPAY_API_KEY=SET_REDACTED
BTCPAY_ENABLED=SET_REDACTED
BTCPAY_MAINNET=SET_REDACTED
BTCPAY_STORE_ID=SET_REDACTED
BTCPAY_URL=SET_REDACTED
BTCPAY_WEBHOOK_SECRET=SET_REDACTED
```

Systemd now imports both:

```text
EnvironmentFile=-/etc/farpy/stripe.env
EnvironmentFile=/etc/farpy/btcpay.env
```

## Route checks

### Unauthenticated valid invoice request

```text
POST https://farpy.com/node/v1/web-render/btcpay/invoice
HTTP 401
{"ok":false,"error":"auth_required"}
```

### Malformed JSON invoice request

```text
POST https://farpy.com/node/v1/web-render/btcpay/invoice
HTTP 400
{"ok":false,"error":"invalid_json"}
```

### Unsigned BTCPay webhook

```text
POST https://farpy.com/node/v1/web-render/btcpay/webhook
HTTP 400
{"ok":false,"error":"invalid_signature"}
```

## Invoice creation result

Not run in this tool context.

Reason: a real signed-in browser/session is required. No forged `farpy_user` cookie, auth bypass, wallet injection, or fake session was used.

## Remaining blocker before $1 Lightning payment

A signed-in operator must open `/topup`, select `Bitcoin Lightning`, click `$1`, and confirm the backend returns a BTCPay `checkout_url`. Stop before payment unless explicitly approved.
## Current launch clarification

As of `LIGHTNING_UI_GATED_V1` / `LIGHTNING_DOCS_ALIGNED_V1`, public Lightning top-up UI is gated and disabled by default.

- `FARPY_LIGHTNING_ENABLED=true` is required at frontend build time to expose the Lightning controls.
- Default production builds do not show Lightning invoice buttons or Lightning claims on `/topup`.
- Lightning remains blocked for public launch until liquidity/channels and a full invoice -> webhook -> wallet-credit smoke are proven GREEN.
- Card/Stripe remains the enabled public top-up rail.