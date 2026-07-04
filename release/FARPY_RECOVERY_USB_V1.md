# FARPY_RECOVERY_USB_V1

Status: GREEN
Date: 2026-06-30

## Objective

Create an offline Farpy recovery USB focused on recoverability rather than archival completeness.

## USB Target

- Drive: D:\
- Root: D:\Farpy-Recovery
- Drive type: removable
- Format: FAT32
- Size: 31.99 GB
- Remaining free space after population: 30.56 GB

## Included

Highest-priority recovery material:

- Caddy config from Node A.
- Farpy env/config directory from Node A.
- Farpy/Caddy systemd unit material from Node A.
- Raw Linux service archive: services/farpy-recovery-services-rootfs.tgz.
- Web-render API/backend scripts from Node A.
- Current production frontend static output from Node A.
- Local frontend source/build metadata.
- Production deployment scripts from Node A.
- Release notes and restore documentation.
- /var/lib/farpy archive from Node A.
- Wallet, receipt, job, Stripe event, BTCPay event metadata from Node A.
- Current verified production backup snapshot archive: databases/current-data-20260630T102558Z.tgz.

## Intentionally Skipped As Expanded Trees

- Live upload payload tree.
- Live output ZIP tree.
- Live render work tree.
- Historical frontend out.bak* trees.
- Large legacy /opt/farpy/uploads and /opt/farpy/inputs trees.
- Large expanded logs.

Reason: these would reduce clarity and may consume USB space; the current verified backup snapshot is included for high-value recovery coverage.

## Verification Files

- README_FIRST.txt
- RESTORE_GUIDE.md
- BACKUP_MANIFEST.txt
- SHA256SUMS.txt

## Production Impact

- Production services were not stopped.
- Production services were not restarted.
- Production files were read only.
- USB files were created/copied locally.

## Result

FARPY_RECOVERY_USB_V1 populated the USB and generated restore documentation, manifest, and checksums.
