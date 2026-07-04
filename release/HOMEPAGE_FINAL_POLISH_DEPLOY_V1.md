# HOMEPAGE_FINAL_POLISH_DEPLOY_V1

Status: PASS

## Scope

Static frontend deploy only. No backend, API, payment, pricing, wallet, or render logic changed.

## Build

`npm.cmd run build` passed.

## Deploy commands

```powershell
npm.cmd run build
tar -czf C:\tmp\farpy-out-homepage-final-polish-deploy-v1-20260630T014908.tar.gz -C C:\Users\danki\Desktop\farpy-frontend\out .
scp -q C:\tmp\farpy-out-homepage-final-polish-deploy-v1-20260630T014908.tar.gz root@farpy.com:/tmp/farpy-out-homepage-final-polish-deploy-v1-20260630T014908.tar.gz
ssh root@farpy.com 'set -e; stamp=20260630T014908; archive=/tmp/farpy-out-homepage-final-polish-deploy-v1-$stamp.tar.gz; backup=/opt/farpy.com/out.bak.homepage_final_polish_deploy_v1.$stamp; test -f $archive; test -d /opt/farpy.com/out; cp -a /opt/farpy.com/out $backup; tar -xzf $archive -C /opt/farpy.com/out; test -f /opt/farpy.com/out/index.html'
ssh root@farpy.com 'set -e; stamp=20260630T014908_clean; archive=/tmp/farpy-out-homepage-final-polish-deploy-v1-20260630T014908.tar.gz; newdir=/opt/farpy.com/out.new.homepage_final_polish_deploy_v1.$stamp; backup=/opt/farpy.com/out.bak.homepage_final_polish_deploy_v1.$stamp; test -f $archive; rm -rf $newdir; mkdir -p $newdir; tar -xzf $archive -C $newdir; test -f $newdir/index.html; mv /opt/farpy.com/out $backup; mv $newdir /opt/farpy.com/out'
```

## Backups

- `/opt/farpy.com/out.bak.homepage_final_polish_deploy_v1.20260630T014908`
- `/opt/farpy.com/out.bak.homepage_final_polish_deploy_v1.20260630T014908_clean`

The clean static-root swap was required because overlay extraction left stale old Next chunks in `/opt/farpy.com/out/_next/static`.

## Production verification

| Check | Result |
| --- | --- |
| `https://farpy.com/` | 200 |
| Header CTA `Send package` | PASS |
| Hero CTA `Send package` | PASS |
| Upload CTA `Upload package` | PASS |
| `Render Partner` / `Render partners` visible | PASS |
| `Receipt-backed` visible | PASS |
| `SHA-256 verified` visible | PASS |
| `Wallet tracked` visible | PASS |
| `No subscription` visible | PASS |
| `Start a render` absent | PASS |
| `Start a new render` absent | PASS |
| `Render Factory` absent | PASS |
| `render factory` absent | PASS |
| `render factories` absent | PASS |
| `factory failed` absent | PASS |

## Proof commands

```powershell
Invoke-WebRequest -Uri https://farpy.com/ -UseBasicParsing -TimeoutSec 30 -Headers @{ 'Cache-Control'='no-cache' }
ssh root@farpy.com "if grep -RIE -e 'Start a render' -e 'Start a new render' -e 'Render Factory' -e 'render factory' -e 'render factories' -e 'factory failed' /opt/farpy.com/out/index.html /opt/farpy.com/out/_next/static; then echo FORBIDDEN_FOUND; exit 1; else echo FORBIDDEN_ABSENT; fi"
```

## Result

Build PASS. Deploy PASS. Production scan PASS.
