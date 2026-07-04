# MOBILE_HOMEPAGE_DEPLOY_V1

Status: PASS

## Objective

Deploy `MOBILE_HOMEPAGE_READINESS_V1` to production and verify the Farpy homepage at mobile and desktop viewports.

## Files changed

- `release/MOBILE_HOMEPAGE_DEPLOY_V1.md`

Previously deployed static changes came from:

- `src/app/globals.css`
- `release/MOBILE_HOMEPAGE_READINESS_V1.md`

## Build

- `npm.cmd run build`: PASS before deploy.

## Deploy commands

```powershell
tar -czf C:\tmp\farpy-out-mobile-homepage-deploy-v1-20260630T0021.tar.gz -C C:\Users\danki\Desktop\farpy-frontend\out .
scp -q C:\tmp\farpy-out-mobile-homepage-deploy-v1-20260630T0021.tar.gz root@farpy.com:/tmp/farpy-out-mobile-homepage-deploy-v1-20260630T0021.tar.gz
ssh root@farpy.com 'set -e; stamp=20260630T0021; archive=/tmp/farpy-out-mobile-homepage-deploy-v1-20260630T0021.tar.gz; backup=/opt/farpy.com/out.bak.mobile_homepage_deploy_v1.20260630T0021; test -f $archive; cp -a /opt/farpy.com/out $backup; tar -xzf $archive -C /opt/farpy.com/out; test -f /opt/farpy.com/out/index.html; test -d /opt/farpy.com/out/_next/static; echo BACKUP=$backup; echo DEPLOYED_STATIC=1'
```

## Backup

- `/opt/farpy.com/out.bak.mobile_homepage_deploy_v1.20260630T0021`

## Production verification

HTTP:

```text
https://farpy.com/ -> 200
```

Deployed CSS proof:

```text
/opt/farpy.com/out/_next/static/chunks/025bb51c1kl4m.css contains site-nav-links.fy-header__nav
```

Mobile viewport:

- URL: `https://farpy.com/?mobile-homepage-deploy-v1=20260630T0021`
- Viewport: `390x844`
- Screenshot: `C:\tmp\mobile-homepage-deploy-v1-prod-mobile.png`

```json
{
  "innerWidth": 390,
  "htmlClientWidth": 390,
  "htmlScrollWidth": 390,
  "bodyClientWidth": 390,
  "bodyScrollWidth": 390,
  "overflow": false,
  "nav_width": 390,
  "nav_text": "🐹 Farpy\\nStart a render",
  "logo_right": 144,
  "cta_right": 376,
  "site_nav_links_display": "none",
  "title_width": 362,
  "actions_width": 362,
  "cards_width": 362,
  "has_primary_cta": true,
  "has_secondary_cta": true
}
```

Desktop viewport:

- URL: `https://farpy.com/?mobile-homepage-deploy-v1-desktop=20260630T0021`
- Viewport: `1440x1000`
- Screenshot: `C:\tmp\mobile-homepage-deploy-v1-prod-desktop.png`

```json
{
  "innerWidth": 1440,
  "htmlScrollWidth": 1425,
  "bodyScrollWidth": 1425,
  "overflow": false,
  "site_nav_links_display": "flex",
  "cta_text": "Start a render",
  "title_font": "44px"
}
```

## Backend/API status

No backend files were changed.

No API files were changed.

No services were restarted.

Static output only was deployed to `/opt/farpy.com/out`.

## Result

- `https://farpy.com/` returns 200: PASS
- Mobile viewport has no horizontal overflow: PASS
- Logo and primary CTA visible on mobile: PASS
- Mobile nav does not spill off-screen: PASS
- Desktop nav remains visible: PASS
- Backend/API unchanged: PASS
