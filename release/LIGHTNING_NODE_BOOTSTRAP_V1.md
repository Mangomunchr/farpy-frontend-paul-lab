# LIGHTNING_NODE_BOOTSTRAP_V1

STATUS: RED

## Summary

Farpy app/wallet/frontend changes were not touched. The remaining blocker is Lightning node bootstrap on the BTCPay host.

Confirmed by operator-provided evidence:

- Core Lightning is the backend.
- `num_peers=0`
- `num_active_channels=0`
- `num_pending_channels=0`
- `listchannels=[]`
- `listfunds.outputs=[]`
- `listfunds.channels=[]`
- Node is publicly announced.
- Port `9735` is reachable.
- Core Lightning is healthy.

Root cause:

- The node has zero Lightning liquidity/connectivity.
- It has no peers, no channels, no pending channels, and no on-chain wallet outputs.
- Generated Lightning invoices cannot be paid because there are no channels capable of forwarding payments.

## Access Status

Attempted SSH access to BTCPay host `135.181.166.121`:

- `root@135.181.166.121` -> permission denied
- `ubuntu@135.181.166.121` -> permission denied
- `debian@135.181.166.121` -> permission denied
- `btcpay@135.181.166.121` -> permission denied
- `admin@135.181.166.121` -> permission denied

Because SSH/admin access is unavailable from this operator environment, no channel-open command was executed.

## Read-Only Commands Attempted

```powershell
ssh -o BatchMode=yes -o StrictHostKeyChecking=accept-new -o ConnectTimeout=8 root@135.181.166.121 "hostname; whoami; pwd; command -v lightning-cli || true; command -v bitcoin-cli || true; docker ps --format '{{.Names}}' 2>/dev/null | head -20"
ssh -o BatchMode=yes -o StrictHostKeyChecking=accept-new -o ConnectTimeout=8 ubuntu@135.181.166.121 "hostname; whoami; pwd; command -v lightning-cli || true; command -v bitcoin-cli || true; docker ps --format '{{.Names}}' 2>/dev/null | head -20"
ssh -o BatchMode=yes -o StrictHostKeyChecking=accept-new -o ConnectTimeout=8 debian@135.181.166.121 "hostname; whoami; pwd; command -v lightning-cli || true; command -v bitcoin-cli || true; docker ps --format '{{.Names}}' 2>/dev/null | head -20"
ssh -o BatchMode=yes -o StrictHostKeyChecking=accept-new -o ConnectTimeout=8 btcpay@135.181.166.121 "hostname; whoami; pwd; command -v lightning-cli || true; command -v bitcoin-cli || true; docker ps --format '{{.Names}}' 2>/dev/null | head -20"
ssh -o BatchMode=yes -o StrictHostKeyChecking=accept-new -o ConnectTimeout=8 admin@135.181.166.121 "hostname; whoami; pwd; command -v lightning-cli || true; command -v bitcoin-cli || true; docker ps --format '{{.Names}}' 2>/dev/null | head -20"
```

## Required Bootstrap Commands

Run these on the BTCPay/Core Lightning host once admin SSH access is available.

### 1. Verify Core Lightning state

Native install:

```bash
lightning-cli getinfo
lightning-cli listfunds
lightning-cli listpeers
lightning-cli listchannels
```

Docker install:

```bash
docker ps --format '{{.Names}}'
docker exec -it btcpayserver_clightning_bitcoin lightning-cli getinfo
docker exec -it btcpayserver_clightning_bitcoin lightning-cli listfunds
docker exec -it btcpayserver_clightning_bitcoin lightning-cli listpeers
docker exec -it btcpayserver_clightning_bitcoin lightning-cli listchannels
```

### 2. Verify Bitcoin wallet/on-chain balance

Native install:

```bash
bitcoin-cli getblockchaininfo
bitcoin-cli getwalletinfo
bitcoin-cli getbalances
bitcoin-cli listunspent
```

Docker install:

```bash
docker exec -it btcpayserver_bitcoind bitcoin-cli getblockchaininfo
docker exec -it btcpayserver_bitcoind bitcoin-cli getwalletinfo
docker exec -it btcpayserver_bitcoind bitcoin-cli getbalances
docker exec -it btcpayserver_bitcoind bitcoin-cli listunspent
```

### 3. If no on-chain funds

Required BTC to bootstrap:

- Minimum practical first public channel: `0.003 BTC` to `0.005 BTC`.
- Better for reliable small top-ups: `0.01 BTC`.
- Also reserve miner fee balance.

Generate an on-chain address:

Native:

```bash
lightning-cli newaddr bech32
```

Docker:

```bash
docker exec -it btcpayserver_clightning_bitcoin lightning-cli newaddr bech32
```

Fund that address, wait for confirmations, then rerun `listfunds`.

### 4. If funded, connect to reputable public node

Pick one reputable public node and verify its current pubkey/address from the operator's trusted source before connecting. Do not paste stale pubkeys from random notes.

Command shape:

```bash
lightning-cli connect <node_pubkey>@<host>:9735
lightning-cli fundchannel <node_pubkey> <sats>
```

Docker shape:

```bash
docker exec -it btcpayserver_clightning_bitcoin lightning-cli connect <node_pubkey>@<host>:9735
docker exec -it btcpayserver_clightning_bitcoin lightning-cli fundchannel <node_pubkey> <sats>
```

Suggested first channel size:

- `300000` sats minimum
- `500000` sats preferred
- `1000000` sats if available

After broadcasting:

```bash
lightning-cli listfunds
lightning-cli listpeers
```

Wait for confirmations until:

- `num_active_channels > 0`
- `listfunds.channels` contains an active channel

## Rollback

Before confirmation:

- If the channel open transaction has not been broadcast, stop before `fundchannel`.

After broadcast:

- Do not force-close unless absolutely necessary.
- If the wrong peer was selected, wait until channel is active, then cooperative close:

```bash
lightning-cli close <channel_id>
```

Docker:

```bash
docker exec -it btcpayserver_clightning_bitcoin lightning-cli close <channel_id>
```

## Validation Gate

Lightning must remain disabled publicly until all validation passes.

Required validation:

1. Generate a new BTCPay invoice.
2. Decode BOLT11.
3. Confirm either:
   - `route_hint_tag_count > 0`, or
   - the node is publicly routable through active public channels.
4. Pay invoice from an external wallet.
5. Confirm BTCPay marks invoice settled.
6. Confirm Farpy webhook fires.
7. Confirm exactly one wallet credit occurs.
8. Replay webhook.
9. Confirm no duplicate credit.

## Final State

RED: unable to bootstrap from this environment because BTCPay host SSH/admin access is unavailable. No Farpy frontend, wallet, webhook, or application logic changes were made.
