# RETAIL_ALPHA_GATE

Status: ACTIVE

Date: 2026-07-01

## Purpose

Define the authoritative go/no-go gate for Farpy Retail Alpha.

This gate is intentionally narrower than a broad public launch gate. Retail Alpha means controlled public usage with bounded expectations, active operator monitoring, and clear deferred items.

## Required GREENs

Retail Alpha requires these areas to remain GREEN:

| Area | Requirement | Current Evidence |
|---|---|---|
| Customer website | Homepage, pricing, signin, topup, workspace, receipt, account, downloads, status, and addon routes load | `REGRESSION_SUITE_IMPLEMENTATION_V1`, `NIGHTLY_PLATFORM_SMOKE_V1` |
| Product language | Customer copy is bounded, package-based, and does not overclaim scale | `RETAIL_ALPHA_FINAL_FREEZE_REPORT_V1` |
| Payment fail-closed behavior | Card/Stripe is visible and malformed/unauthenticated payment requests fail closed | `RETAIL_ALPHA_FINAL_FREEZE_REPORT_V1`, nightly smoke `/checkout` malformed JSON gate |
| Lightning posture | Lightning remains hidden/gated until liquidity and invoice-to-wallet-credit proof are GREEN | `RETAIL_ALPHA_FINAL_FREEZE_REPORT_V1` |
| PayPal posture | PayPal is deferred and not presented as live | `RETAIL_ALPHA_FINAL_FREEZE_REPORT_V1` |
| Render/download/receipt path | Completed packages produce ZIP download and delivery receipt with SHA-256 proof | `RETAIL_ALPHA_FINAL_FREEZE_REPORT_V1` |
| Security baseline | Tokenized job status disclosure fixed, worker query-token auth removed, env permissions hardened, malformed JSON paths fail closed | `RETAIL_ALPHA_FINAL_FREEZE_REPORT_V1`, `SECURITY_GOLD_AUDIT_V1` |
| NodeMuncher scope | NodeMuncher is controlled alpha only, not broad public worker launch | `NODEMUNCHER_ALPHA_GATE.md`, `RETAIL_ALPHA_FINAL_FREEZE_REPORT_V1` |
| Monitoring smoke | Public nightly smoke and regression suite have no FAIL rows | `NIGHTLY_PLATFORM_SMOKE_V1`, `FOUNDER_ABSENCE_RECHECK_V1` |
| Documentation | Operator, incident, deployment, recovery, infra, and state documentation exist | Farpy Book |

## Accepted YELLOWs

These are accepted for Retail Alpha but block broader launch or founder-independent operations:

| Area | Accepted YELLOW | Why Accepted For Retail Alpha | Required To Turn GREEN |
|---|---|---|---|
| Founder absence | Same-host backup/restore exists, but encrypted offsite restore and second-operator access are not proven | Retail Alpha assumes active founder/operator presence | Prove encrypted offsite backup restore from Storage Box and second-operator access drill |
| Private receipt/download nightly proof | Smoke scripts WARN when tokenized receipt/download env vars are absent | Public routes still pass; private URLs require operator-supplied evidence | Provide completed package receipt/download URLs to nightly smoke |
| Fresh-new-account paid E2E | Still pending operator/browser input | Existing render/payment systems have prior proof, but this exact fresh account proof remains manual | Complete `FRESH_NEW_ACCOUNT_E2E_PROOF_V1` |
| Bitcoin browser-click proof | Backend invoice integration proof exists; browser-click proof may remain pending | Bitcoin is secondary; Card remains primary rail | Authenticated browser click creates public BTCPay checkout URL |
| CSP/rate-limit expansion | Baseline hardening exists, expanded proof deferred | Not a known active exploit/blocker for bounded alpha | Add stricter CSP and documented rate-limit evidence |
| Benchmark promotion | Benchmark remains bounded/deferred from core Retail Alpha | Customer render flow does not depend on Benchmark | Separate Benchmark launch gate |
| NodeMuncher broad launch | Controlled alpha only | Retail Alpha customer flow does not require broad worker onboarding | Signing/update/path and friend-install gate GREEN |

## Blocked REDs

Any of the following makes Retail Alpha NO-GO:

| Area | RED Condition |
|---|---|
| Money | Card top-up/checkout cannot start or fails open; wallet debit can occur without receipt/refund policy |
| Auth | Sign-in/account access broken, OAuth redirect broken, or unauthenticated private user data exposed |
| Render | Paid package cannot be submitted or all render partners fail without clean failure/refund path |
| Download | Completed package ZIP cannot be downloaded |
| Receipt | Completed package has no delivery receipt or receipt SHA mismatch |
| Security | Tokenized receipt/download URLs exposed to non-owner status responses |
| Worker auth | Worker/node tokens accepted from query strings or missing-token privileged routes return 200 |
| Payment safety | Lightning is visible while route/liquidity proof remains RED |
| Production health | Nightly smoke or regression suite has required public FAIL rows |
| Recovery | No current same-host backup exists at all |

Current REDs: none documented for bounded Retail Alpha.

## GO / NO GO

Retail Alpha: GO.

Broad public launch: NO-GO.

NodeMuncher broad public launch: NO-GO.

Founder-independent 30-day operation: NO-GO until offsite restore and second-operator access are proven.

## Rollback

Retail Alpha rollback means reduce public exposure while preserving money, render, receipt, and download integrity.

### Static/frontend rollback

1. Preserve evidence: affected route, browser screenshot, command output, and current static path.
2. Restore last known-good static output backup or preserved deploy staging artifact.
3. Preserve protected static artifacts:
   - downloads
   - add-on ZIP
   - SHA sidecars
   - generated status/audit JSON
4. Verify:
   - `/`
   - `/signin`
   - `/topup`
   - `/workspace`
   - `/receipt`
   - `/downloads`
   - `/status`

### Backend rollback

1. Preserve logs and affected request IDs before replacing files.
2. Restore previous backed-up service script.
3. Run syntax check before restart.
4. Restart only the affected service.
5. Verify auth gates, payment gates, render status, receipt, and download.

### Payment rollback

1. Do not manually edit wallet ledgers without evidence.
2. Disable or hide the affected public rail if needed.
3. Keep Card as primary unless Card itself is affected.
4. Verify wallet balance, ledger event, receipt, and refund/reversal policy.

### Render rollback

1. Stop exposing fake progress or completion.
2. Mark failed packages honestly.
3. Preserve job JSON, worker logs, output/receipt state, and wallet ledger.
4. Refund/reverse wallet-funded failed packages when no delivery receipt/output exists.

## Current Recommendation

Proceed with Retail Alpha.

Conditions:

- Keep scope bounded to small Blender and Octane packages.
- Keep Lightning gated.
- Keep PayPal deferred.
- Keep NodeMuncher controlled alpha only.
- Run nightly platform smoke.
- Run full regression before and after production deploys.
- Complete fresh-new-account paid E2E as the next customer proof.
- Complete encrypted offsite restore and second-operator drills before claiming founder-independent operations.

## Evidence References

- `release/RETAIL_ALPHA_FINAL_FREEZE_REPORT_V1.md`
- `release/FOUNDER_ABSENCE_RECHECK_V1.md`
- `release/NIGHTLY_PLATFORM_SMOKE_V1.md`
- `release/REGRESSION_SUITE_IMPLEMENTATION_V1.md`
- `release/SECURITY_GOLD_AUDIT_V1.md`
- `docs/FARPY_BOOK/NODEMUNCHER_ALPHA_GATE.md`
- `docs/FARPY_BOOK/OPERATOR_CHECKLIST.md`
- `docs/FARPY_BOOK/INCIDENT_RUNBOOK.md`
- `docs/FARPY_BOOK/DEPLOYMENT_TIMELINE.md`
