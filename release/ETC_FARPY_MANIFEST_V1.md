# ETC_FARPY_MANIFEST_V1

Status: PASS

## Objective

Create a manifest for `/etc/farpy` without printing secret values.

## Files Changed

- `docs/FARPY_BOOK/ETC_FARPY_MANIFEST.md`
- `release/ETC_FARPY_MANIFEST_V1.md`

## Commands Run

```powershell
ssh root@farpy.com "<read-only /etc/farpy metadata inventory and systemd reference scan>"
```

The inventory collected:

- path
- owner uid/gid
- mode
- size
- systemd files referencing each path

It did not print file contents.

## Production Changes

None.

No files were modified. No services were restarted.

## Result

PASS. `/etc/farpy` now has a source-controlled manifest with purpose, owner, service usage, secret classification, and backup priority.

## Notes

- Secret classification is conservative when filenames indicate keys, tokens, auth, Stripe, BTCPay, backup, webhook, SSH, or env material.
- Backup priority is based on launch recovery importance, not file size.
- Historical backup files under `/etc/farpy` may still contain sensitive material and are marked secret where appropriate.
