# NodeMuncher Alpha Gate

## Status

Controlled alpha gate: OPEN.

Broad public launch gate: CLOSED.

## Purpose

Define the exact gate for allowing a small controlled NodeMuncher alpha while preventing accidental broad public launch.

This gate is for operator-supervised friend installs and internal alpha workers. It is not a retail worker launch checklist.

## Required GREENs

The following must remain GREEN before any controlled alpha install:

| Gate | Required evidence | Current status |
| --- | --- | --- |
| Pairing works against production | Real paired node identity persists locally. | GREEN |
| Heartbeat requires valid token | Missing/invalid token rejected; valid paired node accepted. | GREEN |
| Lease peek/claim uses node token auth | NodeMuncher does not use PR-003 global worker route. | GREEN |
| Blender E2E succeeds | Claim -> input download -> Blender render -> ZIP upload -> receipt proof. | GREEN |
| Failure report endpoint works | Claimed failure moves job to failed/retryable. | GREEN |
| Timeout path reports failure | Timeout code path calls production fail endpoint. | GREEN |
| Startup recovery works | Interrupted active lease detected and recovered/logged on startup. | GREEN |
| No receipt on failed package | Failed package proof has no receipt/output. | GREEN |
| No duplicate wallet refund | Repeat fail does not double-refund. | GREEN |
| No earning on failed package | Failed package has no earning/payout reference. | GREEN |
| App launches locally | Built app opens and remains alive during startup recovery proof. | GREEN |
| Operator can inspect proof | Release notes and Farpy Book entries exist. | GREEN |

Source evidence:

- [NODEMUNCHER_P0_RECHECK_V1.md](../../release/NODEMUNCHER_P0_RECHECK_V1.md)
- [NODEMUNCHER_LEASE_FAILURE_REPORT_PROOF_V1.md](../../release/NODEMUNCHER_LEASE_FAILURE_REPORT_PROOF_V1.md)
- [NODEMUNCHER_STARTUP_RECOVERY_PROOF_V1.md](../../release/NODEMUNCHER_STARTUP_RECOVERY_PROOF_V1.md)
- [04_NODEMUNCHER.md](04_NODEMUNCHER.md)

## Accepted YELLOWs

The following are accepted only for controlled alpha:

| Risk | Why accepted | Required operator control |
| --- | --- | --- |
| Unsigned or not fully trusted installer | EV/signing process is external and not complete. | Distribute only to known testers with explicit warning and hash. |
| Plaintext local node token | Token is stored in `%LOCALAPPDATA%\FarpyNode\node.json`. | Use trusted testers only; provide Forget Node/local data cleanup guidance. |
| Earnings amount/status not fully authoritative in UI | Receipt/history proof works, but desktop earnings amount may be pending. | Operator verifies backend ledger/receipt after each alpha render. |
| No signed auto-update path | Manual update only. | Operator sends versioned installer + SHA and confirms installed version. |
| MSI/admin caveat | MSI may require admin/elevation. | Prefer NSIS installer for friend installs. |
| GPU heartbeat metadata polish | GPU UI/probe data may not perfectly match heartbeat metadata. | Operator checks node eligibility/status manually. |
| Logs/support UX limited | Logs exist but are not yet one-click export. | Operator collects `%LOCALAPPDATA%\FarpyNode\logs` if issues occur. |
| Uninstall preserves local data | Node identity/work/logs may remain. | Tester uses Forget Node or operator documents leftover path. |

Accepted YELLOWs cannot be used in marketing copy.

## Blocked REDs

Any of these close the controlled alpha gate immediately:

| RED | Required action |
| --- | --- |
| Missing/invalid node token can heartbeat, lease, complete, or fail. | Stop alpha; fix auth. |
| Claimed render failure does not report to production. | Stop alpha; fix failure reporting. |
| Claimed job can remain running/leased after app crash without startup recovery decision. | Stop alpha; fix recovery. |
| Failed package mints receipt or exposes download. | Stop alpha; fix backend completion/failure semantics. |
| Failed package keeps wallet debit without refund/reversal when no receipt/output exists. | Stop alpha; fix wallet reversal. |
| Failed package records earning/payout. | Stop alpha; fix accounting. |
| Successful package completes without receipt. | Stop alpha; fix receipt generation. |
| ZIP upload can complete without expected frame/output validation. | Stop alpha; fix complete validation. |
| Public download link exposes private output without owner/token rules. | Stop alpha; fix auth/token exposure. |
| Installer contains wrong product identity or launches Benchmark instead of NodeMuncher. | Stop alpha; rebuild artifact. |
| App cannot launch on a tester machine. | Stop alpha for that artifact; rebuild or document prerequisite. |

## Friend-Install Requirements

Before sending a NodeMuncher alpha installer to a friend/tester:

1. Use the official controlled-alpha Windows NSIS installer, not MSI, unless testing MSI specifically.
2. Record artifact path and SHA256.
3. Record Authenticode signing status.
4. Tell tester this is controlled alpha, not a public product.
5. Tell tester the installer may be unsigned until EV signing is complete.
6. Tell tester NodeMuncher requires Blender 4.x for Blender package work.
7. Provide the Farpy account/pairing flow.
8. Pair one node only per tester machine.
9. Verify heartbeat after pairing.
10. Run one no-work/idle check.
11. Run one controlled render only when operator is watching `/ops`.
12. Capture job ID, receipt ID, ZIP hash, and node ID.

Current official controlled-alpha installer:

```text
C:\Users\danki\Desktop\nodemuncher-codex\src-tauri\target\release\bundle\nsis\Farpy NodeMuncher_0.1.0_x64-setup.exe
```

Current SHA256:

```text
83B2F77C9F2B5D96AE343FB6FDC61D5EE36772BC166F3A5B1F8C4304F5ED28FA
```

Current Authenticode status:

```text
NotSigned
```

MSI caveat:

```text
C:\Users\danki\Desktop\nodemuncher-codex\src-tauri\target\release\bundle\msi\Farpy NodeMuncher_0.1.0_x64_en-US.msi
```

The MSI artifact exists, but it is not the preferred controlled-alpha path. Prior clean-install smoke recorded MSI error 1925 / exit 1603 in the available environment. Use MSI only when the MSI/admin path itself is being tested.

Friend-install proof must include:

- tester OS
- installer filename
- installer SHA256
- Authenticode status
- node ID
- pair result
- heartbeat result
- lease/render result or idle proof
- uninstall/local-data note if uninstall is tested

## EV Signing Dependency

EV signing is not required for controlled alpha with known testers, but it is required before broad public NodeMuncher launch.

Controlled alpha rule:

- unsigned/internal installer may be used only with known testers and explicit hash verification.

Broad launch rule:

- Windows installer and executable should be Authenticode-signed.
- EV/Sectigo/Bizee/D&B process must be complete or an explicit non-EV signing policy must be approved.
- Signing status must be documented in release notes and download copy.
- Update/rollback artifacts must be versioned and hash-pinned.

## Rollback Plan

Controlled alpha rollback is manual and operator-driven.

If a NodeMuncher build is bad:

1. Stop sending that installer.
2. Remove or mark the artifact as revoked in the internal distribution note.
3. Tell testers to stop NodeMuncher.
4. Ask testers to uninstall through Windows Apps.
5. If identity/work cleanup is required, instruct tester to use Forget Node first or remove:

```text
%LOCALAPPDATA%\FarpyNode
```

6. Preserve logs before deleting local data:

```text
%LOCALAPPDATA%\FarpyNode\logs
%LOCALAPPDATA%\FarpyNode\work
```

7. Rebuild a known-good installer.
8. Record new SHA256.
9. Run local clean install smoke.
10. Send replacement only after alpha gate is GREEN again.

If a production job is stranded:

1. Inspect job state.
2. If claimed by NodeMuncher and no output/receipt exists, use the authenticated fail path or startup recovery path.
3. Verify `status=failed`, `retryable=true`.
4. Verify no receipt/output.
5. Verify wallet refund/reversal if debit existed.
6. Verify no earning/payout.

## Alpha Go / No-Go

Controlled alpha go:

- all Required GREENs remain GREEN
- Accepted YELLOWs are documented and explained to tester
- no Blocked REDs are present
- operator is available during first render

Controlled alpha no-go:

- any Blocked RED appears
- production ops health is RED
- wallet/payment/receipt system is under incident
- operator cannot monitor the first render
- tester cannot tolerate local alpha risk

Broad public launch no-go:

- EV/signing/update path incomplete
- earnings/accounting status not fully visible
- local token storage not hardened
- support/log export not ready
- installer trust warnings not resolved

## Current Recommendation

Controlled alpha: YES.

Broad public launch: NO.

NodeMuncher should remain a supervised alpha worker product until signing, update/rollback, earnings visibility, and supportability improve.
