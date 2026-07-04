# LIGHTNING_ROUTE_HINT_AUDIT_V1

Status: FAIL

## Observed user-facing failure

Wallet payment attempt reports:

```text
This invoice was created by a private node that can't be reached... RouteHints required.
```

## Infrastructure checked

Production web server:

- Host: `farpy`
- BTCPay URL configured for Farpy web-render API: `https://btcpay.farpy.com`
- BTCPay DNS target observed: `135.181.166.121`
- BTCPay web checkout route tested: `HTTP 200` for a recent invoice checkout page
- Farpy web-render API has `BTCPAY_*` runtime variables loaded after `LIGHTNING_RUNTIME_CONFIG_ENABLE_V1`

Local Farpy web server is not the Lightning node:

- No local BTCPay service detected through systemd on `farpy`
- No local LND/Core Lightning/LNbits service detected through systemd on `farpy`
- Docker inactive on `farpy`
- No local Lightning listener on `farpy`

BTCPay host SSH:

- `root@btcpay.farpy.com` is reachable but denied by authentication.
- Backend internals could not be audited from this session.

## Lightning backend identity

Result: UNKNOWN / BLOCKED

The available Farpy API key can list invoices but does not have BTCPay store-settings permission. The BTCPay API returned:

```text
missingPermission=btcpay.store.canviewstoresettings
permission=btcpay.store.canviewstoresettings
```

Because of that, this audit could not verify from BTCPay API:

- backend type: LND / Core Lightning / Greenlight / Phoenix Server / LNbits / other
- wallet unlocked
- chain sync
- graph sync
- peers
- active channels
- inbound liquidity
- private/public channel counts
- advertised node addresses
- RouteHints setting in backend/store configuration

## Public reachability checks

From Farpy production server to `btcpay.farpy.com`:

```text
BTCPay checkout page: HTTP 200
Lightning port 9735: open
```

This suggests the host has a public Lightning port, but it does not prove the invoice destination/channel is reachable to the paying wallet.

## Recent invoice inspected

Recent BTCPay invoice selected from invoice list:

```text
invoice_id=SWb6nMiqsTcSJ9Y6pcay1z
status=New
amount=1.00
currency=USD
has_lightning=True
```

Checkout page scan:

```text
bolt11_count=3
bolt11_1_length=301 contains_route_hint_tag_string=False
bolt11_2_length=301 contains_route_hint_tag_string=False
bolt11_3_length=301 contains_route_hint_tag_string=False
```

Decoded first BOLT11 summary:

```text
hrp=lnbc16700n
amount_part=16700n
expiry_seconds=899
min_final_cltv=18
route_hint_tag_count=0
payment_hash=present
explicit_destination_pubkey_tag=missing
```

## Route-hint conclusion

FAIL

The generated BTC-LN invoice does not contain route hints.

This matches the wallet error. If the receiving node is private or depends on private channels, route hints are required and are not present in the BOLT11 invoice currently served by BTCPay.

## Likely root cause category

Exact root cause cannot be fully proven without BTCPay host access or a stronger BTCPay API key, but current evidence supports one of these configuration failures:

- private channels without invoice route hints
- BTCPay / Lightning backend not configured to include private route hints
- wallet/node advertised identity mismatch
- public node port exists, but the invoice destination/channel graph is not reachable to the paying wallet

Not proven from this session:

- no inbound liquidity
- wallet locked
- chain not synced
- graph not synced
- Tor-only node
- BTCPay stripping hints

## PASS/FAIL output

FAIL

Lightning backend generated an unreachable invoice because the public checkout BOLT11 contains no route hints while the paying wallet reports the receiving node is private/unreachable.

## Commands run

```bash
systemctl list-units --type=service --all | grep -Ei 'btcpay|lnd|clightning|core-lightning|lightning|lnbits|docker'
ss -lntup | grep -E ':9735|:10009|btcpay|lnd|lightning'
docker ps --format '{{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}'
find /etc /opt /var/lib -maxdepth 4 -type f \( -iname '*btcpay*' -o -iname '*lnd*' -o -iname '*lightning*' -o -iname '*clightning*' -o -iname '*lnbits*' \)
curl -4 -sS -m 20 https://btcpay.farpy.com/i/SWb6nMiqsTcSJ9Y6pcay1z
python3 BOLT11 checkout scanner against `/tmp/btcpay_checkout.html`
ssh root@btcpay.farpy.com read-only probe
```

## Required next access to finish root-cause proof

One of these is required:

1. SSH access to `btcpay.farpy.com`, or
2. BTCPay API key with store-settings permission, plus Lightning-node management access.

Then verify:

- backend type
- node pubkey and alias
- advertised addresses
- wallet unlock state
- chain sync
- graph sync
- peers
- channels
- inbound/outbound capacity
- private/public channel counts
- route-hints setting
- whether BTCPay is generating invoices from the expected Lightning backend