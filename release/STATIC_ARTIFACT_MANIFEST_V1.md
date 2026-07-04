# STATIC_ARTIFACT_MANIFEST_V1

Status: PASS

## Objective

Document production static artifacts that clean deploys must preserve or regenerate.

## Files Changed

- `docs/FARPY_BOOK/STATIC_ARTIFACT_MANIFEST.md`
- `release/STATIC_ARTIFACT_MANIFEST_V1.md`

## Commands Run

```powershell
ssh root@farpy.com "<read-only inventory of /opt/farpy.com/out focused on JSON, downloads, ZIP/installers, and sidecar hashes>"
ssh root@farpy.com "<read-only category summary for downloads/status/audit/project-status/receipt-static/node JSON>"
```

## Production Evidence

Static root inspected:

- `/opt/farpy.com/out`

Focused categories:

- status JSON
- audit/proof JSON
- generated root JSON
- generated `node/*.json`
- generated `project-status/*.json`
- generated `receipt-static/**/index.json`
- `downloads/**`
- add-on ZIP
- SHA256 sidecars

## Production Changes

None.

No files were modified. No services were restarted.

## Result

PASS. The Farpy Book now documents which production static artifacts are build-owned, runtime-generated, or preservation-critical during clean deploys.

## Key Deploy Warning

A destructive clean deploy of `/opt/farpy.com/out` can remove downloads, sidecar hashes, generated status/audit JSON, proof feeds, static receipt aliases, and project status JSON unless they are explicitly preserved or regenerated.
