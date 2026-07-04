# FARPY_GSC_SITEMAP_CLEANUP_V1

Status: GREEN

Date: 2026-07-04

## Scope

Fix Google Search Console sitemap confusion only.

No firehose pages were created. No unrelated SEO pages were changed.

## Root Cause

`/firehose/sitemap.xml` is dead/legacy. Production returns `404` for it, and no live static roots or current frontend sitemap/robots generators reference it.

The production `robots.txt` was already correct and referenced only:

- `https://farpy.com/sitemap.xml`
- `https://farpy.com/benchmark/sitemap.xml`

The main sitemap was valid but missing three requested current public routes:

- `https://farpy.com/account`
- `https://farpy.com/topup`
- `https://farpy.com/workspace`

## Files Changed

- `src/app/sitemap.ts`
- `release/FARPY_GSC_SITEMAP_CLEANUP_V1.md`

Production static file deployed:

- `/opt/farpy.com/out/sitemap.xml`
- `/opt/farpy-webroot/sitemap.xml`

No production `robots.txt` change was needed.

## Build

Command:

```powershell
npm.cmd run build
```

Result: PASS

Next.js generated static routes including:

- `/robots.txt`
- `/sitemap.xml`
- `/account`
- `/topup`
- `/workspace`

## Deploy

Only the changed static sitemap was deployed.

Deployed SHA256:

```text
a449bac4906bf8a26c0ffd1e415c4a7ffed30b86741b8a6e223bdd377d19309a  /opt/farpy.com/out/sitemap.xml
a449bac4906bf8a26c0ffd1e415c4a7ffed30b86741b8a6e223bdd377d19309a  /opt/farpy-webroot/sitemap.xml
```

## Production Verification

| Check | Result |
| --- | --- |
| `https://farpy.com/robots.txt` returns 200 | PASS |
| `robots.txt` does not contain `/firehose/sitemap.xml` | PASS |
| `robots.txt` contains `https://farpy.com/sitemap.xml` | PASS |
| `robots.txt` contains `https://farpy.com/benchmark/sitemap.xml` | PASS |
| `https://farpy.com/sitemap.xml` returns 200 | PASS |
| `sitemap.xml` contains `/showcase` | PASS |
| `sitemap.xml` contains `/booth` | PASS |
| `sitemap.xml` contains `/account` | PASS |
| `sitemap.xml` contains `/topup` | PASS |
| `sitemap.xml` contains `/workspace` | PASS |
| `sitemap.xml` does not contain `/firehose` | PASS |
| `https://farpy.com/benchmark/sitemap.xml` returns 200 | PASS |
| `https://farpy.com/firehose/sitemap.xml` returns 404 | PASS |

## Requested Route Coverage

| Route | Production sitemap |
| --- | --- |
| `/` | PASS |
| `/pricing` | PASS |
| `/addon` | PASS |
| `/api` | PASS |
| `/account` | PASS |
| `/topup` | PASS |
| `/workspace` | PASS |
| `/showcase` | PASS |
| `/booth` | PASS |
| `/status` | PASS |
| `/faq` | PASS |
| `/docs` | PASS |
| `/downloads` | PASS |
| `/proof` | PASS |
| `/privacy` | PASS |
| `/terms` | PASS |
| `/refunds` | PASS |
| `/dmca` | PASS |
| `/contact` | PASS |
| `/security` | PASS |
| `/acceptable-use` | PASS |

## Commands Executed

```powershell
rg -n "firehose|sitemap|robots|showcase|booth|account|topup|workspace" C:\Users\danki\Desktop\farpy-frontend -g !node_modules -g !.next
Get-Content -LiteralPath C:\Users\danki\Desktop\farpy-frontend\src\app\sitemap.ts
Get-Content -LiteralPath C:\Users\danki\Desktop\farpy-frontend\src\app\robots.ts
npm.cmd run build
rg -n "https://farpy.com/(account|topup|workspace|showcase|booth)|firehose|benchmark/sitemap|Sitemap:" C:\Users\danki\Desktop\farpy-frontend\.next -g *sitemap* -g *robots*
scp C:\Users\danki\Desktop\farpy-frontend\.next\server\app\sitemap.xml.body farpy:/tmp/FARPY_GSC_SITEMAP_CLEANUP_V1.sitemap.xml
ssh farpy "install -m 0644 /tmp/FARPY_GSC_SITEMAP_CLEANUP_V1.sitemap.xml /opt/farpy.com/out/sitemap.xml; install -m 0644 /tmp/FARPY_GSC_SITEMAP_CLEANUP_V1.sitemap.xml /opt/farpy-webroot/sitemap.xml"
curl.exe -sS -L https://farpy.com/robots.txt
curl.exe -sS -L https://farpy.com/sitemap.xml
curl.exe -sS -L https://farpy.com/benchmark/sitemap.xml
curl.exe -sS -L https://farpy.com/firehose/sitemap.xml
```

## Manual GSC Instruction

After GREEN:

1. Remove `https://farpy.com/firehose/sitemap.xml` from Search Console.
2. Resubmit `https://farpy.com/sitemap.xml`.

FARPY_GSC_SITEMAP_CLEANUP_V1 = GREEN
