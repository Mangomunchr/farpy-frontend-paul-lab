# FARPY_DIGITAL_BOOTH_POLISH_DEPLOY_V1

Status: GREEN

## Scope

Deployed the existing `FARPY_DIGITAL_BOOTH_POLISH_V1` static `/booth` page to production.

No application source code changes were made for this deploy task.

## Build

Command:

```powershell
npm.cmd run build
```

Result: PASS

Static route confirmed in build output:

```text
○ /booth
```

## Deploy

- Static preservation stage: `C:\tmp\farpy-static-deploy-preserved-20260704T010418Z`
- Preservation verdict: GREEN
- Protected artifacts missing before preservation: `736`
- Protected artifacts fetched into stage: `736`
- Local deploy archive: `C:\tmp\farpy-booth-polish-deploy-v1-20260704T010418Z.tgz`
- Archive size: `12,870,566` bytes
- Production archive: `/tmp/farpy-booth-polish-deploy-v1-20260704T010418Z.tgz`
- Production static backup: `/opt/farpy.com/out.bak.booth_polish_deploy_v1.20260704T010418Z`

Extraction completed with `receipt-static/*` excluded, preserving protected immutable receipt artifacts already on production.

## Production Verification

| Check | Result |
| --- | --- |
| `https://farpy.com/booth` returns 200 | PASS |
| Content-Type is `text/html` | PASS: `text/html; charset=utf-8` |
| Page contains `FARPY` | PASS |
| Page contains `B-1337` | PASS |
| Page contains `No free GPUs` | PASS |
| Page contains `YOUR ART HERE` | PASS |
| `/sitemap.xml` contains `/booth` | PASS |
| CSS chunk returns 200 | PASS |
| CSS Content-Type is `text/css` | PASS: `text/css; charset=utf-8` |
| No 404 marker | PASS |

CSS verified:

- `https://farpy.com/_next/static/chunks/1we85td2p1q1-.css`

Verification result:

```json
{
  "booth_status": 200,
  "booth_content_type": "text/html; charset=utf-8",
  "contains_farpy": true,
  "contains_b1337": true,
  "contains_no_free_gpus": true,
  "contains_your_art_here": true,
  "no_404_marker": true,
  "sitemap_status": 200,
  "sitemap_contains_booth": true,
  "css_status": 200,
  "css_content_type": "text/css; charset=utf-8",
  "css_text_css": true,
  "all_green": true
}
```

## Preservation Guard

Post-deploy static preservation guard:

- Verdict: GREEN
- Pass count: `1`
- Fail count: `0`
- Evidence: `C:\tmp\farpy-booth-polish-deploy-postdeploy-guard-v1.json`

FARPY_DIGITAL_BOOTH_POLISH_DEPLOY_V1 = GREEN