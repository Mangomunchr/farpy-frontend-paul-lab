# NODEMUNCHER_P0_RECHECK_V1

Status: GREEN

## Objective

Re-run NodeMuncher launch audit only against prior P0s.

Prior P0s:

1. claimed render failures/timeouts not reporting to production
2. crash recovery after claim not proven

## Overall Verdict

GREEN.

Both prior P0s are now resolved for controlled alpha.

This recheck does not clear unrelated P1/P2 launch issues from `NODEMUNCHER_LAUNCH_AUDIT_V1`.

## P0 Recheck

| Prior P0 | Current Status | Evidence | Notes |
| --- | --- | --- | --- |
| Claimed render failures/timeouts not reporting to production | GREEN | `release/NODEMUNCHER_LEASE_FAILURE_REPORT_PROOF_V1.md` | Desktop failure paths call the production fail endpoint; live production job `JOB-6A016363` moved from `running` to `failed/retryable`; no receipt/output/earning was produced; wallet had one debit and one refund. |
| Crash recovery after claim not proven | GREEN | `release/NODEMUNCHER_STARTUP_RECOVERY_PROOF_V1.md` | Startup recovery detected an interrupted local lease fixture, wrote `startup-recovery.json`, logged the decision, called production fail endpoint, app stayed alive, and no duplicate receipt/earning/refund occurred. |

## Evidence Summary

### Lease Failure / Timeout Reporting

Source:

```text
release/NODEMUNCHER_LEASE_FAILURE_REPORT_PROOF_V1.md
```

Proof:

- `Report-LeaseFailure` posts to production fail endpoint.
- Every post-claim local `Fail` path calls `Report-LeaseFailure`.
- Timeout branch calls `Fail 'render_timeout'`.
- Production fail endpoint accepted `JOB-6A016363`.
- Persisted job state:
  - `status=failed`
  - `retryable=true`
  - no receipt
  - no output
  - no earning/payout reference
  - one debit
  - one refund
- Repeat fail call did not duplicate refund.

### Startup Recovery

Source:

```text
release/NODEMUNCHER_STARTUP_RECOVERY_PROOF_V1.md
```

Proof:

- Isolated temp `%LOCALAPPDATA%` fixture created an interrupted work folder.
- App launched normally and remained alive after startup.
- Recovery wrote:
  - `startup-recovery.json`
  - `logs\startup-recovery.log`
- Decision:
  - `reported_failed`
  - `http_status=200`
  - `job_id=JOB-6A016363`
- Production state remained safe:
  - no duplicate receipt
  - no duplicate earning
  - no duplicate refund

## Remaining Non-P0 Items

The earlier launch audit still contains P1/P2 items that are outside this P0 recheck, including:

- authoritative earnings amount/status UX
- installer signing/update path
- MSI/admin install caveat
- GPU metadata heartbeat polish
- status UI accuracy
- local token storage hardening

Those do not reopen the two prior P0s.

## Commands Run

```powershell
Get-Content -LiteralPath 'C:\Users\danki\Desktop\farpy-frontend\release\NODEMUNCHER_LEASE_FAILURE_REPORT_PROOF_V1.md' -Raw
Get-Content -LiteralPath 'C:\Users\danki\Desktop\farpy-frontend\release\NODEMUNCHER_STARTUP_RECOVERY_PROOF_V1.md' -Raw
Get-Content -LiteralPath 'C:\Users\danki\Desktop\nodemuncher-codex\release\NODEMUNCHER_LAUNCH_AUDIT_V1.md' -Raw
```

## Production Changes

None during this P0 recheck.

Earlier proof milestones used the real fail endpoint for `JOB-6A016363` and documented the result.
