# SYSTEMD_TEMPLATE_SOURCE_CONTROL_V1

Status: PASS

## Objective

Create sanitized source-controlled systemd unit/drop-in templates from production without secrets, restarts, or production changes.

## Files Changed

- `infra/systemd/README.md`
- `infra/systemd/caddy.service.template`
- `infra/systemd/caddy.service.d/20-nm-metrics-env.conf.template`
- `infra/systemd/caddy.service.d/30-smoke.conf.template`
- `infra/systemd/farpy-auth.service.template`
- `infra/systemd/farpy-auth.service.d/90-secret-env.conf.template`
- `infra/systemd/farpy-checkout-api.service.template`
- `infra/systemd/farpy-upload-api.service.template`
- `infra/systemd/farpy-jobs-api.service.template`
- `infra/systemd/farpy-jobs-api.service.d/btcpay.conf.template`
- `infra/systemd/farpy-jobs-api.service.d/restart.conf.template`
- `infra/systemd/farpy-web-render-api.service.template`
- `infra/systemd/farpy-web-render-api.service.d/70-ops-token.conf.template`
- `infra/systemd/farpy-web-render-api.service.d/80-btcpay-env.conf.template`
- `infra/systemd/farpy-stripe-webhook.service.template`
- `infra/systemd/farpy-node-pair.service.template`
- `infra/systemd/farpy-node-api.service.template`
- `infra/systemd/farpy-leaderboard.service.template`
- `infra/systemd/farpy-public-api-adapter.service.template`
- `infra/systemd/farpy-ops-http.service.template`
- `infra/systemd/farpy-funnel-report.service.template`
- `infra/systemd/farpy-funnel-report.timer.template`
- `infra/systemd/farpy-status-json.service.template`
- `infra/systemd/farpy-status-json.timer.template`
- `infra/systemd/farpy-web-backup.service.template`
- `infra/systemd/farpy-web-backup.timer.template`
- `docs/FARPY_BOOK/SYSTEMD_SERVICES.md`
- `release/SYSTEMD_TEMPLATE_SOURCE_CONTROL_V1.md`

## Production Evidence Used

Read-only inspection of:

- Farpy and Caddy unit lists
- selected launch-critical `systemctl cat` output
- service/drop-in file paths under `/etc/systemd/system`

Included service families:

- Caddy and Caddy drop-ins
- auth
- checkout/top-up
- upload/jobs
- web-render API
- Stripe webhook
- NodeMuncher pair/node API
- leaderboard/public API
- ops/status/funnel/backup timers

## Commands Run

```powershell
ssh root@farpy.com "systemctl list-unit-files 'farpy*' 'caddy*' --no-pager --no-legend"
ssh root@farpy.com "systemctl list-units 'farpy*' 'caddy*' --all --no-pager --no-legend"
ssh root@farpy.com "find /etc/systemd/system ..."
ssh root@farpy.com "systemctl cat <selected launch-critical units with redaction>"
New-Item -ItemType Directory -Force -Path C:\Users\danki\Desktop\farpy-frontend\infra\systemd,...
```

## Sanitization

- No secret values were copied.
- Inline production `Environment=` values were replaced with `EnvironmentFile=` placeholders where appropriate.
- Token, key, password, Stripe, BTCPay, auth, SMTP, and private config values are documented only as env file boundaries.
- Templates are not exact production replacements.

## Production Changes

None.

No service was restarted. No unit was modified on production.

## Result

PASS. Sanitized systemd unit/drop-in templates and the Farpy Book service map now exist in source control.
