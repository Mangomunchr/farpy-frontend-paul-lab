# LAUNCH_DAY_PLAYBOOK

Status: ACTIVE

Date: 2026-07-01

## Purpose

Launch-day operator playbook for Farpy Retail Alpha.

This playbook assumes the Retail Alpha gate is the authority:

- Retail Alpha: GO
- Broad public launch: NO-GO
- NodeMuncher broad launch: NO-GO
- Founder-independent operations: NO-GO until offsite restore and second-operator access are proven

## Command References

Run from the Farpy frontend repo unless otherwise noted.

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\nightly-platform-smoke-v1.ps1 -OutputPath C:\tmp\nightly-platform-smoke-v1-latest.json
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\regression\run-regression-suite-v1.ps1 -OutputPath C:\tmp\farpy-regression-suite-v1-latest.json
```

Optional private proof URLs:

```powershell
$env:FARPY_REGRESSION_JOB_STATUS_URL="https://..."
$env:FARPY_REGRESSION_RECEIPT_URL="https://..."
$env:FARPY_REGRESSION_DOWNLOAD_URL="https://..."
```

## Launch Decision Rules

### GO

- Public route smoke has no FAIL rows.
- Card/top-up and upload/render auth gates fail closed.
- Homepage, signin, topup, workspace, receipt, downloads, addon, benchmark, and status routes load.
- Lightning remains hidden/gated.
- No active customer-impacting money/render/download/receipt incident is unresolved.

### HOLD

- Smoke has WARN rows only for missing private tokenized proof URLs.
- One non-critical copy/static-shell check is missing but live route loads.
- Operator is actively reviewing an alert with no confirmed customer impact.

### NO-GO

- Any required public route returns 5xx or persistent 404.
- Checkout/card top-up cannot start or fails open.
- Upload/render submit is broken.
- Completed ZIP download is broken.
- Delivery receipt route is broken.
- Unauthenticated private token/receipt/download data is exposed.
- Lightning appears publicly while route/liquidity proof is not GREEN.

## T-24h

### Verification

1. Run nightly smoke.
2. Run full regression suite.
3. Confirm Retail Alpha gate still says GO.
4. Confirm no release note after the gate introduced money/render/download/receipt changes.
5. Confirm `/`, `/pricing`, `/signin`, `/topup`, `/workspace`, `/receipt`, `/account`, `/downloads`, `/status`, `/addon` load.

### Monitoring

1. Open `/ops` if token is available.
2. Confirm no active critical alerts.
3. Check external monitor status if available.
4. Confirm disk/inode status is healthy.
5. Confirm worker/render partner status is understood.

### Rollback

1. Identify latest known-good static deploy backup.
2. Confirm static preservation guard docs are current.
3. Confirm Caddy/systemd rollback docs exist.
4. Do not deploy broad changes unless a launch blocker is found.

### Support

1. Prepare tester/customer response template.
2. Confirm issue report fields: email, browser, OS, job ID, screenshot, expected result.
3. Confirm refund/reversal policy for failed packages with no receipt.

### Incident Response

1. Re-read `INCIDENT_RUNBOOK.md`.
2. Confirm evidence-first rule: job JSON, wallet ledger, receipt, ZIP, worker logs before mutation.
3. Do not acknowledge alerts until underlying conditions are resolved.

## T-12h

### Verification

1. Re-run nightly smoke.
2. Check `/topup` confirms Card visible and Lightning hidden/gated.
3. Check `/signin` shows Google and email options.
4. Check `/downloads` exposes expected artifacts and SHA sidecars.
5. Confirm no forbidden broad-launch copy appears.

### Monitoring

1. Review recent failures.
2. Review wallet debit/credit/refund events if ops data is available.
3. Review recent receipts.
4. Confirm no stuck submitted/running packages.

### Rollback

1. Freeze non-essential changes.
2. Only accept P0/P1 fixes.
3. For any change, require build/check, backup, deploy note, and targeted smoke.

### Support

1. Confirm launch support inbox/channel is watched.
2. Keep known limitations ready:
   - small packages first
   - Lightning gated
   - PayPal deferred
   - NodeMuncher controlled alpha

### Incident Response

1. If money issue appears, stop and preserve ledger/provider evidence.
2. If render issue appears, preserve job/worker/output/receipt evidence.
3. If public route issue appears, decide static rollback vs Caddy/backend fix.

## T-4h

### Verification

1. Run full regression suite.
2. Confirm no FAIL rows.
3. Confirm `NIGHTLY_PLATFORM_SMOKE_V1` result is PASS or WARN only.
4. Manually browse homepage, topup, workspace, receipt, and downloads.
5. Confirm Retail Alpha gate still has no Blocked REDs.

### Monitoring

1. Open `/status`.
2. Open `/ops` if available.
3. Check latest synthetic monitor result if available.
4. Check core health endpoints through public routes.

### Rollback

1. Keep terminal/history for latest known-good deploy command visible.
2. Keep rollback target documented.
3. Do not touch backend unless a verified launch blocker exists.

### Support

1. Prepare first-user issue triage note.
2. Ensure response tone is plain: package, wallet, download, delivery receipt.
3. Confirm refund language is clear for failed packages without receipt.

### Incident Response

1. Assign severity quickly: money, render, download, receipt, auth, public route.
2. For P0, pause launch messaging before debugging deeply.
3. For P1, document and proceed only if Retail Alpha gate allows it.

## Launch

### Verification

1. Confirm homepage loads.
2. Confirm primary CTA points to send package flow.
3. Confirm signin works at shell level.
4. Confirm topup page loads with Card visible.
5. Confirm workspace and receipt shells load.
6. Confirm downloads page loads.

### Monitoring

1. Watch `/ops` or status summary.
2. Watch recent failures.
3. Watch wallet/payment events if available.
4. Watch render partner availability.
5. Watch logs only when diagnosing; do not tail secrets into public notes.

### Rollback

Rollback immediately if:

- payment fails open
- private tokens leak
- completed packages cannot download
- receipts cannot load
- upload/render submit is generally broken
- Lightning appears live unintentionally

### Support

1. Track every issue with job ID or route.
2. Ask for screenshot and browser/OS.
3. Do not promise completion if render failed.
4. Use refund/reversal policy when no delivery receipt exists.

### Incident Response

1. Preserve evidence before mutation.
2. Apply the smallest safe recovery.
3. Record actions in `release/`.
4. Re-run targeted smoke after recovery.

## +1h

### Verification

1. Run nightly smoke.
2. Check any new signups/topups/packages if available.
3. Spot-check one workspace if a completed package exists.
4. Confirm no new 5xx/404 spikes in reports/logs if available.

### Monitoring

1. Review active alerts.
2. Review failed packages.
3. Review wallet debit without completion alerts.
4. Review receipt/download mismatch alerts.

### Rollback

1. If multiple P1 issues stack up, pause new promotion.
2. If any P0 appears, rollback or hide affected surface.

### Support

1. Respond to first reports within the operator channel.
2. Categorize issues: auth, wallet, upload, render, download, receipt, copy/confusion.

### Incident Response

1. For failed package: verify no receipt/output before refund/reversal.
2. For missing receipt: verify ZIP SHA and job state before regeneration.
3. For payment mismatch: verify provider event and ledger idempotency.

## +6h

### Verification

1. Run full regression suite.
2. Compare pass/warn/fail counts to launch baseline.
3. Confirm downloads and receipt route still load.
4. Confirm no accidental Lightning exposure.

### Monitoring

1. Review completed packages and failed packages.
2. Review wallet credits/debits/refunds.
3. Review disk/output growth.
4. Review worker/render partner health.

### Rollback

1. If system is stable, keep freeze.
2. If a bounded UI issue exists, document for next patch.
3. If money/render/download/receipt issue exists, treat as incident.

### Support

1. Update known issues if any.
2. Save recurring questions for later UX/docs cleanup.
3. Do not ship new features based on launch-day feedback.

### Incident Response

1. Ensure every customer-impacting failure has evidence.
2. Ensure every refund/reversal has ledger proof.
3. Ensure no alert is acknowledged without resolution.

## +24h

### Verification

1. Run nightly smoke.
2. Run full regression suite.
3. Review Retail Alpha gate.
4. Review founder-absence YELLOWs; do not let them become invisible.
5. Create launch-day summary release note if material issues occurred.

### Monitoring

1. Review 24h route/API health.
2. Review 24h package outcomes.
3. Review 24h payment/wallet outcomes.
4. Review 24h receipt/download outcomes.
5. Review disk/inode/log growth.

### Rollback

1. Decide whether to keep launch exposure, reduce exposure, or pause promotion.
2. If rollback happened, verify customer-facing route truth after rollback.
3. Confirm protected static artifacts survived any deploy/rollback.

### Support

1. Summarize all customer reports.
2. Identify P0/P1/P2 fixes.
3. Confirm all money-impacting reports are resolved or actively tracked.

### Incident Response

1. Close only resolved incidents.
2. Keep unresolved issues in release notes with owner and next action.
3. Do not upgrade Retail Alpha to broad launch based on one stable day.

## Emergency Decision Matrix

| Symptom | Action |
|---|---|
| Public site down | Follow Server Down and Caddy Failure runbooks |
| Checkout/card broken | Pause promotion; preserve logs; verify Stripe/webhook; keep wallet safe |
| Upload broken | Pause render promotion; verify upload API/storage; no wallet debit for failed upload |
| Render partner failures | Fail packages honestly; refund/reverse when no receipt/output exists |
| Download broken | Treat as P0 if completed packages cannot download |
| Receipt broken | Treat as P0 if completed package has no delivery receipt |
| Private URL exposure | Immediate P0; rollback or patch before continuing |
| Lightning visible unintentionally | Hide/rollback frontend; verify no invoice creation from UI |

## Launch-Day Non-Goals

- Do not launch broad NodeMuncher.
- Do not enable Lightning.
- Do not add PayPal.
- Do not redesign pages.
- Do not refactor backend.
- Do not change receipt schema.
- Do not make broad-scale claims.

## References

- `docs/FARPY_BOOK/RETAIL_ALPHA_GATE.md`
- `docs/FARPY_BOOK/OPERATOR_CHECKLIST.md`
- `docs/FARPY_BOOK/INCIDENT_RUNBOOK.md`
- `docs/FARPY_BOOK/DEPLOYMENT_TIMELINE.md`
- `release/NIGHTLY_PLATFORM_SMOKE_V1.md`
- `release/REGRESSION_SUITE_IMPLEMENTATION_V1.md`
- `release/FOUNDER_ABSENCE_RECHECK_V1.md`
