# OFFSITE_BACKUP_OPERATOR_APPROVAL_V1

Status: READY_FOR_OPERATOR_APPROVAL / NOT RUN
Date: 2026-06-30

## Objective

Prepare the exact offsite backup push command and risk note for Farpy production data. This document is approval prep only. No offsite backup push has been executed by this contract.


## Production Topology Context

Operator-provided production roles:

- Node A: Production only.
- Node B: Standby, restore tests, synthetic monitoring.
- Node C: Payments and future render migration.
- Storage Box: Encrypted backups.
- IONOS: External monitoring.

Backup intent:

- Node A remains the source of production backup snapshots.
- Storage Box is the offsite encrypted backup destination.
- Node B is the preferred non-production restore-test target before any live restore on Node A.
- Node C should not be used as the primary production-data restore test target unless the payment role is isolated from the test.
- IONOS monitoring should verify backup/report freshness without receiving backup contents.

## Source Paths

Configured backup source used by `/opt/farpy/bin/farpy-offsite-sshfs-rsync`:

- `/var/backups/farpy/`

Current verified snapshot prepared on Node A:

- `/var/backups/farpy/current-data-20260630T102558Z/`

Current snapshot contains compressed archives of:

- `/var/lib/farpy-web-render`
- `/var/lib/farpy`

Current snapshot files observed:

- `farpy-web-render.tar.gz` approximately `1.2G`
- `farpy-web-render.tar.gz.sha256`
- `farpy-web-render.contents.sample.txt`
- `farpy-web-render.restore_file_count.txt`
- `farpy.tar.gz` approximately `82M`
- `farpy.tar.gz.sha256`
- `farpy.contents.sample.txt`
- `farpy.restore_file_count.txt`

Checksum proof observed on Node A:

- `/var/backups/farpy/current-data-20260630T102558Z/farpy.tar.gz: OK`
- `/var/backups/farpy/current-data-20260630T102558Z/farpy-web-render.tar.gz: OK`

## Destination

Configured offsite destination:

- Host: `u502913.your-storagebox.de`
- User: `u502913`
- SSH port: `23`
- SSH key: `/root/.ssh/id_farpy`
- Local mount: `/mnt/storagebox`
- Remote root mounted as: `u502913@u502913.your-storagebox.de:/`
- Destination subdirectory: `/mnt/storagebox/home/u502913/farpy-backups/farpy`

Connectivity to the Storage Box was previously verified read-only. Presence of the current production backup snapshot at the offsite destination is not proven until the push and restore proof are run.

## Estimated Size

Current snapshot size:

- Approximately `1.3G`

Expected growth:

- Size will grow as production uploads, outputs, receipts, job state, and operational data grow.

## Encryption Status

Transport:

- Encrypted in transit through SSH/sshfs.

Backup artifact:

- Current `.tar.gz` archives are compressed, not independently encrypted before leaving Node A.

Destination at rest:

- Operator designates Storage Box for encrypted backups; the exact encryption mechanism and key custody were not verified by this document.

Conclusion:

- The proposed push sends production data over an encrypted transport to the operator-designated encrypted backup destination. The `.tar.gz` artifacts themselves are not independently application-encrypted before upload, so key custody and Storage Box encryption controls remain part of the operator risk decision.

## Exact Push Command

Preferred existing production command, if the operator approves mirroring all of `/var/backups/farpy/`:

```bash
/opt/farpy/bin/farpy-offsite-sshfs-rsync
```

Equivalent configured behavior:

```bash
mkdir -p /mnt/storagebox
mountpoint -q /mnt/storagebox || sshfs 'u502913@u502913.your-storagebox.de:/' /mnt/storagebox \
  -o rw,IdentityFile=/root/.ssh/id_farpy,allow_other,default_permissions,StrictHostKeyChecking=accept-new,port=23,reconnect,ServerAliveInterval=15,ServerAliveCountMax=3
mkdir -p /mnt/storagebox/home/u502913/farpy-backups/farpy
rsync -rltD --delete --no-owner --no-group --no-perms --info=stats2 \
  /var/backups/farpy/ \
  /mnt/storagebox/home/u502913/farpy-backups/farpy/
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
echo "OFFSITE_BACKUP_OK $STAMP" > "/mnt/storagebox/home/u502913/farpy-backups/farpy/OFFSITE_OK.$STAMP.txt"
sync
```

Narrower current-snapshot-only command, if the operator approves copying only `current-data-20260630T102558Z` and avoiding remote mirror deletion behavior:

```bash
mkdir -p /mnt/storagebox
mountpoint -q /mnt/storagebox || sshfs 'u502913@u502913.your-storagebox.de:/' /mnt/storagebox \
  -o rw,IdentityFile=/root/.ssh/id_farpy,allow_other,default_permissions,StrictHostKeyChecking=accept-new,port=23,reconnect,ServerAliveInterval=15,ServerAliveCountMax=3
mkdir -p /mnt/storagebox/home/u502913/farpy-backups/farpy/current-data-20260630T102558Z
rsync -rltD --no-owner --no-group --no-perms --info=stats2 \
  /var/backups/farpy/current-data-20260630T102558Z/ \
  /mnt/storagebox/home/u502913/farpy-backups/farpy/current-data-20260630T102558Z/
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
echo "OFFSITE_BACKUP_OK $STAMP current-data-20260630T102558Z" > "/mnt/storagebox/home/u502913/farpy-backups/farpy/OFFSITE_OK.$STAMP.txt"
sync
```

## Retention Behavior

Current configured script behavior:

- Mirrors `/var/backups/farpy/` to the offsite directory.
- Uses `rsync --delete`.
- Remote files that are absent from local `/var/backups/farpy/` may be deleted.

Retention caveat:

- The configured offsite script is a mirror, not a historical retention policy.
- Existing local backup-lite jobs may prune some local backup classes, but current production data snapshot retention should not be treated as proven long-term offsite retention.

Recommended approval choice:

- For first proof, approve the narrower current-snapshot-only command unless the operator explicitly wants the mirror behavior.
- After proof, define retention separately, such as daily snapshots plus weekly/monthly retention, before relying on offsite backups as disaster recovery.

## Restore Command

Non-destructive restore proof from offsite into `/tmp`:

```bash
mkdir -p /mnt/storagebox
mountpoint -q /mnt/storagebox || sshfs 'u502913@u502913.your-storagebox.de:/' /mnt/storagebox \
  -o ro,IdentityFile=/root/.ssh/id_farpy,allow_other,default_permissions,StrictHostKeyChecking=accept-new,port=23,reconnect,ServerAliveInterval=15,ServerAliveCountMax=3
mkdir -p /tmp/farpy-offsite-restore-proof/current-data-20260630T102558Z
rsync -rltD --no-owner --no-group --no-perms \
  /mnt/storagebox/home/u502913/farpy-backups/farpy/current-data-20260630T102558Z/ \
  /tmp/farpy-offsite-restore-proof/current-data-20260630T102558Z/
cd /tmp/farpy-offsite-restore-proof/current-data-20260630T102558Z
sha256sum -c farpy.tar.gz.sha256
sha256sum -c farpy-web-render.tar.gz.sha256
mkdir -p /tmp/farpy-offsite-restore-proof/extracted
tar -xzf farpy.tar.gz -C /tmp/farpy-offsite-restore-proof/extracted
tar -xzf farpy-web-render.tar.gz -C /tmp/farpy-offsite-restore-proof/extracted
find /tmp/farpy-offsite-restore-proof/extracted -type f | wc -l
```

Live restore warning:

- Do not extract directly over `/var/lib/farpy` or `/var/lib/farpy-web-render` while production services are running.
- A live restore should first stop affected services, preserve current live directories, restore into staging, verify checksums and ownership, then swap deliberately.

## Privacy Risk

This backup may contain sensitive production data, including:

- Customer uploaded `.blend` and `.orbx` packages.
- Render output ZIPs/images.
- Job state, package metadata, receipt metadata, hashes, and operational IDs.
- Wallet, billing, account, or ledger-related operational records if present under the backed-up production data paths.
- Tokenized URLs or private delivery references if stored in job state.

Primary risks:

- Production customer data leaves Node A and is stored on a third-party Storage Box.
- Backup archives are not independently encrypted before upload.
- Storage Box credential compromise would expose downloadable backup archives.
- `rsync --delete` mirror mode can remove remote backup history if local source is pruned or damaged.

## Required Operator Approval

Do not run the push until the operator explicitly approves the data transfer.

Suggested approval phrase for narrow first proof:

```text
APPROVE OFFSITE BACKUP PUSH current-data-20260630T102558Z snapshot-only
```

Suggested approval phrase for configured mirror script:

```text
APPROVE OFFSITE BACKUP PUSH /var/backups/farpy mirror with --delete
```

Approval should acknowledge:

- Approximately `1.3G` of production backup data will be copied off Node A.
- The transfer uses SSH, but the `.tar.gz` artifacts are not independently encrypted.
- The destination is the Storage Box path `/home/u502913/farpy-backups/farpy`.
- Mirror mode uses `--delete`; snapshot-only mode avoids deleting remote history.

## Commands Run For This Document

Read-only production inspection commands were run to identify the configured script, cron schedule, source paths, current snapshot size, and checksum status. No offsite backup push command was run.

Representative commands:

```bash
ssh root@farpy.com 'sed -n "1,220p" /opt/farpy/bin/farpy-offsite-sshfs-rsync'
ssh root@farpy.com 'cat /etc/cron.d/farpy-offsite-backup'
ssh root@farpy.com 'du -sh /var/backups/farpy/current-data-20260630T102558Z && ls -lh /var/backups/farpy/current-data-20260630T102558Z'
ssh root@farpy.com 'cd /var/backups/farpy/current-data-20260630T102558Z && sha256sum -c farpy.tar.gz.sha256 && sha256sum -c farpy-web-render.tar.gz.sha256'
```

## Verdict

Status: WAITING_FOR_OPERATOR_APPROVAL

No offsite push has been performed. The safest next step is operator approval for the snapshot-only push followed immediately by a non-destructive offsite restore proof under `/tmp/farpy-offsite-restore-proof`.

