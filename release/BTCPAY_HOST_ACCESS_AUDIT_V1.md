# BTCPAY_HOST_ACCESS_AUDIT_V1

Status: FAIL / ADMIN VISIBILITY BLOCKED

## Goal

Determine how the production BTCPay server is deployed and identify the administrative path needed to inspect the Lightning backend.

Read-only audit only. No production changes were made.

## Hosting location

Confirmed public host:

```text
btcpay.farpy.com -> 135.181.166.121
farpy.com -> 95.217.226.184
```

Conclusion:

- `btcpay.farpy.com` is not hosted on the Farpy web server.
- It is a separate host/IP from `farpy.com`.
- Exact provider/hypervisor account was not discoverable from current access.
- Treat as a separate VPS/VM until cloud/provider console access proves otherwise.

## Deployment method

Not determined.

Evidence from Farpy web server:

- no local BTCPay systemd service
- no local LND/Core Lightning/LNbits systemd service
- local Docker on `farpy` is inactive
- no local BTCPay/LND/Core Lightning containers visible
- no local `btcpayserver-docker`, `BTCPAYGEN_*`, `lnd.conf`, `lightningd.conf`, or NBXplorer config found for the BTCPay host

Files found on Farpy web server:

```text
/etc/farpy/btcpay.env
/etc/systemd/system/farpy-jobs-api.service.d/btcpay.conf
/etc/systemd/system/farpy-web-render-api.service.d/80-btcpay-env.conf
/opt/farpy-logs/docker-compose.yml
/opt/farpy-web-render/scripts/job-api.mjs.bak.lightning_payment_e2e.20260627T001626Z
/opt/farpy-web-render/scripts/job-api.mjs.bak.lightning_topup_smoke.20260627T004041Z
```

These are Farpy integration files only. They do not describe how `btcpay.farpy.com` itself is deployed.

Local repo search found no deployment repository or BTCPay host config. It found only release/audit notes and Farpy-side API integration references.

## Administrative access checked

### SSH

Attempts from local operator machine and from Farpy production host were made against:

- `root@btcpay.farpy.com`
- `ubuntu@btcpay.farpy.com`
- `btcpay@btcpay.farpy.com`
- `admin@btcpay.farpy.com`
- same users against `135.181.166.121`

Result:

```text
Permission denied (publickey,password)
```

Some attempts also timed out after repeated denied attempts, but no user/key combination provided shell access.

### Docker socket

On the Farpy web server:

```text
docker.service inactive
Cannot connect to Docker daemon
```

No Docker socket for the BTCPay host is available from the Farpy web server.

### BTCPay API

Current Farpy API key can:

- list/read invoices
- read invoice-level payment methods
- create invoices

Current Farpy API key cannot:

- read store settings
- read store payment-method configuration

BTCPay error:

```text
missingPermission=btcpay.store.canviewstoresettings
```

### Hypervisor / cloud console

Not available from this session.

No provider CLI, deployment repository, or cloud account reference was found in the local repo or Farpy production filesystem.

### Portainer / web admin

No Portainer URL or deployment file was found from current access.

BTCPay web admin likely exists at:

```text
https://btcpay.farpy.com
```

But credentials/session were not available in this audit.

## Configuration files requested

Not located from current access:

- `BTCPAYGEN_*` configuration
- `docker-compose.yml` for BTCPay host
- `lnd.conf`
- `lightningd.conf`
- NBXplorer configuration

Reason: those files are expected on `btcpay.farpy.com`, not on `farpy`, and SSH/admin access to the BTCPay host is currently unavailable.

## Why current operators cannot inspect the node

Exact cause:

1. The BTCPay server is hosted on a separate machine at `135.181.166.121`.
2. Available SSH keys/users do not authenticate to that machine.
3. The current BTCPay API key lacks store-settings/payment-method permissions.
4. No hypervisor/cloud console, Docker socket, Portainer, or deployment repository is available from the current operator environment.

Therefore operators can inspect Farpy-side integration and invoice-level BTCPay API output, but cannot inspect the Lightning node configuration, channel state, route-hint settings, or BTCPay deployment method.

## Available admin paths

Currently available:

- Farpy web server root SSH: yes
- Farpy-side BTCPay env: yes
- Farpy-side web-render API service: yes
- BTCPay invoice API: partial
- BTCPay invoice payment-method API: partial

Currently missing:

- SSH to `btcpay.farpy.com`
- BTCPay admin web session
- BTCPay API key with store settings permission
- cloud/hypervisor access for `135.181.166.121`
- deployment repository for BTCPay host
- Docker socket / Portainer access for BTCPay host

## Exact next action required

Provide one of the following:

1. SSH credentials/key for `btcpay.farpy.com` / `135.181.166.121`, or
2. BTCPay admin web credentials plus an API key with `btcpay.store.canviewstoresettings`, or
3. cloud/hypervisor console access for the server at `135.181.166.121`, or
4. the BTCPay deployment repository/runbook containing `BTCPAYGEN_*`, compose files, and Lightning backend config.

After access is provided, run the node config audit on the BTCPay host:

- identify deployment method: `btcpayserver-docker`, Docker Compose, manual, package, appliance, or managed
- identify Lightning backend: LND, Core Lightning, LNbits, Greenlight, Phoenix Server, or other
- inspect `lnd.conf` or `lightningd.conf`
- inspect public/private channel status
- inspect route-hint configuration
- verify invoice route hints against backend configuration

## Commands run

```bash
getent ahosts btcpay.farpy.com
python3 DNS resolution for btcpay.farpy.com and farpy.com
systemctl list-units --type=service --all | grep -Ei 'btcpay|lnd|clightning|core-lightning|lightning|lnbits|docker'
ss -lntup | grep -E ':9735|:10009|btcpay|lnd|lightning'
docker ps --format '{{.Names}} {{.Image}} {{.Status}} {{.Ports}}'
find /etc /opt /var/lib -maxdepth 5 -type f \( -iname '*btcpay*' -o -iname '*lnd*' -o -iname '*lightning*' -o -iname '*nbxplorer*' -o -iname 'docker-compose*.yml' -o -iname 'docker-compose*.yaml' \)
ssh root@btcpay.farpy.com read-only probe
ssh ubuntu@btcpay.farpy.com read-only probe
ssh btcpay@btcpay.farpy.com read-only probe
ssh admin@btcpay.farpy.com read-only probe
rg -n "BTCPAYGEN|btcpayserver-docker|btcpay.farpy.com|lnd.conf|lightningd.conf|NBXplorer|docker-compose|LunaNode|Umbrel|Start9|Greenlight|LNbits" .
```

## Verdict

FAIL

BTCPay host administrative visibility is not currently available. The exact deployment method and Lightning node configuration cannot be determined until one of the missing admin paths is provided.