# V1_LAUNCH_SCORECARD

Status: ACTIVE

Date: 2026-06-30

Mode: Documentation only. No production code changed.

## Purpose

Score every Farpy V1 subsystem on a 0-100 launch-readiness scale.

Interpretation:

- 90-100: broad launch ready, low caveat.
- 80-89: retail alpha ready, bounded caveats.
- 70-79: controlled launch only; known gaps need operator awareness.
- 60-69: internal or controlled alpha only.
- 50-59: significant recovery/support/proof debt.
- Below 50: not launch ready.

## Executive Score

Overall V1 retail alpha score: 76 / 100

Retail alpha: YES

Broad public launch: NO

Reason: The customer website, render/download/receipt path, and security gates are strong enough for bounded retail alpha. The limiting factors are not the visible website; they are fresh paid E2E proof, offsite backup/restore proof, support/self-service, second-operator recovery, and NodeMuncher broad-public maturity.

## Score Summary

| Subsystem | Score | Readiness | Short Justification |
| --- | ---: | --- | --- |
| Website | 86 | Retail alpha ready | Public pages, language, top-up, workspace, receipt, status, and add-on handoff are coherent and recently audited. |
| Wallet | 78 | Controlled retail alpha | Ledger/idempotency/fail-closed paths are strong; fresh paid E2E and Bitcoin browser proof remain pending. |
| Receipts | 88 | Retail alpha ready | Receipt JSON, SHA-256, token-gated download/receipt URLs, and receipt UI are strong; mismatch recovery runbook remains incomplete. |
| Rendering | 82 | Retail alpha ready | Blender/Octane render path is proven enough for bounded packages; worker source mirroring and Octane freshness remain risks. |
| Benchmark | 70 | Controlled utility | Windows Benchmark distribution/runtime fixes exist; promotion, signing, update path, and long-term product freeze remain deferred. |
| NodeMuncher | 62 | Controlled alpha only | E2E/watchdog/local install proof exists, but broad launch blocked by update/signing/token/CSP/recovery/support gaps. |
| Addon | 74 | Controlled public alpha | ZIP/page/install smoke are good; source ownership, auth clarity, and update/version path remain weaker. |
| Operations | 78 | Operator-ready with caveats | Ops dashboard, audit scripts, alerts, and triage docs exist; second operator and consolidated runbooks still incomplete. |
| Security | 76 | Retail alpha ready with P1 hardening | Core gates fail closed; remaining P1s include HSTS/CORS/rate-limit/static route/config proof classes. |
| Recovery | 58 | Not broad-launch ready | Same-host and USB recovery are documented; full host-loss/offsite restore/cutover remain unproven. |
| Monitoring | 80 | Retail alpha ready | Ops alerts and dashboard exist; external/second-recipient delivery and monitor-the-monitor proof remain incomplete. |
| Support | 55 | Weak for scale | Many issues still require email/operator handling; self-service and destructive/account workflows are not implemented. |
| Backups | 52 | Plan/partial proof only | Same-host/recovery USB proof exists; encrypted offsite backup and restore proof are not complete. |

## Subsystem Details

### Website: 86

Justification:

- Homepage first-minute clarity, trust strip, product language, stage limits, mobile readiness, workspace tracker, receipt clarity, and status pillars have recent release evidence.
- Public pages and core routes have regression/audit coverage.
- Lightning is hidden/gated; PayPal is deferred; copy is bounded to early access / small render packages.

What prevents 90+:

- Some naming/copy drift remains in historical docs and minor public copy.
- Fresh paid-user path is not continuously proven.
- Static deploy/source drift has happened before and still needs repeated production scan discipline.

Risk: Medium.

User impact: Low to medium. Mostly clarity/trust issues, not core broken flow.

### Wallet: 78

Justification:

- Wallet ledger is append-only/idempotent by event/session/invoice identifiers.
- Stripe/card is visible, default, and fail-closed.
- Wallet-funded failure refund/reversal path has proof.
- BTCPay/Bitcoin backend proof exists at integration level.

What prevents 80+:

- Fresh-new-account paid card E2E remains pending/operator-driven.
- Authenticated Bitcoin browser-click checkout proof remains pending.
- Card-funded failure/refund proof is less complete than wallet-funded failure proof.
- Lightning must remain gated until liquidity/payment/webhook proof is green.

Risk: Medium-high.

User impact: High if it fails, because money is involved.

### Receipts: 88

Justification:

- Completed packages produce receipt JSON with receipt ID, job ID, cost, renderer, frame count, input/output SHA fields.
- Download and receipt URLs are token-gated.
- Receipt page exposes technical proof without overwhelming normal users.
- Job status private URL disclosure was fixed.

What prevents 90+:

- Customer-side SHA verification is still manual.
- Receipt/output hash mismatch recovery runbook is incomplete.
- Owner private URL proof remains manual/operator driven.

Risk: Medium.

User impact: High if broken, but core implementation is strong.

### Rendering: 82

Justification:

- Render/download/receipt flow is frozen for retail alpha.
- Blender and Octane paths have real smoke history.
- ZIP/frame validation and failed-render handling are present.
- Stage limits copy keeps workload claims bounded.

What prevents 90+:

- Production worker source mirroring is incomplete.
- Octane fresh worker proof and larger workload breadth are not broad-launch ready.
- NodeMuncher public render partner path is controlled alpha, not normal fleet.

Risk: Medium.

User impact: High when render fails, mitigated by refund/failure copy.

### Benchmark: 70

Justification:

- Benchmark Windows installer/downloads exist with SHA sidecars.
- Runtime fixes were made for Blender-required UX, no console, timeout, and visible run state.
- Public benchmark pages/API exist.

What prevents 80+:

- Benchmark promotion is intentionally deferred.
- Signing/update path is not mature.
- Benchmark artifacts/source are split across repos.
- Windows-only reality must remain explicit.

Risk: Medium.

User impact: Medium. Not core Farpy render path.

### NodeMuncher: 62

Justification:

- Pairing, heartbeat, lease, E2E, watchdog, failure report, and local install have evidence.
- NodeMuncher is correctly framed as controlled alpha only.

What prevents 70+:

- No broad public signing/update/rollback path.
- Token storage is alpha-grade local JSON.
- Tauri CSP remains loose/null.
- Friend install, support, earnings/history maturity, and recovery behavior are not broad-public ready.

Risk: High for public launch; acceptable for controlled alpha.

User impact: High if exposed broadly; currently bounded.

### Addon: 74

Justification:

- Add-on page and ZIP are deployed with SHA sidecar.
- Install smoke exists.
- Polished language and website handoff exist.

What prevents 80+:

- Canonical editable add-on source path is not obvious from frontend repo inventory.
- Auth/session clarity remains weaker than the website.
- Update/version path is manual.

Risk: Medium.

User impact: Medium. Add-on is helpful, not the only upload path.

### Operations: 78

Justification:

- `/ops` command center exists.
- Public and private ops summary model exists.
- Alerting and alert triage have release evidence.
- Regression, public-user, NodeMuncher fresh install, add-on, and launch-freeze scripts exist.

What prevents 80+:

- Additional operator alert delivery proof remains incomplete.
- Runbooks are numerous but not consolidated.
- Some key operational actions still require founder/operator judgment.

Risk: Medium.

User impact: Medium to high during incidents.

### Security: 76

Justification:

- No proven active P0 in latest security audits.
- Core money/render/download/receipt routes mostly fail closed.
- Worker query-token auth was removed.
- Job status token disclosure was fixed.
- Env permission hardening was performed.

What prevents 80+:

- Security audit still found P1 hardening gaps: HSTS on main site, broad CORS, rate-limit proof, legacy static output route risk, and auth boundary documentation/hardening.
- Desktop CSP remains loose for NodeMuncher/Benchmark.

Risk: Medium.

User impact: High if exploited, but current retail alpha surface has no proven P0.

### Recovery: 58

Justification:

- Same-host backup/restore and recovery USB documentation exist.
- Disaster recovery and founder absence audits exist.
- Infrastructure role freeze exists.

What prevents 70+:

- Full host-loss recovery is not proven.
- Node B cutover from encrypted offsite backup is not proven.
- Domain/DNS/registrar and payment dashboard recovery still need second-operator proof.

Risk: High.

User impact: High during production loss.

### Monitoring: 80

Justification:

- Production alerting is implemented.
- Ops summary includes health status and alert counts.
- Funnel reports and operations dashboard exist.
- Synthetic monitoring roles are documented.

What prevents 90+:

- Second-recipient alert delivery is not fully proven.
- Monitor-heartbeat / monitor-the-monitor proof is incomplete.
- Some private metrics depend on ops token setup and operator discipline.

Risk: Medium.

User impact: Medium. Good detection, but escalation path still maturing.

### Support: 55

Justification:

- Support audits and account self-service planning exist.
- Contact/refund/support copy exists.
- Failed package UX and refund wording improved.

What prevents 70+:

- Many real user needs still require email/operator handling: account deletion, source deletion, completed package deletion, cancel queued package, billing disputes, card-funded failure/refund review.
- Support request center is not implemented.
- Runbooks for several support cases are incomplete.

Risk: Medium-high.

User impact: High once more than a few users arrive.

### Backups: 52

Justification:

- Same-host backup proof and recovery USB documentation exist.
- Offsite encrypted backup plan exists.
- Infrastructure roles identify Storage Box as encrypted backup destination.

What prevents 70+:

- Encrypted offsite backup implementation is not complete.
- Offsite restore proof is not complete.
- Key ownership/custody and secondary operator proof remain future work.

Risk: High.

User impact: Catastrophic in a full Node A loss.

## Highest Leverage Improvements

1. Complete fresh paid customer E2E and add it to the evidence loop.
2. Implement age-encrypted offsite backup and prove restore on Node B.
3. Add second-operator access proof for domains, DNS, Stripe, BTCPay, hosting, email, Storage Box, and keys.
4. Consolidate runbooks for deploy/rollback, payments, receipts/downloads, workers, backups, and support.
5. Keep NodeMuncher controlled alpha until signing/update/token/CSP/support gaps are resolved.

## Score Rationale Sources

Primary inputs:

- `release/RETAIL_ALPHA_FINAL_FREEZE_REPORT_V1.md`
- `release/TRUST_CHAIN_AUDIT_V1.md`
- `release/SECURITY_GOLD_AUDIT_V1.md`
- `docs/FARPY_BOOK/TECH_DEBT_REGISTER.md`
- `docs/FARPY_BOOK/RUNBOOK_STATUS.md`
- `release/SINGLE_POINT_OF_FAILURE_AUDIT_V2.md`
- `release/FARPY_OPERATIONS_COMMAND_CENTER_V1.md`
- `release/FARPY_PRODUCTION_ALERTING_V1.md`

## Commands Run

```powershell
Get-Content -LiteralPath 'C:\Users\danki\Desktop\farpy-frontend\docs\FARPY_BOOK\TECH_DEBT_REGISTER.md' -Raw
Get-Content -LiteralPath 'C:\Users\danki\Desktop\farpy-frontend\release\RETAIL_ALPHA_FINAL_FREEZE_REPORT_V1.md' -Raw
Get-Content -LiteralPath 'C:\Users\danki\Desktop\farpy-frontend\release\TRUST_CHAIN_AUDIT_V1.md' -Raw
Get-Content -LiteralPath 'C:\Users\danki\Desktop\farpy-frontend\release\SECURITY_GOLD_AUDIT_V1.md' -Raw
Get-Content -LiteralPath 'C:\Users\danki\Desktop\farpy-frontend\docs\FARPY_BOOK\RUNBOOK_STATUS.md' -Raw
Get-Content -LiteralPath 'C:\Users\danki\Desktop\farpy-frontend\release\SINGLE_POINT_OF_FAILURE_AUDIT_V2.md' -Raw
Get-Content -LiteralPath 'C:\Users\danki\Desktop\farpy-frontend\release\FARPY_OPERATIONS_COMMAND_CENTER_V1.md' -Raw
Get-Content -LiteralPath 'C:\Users\danki\Desktop\farpy-frontend\release\FARPY_PRODUCTION_ALERTING_V1.md' -Raw
```
