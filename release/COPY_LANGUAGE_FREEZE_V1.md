# COPY_LANGUAGE_FREEZE_V1

Status: DOCUMENTED
Date: 2026-06-30
Mode: Read-only customer-facing copy audit. No code, API, backend, or production changes.

## Objective

Freeze Farpy customer-facing vocabulary around canonical terms only, find inconsistencies, and define forbidden synonyms before additional launch copy changes.

Canonical launch terms:

- Package
- Render Partner
- Delivery
- Receipt / Delivery Receipt
- Wallet
- Download
- Refund
- NodeMuncher
- Benchmark

## Verdict

YELLOW.

The main retail journey is mostly aligned: homepage, workspace, account, status, add-on, and docs use `Package`, `Render Partner`, `Delivery Receipt`, `Wallet`, `Download`, and `Refund` in the right places. The remaining inconsistency is that some customer-visible docs/legal/API/proof copy still says `render jobs`, `jobs`, `worker`, or `queue` where a normal user should see `packages`, `render partners`, or `delivery` language.

No P0 launch blocker was found. This is a copy freeze/audit issue, not a functional defect.

## Canonical Vocabulary

| Concept | Canonical customer term | Notes |
| --- | --- | --- |
| Uploaded work unit | Package | Use for the thing a customer sends to Farpy. |
| Machine/person/network that renders | Render Partner | Use in customer surfaces. Internal code can keep worker/node. |
| Completion event | Delivery / Package delivered | Avoid “job complete” in user copy. |
| Proof artifact | Delivery Receipt / Receipt | Use Delivery Receipt on receipt/customer pages; Receipt is acceptable in compact UI. |
| Stored balance | Wallet | Keep plain and calm on money pages. |
| Output action | Download / Download package result / Download ZIP | ZIP remains allowed and helpful. |
| Reversal | Refund | Use “returned to wallet” where it clarifies wallet-funded failures. |
| Worker product | NodeMuncher | Keep as product name only; do not use it as first-user CTA. |
| Benchmark product | Benchmark | Keep as standalone utility name. |

## Forbidden Customer-Facing Synonyms

These should not appear in normal customer journey copy except in allowed technical contexts below.

| Forbidden / legacy term | Replace with |
| --- | --- |
| render job | package |
| job | package |
| worker | render partner |
| node | render partner, or hide in Verification Details |
| queue | delivery, waiting, dispatcher, or package tracker state |
| lease | hide; only use in internal/operator/debug surfaces |
| backend | service/API only in technical docs |
| render factory | render partner |
| factory failed | render partner encountered a problem |
| Start a render | Send package |
| Pay & Render | Pay and send package |
| View Receipt | View delivery receipt |
| Download ZIP | Download package result, except where ZIP specificity is useful |

## Allowed Technical Exceptions

These terms may remain when they are explicitly technical, legal, API, support, or verification details:

- `job_id`, `receipt_id`, `node_id`, `worker_id`, `lease_id` field names.
- API docs that describe actual endpoint names such as `/jobs/{job_id}`.
- Operator-only pages such as `/ops` and internal release notes.
- Legal/privacy/security pages where “job” or “render job” refers to contractual/service behavior, though package language is preferred when readable.
- Code comments and TypeScript field names matching backend contracts.
- Benchmark leaderboard copy, where “benchmark result” is the correct product term.

## Current Alignment

| Surface | Status | Evidence |
| --- | --- | --- |
| Homepage | GREEN | `src/components/HomeRenderFlow.tsx` uses `Send package`, `Render Partner`, `Receipt`, `Wallet tracked`, and package-label flow. |
| World language helper | GREEN with note | `src/lib/worldLanguage.ts` centralizes package/render-partner/delivery labels. Note: icon literals appear mojibaked in source output from the terminal view, but this audit is language-only. |
| Workspace | GREEN | `src/components/Workspace.tsx` uses Package tracker, Package ID, Render Partner ID, Download package result, View delivery receipt, refund-safe failed copy. |
| Receipt page | GREEN | `src/components/ReceiptPage.tsx` uses Delivery Receipt, Package delivered, Download ZIP, View package tracker, Verification Details. |
| Account | GREEN | `src/components/AccountPage.tsx` uses package history, delivery receipts, wallet history, refund history. |
| Topup | GREEN | `src/components/TopUpPage.tsx` keeps wallet/topup language plain and says render packages. |
| Status | GREEN | `src/app/status/page.tsx` uses Wallet, Rendering, Render partners, Downloads, Receipts. |
| Add-on page | GREEN | `src/components/AddonPage.tsx` uses Farpy Render Delivery, send package, track package, delivery receipt. |
| Docs | YELLOW | Mostly aligned, but support/troubleshooting still exposes `job_id` and uses “Render history” heading. Technical IDs are acceptable; heading should become Package history in next copy pass. |
| FAQ | YELLOW | Uses delivery receipt correctly, but still says failed renders and support asks for job/payment details. Mostly acceptable; could translate first sentence to packages. |
| Legal/privacy/acceptable use | YELLOW | Several instances of `render jobs`, `jobs`, and `job` remain. Legal precision is acceptable, but customer readability would improve with package-first wording. |
| API docs | GREEN technical exception | `src/components/ApiPage.tsx` correctly uses endpoint names and job_id fields. |
| Public proof | YELLOW | `src/components/PublicProofPage.tsx` says Jobs completed; public proof could say Packages delivered while retaining receipt/result IDs. |
| Ops command center | GREEN internal exception | Operator-only copy may keep Jobs, Workers, Nodes, backend/API labels. |

## Inconsistencies Found

### P1: Legal and policy pages still use job-first language

Evidence:

- `src/app/terms/page.tsx` says `Render jobs may fail`, `review the job`, and `fail jobs`.
- `src/app/privacy/page.tsx` says `create jobs` and `job status records`.
- `src/app/acceptable-use/page.tsx` says `render jobs` and `fail jobs`.
- `src/app/refunds/page.tsx` says `render jobs` and asks for `job_id`.

Recommended fix:

Use customer-first wording in sentences, while retaining technical IDs in support detail lists.

Example:

- `Render jobs may fail` -> `Packages may fail to render`.
- `review the job` -> `review the package`.
- `job_id` remains allowed as a support field.

### P1: Public proof still says Jobs completed

Evidence:

- `src/components/PublicProofPage.tsx` uses `Jobs completed`.

Recommended fix:

- `Jobs completed` -> `Packages delivered`.

### P1: Docs section heading says Render history

Evidence:

- `src/app/docs/page.tsx` has heading `Render history`.

Recommended fix:

- `Render history` -> `Package history`.

### P2: API page uses user-facing headings with job terminology

Evidence:

- `src/components/ApiPage.tsx` says `Anonymous jobs and account wallet endpoints`, `Anonymous render jobs are supported`, and endpoint summaries use job terminology.

Recommended fix:

Keep endpoint names unchanged but add a customer-facing bridge sentence:

- `API uses job_id for package records.`

This is not launch-blocking because API docs are technical.

### P2: Pricing/FAQ still mention queue/Normal/Fast in explanatory copy

Evidence:

- `src/app/pricing/page.tsx` says `Normal`, `Fast`, and `fast queue`.
- `src/components/FaqSection.tsx` says `Normal renders`, `Fast renders`, and `fast queue`.

Recommended fix:

Map to delivery language when customer-facing:

- `Normal` -> `Standard`.
- `Fast` -> `Priority`.
- `fast queue` -> `Priority delivery`.

Preserve existing pricing math and internal queue names.

## Freeze Rules For Future Copy

1. Customer journey pages must use `Package`, not `job`.
2. Customer pages must use `Render Partner`, not `worker`, `node`, or `render factory`.
3. Customer pages must use `Delivery Receipt` or `Receipt`, not raw “proof JSON” language above the fold.
4. Use `Wallet` for balance and topups. Do not invent payment metaphors on money pages.
5. Use `Refund` and `returned to wallet` for failed no-delivery outcomes.
6. Keep `NodeMuncher` as the worker product name only.
7. Keep `Benchmark` as the standalone utility name only.
8. Technical identifiers remain exact: `Job ID`, `Receipt ID`, `Node ID`, `worker_id`, endpoint paths, and JSON fields are allowed in Verification Details, API docs, support templates, and ops views.
9. Internal release notes do not need historical rewrites, but new release notes should prefer frozen terms in summaries.
10. If a copy change conflicts with API truth, preserve API truth and add a customer-facing translation around it.

## Recommended Next Copy Patch

Smallest safe future patch:

1. `src/app/docs/page.tsx`: `Render history` -> `Package history`.
2. `src/components/PublicProofPage.tsx`: `Jobs completed` -> `Packages delivered`.
3. `src/app/terms/page.tsx`: translate visible `render jobs/job/fail jobs` sentences to package language.
4. `src/app/privacy/page.tsx` and `src/app/acceptable-use/page.tsx`: package-first wording, keep technical records in detail clauses.
5. `src/app/pricing/page.tsx` and `src/components/FaqSection.tsx`: map Normal/Fast queue copy to Standard/Priority delivery.

Do not touch backend fields or endpoint names.

## Commands Run

```powershell
rg -n "render factory|Render Factory|factory failed|worker|Worker|job|Job|queue|Queue|queued|render job|Render job|delivery receipt|Delivery Receipt|receipt|Receipt|package|Package|Render Partner|render partner|node|Node|lease|Lease|backend|Backend|refund|Refund|wallet|Wallet|download|Download|NodeMuncher|Benchmark|Start a render|Pay & Render|Workspace|workspace|Delivery|delivery" src public release -S
rg -n "Render Factory|render factory|render factories|factory failed|Start a render|Start Rendering|Pay & Render|render job|Render job|job queue|worker|Worker|backend|Backend|lease|Lease|node|Node" src public --glob '!public/downloads/**' -S
rg -n "Package|package|Render Partner|render partner|Delivery|delivery|Receipt|receipt|Wallet|wallet|Download|download|Refund|refund|NodeMuncher|Benchmark" src --glob '*.tsx' --glob '*.ts' -S
rg -n "render jobs|Render jobs|jobs|Jobs|job_id|receipt_id|Render Partner|render partner|render factory|worker|node|queue|backend|Download ZIP|View receipt|View Receipt|Delivery Receipt|delivery receipt" src\app src\components src\lib --glob '*.tsx' --glob '*.ts' --glob '!*.bak*' -S
Get-Content src\lib\worldLanguage.ts
Get-Content src\components\HomeRenderFlow.tsx
Get-Content src\app\docs\page.tsx
Get-Content src\app\terms\page.tsx
```

## Changes

Documentation only:

- `release/COPY_LANGUAGE_FREEZE_V1.md`

No product code changed.
No backend code changed.
No production deployment performed.
No secrets printed.
