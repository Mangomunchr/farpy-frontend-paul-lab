# FARPY_DIGITAL_BOOTH_LAYOUT_V2_DEPLOY

Status: GREEN

## Scope

Deployed the existing `FARPY_DIGITAL_BOOTH_LAYOUT_V2` static `/booth` page to production.

No application source code changes were made for this deploy task.

## Build

Command:

```powershell
npm.cmd run build
```

Result: PASS

Static route confirmed:

```text
○ /booth
```

## Deploy

- Static preservation stage: `C:\tmp\farpy-static-deploy-preserved-20260704T014038Z`
- Preservation verdict: GREEN
- Protected artifacts missing before preservation: `736`
- Protected artifacts fetched into stage: `736`
- Local deploy archive: `C:\tmp\farpy-booth-layout-v2-deploy-20260704T014038Z.tgz`
- Archive size: `12,871,108` bytes
- Production archive: `/tmp/farpy-booth-layout-v2-deploy-20260704T014038Z.tgz`
- Production static backup: `/opt/farpy.com/out.bak.booth_layout_v2_deploy.20260704T014038Z`

Extraction completed with `receipt-static/*` excluded, preserving protected immutable receipt artifacts already on production.

## Production Verification

| Check | Result |
| --- | --- |
| `https://farpy.com/booth` returns 200 | PASS |
| CSS chunk returns 200 | PASS |
| CSS Content-Type is `text/css` | PASS: `text/css; charset=utf-8` |
| Page contains `FARPY` | PASS |
| Page contains `B-1337` | PASS |
| Page contains `YOUR ART HERE` | PASS |
| No 404 marker | PASS |
| `/sitemap.xml` contains `/booth` | PASS |

CSS verified:

- `https://farpy.com/_next/static/chunks/1we85td2p1q1-.css`

Verification result:

```json
{
  "booth_status": 200,
  "booth_content_type": "text/html; charset=utf-8",
  "css_status": 200,
  "css_content_type": "text/css; charset=utf-8",
  "css_text_css": true,
  "contains_farpy": true,
  "contains_b1337": true,
  "contains_your_art_here": true,
  "no_404_marker": true,
  "sitemap_status": 200,
  "sitemap_contains_booth": true,
  "all_green": true
}
```

## Preservation Guard

Post-deploy static preservation guard:

- Verdict: GREEN
- Pass count: `1`
- Fail count: `0`
- Evidence: `C:\tmp\farpy-booth-layout-v2-deploy-postdeploy-guard.json`

FARPY_DIGITAL_BOOTH_LAYOUT_V2_DEPLOY = GREEN