# FARPY_SEO_AUDIT_V1

Date: 2026-07-01

Scope: current `C:\Users\danki\Desktop\farpy-frontend` filesystem and existing `out/` static export.

Mode: audit only. No product code changes.

## Summary

Farpy has a solid SEO foundation for Retail Alpha: static export, global metadata, canonical origin, generated OpenGraph image, Twitter card tags, sitewide Organization/WebSite JSON-LD, FAQ schema, robots controls, and a conservative public sitemap.

The main SEO gaps are discoverability polish rather than launch blockers:

- Main sitemap omits several legitimate public pages, especially `/downloads`, `/proof`, proof detail pages, and benchmark pages.
- `robots.txt` references only `/sitemap.xml`, not `/benchmark/sitemap.xml`.
- Benchmark static pages have weaker metadata and mojibake in generated titles.
- `/ops` is exported with `noindex`, but canonical points to `/`; this is acceptable for privacy but messy.
- Public proof pages contain example/static proof data; do not over-promote them as live production evidence.

Overall SEO readiness score: **78 / 100**

## Public Routes

### App Router Pages

| Route | Index policy | Notes |
|---|---:|---|
| `/` | index | Homepage / package flow |
| `/acceptable-use` | index | Legal / policy |
| `/account` | noindex | Authenticated app surface |
| `/addon` | index | Blender add-on page |
| `/api` | index | Public API docs |
| `/contact` | index | Support/contact |
| `/dmca` | index | Legal |
| `/docs` | index | Public docs |
| `/downloads` | index | Public downloads, not in main sitemap |
| `/faq` | index | FAQ |
| `/files` | index | File support docs |
| `/ops` | noindex | Internal ops shell |
| `/pricing` | index | Pricing |
| `/privacy` | index | Legal |
| `/proof` | index | Public proof landing, not in main sitemap |
| `/proof/[slug]` | index | 6 generated proof examples |
| `/receipt` | noindex | Token-gated receipt shell |
| `/refunds` | index | Refund policy |
| `/security` | index | Security contact |
| `/signin` | noindex | Auth |
| `/signup` | noindex | Auth |
| `/status` | index | Public status |
| `/terms` | index | Legal |
| `/topup` | noindex | Wallet/payment app surface |
| `/workspace` | noindex | Private package tracker |
| `/workspace/[id]` | noindex | Private package tracker |

### Static Benchmark Pages

| Route | Metadata status | Notes |
|---|---|---|
| `/benchmark/` | weak | Missing description/canonical in built page |
| `/benchmark/api/` | ok | Has title/description/canonical |
| `/benchmark/compare/` | weak | Uses `unknown vs unknown` static fallback |
| `/benchmark/gpu/` | weak | Uses `unknown` static fallback |
| `/benchmark/latest/` | ok | Has title/description/canonical |
| `/benchmark/leaderboard/` | ok | Has title/description/canonical |
| `/benchmark/result/` | weak | Uses `unknown` static fallback |
| `/benchmark/search/` | partial | Missing canonical |

## Titles / Metadata

| Route | Title | Description | Canonical | Robots | OG/Twitter |
|---|---|---|---|---|---|
| `/` | Farpy - Render Blender + Octane files for less | Present | `https://farpy.com` | index/follow | Present |
| `/acceptable-use` | Acceptable use - Farpy | Present | Present | index/follow | Present |
| `/account` | Account - Farpy | Present | Present | noindex/nofollow | Present |
| `/addon` | Farpy Render Delivery Blender add-on - Farpy | Present | Present | index/follow | Present |
| `/api` | Beta API - Farpy | Present | Present | index/follow | Present |
| `/contact` | Contact - Farpy | Present | Present | index/follow | Present |
| `/dmca` | DMCA - Farpy | Present | Present | index/follow | Present |
| `/docs` | Docs - Farpy | Present | Present | index/follow | Present |
| `/downloads` | Downloads - Farpy | Present | Present | index/follow | Present |
| `/faq` | FAQ - Farpy | Present | Present | index/follow | Present |
| `/files` | Files - Farpy | Present | Present | index/follow | Present |
| `/ops` | Farpy Ops - Farpy | Present | canonical inherited as `/` | noindex/nofollow | Present |
| `/pricing` | Pricing - Farpy | Present | Present | index/follow | Present |
| `/privacy` | Privacy policy - Farpy | Present | Present | index/follow | Present |
| `/proof` | Farpy Proof - Farpy | Present | Present | index/follow | Present |
| `/receipt` | Render receipt - Farpy | Present | Present | noindex/nofollow | Present |
| `/refunds` | Refunds - Farpy | Present | Present | index/follow | Present |
| `/security` | Security - Farpy | Present | Present | index/follow | Present |
| `/signin` | Sign in - Farpy | Present | Present | noindex/nofollow | Present |
| `/signup` | Create account - Farpy | Present | Present | noindex/nofollow | Present |
| `/status` | Status - Farpy | Present | Present | index/follow | Present |
| `/terms` | Terms of service - Farpy | Present | Present | index/follow | Present |
| `/topup` | Top up balance - Farpy | Present | Present | noindex/nofollow | Present |
| `/workspace` | Package tracker - Farpy | Present | Present | noindex/nofollow | Present |

## JSON-LD

Found schema:

- `Organization`: sitewide in `src/app/layout.tsx`
- `WebSite`: sitewide in `src/app/layout.tsx`
- `Service`: homepage in `src/app/page.tsx`
- `FAQPage`: FAQ section in `src/components/FaqSection.tsx`
- `DigitalDocument`: proof detail pages in `src/app/proof/[slug]/page.tsx`

Requested schema coverage:

| Schema | Status | Evidence |
|---|---|---|
| Organization | GREEN | Sitewide JSON-LD |
| SoftwareApplication | RED | Not found |
| FAQ | GREEN | `FAQPage` emitted by FAQ section |
| Article | RED | Not found; proof pages use `DigitalDocument` |
| Breadcrumb | RED | Not found |
| Product | RED | Not found |
| WebSite | GREEN | Sitewide JSON-LD |

Notes:

- Homepage uses `Service` with `AggregateOffer`, which is a good fit for render-service pricing.
- Add-on and Benchmark may eventually justify `SoftwareApplication`, but that schema is not currently implemented.
- Breadcrumb schema is absent across docs/legal/benchmark pages.

## Sitemap

Main sitemap: `out/sitemap.xml`

Main sitemap URL count: **15**

Included:

- `/`
- `/pricing`
- `/faq`
- `/docs`
- `/addon`
- `/api`
- `/files`
- `/acceptable-use`
- `/security`
- `/privacy`
- `/terms`
- `/refunds`
- `/dmca`
- `/contact`
- `/status`

Separate benchmark sitemap: `out/benchmark/sitemap.xml`

Benchmark sitemap URL count: **3**

- `/benchmark/leaderboard`
- `/benchmark/latest`
- `/benchmark/search`

Missing from main sitemap but public/indexable:

- `/downloads`
- `/proof`
- `/proof/studio-render`
- `/proof/lakeside-scene`
- `/proof/abstract-loop`
- `/proof/motion-design`
- `/proof/product-still`
- `/proof/material-study`
- `/benchmark/`
- `/benchmark/api`
- `/benchmark/compare`
- `/benchmark/gpu`
- `/benchmark/result`

Duplicates: none found in `sitemap.ts`.

Sitemap index: not found.

Risk: benchmark sitemap exists but `robots.txt` advertises only `https://farpy.com/sitemap.xml`, so crawlers may not discover benchmark URLs via robots.

## robots.txt

Generated `out/robots.txt`:

- Allows `/`
- Disallows `/workspace`
- Disallows `/account`
- Disallows `/topup`
- Disallows `/signin`
- Disallows `/signup`
- References `Sitemap: https://farpy.com/sitemap.xml`
- Sets `Host: https://farpy.com`

GREEN:

- Private app surfaces are blocked.
- Sitemap reference exists.

YELLOW:

- `/receipt` is noindexed by page metadata but not disallowed in robots.
- `/ops` is noindexed by page metadata but not disallowed in robots.
- `/benchmark/sitemap.xml` is not referenced.

## Internal Linking

Homepage outgoing links:

- `/`
- `/#start`
- `/account`
- `/addon`
- `/api`
- `/benchmark`
- `/contact`
- `/dmca`
- `/docs`
- `/downloads`
- `/faq`
- `/pricing`
- `/privacy`
- `/refunds`
- `/status`
- `/terms`
- `/topup`
- `/workspace`

Orphan or weakly linked app pages in built output:

- `/acceptable-use`
- `/files`
- `/ops`
- `/proof`
- `/receipt`
- `/security`
- `/signup`

Interpretation:

- `/ops`, `/receipt`, `/signup` being weak/noindex is acceptable.
- `/acceptable-use`, `/files`, `/security`, and `/proof` are public/trust pages and could use footer/docs links if intentionally indexable.
- `/downloads` has only one detected incoming link from homepage, so it is weakly linked despite being important.

## Images

GREEN:

- Generated OpenGraph image exists via `src/app/opengraph-image.tsx`.
- Built homepage emits OG image metadata:
  - `og:image`
  - `og:image:width=1200`
  - `og:image:height=630`
  - `og:image:alt`
  - Twitter image equivalents
- `favicon.svg`, `favicon.ico`, and `apple-touch-icon.png` are present.

YELLOW:

- No normal content `<img>` / Next Image usage found in current app source, so there is little image alt text to audit.
- Homepage visual proof block currently says sample render gallery is coming after Alpha User #1; that is honest, but it means image SEO is thin.

RED:

- No static social image files like `public/opengraph-image.png`; social image is generated by Next route instead. This is not broken, but some static-hosting setups need verification that `/opengraph-image` is served correctly after export/deploy.

## Performance SEO

Observed from `out/index.html` and bundle inventory:

GREEN:

- Static export is enabled: `next.config.ts` has `output: "export"`.
- Font is self-hosted and preloaded.
- Scripts are async/preloaded by Next.
- CSS/JS are chunked.

YELLOW:

- Largest JS chunks observed:
  - `3j9pm5otqxm82.js` ~226 KB
  - `2gj5bmeov-r8f.js` ~137 KB
  - `0cz1d0mv5g_q7.js` ~112 KB
- Largest CSS chunk observed: `3gcm9u1drpra1.css` ~167 KB.
- Google tag script is preloaded on the homepage; verify analytics still does not delay interaction on low-end mobile.
- One inline no-flash boot script is present.

RED:

- No hard SEO blocker found from bundle size alone.

## URL Structure

Benchmark pages:

- `/benchmark/`
- `/benchmark/api/`
- `/benchmark/compare/`
- `/benchmark/gpu/`
- `/benchmark/latest/`
- `/benchmark/leaderboard/`
- `/benchmark/result/`
- `/benchmark/search/`

Receipt pages:

- `/receipt` noindex shell
- Tokenized receipt URLs are backend/API-driven and should remain private/noindex.

Docs / FAQ / pricing / addon / API / status:

- `/docs`
- `/faq`
- `/pricing`
- `/addon`
- `/api`
- `/status`

Dynamic / programmatic routes:

- `/proof/[slug]`: 6 static generated proof pages.
- `/workspace/[id]`: private noindex package tracker.
- Benchmark static generator pages use fallback paths such as `/benchmark/gpu/unknown` in canonical metadata for exported placeholder pages.

## Content Inventory

Approximate exported word counts from `.txt` route artifacts:

| Route | Words | Thin? |
|---|---:|---|
| `/` | 2335 | No |
| `/acceptable-use` | 1594 | No |
| `/account` | 1204 | No, noindex |
| `/addon` | 1515 | No |
| `/api` | 2040 | No |
| `/contact` | 1330 | No |
| `/dmca` | 1657 | No |
| `/docs` | 2211 | No |
| `/downloads` | 1540 | No |
| `/faq` | 2507 | No |
| `/files` | 1573 | No |
| `/ops` | 1101 | No, noindex |
| `/pricing` | 1790 | No |
| `/privacy` | 1660 | No |
| `/proof` | 1112 | No |
| `/receipt` | 1224 | No, noindex |
| `/refunds` | 1453 | No |
| `/security` | 1514 | No |
| `/signin` | 1112 | No, noindex |
| `/signup` | 1107 | No, noindex |
| `/status` | 1662 | No |
| `/terms` | 1750 | No |
| `/topup` | 1223 | No, noindex |
| `/workspace` | 1233 | No, noindex |

Thin pages under 300 words: none found among main exported app pages.

Estimated indexable pages:

- Main indexable app pages: 17
- Proof detail pages: 6
- Benchmark static pages: 8
- Approximate total indexable public pages: 31

## GREEN - Already Implemented

- Static export exists.
- Global title template and metadata base exist.
- Default meta description exists.
- Canonicals are present on most App Router pages.
- OpenGraph and Twitter card metadata are present globally.
- Generated OG image includes dimensions and alt text.
- Organization and WebSite JSON-LD exist.
- Homepage Service schema exists with offer data.
- FAQPage schema exists.
- Proof detail pages have DigitalDocument schema.
- Sitemap exists.
- robots.txt exists and references sitemap.
- Private workspace/account/topup/signin/signup routes are noindexed or blocked.
- Legal/policy routes exist.
- Main marketing/docs pages are not thin.

## YELLOW - Could Improve

P1:

- Add `/downloads` to main sitemap if it remains public/indexable.
- Add `/proof` and intentional proof detail pages to sitemap, or noindex them if they are only examples.
- Reference `/benchmark/sitemap.xml` in robots or create a sitemap index.
- Fix benchmark static placeholder metadata (`unknown`, missing descriptions/canonicals).
- Decide whether `/proof` should be a public SEO surface; current example proof data is honest but could confuse if read as live production proof.
- Add footer/docs links for public trust pages: `/acceptable-use`, `/files`, `/security`, and maybe `/proof`.
- Give `/ops` its own canonical or keep it out of static public export if possible.

P2:

- Add Breadcrumb JSON-LD to docs/legal/benchmark pages.
- Add SoftwareApplication JSON-LD to `/addon` and Benchmark pages if those pages remain product surfaces.
- Add Product schema only if Farpy wants product rich-result eligibility and the claims remain bounded.
- Verify `/opengraph-image` serves correctly on production static/proxy deployment.
- Reduce source/output mojibake in comments and benchmark titles; mostly not customer-facing but messy.
- Revisit homepage `Service` offer labels: JSON-LD still says Normal/Express lane while public copy has moved to Standard/Priority.

## RED - Missing

P0:

- None found.

P1:

- Main sitemap does not cover all intentional public/indexable surfaces.
- Benchmark static SEO is incomplete and contains placeholder `unknown` titles/canonicals.
- `robots.txt` does not advertise the benchmark sitemap.

P2:

- No Breadcrumb schema.
- No SoftwareApplication schema.
- No Article schema.
- No Product schema.
- Limited normal image/content-image SEO because the current UI is mostly CSS/SVG and generated social imagery.

## Priority Order

### P0

None.

### P1

1. Decide public proof indexing policy: either sitemap intentional proof pages or noindex examples.
2. Add `/downloads` to sitemap.
3. Expose benchmark sitemap through robots or sitemap index.
4. Fix benchmark placeholder metadata and missing canonicals.
5. Link public trust/policy pages that are currently orphaned or weakly linked.

### P2

1. Add Breadcrumb JSON-LD where appropriate.
2. Add SoftwareApplication JSON-LD for add-on/benchmark.
3. Verify production OG image serving.
4. Clean source comment mojibake and benchmark title mojibake.
5. Consider real render/gallery imagery after Alpha User #1.

## Missing Opportunities Compared Against Current Implementation

- `/downloads` is real and important but absent from sitemap.
- Benchmark has real static pages and a separate sitemap, but discovery is incomplete.
- Add-on is a software download page but lacks SoftwareApplication schema.
- FAQ schema exists on homepage FAQ component, but route-level `/faq` should be checked after future changes to ensure FAQ schema remains emitted there too.
- Proof pages exist but lack a clear SEO policy: public proof asset vs example-only trust support.

## Overall Verdict

SEO readiness: **YELLOW / launch-safe**

No P0 SEO blocker was found. Farpy is indexable, has correct baseline metadata, and avoids indexing private app surfaces. The highest-value improvements are sitemap completeness and benchmark/proof metadata cleanup.
