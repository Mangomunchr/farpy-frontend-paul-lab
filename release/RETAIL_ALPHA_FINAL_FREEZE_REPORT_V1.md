# RETAIL_ALPHA_FINAL_FREEZE_REPORT_V1

## Final Recommendation

- Retail alpha: YES
- Broad public launch: NO
- NodeMuncher broad launch: NO

Farpy is suitable for a controlled retail alpha with bounded expectations, small render packages, card payments, receipt-backed delivery, and active operator monitoring. It is not yet positioned for broad public scale, broad public NodeMuncher participation, or fully automated unsupported growth.

## Frontend Status

GREEN

- Homepage first-minute clarity passed.
- Trust strip passed.
- Product language passed.
- Stage limits copy passed.
- Receipt clarity passed.
- Status pillars passed.
- Workspace/package tracker language is customer-readable while preserving Advanced Details.
- Lightning is hidden/gated in public UI.
- PayPal is deferred and not presented as live.

## Backend Status

GREEN

- Checkout malformed JSON fixed.
- Price malformed JSON fixed.
- Job status token disclosure fixed.
- Worker query-token auth removed.
- Env permissions hardened.
- Render, download, and receipt paths are frozen for retail alpha.
- Stripe/card checkout remains visible and fail-closed.
- Bitcoin backend proof is green at the backend/invoice integration level.
- Lightning backend remains fail-closed and gated.

## Security Status

GREEN for retail alpha.

- Tokenized job status URLs are owner-gated.
- Worker/node token query-string fallback removed.
- Sensitive env files hardened.
- Malformed JSON paths fail closed.
- Lightning is not public while liquidity proof is pending.

Known hardening still deferred:

- CSP tightening.
- Rate limit proof expansion.
- EV/macOS signing and broader installer trust work.

## Payment Rail Status

GREEN / CONTROLLED

- Stripe/card: visible, default, fail-closed.
- Bitcoin on-chain backend: proof green; browser-click proof pending.
- Lightning: hidden/gated until liquidity and invoice-to-wallet-credit smoke are proven.
- PayPal: deferred.

## Render / Download / Receipt Status

GREEN

- Render/download/receipt flow is frozen for retail alpha.
- Receipts preserve SHA-256, cost, renderer, frame count, and technical proof.
- Downloads remain ZIP-based.
- Status and receipt pages are customer-readable.
- Completed package delivery language is live.

## NodeMuncher Controlled Alpha Status

GREEN for controlled alpha only.

- NodeMuncher E2E green.
- NodeMuncher watchdog green.
- NodeMuncher local install green.

Not ready for broad public worker launch:

- Signing/update path deferred.
- Broad worker onboarding deferred.
- Public worker scale proof deferred.

## Known Pending Operator Proofs

These are not blockers for controlled retail alpha, but remain required to turn the freeze from controlled alpha to broader public confidence:

- Fresh-new-account Stripe/card paid E2E.
- Authenticated Bitcoin browser-click checkout proof.
- Authenticated owner private receipt/download URL proof.

## Deferred Items

- Broad public NodeMuncher launch.
- Signing/update path.
- Lightning liquidity proof.
- PayPal.
- Benchmark promotion.
- EV/macOS signing.
- CSP tightening.
- Rate limit proof expansion.

## Go / No-Go

Retail alpha: GO.

Broad public launch: NO-GO.

NodeMuncher broad launch: NO-GO.

