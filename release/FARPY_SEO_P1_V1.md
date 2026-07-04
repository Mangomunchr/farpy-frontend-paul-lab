# FARPY_SEO_P1_V1

Date: 2026-07-01

## Summary

Implemented only the P1 SEO issues identified in `release/FARPY_SEO_AUDIT_V1.md`.

No page redesign, backend change, API change, or new product content was added.

## Files Changed

- `src/app/sitemap.ts`
- `src/app/robots.ts`
- `src/components/SiteFooter.tsx`
- `public/benchmark/index.html`
- `public/benchmark/compare/index.html`
- `public/benchmark/gpu/index.html`
- `public/benchmark/result/index.html`
- `public/benchmark/search/index.html`
- `public/benchmark/sitemap.xml`
- `release/FARPY_SEO_P1_V1.md`

## Exact Fixes

### 1. Fixed Sitemap Omissions

Updated `src/app/sitemap.ts` to include existing public/indexable surfaces that were missing:

- `/downloads`
- `/proof`
- `/proof/studio-render`
- `/proof/lakeside-scene`
- `/proof/abstract-loop`
- `/proof/motion-design`
- `/proof/product-still`
- `/proof/material-study`

Generated main sitemap now contains 23 URLs and has no duplicate entries.

### 2. Referenced Benchmark Sitemap From Robots

Updated `src/app/robots.ts` so generated `robots.txt` references both:

- `https://farpy.com/sitemap.xml`
- `https://farpy.com/benchmark/sitemap.xml`

### 3. Replaced Benchmark Placeholder Metadata

Updated static benchmark shell metadata to remove document-level placeholder titles/canonicals such as:

- `unknown vs unknown`
- `Farpy Benchmark unknown`
- `Score unknown`
- `/benchmark/gpu/unknown`
- `/benchmark/result/unknown`

Updated benchmark shells now use production-safe generic metadata:

- `/benchmark/`
- `/benchmark/compare/`
- `/benchmark/gpu/`
- `/benchmark/result/`
- `/benchmark/search`

Runtime table fallback text such as `unknown` remains unchanged where it truthfully represents missing API data.

### 4. Improved Internal Links For Trust Pages

Updated `src/components/SiteFooter.tsx` to expose existing public trust/download pages:

- Downloads
- Proof
- Files
- Acceptable Use
- Security

Built output now shows incoming footer links for:

- `/acceptable-use`
- `/files`
- `/security`
- `/proof`
- `/downloads`

Private/noindex routes such as `/ops`, `/receipt`, and `/signup` remain weakly linked by design.

## Validation Performed

Command:

```powershell
npm.cmd run build
```

Result:

- Build passed.
- TypeScript passed.
- Static generation passed: 37 pages.

Generated sitemap validation:

- Main sitemap count: 23
- Duplicate main sitemap URLs: 0
- `/downloads` present.
- `/proof` present.
- All six generated `/proof/[slug]` pages present.

Generated robots validation:

- `Sitemap: https://farpy.com/sitemap.xml` present.
- `Sitemap: https://farpy.com/benchmark/sitemap.xml` present.

Benchmark sitemap validation:

- Benchmark sitemap count: 8
- Includes:
  - `/benchmark/`
  - `/benchmark/api`
  - `/benchmark/compare`
  - `/benchmark/gpu`
  - `/benchmark/leaderboard`
  - `/benchmark/latest`
  - `/benchmark/result`
  - `/benchmark/search`

Benchmark placeholder metadata scan:

- No `unknown vs unknown` found in benchmark source/output metadata.
- No `/benchmark/gpu/unknown` metadata found.
- No `/benchmark/result/unknown` metadata found.
- No `Score unknown` metadata found.

Internal link validation:

- `/acceptable-use`: 21 incoming links in built output.
- `/files`: 21 incoming links in built output.
- `/security`: 21 incoming links in built output.
- `/proof`: 21 incoming links in built output.
- `/downloads`: 21 incoming links in built output.

## Remaining P2 Items

- Add Breadcrumb JSON-LD where appropriate.
- Add SoftwareApplication JSON-LD for add-on and benchmark pages if desired.
- Verify production `/opengraph-image` serving after deploy.
- Clean source comment mojibake and any non-user-facing metadata hygiene.
- Consider real render/gallery imagery after Alpha User #1.

FARPY_SEO_P1_V1 = GREEN
