# FARPY_TOPUP_CHECKOUT_BUTTON_WIRE_V1

Date: 2026-06-28

## Root Cause

Production `/topup` had wallet top-up UI traffic, but the public checkout path expected for launch was not wired:

- `/checkout` returned `404`.
- `/api/topup/checkout` returned `404`.
- Existing frontend code posted to `/v1/wallet/topup/session`, not `/checkout`.
- Existing backend wallet top-up session logic existed and was authenticated, but `/checkout` was not an alias.
- No `farpy_accept` dependency was found in the deployed top-up checkout path.

## Fix

- Added `/checkout` as an alias to the existing authenticated wallet top-up session handler in `scripts/job-api.mjs`.
- Added Caddy route for exact `/checkout` to proxy to the isolated web-render API on `127.0.0.1:19102`.
- Updated `TopUpPage` to POST JSON to `/checkout` with `{ amount_cents }` and `credentials: "include"`.
- Preserved the existing $10 / $25 / $50 / $100 amount buttons.
- Preserved Card default and Lightning safe-hold state.
- Preserved existing error handling and improved fallback copy to `Unable to start checkout.`.

## Files Changed

Production:

- `/opt/farpy-web-render/scripts/job-api.mjs`
- `/etc/caddy/caddy.real.json`
- `/opt/farpy.com/out/*`

Repo:

- `scripts/job-api.mjs`
- `src/components/TopUpPage.tsx`
- `release/FARPY_TOPUP_CHECKOUT_BUTTON_WIRE_V1.md`

## Backups

- API: `/opt/farpy-web-render/scripts/job-api.mjs.bak.topup_checkout.20260628T023417Z`
- Caddy: `/etc/caddy/caddy.real.json.bak.topup_checkout.20260628T023444Z`
- Static: `/opt/farpy.com/out.bak.topup_checkout.20260628T023531Z`

## Commands Run

```bash
node --check scripts/job-api.mjs
npm.cmd run build
scp scripts/job-api.mjs root@farpy.com:/tmp/job-api.mjs.checkout
cp /opt/farpy-web-render/scripts/job-api.mjs /opt/farpy-web-render/scripts/job-api.mjs.bak.topup_checkout.TIMESTAMP
cp /tmp/job-api.mjs.checkout /opt/farpy-web-render/scripts/job-api.mjs
node --check /opt/farpy-web-render/scripts/job-api.mjs
systemctl restart farpy-web-render-api.service
cp /etc/caddy/caddy.real.json /etc/caddy/caddy.real.json.bak.topup_checkout.TIMESTAMP
chattr -i /etc/caddy/caddy.real.json
python3 /tmp/patch_caddy_checkout_route.py
caddy validate --config /etc/caddy/caddy.real.json
systemctl restart caddy
chattr +i /etc/caddy/caddy.real.json
tar -czf C:\tmp\farpy-topup-checkout-out.tar.gz -C out .
scp C:\tmp\farpy-topup-checkout-out.tar.gz root@farpy.com:/tmp/farpy-topup-checkout-out.tar.gz
cp -a /opt/farpy.com/out /opt/farpy.com/out.bak.topup_checkout.TIMESTAMP
tar -xzf /tmp/farpy-topup-checkout-out.tar.gz -C /opt/farpy.com/out
```

## Smoke Tests

Build:

```text
npm.cmd run build -> PASS
node --check scripts/job-api.mjs -> PASS
```

Production services:

```text
farpy-web-render-api.service -> active
caddy.service -> active
```

Unauthenticated route smoke:

```text
POST https://farpy.com/checkout?audit=topup-checkout-1782614243
Body: {"amount_cents":1000}
Result: 401 {"ok":false,"error":"auth_required"}
```

Access log proof:

```text
POST /checkout?audit=topup-checkout-1782614243 status=401
```

This proves `/checkout` reaches the backend and fails closed without `farpy_accept`.

Static proof:

```text
/topup -> 200
Built chunk contains fetch("/checkout", ...)
Deployed top-up output contains no farpy_accept reference.
```

## Remaining Manual Proof

A full `200`/Stripe redirect requires a real signed-in browser session. The route is now wired for that flow, but this audit did not forge cookies or impersonate a user session.

Expected signed-in result:

```text
POST /checkout {"amount_cents":1000}
-> 200 {"checkout_url":"https://checkout.stripe.com/..."}
-> browser redirects to Stripe Checkout
```

## Rollback

```bash
cp /opt/farpy-web-render/scripts/job-api.mjs.bak.topup_checkout.20260628T023417Z /opt/farpy-web-render/scripts/job-api.mjs
systemctl restart farpy-web-render-api.service
chattr -i /etc/caddy/caddy.real.json
cp /etc/caddy/caddy.real.json.bak.topup_checkout.20260628T023444Z /etc/caddy/caddy.real.json
caddy validate --config /etc/caddy/caddy.real.json
systemctl restart caddy
chattr +i /etc/caddy/caddy.real.json
rm -rf /opt/farpy.com/out
cp -a /opt/farpy.com/out.bak.topup_checkout.20260628T023531Z /opt/farpy.com/out
```