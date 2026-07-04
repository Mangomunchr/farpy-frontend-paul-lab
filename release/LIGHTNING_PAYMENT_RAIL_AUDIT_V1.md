# LIGHTNING_PAYMENT_RAIL_AUDIT_V1

Date: 2026-06-26
Verdict: RED

Farpy must not enable public Bitcoin Lightning top-ups yet. The rail has historical code and configuration, and `btcpay.farpy.com` is reachable over HTTPS, but the active public route is not usable, the current `/topup` UI is Stripe wallet-only, and end-to-end credit into the current wallet of record is not proven.

## Scope Audited

- Production host: `farpy`
- BTCPay host: `https://btcpay.farpy.com`
- Farpy top-up UI and frontend API helpers
- Production jobs API BTCPay patch
- Production Caddy routing
- Legacy top-up databases and wallet ledger evidence
- Webhook signature/idempotency path
- Wallet credit application path

## Infrastructure Findings

| Check | Status | Evidence |
| --- | --- | --- |
| `btcpay.farpy.com` DNS/TLS | PASS | DNS resolves to `135.181.166.121`; HTTPS returns Caddy/Kestrel and redirects to BTCPay login. |
| BTCPay enabled/mainnet env | PASS | `/etc/farpy/btcpay.env` exists; `BTCPAY_ENABLED=1`; `BTCPAY_MAINNET=1`. Secret values were not recorded. |
| BTCPay API read with configured key | FAIL | Read-only API probe returned unauthenticated/401; key authorization was not proven. |
| BTCPay service/container on Node A | FAIL | No active `btcpay`, `bitcoin`, `lnd`, `clightning`, `core-lightning`, or `nbxplorer` systemd unit/container/process found on Node A. |
| Lightning listener `9735` | WARN | No `:9735` listener found on Node A. This may be acceptable if BTCPay/LN lives elsewhere, but that topology is not documented/proven. |
| BTCPay store/payment methods | FAIL | Store/payment-method read was not authenticated, so Lightning backend usability/sync was not proven. |

## Farpy Integration Findings

| Area | Status | Evidence |
| --- | --- | --- |
| `/topup` UI | FAIL | `src/components/TopUpPage.tsx` exposes Stripe wallet top-ups only: `$10/$25/$50/$100` through `POST /v1/wallet/topup/session`. No Lightning `$1/$5/$10` public UI exists. |
| Frontend API helpers | FAIL | `src/lib/api.ts` has no BTCPay/Lightning invoice helper. |
| Invoice creation endpoint code | PARTIAL | Production `/var/lib/farpy/jobs-api/server.js` contains `POST /api/topup/btcpay/create`. Allowed Lightning amounts are `25,100,300,500,1000` cents, so `$1/$5/$10` are accepted by code. |
| Active public invoice route | FAIL | `POST https://farpy.com/api/topup/btcpay/create` returned `404` for safe invalid-probe request; `OPTIONS` also returned `404`. |
| Webhook endpoint code | PARTIAL | Production jobs API contains `POST /btcpay/webhook` with HMAC validation using `BTCPAY_WEBHOOK_SECRET`. Active public webhook exposure was not proven. |
| Wallet credit script | PARTIAL | `/var/lib/farpy/ops-topup/apply_topup_balance.py` exists and is idempotent by `balance_ledger(user_id, reason, ref)`. |
| Current wallet of record | FAIL | The BTCPay webhook inserts paid rows into `/var/lib/farpy/ops-topup/topups.db`, while `apply_topup_balance.py` reads `/var/lib/farpy/topups.db`. This split means webhook credit is not proven safe end-to-end. |
| Historical BTCPay credit | PARTIAL | Legacy DB contains one paid `TOPUP-BTCPAY-*` for 100 cents, and the authoritative web-render wallet has a later reconciliation entry referencing it. This proves historical reconciliation, not live webhook credit. |

## Security Findings

| Check | Status | Evidence |
| --- | --- | --- |
| Webhook signature validation | PASS/PARTIAL | Code verifies `BTCPAY-SIG` with HMAC-SHA256 and timing-safe comparison. Not proven against a real BTCPay webhook delivery. |
| Duplicate webhook idempotency | PARTIAL | Credit script is idempotent by `balance_ledger` ref, and webhook uses `INSERT OR IGNORE`; however, the two DB paths make the live path unproven. |
| Client-forged amount prevention | PARTIAL | Invoice creation restricts amounts to allowlists. It still accepts `email/farpy_user` from client body; authenticated/server-side account binding is not proven for Lightning. |
| Expired/cancelled invoice behavior | PASS/PARTIAL | Webhook ignores events other than `InvoiceSettled`. Not proven with real BTCPay payloads. |
| Partial/underpaid behavior | UNKNOWN | Not proven from audited code; amount verification appears metadata-based, not independently checked against BTCPay settled amount in the visible handler. |
| Overpaid behavior | UNKNOWN | No documented behavior found in audited code/docs. |

## Endpoints Found

### Active frontend wallet path

- `GET /v1/wallet/balance`
- `GET /v1/wallet/transactions`
- `POST /v1/wallet/topup/session`

These are Stripe wallet endpoints, not Lightning.

### Legacy/current production BTCPay code paths

- `POST /api/topup/btcpay/create` in `/var/lib/farpy/jobs-api/server.js`
- `POST /btcpay/webhook` in `/var/lib/farpy/jobs-api/server.js`
- `/var/lib/farpy/ops-topup/apply_topup_balance.py`

Active public route validation failed for `/api/topup/btcpay/create` with `404`.

## Env Vars Required

Defined in `/etc/farpy/btcpay.env`:

- `BTCPAY_URL`
- `BTCPAY_STORE_ID`
- `BTCPAY_API_KEY`
- `BTCPAY_WEBHOOK_SECRET`
- `BTCPAY_ENABLED`
- `BTCPAY_MAINNET`

Values were intentionally not recorded.

## Amount Mapping

Code-level Lightning allowlist includes:

- `$0.25` = `25` cents
- `$1` = `100` cents
- `$3` = `300` cents
- `$5` = `500` cents
- `$10` = `1000` cents

The requested public set `$1/$5/$10` is representable in code, but not currently exposed through `/topup`.

## Blockers

1. Public Lightning invoice route returns `404`.
2. `/topup` UI does not expose Lightning or `$1/$5/$10` options.
3. BTCPay API authorization was not proven with the configured production key.
4. No BTCPay/LN service/container/process/listener was found on Node A; actual BTCPay/LN topology is not documented by this audit.
5. Webhook credit path appears split across two top-up DBs:
   - webhook writes `/var/lib/farpy/ops-topup/topups.db`
   - credit script reads `/var/lib/farpy/topups.db`
6. Live webhook delivery, replay/idempotency, partial/underpaid behavior, and authoritative wallet credit were not proven.
7. Account binding for Lightning invoice creation appears client-supplied in the visible handler, not proven session-bound.

## Safe Next Commands To Turn Rail GREEN

Run only after deciding to actively validate or repair the rail. Do not spend funds without operator approval.

```bash
# 1. Confirm active route exposure after Caddy/jobs-api route repair.
curl -i -X OPTIONS https://farpy.com/api/topup/btcpay/create
curl -i -X POST https://farpy.com/api/topup/btcpay/create \
  -H 'content-type: application/json' \
  --data '{"amount_cents":999,"rail":"lightning","email":"audit@example.invalid"}'

# Expected after route is live: 400 bad_lightning_amount, not 404.
```

```bash
# 2. Verify BTCPay API key/store/payment methods without printing secrets.
set -a
. /etc/farpy/btcpay.env
set +a
curl -sS -o /tmp/btcpay-store.json -w '%{http_code}\n' \
  -H "Authorization: token ${BTCPAY_API_KEY}" \
  "${BTCPAY_URL%/}/api/v1/stores/${BTCPAY_STORE_ID}"
curl -sS -o /tmp/btcpay-methods.json -w '%{http_code}\n' \
  -H "Authorization: token ${BTCPAY_API_KEY}" \
  "${BTCPAY_URL%/}/api/v1/stores/${BTCPAY_STORE_ID}/payment-methods"
python3 - <<'PY'
import json
print(json.load(open('/tmp/btcpay-store.json')).get('defaultCurrency'))
for m in json.load(open('/tmp/btcpay-methods.json')):
    print({k:m.get(k) for k in ('paymentMethod','enabled','cryptoCode','paymentType')})
PY
```

```bash
# 3. Dry-run the DB consistency before any real invoice payment.
sqlite3 /var/lib/farpy/topups.db ".schema topups"
sqlite3 /var/lib/farpy/ops-topup/topups.db ".schema topups"
grep -R "TOPUP-BTCPAY" /var/lib/farpy-web-render/wallet /opt/farpy/ledger /var/lib/farpy 2>/dev/null | tail -50
```

```bash
# 4. After DB/credit path is repaired and operator approves a real $1 test:
# Create an invoice through the production endpoint, pay manually, then verify.
curl -sS -X POST https://farpy.com/api/topup/btcpay/create \
  -H 'content-type: application/json' \
  --data '{"amount_cents":100,"rail":"lightning","email":"<operator-test-email>"}'

# Manually pay the returned BTCPay invoice.
# Then verify wallet credit and idempotency from server logs/ledger.
```

```bash
# 5. Replay/idempotency validation only with a captured non-secret BTCPay sample payload
# and correct signature generation in a private operator shell. Expected result:
# first replay credits once, second replay returns ok/already or no balance change.
```

## Final Status

LIGHTNING_PAYMENT_RAIL_AUDIT_V1 = RED

Public Lightning top-up should remain disabled until route exposure, authenticated invoice creation, BTCPay API access, webhook delivery, and authoritative wallet credit are proven end-to-end.
