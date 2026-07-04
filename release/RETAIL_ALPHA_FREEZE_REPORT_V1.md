# RETAIL_ALPHA_FREEZE_REPORT_V1

Date: 2026-06-29

## Verdict

YELLOW / RETAIL ALPHA FREEZE

Farpy is frozen for controlled retail alpha use. The customer-facing render path, wallet/card rail, receipt/download surface, and launch copy are bounded to the current safe operating stage. Broad launch remains blocked until a brand-new account completes the full top-up -> render -> download -> receipt proof with operator-controlled auth and Stripe payment input.

## Green

| Area | Status | Evidence |
| --- | --- | --- |
| Farpy frontend/backend | Frozen | Launch closure docs show no public P0 blockers; backend hardening and static route fixes completed. |
| Product language | GREEN | `FARPY_PRODUCT_LANGUAGE_V1` passed; customer copy explains simply while preserving advanced proof details. |
| Stage limits copy | GREEN | `FARPY_STAGE_LIMITS_COPY_V1` passed; live routes returned 200 and forbidden overclaim grep was clear. |
| Checkout malformed JSON | GREEN | `CHECKOUT_MALFORMED_JSON_FAIL_CLOSED_V1` passed; malformed `/checkout` JSON now returns `400 invalid_json`, unauth valid JSON returns `401 auth_required`. |
| Stripe/card wallet rail | GREEN for current alpha path | Card remains the active public top-up path; Lightning is gated. |
| Receipt/download surface | GREEN for proven jobs | Receipt and download pages are live and included in production audits. |
| NodeMuncher E2E | GREEN | `NODEMUNCHER_PUBLIC_E2E_SMOKE_V1` previously passed. |
| NodeMuncher render watchdog | GREEN | `NODEMUNCHER_RENDER_WATCHDOG_V1` passed; Blender subprocess timeout kills stalled renders and fails closed. |

## Intentionally Deferred

| Area | Status | Reason |
| --- | --- | --- |
| NodeMuncher public worker launch | Controlled alpha only | E2E exists, but token storage, update/signing, fleet durability, and public installer trust are not broad-launch complete. |
| PayPal | Deferred | Card is the active public payment rail; PayPal is not part of the retail alpha contract. |
| Bitcoin Lightning | Gated | UI is disabled by default; Lightning remains blocked until liquidity/channels and invoice -> webhook -> wallet-credit smoke are proven. |
| Benchmark | Halted / final phase | Benchmark is separate from the render-package flow and should not drive the retail alpha launch path. |

## Broad Launch Blockers

| Blocker | Status | Required input |
| --- | --- | --- |
| Fresh-new-account E2E proof | Pending operator input | Fresh email/sign-in completion, approved Stripe/card top-up, known-good `.blend`, and permission to spend through the normal website flow. |

## Current Retail Alpha Contract

- Farpy is early access / production alpha.
- Best for small Blender and Octane render packages today.
- Good uses: previews, tests, splash screens, short frame ranges.
- Users should start with a small package and test before sending larger work.
- Card top-up is the active public payment rail.
- Lightning and PayPal are not public launch rails.
- NodeMuncher is controlled alpha, not a broad public worker network.
- Benchmark is not part of the primary render-package checkout path.

## Freeze Recommendation

YES for controlled retail alpha.

NO for broad launch until `FRESH_NEW_ACCOUNT_E2E_PROOF_V1` completes with a real fresh account, wallet top-up, render, ZIP download, delivery receipt, and account history proof without operator repair.
