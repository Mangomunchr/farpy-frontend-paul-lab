# WEB_RENDER_BACKUP_ENCRYPTION_PLAN_V1

Status: PLAN_ONLY / READY_FOR_FUTURE_IMPLEMENTATION
Date: 2026-06-30

## Objective

Define the final encryption plan for Farpy offsite backups before any production customer data leaves Node A.

This milestone produced a plan only.

No production data was uploaded, moved, or deleted.
No encryption keys were generated.
No secrets were printed or stored in this document.

## Existing Context

Cross-referenced documents:

- `DISASTER_RECOVERY_AUDIT_V1`
- `OFFSITE_BACKUP_OPERATOR_APPROVAL_V1`
- `FARPY_RECOVERY_USB_V1`
- `FOUNDER_ABSENCE_FIX_V1`

Current production facts from those documents:

- Node A is the production control plane.
- Storage Box is the intended encrypted backup destination.
- Node B is the preferred restore-test and standby host.
- Current same-host backup snapshot exists at `/var/backups/farpy/current-data-20260630T102558Z`.
- Current same-host snapshot includes `/var/lib/farpy-web-render` and `/var/lib/farpy`.
- Same-host restore proof exists.
- Offsite transfer is blocked pending explicit operator approval.
- Existing `.tar.gz` artifacts are compressed but not independently application-encrypted before leaving Node A.
- Current offsite helper is `/opt/farpy/bin/farpy-offsite-sshfs-rsync`.
- Existing helper mirrors `/var/backups/farpy/` to Storage Box using SSH/sshfs/rsync.

## Recommended Encryption Approach

Use `age` recipient-based encryption.

Reason:

- Small, simple operational surface.
- No long-running key agent required.
- Public recipient can live on Node A without exposing the private key.
- Private key can stay offline and with operators.
- Encrypted archives are portable and easy to restore on Node B or a replacement host.
- Easier than GPG for emergency recovery and less stateful than full repository backup tools.

Not chosen:

- GPG: more operational keyring complexity.
- Restic/Borg as first step: useful later, but they add repository state, passphrase management, prune semantics, and lock handling. Farpy needs a clear artifact-first encrypted snapshot plan before adding backup-repository tooling.
- Storage Box transport-only encryption: insufficient because Storage Box credential or provider-side access could expose plaintext `.tar.gz` archives.

## Backup Source Paths

Minimum encrypted source set:

```text
/var/lib/farpy-web-render
/var/lib/farpy
```

These cover:

- web-render jobs
- uploads
- outputs
- receipts
- wallet ledgers/events
- Stripe event records
- BTCPay event records
- recovery records
- account/auth and legacy state under `/var/lib/farpy`

Config/code source set:

```text
/etc/farpy
/etc/caddy
/etc/systemd/system
/opt/farpy-web-render
/opt/farpy-node
/opt/farpy.com/out
```

Optional metadata/log source set:

```text
/var/log/farpy
/opt/farpy/reports
/var/backups/farpy/*manifest*
```

Do not include by default:

- old static deploy backups unless explicitly needed
- expanded historical logs
- temporary render work dirs older than the active restore window
- duplicate local backup archives after they have been superseded by encrypted artifacts

## Encrypted Archive Flow

Future implementation flow:

1. Create a new local staging directory on Node A:

```bash
stamp="$(date -u +%Y%m%dT%H%M%SZ)"
base="/var/backups/farpy/encrypted-$stamp"
mkdir -p "$base/plain" "$base/encrypted"
```

2. Create plaintext tarballs locally on Node A only:

```bash
tar --warning=no-file-changed --one-file-system -czf "$base/plain/farpy-web-render.tar.gz" -C /var/lib farpy-web-render
tar --warning=no-file-changed --one-file-system -czf "$base/plain/farpy.tar.gz" -C /var/lib farpy
tar --xattrs --acls -czf "$base/plain/etc-farpy.tar.gz" /etc/farpy
tar --xattrs --acls -czf "$base/plain/etc-caddy.tar.gz" /etc/caddy
tar --xattrs --acls -czf "$base/plain/systemd-farpy.tar.gz" /etc/systemd/system
tar --xattrs --acls -czf "$base/plain/opt-farpy-web-render.tar.gz" /opt/farpy-web-render
tar --xattrs --acls -czf "$base/plain/opt-farpy-node.tar.gz" /opt/farpy-node
tar --xattrs --acls -czf "$base/plain/opt-farpy-com-out.tar.gz" /opt/farpy.com/out
```

3. Generate plaintext manifest and checksums locally:

```bash
find "$base/plain" -type f -printf "%P\t%s\n" | sort > "$base/plain/BACKUP_MANIFEST.txt"
cd "$base/plain"
sha256sum *.tar.gz BACKUP_MANIFEST.txt > SHA256SUMS.txt
```

4. Encrypt every plaintext artifact with `age` using the Farpy backup recipient:

```bash
recipient_file="/etc/farpy/backup-age-recipient.txt"
for file in "$base/plain"/*; do
  age -R "$recipient_file" -o "$base/encrypted/$(basename "$file").age" "$file"
done
```

5. Generate encrypted-artifact checksums:

```bash
cd "$base/encrypted"
sha256sum *.age > SHA256SUMS.age.txt
```

6. Verify encrypted artifacts exist and are non-empty:

```bash
test -s "$base/encrypted/farpy-web-render.tar.gz.age"
test -s "$base/encrypted/farpy.tar.gz.age"
test -s "$base/encrypted/SHA256SUMS.txt.age"
sha256sum -c "$base/encrypted/SHA256SUMS.age.txt"
```

7. Only after local encrypted artifact verification, push encrypted files to Storage Box:

```bash
rsync -rltD --no-owner --no-group --no-perms --info=stats2 \
  "$base/encrypted/" \
  /mnt/storagebox/home/u502913/farpy-backups/farpy/encrypted-$stamp/
```

8. Write a marker after transfer:

```bash
echo "ENCRYPTED_OFFSITE_BACKUP_OK $stamp" > /mnt/storagebox/home/u502913/farpy-backups/farpy/encrypted-$stamp/OFFSITE_OK.txt
```

## Key Ownership

Use an `age` recipient public key on Node A:

```text
/etc/farpy/backup-age-recipient.txt
```

This file contains only the public recipient string. It is not secret.

Private identity key ownership:

- Primary operator: offline copy.
- Secondary operator: sealed/offline copy.
- Recovery USB: optional sealed copy only if physically protected and explicitly approved.
- Node A: should not store the private age identity.
- Storage Box: must never store the private age identity.
- Node B: may temporarily receive the private key only during restore proof, then it should be securely removed.

No key was generated in this milestone.

## Key Backup Strategy

Minimum key backup plan:

1. Generate one Farpy backup age identity on an offline/trusted machine.
2. Record the public recipient in `/etc/farpy/backup-age-recipient.txt` on Node A.
3. Store the private identity in at least two offline locations:
   - primary operator sealed copy
   - secondary operator sealed copy
4. Store a printed recovery card containing:
   - where the private key is held
   - which recipient is active
   - restore command skeleton
   - emergency operator contact
5. Test decrypt on Node B using a non-production sample archive before encrypting production data.

Private key backups must not be committed to git, copied to Storage Box, pasted into release notes, or printed in shell logs.

## Restore Workflow

Preferred restore proof target:

```text
Node B
```

Non-destructive restore proof:

```bash
stamp="<backup-stamp>"
restore="/tmp/farpy-offsite-restore-proof/$stamp"
mkdir -p "$restore/encrypted" "$restore/plain" "$restore/extracted"

rsync -rltD --no-owner --no-group --no-perms \
  /mnt/storagebox/home/u502913/farpy-backups/farpy/encrypted-$stamp/ \
  "$restore/encrypted/"

cd "$restore/encrypted"
sha256sum -c SHA256SUMS.age.txt

for file in *.age; do
  age -d -i /secure/offline/path/farpy-backup-age-identity.txt \
    -o "$restore/plain/${file%.age}" \
    "$file"
done

cd "$restore/plain"
sha256sum -c SHA256SUMS.txt

tar -tzf farpy-web-render.tar.gz >/dev/null
tar -tzf farpy.tar.gz >/dev/null
tar -xzf farpy-web-render.tar.gz -C "$restore/extracted"
tar -xzf farpy.tar.gz -C "$restore/extracted"
find "$restore/extracted" -type f | wc -l
```

Live restore warning:

- Do not decrypt or extract over live `/var/lib/farpy` or `/var/lib/farpy-web-render`.
- Stop affected services first.
- Preserve current live directories before swapping.
- Verify checksums before service restart.

## Retention Policy

Initial retention recommendation:

- hourly encrypted snapshots: keep last 24
- daily encrypted snapshots: keep last 14
- weekly encrypted snapshots: keep last 8
- monthly encrypted snapshots: keep last 6

Retention must operate on encrypted snapshot directories only:

```text
encrypted-YYYYMMDDTHHMMSSZ/
```

Do not use `rsync --delete` against the only offsite backup history.

Mirror mode may still be useful for a `latest/` pointer, but it must not replace historical encrypted snapshots.

Recommended remote layout:

```text
/home/u502913/farpy-backups/farpy/
  latest -> encrypted-YYYYMMDDTHHMMSSZ
  encrypted-YYYYMMDDTHHMMSSZ/
    *.age
    SHA256SUMS.age.txt
    OFFSITE_OK.txt
```

## Integrity Verification

Before upload:

- verify each plaintext tarball can be listed with `tar -tzf`
- verify plaintext `SHA256SUMS.txt`
- verify each encrypted artifact exists and is non-empty
- verify encrypted `SHA256SUMS.age.txt`

After upload:

- re-read remote encrypted checksums from Storage Box
- run `sha256sum -c SHA256SUMS.age.txt` against remote/restored encrypted files
- decrypt on Node B or another non-production restore target
- verify plaintext `SHA256SUMS.txt`
- list tar contents
- extract into `/tmp/farpy-offsite-restore-proof/<stamp>`
- count restored files
- spot-check representative paths:
  - one job JSON
  - one wallet ledger/event
  - one receipt JSON
  - one upload
  - one output ZIP if present

## Rotation Policy

Age recipient rotation:

1. Generate new offline age identity.
2. Add new public recipient to Node A.
3. Encrypt new backups to both old and new recipients for one transition window.
4. Prove restore using the new private identity on Node B.
5. After proof, stop encrypting to old recipient.
6. Keep old private identity until all backups encrypted only to the old key age out of retention.
7. Document the active recipient fingerprint/string in a root-owned metadata file on Node A and in the offline recovery binder.

Emergency rotation:

- If a private key is suspected compromised, immediately stop using that recipient.
- Generate a new identity offline.
- Re-encrypt only backups still inside retention if they must remain recoverable and trustworthy.
- Treat any backup encrypted to a compromised recipient as potentially exposed.

## Operator Approval Gate

Before any production data leaves Node A, require explicit approval.

Recommended approval phrase:

```text
APPROVE ENCRYPTED OFFSITE BACKUP PUSH <stamp> TO STORAGE BOX
```

Approval must acknowledge:

- production customer data will leave Node A
- archives are independently encrypted with age before upload
- Storage Box receives encrypted `.age` files only
- private age identity is not on Storage Box
- retention will keep historical encrypted snapshots
- restore proof must be run after the first upload

Do not accept ambiguous approval such as `go`, `ship it`, or `run backup`.

## Disaster Scenarios Covered

Covered after implementation and restore proof:

- Node A disk loss, if latest encrypted offsite backup is available.
- Node A host loss, if replacement host can access Storage Box and private age identity.
- Bad deploy or bad config, if config/code snapshots are included.
- Wallet/job/receipt/upload/output state recovery to the last successful backup point.
- Storage Box credential exposure, because stored artifacts are encrypted independently.
- Accidental remote deletion of `latest`, if historical snapshot retention is implemented.
- Founder unavailability, if secondary operator has private key access and runbook access.

## Disaster Scenarios Not Covered

Not covered by this plan alone:

- Loss of both offsite backups and all private age identity copies.
- Corruption that existed before the backup and was retained across snapshots.
- Recovery of data created after the latest successful backup.
- Stripe Dashboard account loss.
- BTCPay/Node C full recovery if its own host/config/wallet state is not separately backed up.
- Remote GPU worker/license recovery.
- Domain registrar or DNS account loss.
- Legal obligation to delete specific customer files from all retained encrypted backups.
- Silent backup success with no restore proof; restore proof remains mandatory.

## Implementation Readiness Checklist

Before implementation:

- install `age` on Node A and Node B
- generate age identity offline
- place public recipient only at `/etc/farpy/backup-age-recipient.txt`
- confirm Storage Box mount works
- confirm Node B can mount/read Storage Box
- confirm current same-host backup source still exists

First implementation run:

- create encrypted snapshot locally
- verify encrypted checksums
- ask for explicit operator approval
- upload encrypted snapshot only
- restore/decrypt on Node B or `/tmp` non-production target
- verify plaintext checksums and tar listings
- create a restore proof release note

## Proposed Future Scripts

Recommended future script names:

```text
/opt/farpy/bin/farpy-encrypted-backup-create
/opt/farpy/bin/farpy-encrypted-backup-push
/opt/farpy/bin/farpy-encrypted-backup-restore-proof
```

Each script should:

- use `set -euo pipefail`
- log no secrets
- refuse to run if recipient file is missing
- refuse to upload plaintext `.tar.gz`
- write a machine-readable JSON summary
- write a human-readable text summary
- exit nonzero on checksum or restore-proof failure

## Cross-Reference Notes

`DISASTER_RECOVERY_AUDIT_V1`:

- Found no current off-host backup proof for `/var/lib/farpy-web-render` or `/var/lib/farpy`.
- This plan closes the design gap, not the proof gap.

`OFFSITE_BACKUP_OPERATOR_APPROVAL_V1`:

- Prepared push commands for current plaintext `.tar.gz` snapshots.
- Explicitly noted that current artifacts are not independently encrypted.
- This plan supersedes the plaintext push as the preferred future path.

`FARPY_RECOVERY_USB_V1`:

- Created offline recovery material and includes current backup snapshot material.
- This plan treats the USB as recovery support, not as the sole backup destination.

`FOUNDER_ABSENCE_FIX_V1`:

- Created current same-host backup and local restore proof.
- Remained blocked on offsite transfer and offsite restore proof.
- This plan defines the required encrypted offsite step before that blocker can be removed.

## Final Recommendation

Use `age` recipient encryption before any backup artifacts leave Node A.

Do not run the existing plaintext Storage Box push for current production data unless the operator explicitly accepts that temporary risk. The preferred next milestone is:

```text
WEB_RENDER_BACKUP_ENCRYPTION_IMPLEMENTATION_V1
```

That milestone should implement the scripts, generate keys only with explicit operator approval, upload encrypted artifacts only after approval, and immediately prove restore from Storage Box on Node B or a non-production restore target.

## Commands Run For This Plan

Read-only local inspection only:

```powershell
Get-Content release\DISASTER_RECOVERY_AUDIT_V1.md
Get-Content release\OFFSITE_BACKUP_OPERATOR_APPROVAL_V1.md
Get-Content release\FARPY_RECOVERY_USB_V1.md
Get-Content release\FOUNDER_ABSENCE_FIX_V1.md
rg -n "farpy-offsite-sshfs-rsync|current-data|/var/backups/farpy|/var/lib/farpy-web-render|/var/lib/farpy|Storage Box|age|sshfs|rsync|retention|restore proof" release scripts deploy public src -S
```

No production mutations were made.
No uploads were performed.
No encryption keys were generated.
