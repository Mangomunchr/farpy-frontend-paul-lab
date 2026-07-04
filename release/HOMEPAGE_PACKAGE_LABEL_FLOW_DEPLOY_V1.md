# HOMEPAGE_PACKAGE_LABEL_FLOW_DEPLOY_V1

Date: 2026-06-30
Status: PASS

## Scope

Static frontend deploy only.

No backend, API, payment, pricing, wallet, render, or scheduler services were changed.

## Files Changed Locally

- `src/components/HomeRenderFlow.tsx`
- `src/app/globals.css`
- `release/HOMEPAGE_PACKAGE_LABEL_FLOW_V1.md`
- `release/HOMEPAGE_PACKAGE_LABEL_FLOW_DEPLOY_V1.md`

## Build

Command:

```powershell
npm.cmd run build
```

Result:

```text
Compiled successfully
TypeScript finished successfully
Static pages generated successfully
```

A clean rebuild was required because the first deploy still carried stale prerendered homepage HTML in `out/index.html` even though the new client chunk existed. I removed generated build artifacts only:

```powershell
Remove-Item .next -Recurse -Force
Remove-Item out -Recurse -Force
npm.cmd run build
```

## Deploy Commands

```powershell
tar -czf C:\tmp\farpy-out-homepage-package-label-flow-deploy-v1-final-20260630T110429Z.tar.gz -C C:\Users\danki\Desktop\farpy-frontend\out .
scp -q C:\tmp\farpy-out-homepage-package-label-flow-deploy-v1-final-20260630T110429Z.tar.gz root@farpy.com:/tmp/farpy-out-homepage-package-label-flow-deploy-v1-final-20260630T110429Z.tar.gz
scp -q C:\tmp\farpy-hplf-final-deploy.sh root@farpy.com:/tmp/farpy-hplf-final-deploy.sh
ssh root@farpy.com 'chmod 755 /tmp/farpy-hplf-final-deploy.sh; /tmp/farpy-hplf-final-deploy.sh'
```

Remote deploy script performed a clean static root swap:

```bash
archive="/tmp/farpy-out-homepage-package-label-flow-deploy-v1-final-20260630T110429Z.tar.gz"
newdir="/opt/farpy.com/out.new.homepage_package_label_flow_deploy_v1_final.20260630T110429Z"
backup="/opt/farpy.com/out.bak.homepage_package_label_flow_deploy_v1_final.20260630T110429Z"
tar -xzf "$archive" -C "$newdir"
mv /opt/farpy.com/out "$backup"
mv "$newdir" /opt/farpy.com/out
```

## Backup

```text
/opt/farpy.com/out.bak.homepage_package_label_flow_deploy_v1_final.20260630T110429Z
```

## Production Hash Proof

Production deployed homepage hash:

```text
101ff1fb41c6248380d5ae7fb389d951f09577cd5cfc511df28ee77d583ddafe  /opt/farpy.com/out/index.html
```

## Production Verification

Live URL:

```text
https://farpy.com/?hplf=final-20260630T110429Z
```

HTTP result:

```text
STATUS=200
```

Required labels present in production response:

```text
Package: true
Output: true
Frames: true
Delivery: true
Summary: true
Still image: true
Animation: true
Standard: true
Priority: true
Send package: true
Render Partner accepts it: true
```

Forbidden terms absent in production response:

```text
Render Lane: false
Frames to Render: false
Start a render: false
Render Factory: false
render factory: false
render factories: false
factory failed: false
```

## Mobile Verification

Chrome headless viewport probe at 390px:

```text
href: https://farpy.com/?hplf=mobile-final-4
title: Farpy - Render Blender + Octane files for less
innerWidth: 390
documentScrollWidth: 375
bodyScrollWidth: 375
overflow: false
```

Result:

```text
No horizontal overflow at 390px.
```

## Notes

- Tar extraction printed future timestamp warnings because of local/remote clock skew; the static root swap completed and the deployed `index.html` hash matched the final clean build.
- The first deployment attempt left stale prerendered homepage HTML, so a clean `.next`/`out` rebuild and final clean root swap were performed.
- No backend or API services were restarted.

## Acceptance

- Build PASS
- Deploy PASS
- Production scan PASS
- Mobile 390px overflow check PASS
- No backend/API/payment/pricing changes
