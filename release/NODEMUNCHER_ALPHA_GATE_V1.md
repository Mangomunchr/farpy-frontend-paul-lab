# NODEMUNCHER_ALPHA_GATE_V1

Status: GREEN

## Objective

Define the exact gate for controlled NodeMuncher alpha.

## Files Changed

- `docs/FARPY_BOOK/NODEMUNCHER_ALPHA_GATE.md`
- `release/NODEMUNCHER_ALPHA_GATE_V1.md`

## Gate Result

Controlled alpha gate: OPEN.

Broad public launch gate: CLOSED.

## Required GREENs

Documented required GREENs include:

- production pairing
- token-authenticated heartbeat
- safe lease peek/claim
- Blender E2E render proof
- failure report endpoint proof
- timeout path reporting proof
- startup recovery proof
- no receipt/output/earning on failed package
- no duplicate refund
- app launch proof
- operator-visible evidence

## Accepted YELLOWs

Accepted only for controlled alpha:

- unsigned / not fully trusted installer
- plaintext local node token
- incomplete authoritative earnings UX
- no signed auto-update path
- MSI/admin caveat
- GPU heartbeat metadata polish
- limited logs/support export
- uninstall may preserve local data

## Blocked REDs

The gate now explicitly blocks alpha if any of these occur:

- fail-open node auth
- claimed failure does not report to production
- crash after claim strands a package
- failed package mints receipt/download
- failed package keeps wallet debit without refund/reversal
- failed package records earning/payout
- successful package completes without receipt
- ZIP validation fails open
- private download exposure
- wrong installer identity
- app cannot launch on tester machine

## Friend-Install Requirements

Friend installs now require:

- recommended NSIS installer
- artifact SHA256
- controlled-alpha warning
- Blender 4.x prerequisite
- pairing proof
- heartbeat proof
- idle or render proof
- node ID/job ID/receipt ID/ZIP hash capture when rendering
- uninstall/local-data note if tested

## EV Signing Dependency

EV signing is not required for controlled alpha with known testers and explicit hash verification.

EV/signing/update path is required before broad public NodeMuncher launch.

## Rollback Plan

Documented rollback includes:

- stop distributing bad installer
- revoke/mark artifact internally
- ask testers to stop/uninstall app
- preserve logs/work before cleanup
- optional `%LOCALAPPDATA%\FarpyNode` cleanup after Forget Node or operator instruction
- rebuild known-good installer
- record SHA256
- rerun local clean install smoke
- for stranded jobs, use authenticated fail/startup recovery path and verify no receipt/output/earning plus wallet reversal

## Evidence Linked

- `release/NODEMUNCHER_P0_RECHECK_V1.md`
- `release/NODEMUNCHER_LEASE_FAILURE_REPORT_PROOF_V1.md`
- `release/NODEMUNCHER_STARTUP_RECOVERY_PROOF_V1.md`
- `docs/FARPY_BOOK/04_NODEMUNCHER.md`

## Commands Run

```powershell
Get-Content -LiteralPath 'C:\Users\danki\Desktop\farpy-frontend\docs\FARPY_BOOK\04_NODEMUNCHER.md' -Raw
Get-Content -LiteralPath 'C:\Users\danki\Desktop\farpy-frontend\release\NODEMUNCHER_P0_RECHECK_V1.md' -Raw
Select-String -Path 'C:\Users\danki\Desktop\farpy-frontend\docs\FARPY_BOOK\NODEMUNCHER_ALPHA_GATE.md','C:\Users\danki\Desktop\farpy-frontend\release\NODEMUNCHER_ALPHA_GATE_V1.md' -Pattern 'Controlled alpha gate: OPEN|Broad public launch gate: CLOSED|Required GREENs|Accepted YELLOWs|Blocked REDs|Friend-Install Requirements|EV Signing Dependency|Rollback Plan'
```

## Production Changes

None.

No code changes.
No deploy.
