# ETC_FARPY_PERMISSION_FIX_V1

Status: PASS

## Objective

Fix secret-like `/etc/farpy` files that were mode `0644`.

## Source Evidence

Used `production-drift-guard-v1` evidence. The guard flagged four secret-like files as not `0600`.

No secret values were printed.

## Files Changed On Production

Permissions only:

| Path | Before | After | Owner |
| --- | --- | --- | --- |
| `/etc/farpy/farpy.env.bak.20251227T145610Z` | `0644` | `0600` | `root:root` |
| `/etc/farpy/systemd-secret-move-backups-20260628T201245Z/50-worker-token.conf` | `0644` | `0600` | `root:root` |
| `/etc/farpy/systemd-secret-move-backups-20260628T201245Z/env.conf` | `0644` | `0600` | `root:root` |
| `/etc/farpy/worker.env.nodeid.1777580359` | `0644` | `0600` | `root:root` |

No ownership changes. No content edits.

## Why Secret-Like

The filenames indicate environment, worker, token, or systemd secret-backup material. They should not be group/world-readable.

## Commands Run

```powershell
ssh root@farpy.com "stat -c 'BEFORE %n %a %U:%G %s' <four flagged paths>"
ssh root@farpy.com "chmod 600 <four flagged paths> && stat -c 'AFTER %n %a %U:%G %s' <four flagged paths>"
powershell -NoProfile -ExecutionPolicy Bypass -File C:\Users\danki\Desktop\farpy-frontend\scripts\production-drift-guard-v1.ps1 -OutputPath C:\tmp\production-drift-guard-v1-after-etc-permission-fix.json
ssh root@farpy.com "systemctl is-active caddy farpy-auth farpy-checkout-api farpy-upload-api farpy-jobs-api farpy-web-render-api farpy-stripe-webhook farpy-node-pair farpy-node-api farpy-leaderboard farpy-public-api-adapter --no-pager"
```

## Verification

After chmod:

- all four files are `0600 root:root`
- critical services remained `active`
- no restarts were performed
- no secret values were printed

Drift guard after fix:

- `VERDICT=YELLOW`
- `PASS_COUNT=10`
- `WARN_COUNT=1`
- `FAIL_COUNT=0`
- `SKIP_COUNT=0`

Resolved check:

- `etc_farpy_secret_permissions | PASS | Secret-like production files are 0600.`

Remaining warning:

- local `out` sample hashes differ from production for:
  - `index.html`
  - `downloads/Farpy-Blender-Addon-unified.zip`
  - `downloads/Farpy-Blender-Addon-unified.zip.sha256`

This warning is unrelated to `/etc/farpy` permissions.

## Evidence

- `C:\tmp\production-drift-guard-v1-after-etc-permission-fix.json`

## Result

PASS. The flagged secret-like files are no longer `0644`, services remain healthy, and `production-drift-guard-v1` no longer fails on this issue.
