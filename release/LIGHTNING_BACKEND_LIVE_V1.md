# LIGHTNING_BACKEND_LIVE_V1

Date: 2026-06-27
Status: YELLOW

Lightning is still not exposed publicly in the Farpy UI. Production BTCPay can create a real unpaid mainnet Lightning invoice, and the invoice has an active `BTC-LN` payment method. The backend is not GREEN yet because the Lightning daemon type/sync/liquidity could not be independently verified from Node A, the configured API key lacks store-settings/payment-method listing permission, and BTCPay is still registered to the legacy Farpy webhook route.

## BTCPay

| Check | Status | Evidence |
| --- | --- | --- |
| DNS | PASS | `btcpay.farpy.com` resolves to `135.181.166.121`. |
| HTTPS | PASS | `https://btcpay.farpy.com` returns HTTP/2 `302` to `/login`, served by Caddy/Kestrel. |
| Store ID exists | PARTIAL | API can create/read invoices for the configured store. Store-settings read returned `403 missing-permission`. |
| API key permissions | PARTIAL | API key can list webhooks and create/read invoices. It cannot read store settings or store payment methods; BTCPay reports missing `btcpay.store.canviewstoresettings`. |
| Webhook registration | PASS/PARTIAL | BTCPay API reports 1 enabled webhook with 2 events at `https://api.farpy.com/btcpay/webhook`. |
| Webhook secret match | PARTIAL | Farpy legacy webhook rejects unsigned requests with `401 bad_signature`. BTCPay does not expose webhook secret for direct equality proof. |

## Lightning Backend

| Check | Status | Evidence |
| --- | --- | --- |
| Backend type | UNKNOWN | No `lnd`, `core-lightning`, `lightningd`, `bitcoind`, `nbxplorer`, or BTCPay service/container/process was visible on Node A. |
| Daemon running | UNKNOWN | No daemon visible on Node A. BTCPay may be hosted elsewhere or hidden behind managed infrastructure. |
| Wallet unlocked | UNKNOWN | Not visible from Node A. |
| Chain synced | UNKNOWN | Not visible from Node A. |
| Lightning synced | UNKNOWN | Not visible from Node A. |
| BTCPay Lightning method enabled | PASS/PARTIAL | Unpaid test invoice exposes one active payment method: `paymentMethodId=BTC-LN`. |
| Inbound liquidity | UNKNOWN | Invoice generation proves a BOLT11 can be created, but a real payment was not made, so routeability/liquidity are not proven. |

## Network

| Check | Status | Evidence |
| --- | --- | --- |
| Public DNS | PASS | `btcpay.farpy.com` resolves. |
| Public HTTPS | PASS | TLS endpoint works and redirects to login. |
| Reverse proxy | PARTIAL | Caddy serves the public host; active config has complex legacy BTCPay/topup route fragments. |
| Required ports | PARTIAL | `80/443` open via Caddy. No `9735` listener was visible on Node A. This may be acceptable if Lightning is hosted elsewhere, but topology is not proven. |
| Firewall | NOT PROVEN | No active firewall proof was captured beyond listener state. |

## Invoice Test

Created one unpaid operator test invoice through BTCPay API.

| Field | Value |
| --- | --- |
| Invoice ID | `HUoNsuTaYpcKkj1eFiMMkN` |
| Amount | `$1.00 USD` |
| Status | `New` |
| Created time | `1782519011` |
| Expiration time | `1782519911` |
| Expiration window | `900 seconds` |
| Payment method endpoint | `200` |
| Active payment method | `BTC-LN` |

The invoice was not paid.

The invoice checkout page contains Lightning/Bitcoin payment UI text, and the invoice payment-method endpoint returned an active Lightning destination. The BOLT11 destination is intentionally not copied into this report.

## Webhook State

Current registered BTCPay webhook:

- `https://api.farpy.com/btcpay/webhook`
- enabled: `true`
- authorized event count: `2`

Route probes:

| Route | Result |
| --- | --- |
| `POST https://api.farpy.com/btcpay/webhook` unsigned | `401 bad_signature` |
| `POST https://farpy.com/node/v1/web-render/btcpay/webhook` unsigned | `404 not_found` |

This means BTCPay is still pointed at the legacy webhook route, not the repaired web-render wallet route from `LIGHTNING_FOUNDATION_REPAIR_V1`.

## API Auth

Observed API permissions:

| API probe | Result |
| --- | --- |
| `GET /api/v1/stores/<store_id>` | `403 missing-permission` |
| `GET /api/v1/stores/<store_id>/payment-methods` | `403 missing-permission` |
| `GET /api/v1/stores/<store_id>/webhooks` | `200` |
| `POST /api/v1/stores/<store_id>/invoices` | `200` |
| `GET /api/v1/stores/<store_id>/invoices/<invoice_id>` | `200` |
| `GET /api/v1/stores/<store_id>/invoices/<invoice_id>/payment-methods` | `200` |

The key is sufficient for invoice creation and invoice-level payment-method proof, but insufficient for full store/payment-method health audit.

## Commands Run

Commands were run read-only except for creating the single unpaid invoice above.

```bash
getent hosts btcpay.farpy.com
curl -I https://btcpay.farpy.com
systemctl list-units --type=service --all --no-pager | grep -Ei 'btcpay|bitcoin|lightning|lnd|nbxplorer|docker|containerd'
docker ps --format '{{.Names}} {{.Image}} {{.Status}} {{.Ports}}'
ss -lntup | grep -E ':80|:443|:9735|:8332|:8333|:28332|:28333|:10009|btcpay|bitcoin|lightning|lnd|nbxplorer'
curl -H 'Authorization: token <redacted>' <btcpay-store-api>
curl -H 'Authorization: token <redacted>' <btcpay-webhooks-api>
curl -X POST -H 'Authorization: token <redacted>' <btcpay-invoices-api>
curl -H 'Authorization: token <redacted>' <btcpay-invoice-payment-methods-api>
```

## Remaining Blockers Before First `$1` Payment

1. Grant or create a BTCPay API key with store-settings/payment-method read permission, or document why invoice-level method checks are sufficient.
2. Identify the actual Lightning backend type: LND, Core Lightning, or BTCPay-managed equivalent.
3. Prove wallet unlocked, chain synced, Lightning synced, and routeability/liquidity for a small receive.
4. Deploy the `LIGHTNING_FOUNDATION_REPAIR_V1` web-render API patch to production.
5. Route/register BTCPay webhook to the repaired route:
   - `https://farpy.com/node/v1/web-render/btcpay/webhook`
6. Confirm unsigned webhook rejects and valid BTCPay webhook is accepted by the repaired route.
7. Perform one operator-approved `$1` payment.
8. Verify exactly one 100-cent credit lands in the authoritative wallet JSONL.
9. Replay the same webhook and verify no duplicate wallet credit.
10. Confirm account history shows the Lightning wallet credit.

## Verdict

LIGHTNING_BACKEND_LIVE_V1 = YELLOW

BTCPay can create an unpaid mainnet Lightning invoice and expose an active `BTC-LN` payment method. The rail is not ready for public use or first paid smoke until webhook routing and backend sync/liquidity proof are complete.
