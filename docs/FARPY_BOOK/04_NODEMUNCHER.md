# NodeMuncher

## Status

Controlled alpha.

Current P0 status: GREEN for the previously identified launch-blocking NodeMuncher worker-safety issues.

Broad public NodeMuncher launch: NO.

## Purpose

NodeMuncher is the Farpy worker desktop application. It pairs a user-owned machine with Farpy, heartbeats to production, leases compatible render packages, executes Blender locally, uploads completed ZIP output, and reports failure safely when local execution cannot complete.

This chapter summarizes the current controlled-alpha truth and links to the release evidence. It does not replace the detailed release notes.

## Current Truth

### Pairing / Identity

- NodeMuncher can pair with production using the real node pairing API.
- The paired node identity persists locally under `%LOCALAPPDATA%\FarpyNode\node.json`.
- The local node token is not shown in the UI, but it is still stored as plaintext JSON for alpha.
- This is acceptable for controlled alpha, not broad public launch.

### Heartbeat

- Paired nodes heartbeat to production using the node token.
- Missing/invalid token behavior has been hardened in earlier milestones.
- GPU metadata reporting remains a P1 polish/risk item because UI-detected GPU data and heartbeat metadata can diverge.

### Lease / Claim

- NodeMuncher uses safe node-token-authenticated lease APIs, not the global PR-003 worker route.
- Lease payload includes:
  - `job_id`
  - input URL
  - progress URL
  - complete URL
  - fail URL
  - frame metadata
  - renderer metadata
- Lease claim is authenticated and scoped to the paired node.

### Render Execution

- Current desktop execution path is Blender-focused.
- Octane is not part of the NodeMuncher desktop launch surface.
- Successful E2E proof exists for NodeMuncher claim -> Blender render -> ZIP upload -> receipt.

### Lease Failure Reporting

Status: GREEN.

NodeMuncher now reports claimed render failures and timeouts to production.

Evidence:

- [NODEMUNCHER_LEASE_FAILURE_REPORT_V1.md](../../release/NODEMUNCHER_LEASE_FAILURE_REPORT_V1.md)
- [NODEMUNCHER_LEASE_FAILURE_REPORT_PROOF_V1.md](../../release/NODEMUNCHER_LEASE_FAILURE_REPORT_PROOF_V1.md)
- [NODEMUNCHER_P0_RECHECK_V1.md](../../release/NODEMUNCHER_P0_RECHECK_V1.md)

Current proof:

- Real production job `JOB-6A016363` was recovered through the NodeMuncher fail endpoint.
- Job moved from stranded `running` to `failed`.
- `retryable=true`.
- No receipt was produced.
- No output/download was exposed.
- No earning/payout reference was found.
- Wallet ledger showed one debit and one refund.
- Repeated fail report did not duplicate the refund.

Timeout status:

- The timeout branch calls the same failure-report path.
- A fresh forced-timeout live render was not run during the proof pass; the code path is proven and the production fail endpoint path is proven.

### Startup Recovery

Status: GREEN.

NodeMuncher now runs a startup recovery pass in a background thread.

Evidence:

- [NODEMUNCHER_STARTUP_RECOVERY_V1.md](../../release/NODEMUNCHER_STARTUP_RECOVERY_V1.md)
- [NODEMUNCHER_STARTUP_RECOVERY_PROOF_V1.md](../../release/NODEMUNCHER_STARTUP_RECOVERY_PROOF_V1.md)
- [NODEMUNCHER_P0_RECHECK_V1.md](../../release/NODEMUNCHER_P0_RECHECK_V1.md)

Current proof:

- An isolated temp `%LOCALAPPDATA%` fixture simulated an interrupted active lease.
- App startup detected the interrupted work folder.
- Recovery wrote `startup-recovery.json`.
- Recovery wrote `logs\startup-recovery.log`.
- Recovery called the production fail endpoint.
- App stayed alive after startup.
- No duplicate receipt was created.
- No duplicate earning was recorded.
- No duplicate refund was recorded.

## Remaining P1 Risks

These do not reopen the previous P0s, but they matter before a broad public launch:

| Area | Risk | Current stance |
| --- | --- | --- |
| Earnings | Desktop can show receipt/history proof, but authoritative earnings amount/status remains incomplete or pending. | Controlled alpha only. |
| Signing | Windows signing / Defender reputation proof is not complete. | Keep broad public launch blocked. |
| Update / rollback | No signed auto-update or rollback path is frozen. | Manual/internal alpha distribution only. |
| MSI install | MSI/admin path had prior install caveats. | Prefer NSIS/internal installer for alpha. |
| Token storage | Node token is stored in plaintext local JSON. | Acceptable for alpha; harden before public worker network. |
| GPU heartbeat | UI GPU probe and heartbeat metadata can diverge. | P1 polish/eligibility confidence issue. |
| Status UI | Some worker status fields have been historically weak or hardcoded. | Verify before broader tester push. |
| Logs/support | Render logs exist, but user-friendly support/export flow remains limited. | P1 support gap. |

## Remaining P2 Risks

- UI polish and friendlier pairing flow.
- Better local history deduplication.
- Clearer uninstall/local data policy.
- Broader runbook coverage for non-founder operators.

## Launch Recommendation

Controlled alpha: YES.

Broad public NodeMuncher launch: NO.

Rationale:

- Prior P0 worker-safety blockers are now GREEN.
- NodeMuncher can be used with operator-supervised controlled alpha testers.
- Broad launch still requires signing/update strategy, clearer earnings/accounting proof, stronger local token storage, better support/log surfacing, and installer trust polish.

## Source-of-Truth Release Notes

- [NODEMUNCHER_P0_RECHECK_V1.md](../../release/NODEMUNCHER_P0_RECHECK_V1.md)
- [NODEMUNCHER_LEASE_FAILURE_REPORT_PROOF_V1.md](../../release/NODEMUNCHER_LEASE_FAILURE_REPORT_PROOF_V1.md)
- [NODEMUNCHER_STARTUP_RECOVERY_PROOF_V1.md](../../release/NODEMUNCHER_STARTUP_RECOVERY_PROOF_V1.md)
- [NODEMUNCHER_LEASE_FAILURE_REPORT_V1.md](../../release/NODEMUNCHER_LEASE_FAILURE_REPORT_V1.md)
- [NODEMUNCHER_STARTUP_RECOVERY_V1.md](../../release/NODEMUNCHER_STARTUP_RECOVERY_V1.md)
- [NODEMUNCHER_LAUNCH_AUDIT_V1.md](../../../nodemuncher-codex/release/NODEMUNCHER_LAUNCH_AUDIT_V1.md)
- [NODEMUNCHER_FRESH_INSTALL_V1.md](../../release/NODEMUNCHER_FRESH_INSTALL_V1.md)
- [NODEMUNCHER_CLEAN_INSTALL_SMOKE_V1.md](../../release/NODEMUNCHER_CLEAN_INSTALL_SMOKE_V1.md)

## Open Questions

- What is the canonical production earnings/history endpoint for NodeMuncher desktop?
- What is the final signing and update path?
- Should local node tokens move to OS credential storage before any broader alpha?
- Which installer should external testers receive once signing is ready?
