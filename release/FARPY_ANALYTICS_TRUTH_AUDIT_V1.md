# FARPY_ANALYTICS_TRUTH_AUDIT_V1

Date: 2026-06-28

## Root Cause

`farpy-funnel-report` was pointed at `/var/log/farpy/access.log`, but Caddy was not actively writing access logs to that file. The file was stale from `2026-06-12`, so the hourly funnel dashboard was structurally healthy but not reading real live production traffic.

The active Caddy service was running from `/etc/caddy/caddy.real.json` with stdout to journald and no access-log writer configured in the JSON. Journald contained Caddy operational logs, not complete access analytics suitable for the funnel report.

## Fix

Enabled Caddy JSON access logging to the existing report source:

- Active log: `/var/log/farpy/access.log`
- Logger name: `accessfile`
- Encoder: JSON
- Caddy server: `srv0`

Preserved the existing report format and output paths:

- `/opt/farpy/reports/funnel-latest.json`
- `/opt/farpy/reports/funnel-latest.txt`

Tightened the existing report filter so all `/node` and `/node/*` traffic is excluded, including nested worker routes such as `/node/v1/web-render/node/v1/worker/claim`.

## Files Changed

Production:

- `/etc/caddy/caddy.real.json`
- `/usr/local/bin/farpy-funnel-report`
- `/opt/farpy/reports/funnel-latest.json`
- `/opt/farpy/reports/funnel-latest.txt`

Repo documentation:

- `release/FARPY_ANALYTICS_TRUTH_AUDIT_V1.md`

## Backups

- `/etc/caddy/caddy.real.json.bak.analytics_truth.20260628T020430Z`
- `/usr/local/bin/farpy-funnel-report.bak.analytics_truth.20260628T020849Z`

## Commands Run

```bash
systemctl cat caddy --no-pager
journalctl -u caddy --no-pager -n 80
caddy adapt --config /tmp/caddy-log-shape.Caddyfile --pretty
cp /etc/caddy/caddy.real.json /etc/caddy/caddy.real.json.bak.analytics_truth.TIMESTAMP
chattr -i /etc/caddy/caddy.real.json
python3 /tmp/patch_caddy_access_log.py
caddy validate --config /etc/caddy/caddy.real.json
systemctl restart caddy
chattr +i /etc/caddy/caddy.real.json
curl https://farpy.com/?audit=truth-audit-...
curl https://farpy.com/account?audit=truth-audit-...
curl https://farpy.com/auth/me?audit=truth-audit-...
tail -100 /var/log/farpy/access.log | grep truth-audit
cp /usr/local/bin/farpy-funnel-report /usr/local/bin/farpy-funnel-report.bak.analytics_truth.TIMESTAMP
bash -n /usr/local/bin/farpy-funnel-report
/usr/bin/time -f "elapsed=%e" /usr/local/bin/farpy-funnel-report
systemctl is-active farpy-funnel-report.timer
```

## Smoke Tests

Live request marker: `truth-audit-1782612544`

Observed in `/var/log/farpy/access.log`:

- `GET /?audit=truth-audit-1782612544` -> `200`
- `GET /account?audit=truth-audit-1782612544` -> `200`
- `GET /auth/me?audit=truth-audit-1782612544` -> `200`

Report rerun:

```text
Visitors: 16
Homepage: 18 visits / 12 unique
Signin: 0
Account: 9
Topups: 7
Uploads: 0
Jobs: 0
Receipts: 14
Downloads: 2
404: 18
500: 0
```

Runtime:

```text
elapsed=0.67
```

Timer:

```text
systemctl is-active farpy-funnel-report.timer -> active
farpy-funnel-report.service Result=success ExecMainStatus=0
```

Production traffic check:

```text
GET https://farpy.com/ -> 200
caddy.service -> active
```

## Log Rotation

Existing `/etc/logrotate.d/farpy` covers `/var/log/farpy/*.log` daily with `copytruncate`, so `/var/log/farpy/access.log` is included.

## Rollback Plan

```bash
chattr -i /etc/caddy/caddy.real.json
cp /etc/caddy/caddy.real.json.bak.analytics_truth.20260628T020430Z /etc/caddy/caddy.real.json
caddy validate --config /etc/caddy/caddy.real.json
systemctl restart caddy
chattr +i /etc/caddy/caddy.real.json
cp /usr/local/bin/farpy-funnel-report.bak.analytics_truth.20260628T020849Z /usr/local/bin/farpy-funnel-report
chmod 0755 /usr/local/bin/farpy-funnel-report
/usr/local/bin/farpy-funnel-report
```

## Final Status

FARPY_ANALYTICS_TRUTH_AUDIT_V1 = GREEN