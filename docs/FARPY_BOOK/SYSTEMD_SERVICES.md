# Systemd Services

Status: source-controlled service map from sanitized production evidence.

Purpose: document launch-critical Farpy systemd services and provide sanitized unit templates without storing secrets.

Template directory: `infra/systemd/`

## Source

Read-only production inspection on 2026-06-30:

- `systemctl list-unit-files 'farpy*' 'caddy*'`
- `systemctl list-units 'farpy*' 'caddy*' --all`
- `systemctl cat` for selected launch-critical units
- `/etc/systemd/system/*.service.d/*.conf` paths were enumerated, not copied verbatim when secret-bearing.

No production units were changed. No services were restarted.

## Template Policy

- Templates are not drop-in production replacements.
- Secret values must live in protected files under `/etc/farpy/`.
- Prefer `EnvironmentFile=` over inline `Environment=` for anything sensitive.
- Validate generated units with `systemd-analyze verify`.
- Back up `/etc/systemd/system` before deployment.
- Keep production-only emergency or historical units out of the template set unless they become launch-critical.

## Launch-Critical Services

| Area | Unit template | Production role | Secret boundary |
| --- | --- | --- | --- |
| Reverse proxy | `caddy.service.template` | Serves public sites and reverse-proxies APIs. | `/etc/farpy/nm-metrics.env` if metrics are enabled. |
| Auth | `farpy-auth.service.template` | Google OAuth, sessions, magic-link/email auth. | `/opt/farpy/config/google-auth.env`, `/etc/farpy/auth-secrets.env`, SMTP env. |
| Checkout/top-up | `farpy-checkout-api.service.template` | Card checkout/account payment path. | `/etc/farpy/stripe.env`, `/etc/farpy/checkout.env`. |
| Upload | `farpy-upload-api.service.template` | Render package upload endpoint. | `/etc/farpy/secrets.env`, `/etc/farpy/upload.env`. |
| Jobs API | `farpy-jobs-api.service.template` | Legacy jobs/default API boundary. | `/etc/farpy/jobs-api.env`, `/etc/farpy/btcpay.env`, Redis env. |
| Web-render API | `farpy-web-render-api.service.template` | Customer render submit/status/receipt/download/API path. | `/etc/farpy/web-render-api-secrets.env`, Stripe, BTCPay env. |
| Stripe webhook | `farpy-stripe-webhook.service.template` | Stripe webhook processing and wallet credit path. | `/etc/farpy/stripe.env`, wallet env. |
| Node pairing | `farpy-node-pair.service.template` | NodeMuncher pairing API. | `/etc/farpy/node-pair.env`. |
| Node API | `farpy-node-api.service.template` | NodeMuncher heartbeat/lease/control compatibility surface. | `/etc/farpy/node-api.env`, Stripe env if needed. |
| Leaderboard | `farpy-leaderboard.service.template` | Benchmark public leaderboard API. | `/etc/farpy/leaderboard.env`. |
| Public API adapter | `farpy-public-api-adapter.service.template` | Public read API adapter. | `/etc/farpy/public-api-adapter.env`. |
| Ops HTTP | `farpy-ops-http.service.template` | Localhost-only internal ops file server. | none in template. |

## Timers

| Timer template | Purpose |
| --- | --- |
| `farpy-funnel-report.timer.template` | Hourly funnel report generation. |
| `farpy-status-json.timer.template` | Frequent public/internal status JSON generation. |
| `farpy-web-backup.timer.template` | Daily web backup job. |

## Caddy Drop-Ins

| Drop-in template | Purpose |
| --- | --- |
| `caddy.service.d/20-nm-metrics-env.conf.template` | Optional metrics environment file. |
| `caddy.service.d/30-smoke.conf.template` | Optional post-start smoke command. |

## Web-Render Drop-Ins

| Drop-in template | Purpose |
| --- | --- |
| `farpy-web-render-api.service.d/70-ops-token.conf.template` | Loads protected ops/worker token env file. |
| `farpy-web-render-api.service.d/80-btcpay-env.conf.template` | Loads protected BTCPay env file. |

## Production Caveats

Production currently contains many static, historical, masked, disabled, and one-shot Farpy units. They were not all source-controlled here because most are not part of the minimal launch recovery path.

Notable caveats:

- Some production service drop-ins still contain inline `Environment=` entries. Templates intentionally model the safer `EnvironmentFile=` pattern.
- `farpy-render-worker.service` exists on Node A but has Node A render-forbidden drop-ins; render execution belongs on approved worker nodes.
- `farpy-web-render-worker.service` exists on Node A with no-restart/forbidden drop-ins; PR/remote workers have their own install profile.
- Payout units are mostly masked/deferred and are not templated for retail alpha.
- Generated status/audit artifacts are controlled by timers and static deploy behavior; deployment must preserve or regenerate them.

## Restore Order

1. Restore `/etc/farpy` env files with `600 root:root` permissions.
2. Restore Caddy config and `caddy.service`.
3. Restore auth and checkout services.
4. Restore upload/jobs/web-render APIs.
5. Restore webhook services.
6. Restore NodeMuncher pair/node APIs.
7. Restore leaderboard/public API adapter.
8. Restore status/reporting/backup timers.
9. Run health and route smoke checks before accepting customer traffic.

## Validation Commands

```bash
systemd-analyze verify /etc/systemd/system/caddy.service
systemd-analyze verify /etc/systemd/system/farpy-auth.service
systemd-analyze verify /etc/systemd/system/farpy-checkout-api.service
systemd-analyze verify /etc/systemd/system/farpy-upload-api.service
systemd-analyze verify /etc/systemd/system/farpy-jobs-api.service
systemd-analyze verify /etc/systemd/system/farpy-web-render-api.service
systemctl status caddy farpy-auth farpy-checkout-api farpy-upload-api farpy-jobs-api farpy-web-render-api --no-pager
systemctl list-timers 'farpy-*' --no-pager
```

