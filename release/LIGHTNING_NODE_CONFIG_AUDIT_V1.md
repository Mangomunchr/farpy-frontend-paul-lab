# LIGHTNING_NODE_CONFIG_AUDIT_V1

Status: FAIL / NODE-CONFIG ROOT CAUSE BLOCKED BY ACCESS

## Scope

Read-only audit of the BTCPay / Lightning node configuration behind `btcpay.farpy.com`.

No production configuration was changed.

## Confirmed production topology

Farpy web-render API points to:

```text
BTCPAY_URL=https://btcpay.farpy.com
```

The Farpy web server itself is not the Lightning node:

- no local BTCPay service found on `farpy`
- no local LND/Core Lightning/LNbits service found on `farpy`
- Docker inactive on `farpy`
- no local Lightning listener on `farpy`

BTCPay host:

```text
btcpay.farpy.com -> 135.181.166.121
```

## Access result

Direct SSH to the BTCPay host was attempted with available keys/users:

- `root`
- `ubuntu`
- `btcpay`
- `admin`

Result:

```text
Permission denied (publickey,password)
```

Therefore direct node inspection could not be completed from this session.

## BTCPay API permission result

The configured Farpy BTCPay API key can read invoices and invoice payment methods, but cannot read store payment-method settings.

Store settings endpoint result:

```text
HTTP 403
missingPermission=btcpay.store.canviewstoresettings
```

Because of that, this audit could not verify:

- BTCPay version
- Lightning implementation type: LND / Core Lightning / LNbits / Greenlight / other
- node alias
- advertised addresses
- `externalip` / `announce-addr`
- Tor-only config
- route-hint store setting
- backend wallet/channel configuration through BTCPay settings

## Invoice inspected

Recent invoice:

```text
invoice_id=SWb6nMiqsTcSJ9Y6pcay1z
status=New
amount=1.00 USD
payment method=BTC-LN
activated=True
```

Invoice payment-method endpoint:

```text
GET /api/v1/stores/<store_id>/invoices/SWb6nMiqsTcSJ9Y6pcay1z/payment-methods
HTTP 200
paymentMethodId=BTC-LN
activated=True
destination=lnbc...
paymentLink=lightning:lnbc...
```

## BOLT11 decode summary

The generated BOLT11 invoice was decoded from the BTCPay checkout page.

```text
hrp=lnbc16700n
amount_part=16700n
expiry_seconds=899
min_final_cltv=18
payment_hash=present
route_hint_tag_count=0
explicit_destination_pubkey_tag=missing
```

Checkout page contained three BOLT11 instances for the invoice, and all lacked route-hint markers:

```text
bolt11_count=3
bolt11_1_length=301 contains_route_hint_tag_string=False
bolt11_2_length=301 contains_route_hint_tag_string=False
bolt11_3_length=301 contains_route_hint_tag_string=False
```

## Network reachability evidence

From Farpy production host:

```text
btcpay.farpy.com:9735 open
btcpay.farpy.com checkout page reachable
```

This proves a public Lightning TCP port is reachable from Farpy, but does not prove the invoice destination node is announced/reachable in the Lightning graph or that its receiving channels are public.

## Required LND/Core Lightning checks not completed

Blocked by missing BTCPay host access.

For LND, still required:

```bash
lncli getinfo
lncli listchannels
lncli pendingchannels
lncli walletbalance
lncli channelbalance
lncli forwardinghistory
lncli listpeers
```

For Core Lightning, still required:

```bash
lightning-cli getinfo
lightning-cli listfunds
lightning-cli listpeers
lightning-cli listchannels
lightning-cli bkpr-channelsapy
```

Also required from config files:

- public/private channel config
- `externalip` / `tlsextraip` / `listen` / `nat` for LND, if LND
- `announce-addr` / bind address for Core Lightning, if Core Lightning
- Tor-only state
- route-hints/private-channel invoice setting

## Root cause

Exact node-level root cause is not fully provable without BTCPay host or store-settings access.

What is proven:

```text
BTCPay is emitting BTC-LN invoices without route hints.
```

That is incompatible with the observed wallet error:

```text
This invoice was created by a private node that can't be reached... RouteHints required.
```

Therefore current failure class is:

```text
FAIL: Lightning backend/BTCPay config emits an unreachable BOLT11 invoice with no route hints.
```

Most likely root-cause families, not yet distinguished:

1. receiving channel is private and route hints are disabled/not generated
2. Lightning backend node is not properly announced in the graph
3. BTCPay is connected to a private/unannounced backend and not adding hints
4. public port exists, but node/channel graph data is not reachable to paying wallets

## Single configuration fix

No single configuration change can be safely identified from available evidence.

Do not change production yet.

Required next access:

1. SSH access to `btcpay.farpy.com`, or
2. BTCPay API key with `btcpay.store.canviewstoresettings`, plus Lightning node admin access.

Once access is available, inspect the Lightning backend and either:

- enable route hints for private channels, or
- make the receiving node/channel publicly announced and reachable, depending on what `getinfo` / channel inspection proves.

## PASS / FAIL

FAIL

Invoices omit route hints, and node configuration could not be directly audited due missing host/settings access.