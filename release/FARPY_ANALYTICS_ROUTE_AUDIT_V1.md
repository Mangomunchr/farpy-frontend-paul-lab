# FARPY_ANALYTICS_ROUTE_AUDIT_V1

Date: 2026-06-28

## Root Cause

- `/funnel-event` is an intended legacy analytics collector route in active Caddy, but the collector process was stale/orphaned on `127.0.0.1:19181` and returned parser errors instead of a stable success response.
- Current frontend analytics no longer calls `/funnel-event`; it uses centralized GA4 page views plus optional Firehose via `NEXT_PUBLIC_FIREHOSE_URL`.
- `/real` is no longer referenced by active frontend, auth, web-render API, or generated static output. Google OAuth uses `/auth/google?next=...` and no longer redirects to `/real`.
- `project-status` 404s are not referenced by current source or generated static output; observed requests are stale external/browser cache traffic.
- `robots.txt` exists and returns 200.
- Apple touch icon was missing from static assets and metadata.

## Route Classification

| Reference | Current State | Classification | Action |
| --- | --- | --- | --- |
| `/funnel-event` | Active Caddy route to `127.0.0.1:19181` | Active legacy analytics | Restored collector 200 responses and restarted service |
| `/real` / `/real/` | No active app/auth/static callers; live route returns 404 | Dead legacy | No caller remains; Google OAuth verified away from `/real` |
| `/real-upload` | Active Caddy legacy upload route | Legacy, outside this task | Left unchanged |
| `/real-submit` | Active Caddy legacy submit route | Legacy, outside this task | Left unchanged |
| `project-status` | No current source/static callers; live unknown status paths return 404 | Stale external/cache traffic | No app change |

## Files Changed

- `/opt/farpy/funnel_event_collector.py`
- `src/app/layout.tsx`
- `public/apple-touch-icon.png`
- `release/FARPY_ANALYTICS_ROUTE_AUDIT_V1.md`

## Deployment Commands

```bash
cp /opt/farpy/funnel_event_collector.py /opt/farpy/funnel_event_collector.py.bak.analytics_route_audit.TIMESTAMP
scp C:\tmp\funnel_event_collector.py root@farpy.com:/tmp/funnel_event_collector.py
cp /tmp/funnel_event_collector.py /opt/farpy/funnel_event_collector.py
python3 -m py_compile /opt/farpy/funnel_event_collector.py
fuser -k 19181/tcp || true
systemctl reset-failed farpy-funnel-event.service
systemctl start farpy-funnel-event.service
npm.cmd run build
tar -czf C:\tmp\farpy-analytics-route-audit-out.tar.gz -C out .
scp C:\tmp\farpy-analytics-route-audit-out.tar.gz root@farpy.com:/tmp/farpy-analytics-route-audit-out.tar.gz
cp -a /opt/farpy.com/out /opt/farpy.com/out.bak.analytics_route_audit.TIMESTAMP
tar -xzf /tmp/farpy-analytics-route-audit-out.tar.gz -C /opt/farpy.com/out
```

## Smoke Tests

- `POST https://farpy.com/funnel-event` returns `200 {"ok":true}`.
- `HEAD https://farpy.com/funnel-event` returns `200`.
- `GET https://farpy.com/robots.txt` returns `200`.
- `GET https://farpy.com/apple-touch-icon.png` returns `200` after deploy.
- `GET https://farpy.com/auth/google?next=%2Faccount` returns `302` to Google and does not include `/real`.
- `GET https://farpy.com/real` and `/real/` return `404`; no active caller remains.
- `GET https://farpy.com/project-status/PROJ-DOES-NOT-EXIST.json` returns `404`; no active caller remains.

## Rollback Plan

```bash
cp /opt/farpy/funnel_event_collector.py.bak.analytics_route_audit.TIMESTAMP /opt/farpy/funnel_event_collector.py
python3 -m py_compile /opt/farpy/funnel_event_collector.py
systemctl restart farpy-funnel-event.service
rm -rf /opt/farpy.com/out
cp -a /opt/farpy.com/out.bak.analytics_route_audit.TIMESTAMP /opt/farpy.com/out
```
