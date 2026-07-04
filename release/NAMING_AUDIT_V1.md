# NAMING_AUDIT_V1

Date: 2026-06-30

Status: YELLOW

Mode: Audit only. No production code changed.

## Objective

Find inconsistent naming against the current customer-facing vocabulary freeze.

Canonical terms:

- Package
- Render Partner
- Receipt
- Wallet
- NodeMuncher
- Benchmark

Forbidden legacy terms:

- Render Factory
- Render Lane
- Start a Render

## Summary

Farpy is mostly aligned with the current package / render partner / receipt language on active customer-facing surfaces.

No exact active homepage/build hit was found for:

- Render Factory
- Start a Render
- Start Rendering

However, active source and exported output still contain related lane/job vocabulary that conflicts with the naming freeze:

- Normal lane
- Express lane
- Standard render lane
- express lane
- render jobs

These are not backend issues, but they are customer-facing naming drift and should be cleaned before treating the vocabulary as frozen.

## Commands Run

```powershell
rg -n "Render Factory|render factory|Render factories|render factories|factory failed|Render Lane|render lane|Start a Render|Start a render|Start Rendering|Start rendering|Package|Render Partner|render partner|Receipt|Wallet|NodeMuncher|Benchmark|worker|node|queue|job|render job|lane" C:\Users\danki\Desktop\farpy-frontend\src C:\Users\danki\Desktop\farpy-frontend\public C:\Users\danki\Desktop\farpy-frontend\docs C:\Users\danki\Desktop\farpy-frontend\release -S --glob '!out/**' --glob '!node_modules/**'
```

```powershell
rg -n "Render Factory|render factory|Render factories|render factories|factory failed|Render Lane|render lane|Start a Render|Start a render|Start Rendering|Start rendering|Package|Render Partner|render partner|Receipt|Wallet|NodeMuncher|Benchmark|worker|node|queue|job|render job|lane" C:\Users\danki\Desktop\nodemuncher-codex\src C:\Users\danki\Desktop\nodemuncher-codex\src-nodemuncher C:\Users\danki\Desktop\nodemuncher-codex\src-tauri C:\Users\danki\Desktop\nodemuncher-codex\public C:\Users\danki\Desktop\nodemuncher-codex\release -S --glob '!target/**' --glob '!node_modules/**' --glob '!dist/**' --glob '!dist-nodemuncher/**'
```

```powershell
rg -n "Render Factory|render factory|Render Lane|render lane|Start a Render|Start a render|Start Rendering|Start rendering|Normal lane|Express lane|express lane|render jobs|render job" C:\Users\danki\Desktop\farpy-frontend\src C:\Users\danki\Desktop\farpy-frontend\out C:\Users\danki\Desktop\farpy-frontend\release -S --glob '!node_modules/**' --glob '!out/_next/static/chunks/*.map'
```

## Findings

### P0

None found.

No naming issue found that blocks payment, render, receipt, download, or account flows.

### P1

1. Active homepage metadata / structured data still uses lane language.

Evidence:

- `src/app/page.tsx`: `Normal lane`
- `src/app/page.tsx`: `Standard render lane. Billed only for frames that finish.`
- `src/app/page.tsx`: `Express lane`
- `src/app/page.tsx`: `Express lane for sooner frames where available. Optional. Same output.`
- Exported `out` also contains those strings.

Recommended fix:

- `Normal lane` -> `Standard delivery`
- `Express lane` -> `Priority delivery`
- `Standard render lane...` -> `Standard delivery for completed frames.`
- `Express lane...` -> `Priority delivery where available. Same output.`

2. Active homepage FAQ still uses Normal/Fast and express-lane wording.

Evidence:

- `src/app/page.tsx`: `What's the difference between Normal and Fast?`
- `src/app/page.tsx`: `Fast uses the express lane. Normal is $0.01 per frame, Fast is $0.02 per frame.`

Recommended fix:

- Align with the current UI terms `Standard` and `Priority`.
- Remove `express lane`.

3. Active public/legal copy still says render jobs where package language is expected.

Evidence:

- `src/app/page.tsx`: `Farpy uses uploads to quote and run render jobs.`
- `src/app/acceptable-use/page.tsx`: `Farpy acceptable use rules for public alpha uploads and render jobs.`
- `src/app/refunds/page.tsx`: `Wallet credits are intended for Farpy render jobs.`

Recommended fix:

- Replace customer-facing `render jobs` with `render packages` or `packages`.
- Keep `job_id` only in advanced/developer surfaces.

### P2

1. Historical release notes contain legacy names.

Evidence:

- `release/ADDON_WEBSITE_HANDOFF_V1.md`: `render factory`

Recommendation:

- Do not rewrite historical notes unless they are used as public docs.
- If release notes are customer-visible, add a small glossary note that current copy says `Render Partner`.

2. Old backup source file contains stale workspace naming.

Evidence:

- `src/components/Workspace.tsx.bak.receipt_workspace_ux_20260628T152924Z` contains older workspace language such as worker/render-node style wording.

Recommendation:

- Move backup files out of `src/` or exclude `*.bak.*` from customer-facing copy audits and packaging.
- This avoids stale terms being reintroduced during future patches.

3. Persona term `Rendars` appears in current homepage copy.

Evidence:

- Exported homepage copy includes: `Rendars send packages. NodeMunchers earn by running render partners.`

Recommendation:

- Decide whether `Rendars` is canonical.
- If not, replace with `Customers`, `Artists`, or `People sending packages`.

## Canonical Term Status

| Term | Status | Notes |
| --- | --- | --- |
| Package | GREEN | Strongly present across homepage and workspace language. Some `render jobs` drift remains. |
| Render Partner | YELLOW | Present in current homepage language. Historical and backup files still contain `render factory`. |
| Receipt | GREEN | Present and aligned. Keep `delivery receipt` for customer copy where possible. |
| Wallet | GREEN | Present and appropriate for payment/account surfaces. |
| NodeMuncher | GREEN | Product name is consistently used. Keep broader worker/internal terms out of customer surfaces. |
| Benchmark | GREEN | Used as standalone product name. No blocker found in naming scan. |

## Forbidden Term Status

| Forbidden term | Active status | Evidence |
| --- | --- | --- |
| Render Factory | No exact active build hit found | Historical release note and stale backup source still contain related wording. |
| Render Lane | No exact active build hit found | Active source still has related `Normal lane`, `Express lane`, and `Standard render lane`. |
| Start a Render | No exact active build hit found | Current primary CTA appears aligned to `Send package`. |

## Overall Verdict

YELLOW.

The active product vocabulary is close, but not fully frozen. The remaining P1 issues are localized copy/metadata changes, mainly in `src/app/page.tsx`, `src/app/acceptable-use/page.tsx`, and `src/app/refunds/page.tsx`.

## Next Action

Run a small naming cleanup milestone:

1. Replace lane terminology with Standard/Priority delivery language.
2. Replace customer-facing `render jobs` with `packages` or `render packages`.
3. Decide whether `Rendars` is canonical.
4. Move stale `*.bak.*` files out of `src/` or exclude them from source audits.
