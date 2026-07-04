# TRUST_CHAIN_AUDIT_V1

Status: YELLOW
Date: 2026-06-30
Mode: READ_ONLY audit, no product code changes

## Objective

Audit every trust promise Farpy makes and answer:

- Where is it implemented?
- Where is it verified?
- Can the customer independently verify it?
- Where can the promise break?

## Overall Verdict

YELLOW.

Farpy has real trust primitives: receipt JSON, SHA-256 fields, token-gated downloads/receipts, wallet ledger events, failed-wallet-refund handling, benchmark receipt APIs, and NodeMuncher E2E proof notes. The chain is strong enough for retail alpha, but not all promises are independently customer-verifiable yet. The largest gaps are public proof depth, fresh paid-user proof still being operator-driven, and refund/payment proof outside wallet-funded failure cases.

No RED finding was proven in this audit.

## Trust Promise Matrix

| Promise | Verdict | Where Implemented | Where Verified | Customer Independent Verification | Where It Can Break |
| --- | --- | --- | --- | --- | --- |
| Receipt-backed completed packages | GREEN/YELLOW | `scripts/job-api.mjs:484-522` mints receipt JSON with `receipt_id`, `job_id`, `input_sha256`, `output_sha256`, cost, renderer, frames. Receipt endpoint at `scripts/job-api.mjs:2735-2745`. UI at `src/components/ReceiptPage.tsx:180-263`. | Regression/private checks in `scripts/production-regression-audit-v1.ps1` and `scripts/regression/platform-regression-suite-v1.ps1`; receipt canonicalization in `release/AUDIT_CANONICAL_RECEIPT_DOWNLOAD_URLS_V1.md`. | Yes, if customer has the private receipt URL/token. They can view raw JSON, Receipt ID, Job ID, renderer, frames, cost, and output SHA. | Receipt only proves what backend recorded. If receipt generation fails, customer has no receipt. Public proof page does not expose private receipts. Card-funded failed render correction may still require support review unless job path stamps clear state. |
| SHA-256 verified downloads | GREEN/YELLOW | Hash helper at `scripts/job-api.mjs:128`; output hash stored at `scripts/job-api.mjs:478`; download response includes `x-farpy-output-sha256` at `scripts/job-api.mjs:66-69`; receipt stores `output_sha256` at `scripts/job-api.mjs:497`. Receipt UI copy/copy box at `src/components/ReceiptPage.tsx:219-233`. | Download/receipt scripts validate tokenized URL and receipt fields when env vars are supplied. Addon/benchmark artifacts have `.sha256` sidecars and public proof reads sidecars in `src/components/PublicProofPage.tsx:177-190`. | Partially. Customers can download ZIP, compute local SHA-256, and compare with receipt/header. The UI exposes the receipt hash but does not yet provide an in-browser verifier for downloaded ZIP bytes. | If ZIP is regenerated after receipt, hash mismatch would be detectable only if customer checks. If tokenized URLs are lost, customer cannot fetch proof without account/history support. |
| Wallet tracked | GREEN | Wallet ledger stored as append-only JSONL keyed by hashed user ID at `scripts/job-api.mjs:175`, read at `scripts/job-api.mjs:260-272`, appended idempotently at `scripts/job-api.mjs:356-407`. Account/wallet APIs require auth at `scripts/job-api.mjs:2464-2486`. UI reads balance at `src/components/Workspace.tsx:180-188`. | Public regression checks account shell; private account/history proof still operator-driven. Ledger idempotency appears in wallet append code and release notes. | Yes, signed-in customer can see wallet balance/history in account UI. They cannot independently inspect server ledger file, but can compare displayed balance/history against receipts and Stripe/BTCPay records. | Ledger corruption, duplicate webhook bugs, or missing history rendering could break trust. Existing duplicate checks cover `event_id`, Stripe session, and Lightning invoice ID, but offsite restore proof remains relevant to long-term wallet durability. |
| Refunds/no charge without delivery | YELLOW | Failed wallet debit refund path at `scripts/job-api.mjs:416-453`; NodeMuncher/worker failure routes call refund at `scripts/job-api.mjs:2420-2435` and `2438-2461`. Refund policy copy at `src/app/refunds/page.tsx:13-28` and terms at `src/app/terms/page.tsx:54-62`. | `release/FAILED_WALLET_REFUND_FIX_V1.md` proves JOB-B13C609B refund idempotency and no receipt/output exposure. | Partially. Customer can see wallet refund/balance and absence of receipt/download. Card checkout refund behavior is policy-backed, not fully customer-self-verifiable without operator/payment-provider evidence. | Non-wallet card charge failures may still require support review. If failure path misses `refundFailedWalletDebit`, wallet debit could remain until alert/support/backfill catches it. |
| Token-gated downloads | GREEN | Secret token creation at `scripts/job-api.mjs:129`; timing-safe compare at `scripts/job-api.mjs:130-134`; download endpoint at `scripts/job-api.mjs:2723-2732`; receipt endpoint at `scripts/job-api.mjs:2735-2745`. | Security audit/fix notes, plus `JOB_STATUS_TOKEN_DISCLOSURE_FIX_V1` behavior in code at `scripts/job-api.mjs:2748-2756` where unauth job status returns safe status. Regression suite optional download check. | Yes, with private URL/token. Wrong/missing token returns `404`, so customers can verify link works but cannot audit token secrecy. | URL/token leakage through screenshots/referrers/logs remains a risk class. If account history loses tokenized URL, customer may need support. |
| Package tracking | GREEN/YELLOW | Workspace fetches job status and renders package journey in `src/components/Workspace.tsx`; private URLs built from receipt/download tokens at `src/components/Workspace.tsx:128-134`. Safe public status redaction at `scripts/job-api.mjs:2748-2756`. | Platform regression suite checks `/workspace`; current run found production copy drift, documented in `release/PLATFORM_REGRESSION_SUITE_V1.md`. | Partially. Customer can track their own package if authenticated or if tokenized URL is preserved. Public-safe unauth status is intentionally redacted. | Current production regression suite found `/workspace` missing expected subtitle. Status can confuse if tokens are absent or if a failed job lacks clear next action. |
| Public proof | YELLOW | `/proof` page at `src/app/proof/page.tsx`; data component at `src/components/PublicProofPage.tsx:75-190`; downloads SHA sidecars and latest benchmark API are public-safe. | Public route included in launch audits and sitemap/link fixes; component probes website, render API, worker status, leaderboard API. | Partially. Visitors can see public health checks, benchmark results, and artifact SHA sidecars. Render proof rows currently show `No public proof yet` for completed jobs/frames/receipts/output SHA examples. | Promise can feel underpowered because core render proof is not yet populated publicly. Good behavior is honest fallback, not fake metrics. |
| Benchmark public trust | GREEN/YELLOW | Benchmark APIs/pages implemented in earlier milestones; public proof consumes `/node/v1/leaderboard/latest?limit=5`; regression suite checks `/benchmark`, `/node/v1/leaderboard/stats`, `/top`. Download hashes are public sidecars. | Platform regression suite currently passes benchmark page/API checks. Benchmark release notes document installer hashes and runtime fixes. | Yes for public benchmark rows/download artifacts. Users can fetch leaderboard APIs and installer SHA sidecars. | Benchmark desktop requires local Blender 4.x. If users miss that requirement, trust can drop. Benchmark promotion was previously marked deferred/limited. |
| NodeMuncher trust | YELLOW | Node token/heartbeat/lease endpoints exist; missing token rejected in regression suite. NodeMuncher E2E and watchdog are documented as GREEN in release reports, but source is partly outside this frontend repo. | Current suite checks heartbeat and lease peek fail-closed. Prior reports list NodeMuncher E2E/watchdog/local install green. | Not for general customers yet. NodeMuncher is controlled alpha, so proof is operator/internal rather than public retail proof. | Broad public launch would need installer signing/update path, earnings/history UX, recovery behavior, and friend-install proof. Current promise should remain controlled-alpha only. |
| Add-on package trust | GREEN/YELLOW | `/addon` page, ZIP in `public/downloads`, SHA display/sidecar, add-on audit notes. Public proof lists add-on/download sidecar style. | `release/ADDON_PRODUCTION_DEPLOY_V1.md`, `release/BLENDER_ADDON_FINAL_AUDIT_V1.md`, and production regression scripts. | Yes for ZIP hash. User can download add-on and compare SHA-256. | Browser-to-add-on auth/session clarity remains weaker than website flow. Add-on cannot independently prove server-side receipt until user opens workspace/receipt. |
| Payment rail posture | YELLOW | Stripe checkout auth/malformed JSON fail-closed at `scripts/job-api.mjs:2500-2510`. BTCPay invoice auth route at `scripts/job-api.mjs:2512-2525`. Webhook signature validation at `scripts/job-api.mjs:2683-2696`. Lightning UI gated in top-up copy/history. | Platform regression suite checks checkout malformed JSON, unauth checkout, unauth Bitcoin invoice. Payment rail reports say card visible and fail-closed, Bitcoin backend proof green, Lightning hidden/gated. | Partially. Customer can verify card checkout and wallet credit after payment. Bitcoin invoice proof depends on authenticated browser click and BTCPay checkout. Lightning is intentionally hidden. | Fresh-new-account paid E2E and authenticated Bitcoin browser-click proof were still listed as pending operator proofs in final freeze report. |

## Top Trust Strengths

1. Receipts are concrete JSON artifacts, not just UI copy.
2. Output SHA-256 is stored in both job/receipt state and exposed in download headers.
3. Download and receipt endpoints require token match and return `404` on missing/wrong token.
4. Unauthenticated job status is redacted before private URLs are returned.
5. Wallet ledger appends are idempotent by event/session/invoice identifiers.
6. Failed wallet-funded jobs without output/receipt have an idempotent refund path.
7. Public benchmark APIs and artifact SHA sidecars are independently fetchable.
8. Public proof page avoids fake metrics and says `No public proof yet` when data is unavailable.
9. NodeMuncher auth gates reject missing tokens in the regression suite.
10. Launch audit scripts now encode the trust promises as repeatable checks.

## Main Trust Gaps

1. Public proof does not yet show live completed render counts, receipt counts, or latest output SHA examples.
2. Fresh paid-user E2E remains operator-driven rather than continuously proven.
3. Card-funded failure/refund chain is policy-backed but less automatically proven than wallet-funded failure refunds.
4. Customer-side SHA verification requires manual local hashing; no built-in download verifier exists.
5. NodeMuncher trust is still controlled-alpha/internal, not independently verifiable by broad public users.
6. Account history/token loss can make receipt/download verification depend on support.
7. Current platform regression suite found production UI drift on workspace/homepage copy, which affects trust language consistency.

## Customer Verification Levels

| Level | Promises |
| --- | --- |
| Fully customer-verifiable with URL/data | Receipt JSON, output SHA, tokenized download, benchmark APIs, download SHA sidecars |
| Customer-visible but server-trust dependent | Wallet balance/history, package tracking, payment status, refunds |
| Operator/internal proof today | NodeMuncher E2E, offsite restore, full paid-user smoke, render partner health |
| Honest placeholder today | Public proof completed jobs/frames/receipts counts |

## Recommended Next Actions

1. Fix production copy drift caught by `PLATFORM_REGRESSION_SUITE_V1`: stale homepage `Render Lane` and missing workspace subtitle.
2. Run `PAID_BROWSER_SMOKE_V1` with a fresh or operator-approved account and capture receipt/download/hash proof.
3. Populate `/proof` with public-safe real counts only when there is a receipt-derived source that does not expose private customer data.
4. Add an optional customer-facing SHA verification guide or tiny local command snippet near receipt/download.
5. Keep NodeMuncher language controlled-alpha until public installer/signing/update/earnings proof is complete.

## Commands Run

Read-only inspection:

```powershell
rg -n "Receipt-backed|SHA-256|SHA256|Wallet tracked|refund|Refund|Download|Package tracking|Public proof|Benchmark|NodeMuncher|receipt|delivery receipt|verified|wallet|proof" src public release scripts -S
Select-String -Path <target files> -Pattern "receipt|sha256|download_token|receipt_token|refund|wallet|public proof|benchmark|NodeMuncher|complete|zip|token|history|proof|debit|balance|rendered_file_count|output_size|download_url|receipt_url"
Get-Content scripts\job-api.mjs selected line ranges
Get-Content src\components\PublicProofPage.tsx selected line ranges
Get-Content src\app\refunds\page.tsx selected line ranges
Get-Content src\app\terms\page.tsx selected line ranges
```

No production mutations were made.
No code changes were made.
No secrets were printed.
