# FARPY_SHOWCASE_DEPLOY_V1

Status: GREEN

## Goal

Deploy the existing built `/showcase` page to production `farpy.com`.

## Files deployed

Narrow static deploy only:

- `/opt/farpy.com/out/showcase`
- `/opt/farpy.com/out/showcase.html`
- `/opt/farpy.com/out/showcase.txt`
- `/opt/farpy.com/out/sitemap.xml`
- `/opt/farpy.com/out/_next/static/chunks/2-1fexcyns6ki.js`
- `/opt/farpy.com/out/_next/static/chunks/2qe8k_h4hwfd8.css`

No backend/API files were changed. No services were restarted.

## Build

```powershell
npm.cmd run build
```

Result: PASS.

`/showcase` was generated as a static route.

## Preservation

The broad preserved deploy stage passed:

```text
STATIC_DEPLOY_PRESERVE_FIX_V1
VERDICT=GREEN
STAGE_ROOT=C:\tmp\farpy-static-deploy-preserved-20260703T084837Z
MISSING_BEFORE_FETCH=736
FETCHED=736
```

The broad deploy was intentionally not used because the local worktree contains unrelated uncommitted frontend changes. A safer narrow deploy was used instead.

## Production backup

Narrow backup:

```text
/opt/farpy.com/out.bak.showcase_deploy_v1.narrow.20260703T084837Z
```

The temporary directory route created during verification was preserved as:

```text
/opt/farpy.com/out/showcase.dir.showcase_deploy_v1.20260703T084837Z
```

## Commands run

```powershell
npm.cmd run build
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\prepare-static-deploy-preserve-v1.ps1 -EvidencePath C:\tmp\farpy-showcase-deploy-preserve.json
scp -q C:\tmp\farpy-showcase-deploy-v1-20260703T084837Z.narrow.tar.gz root@farpy.com:/tmp/farpy-showcase-deploy-v1-20260703T084837Z.narrow.tar.gz
ssh root@farpy.com '<narrow backup and extract>'
ssh root@farpy.com '<install extensionless /opt/farpy.com/out/showcase for direct clean URL>'
```

## Production verification

`https://farpy.com/showcase`

```text
SHOWCASE_STATUS=200
HAS_TITLE=True
HAS_CTA=True
HAS_FOOTER_LINK=True
HAS_META=True
```

`https://farpy.com/sitemap.xml`

```text
SITEMAP_STATUS=200
SITEMAP_HAS_SHOWCASE=True
```

`https://farpy.com/showcase/`

```text
SHOWCASE_SLASH_STATUS=308
```

The canonical direct route `/showcase` returns `200`. The trailing-slash form redirects, which is acceptable for this deploy because the required production URL is `/showcase`.

FARPY_SHOWCASE_DEPLOY_V1 = GREEN
