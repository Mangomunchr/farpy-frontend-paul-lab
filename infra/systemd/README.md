# Farpy systemd templates

Status: sanitized templates only.

These files document the production service shape without storing secrets.

Rules:

- Do not paste production secret values into this directory.
- Use `EnvironmentFile=` for secrets and host-specific runtime configuration.
- Validate rendered units with `systemd-analyze verify` before deployment.
- Deploy with an explicit backup of `/etc/systemd/system`.
- Restart services only during an approved deploy window.

Production has many historical, static, masked, and one-shot Farpy units. This directory keeps templates for launch-critical service families only:

- Caddy
- auth
- checkout/top-up
- upload/jobs
- web-render API
- Stripe webhook
- NodeMuncher pair/node API
- leaderboard/public API
- ops/status/reporting timers
- backup timer

