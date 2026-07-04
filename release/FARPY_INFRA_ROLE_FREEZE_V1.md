# FARPY_INFRA_ROLE_FREEZE_V1

Status: FROZEN
Date: 2026-06-30

## Objective

Define the authoritative Farpy infrastructure role map for launch operations. This document makes no production changes and does not modify code, services, DNS, Caddy, systemd, payment configuration, or backup configuration.

## Role Map

| Host | Role | Belongs Here | Does Not Belong Here |
| --- | --- | --- | --- |
| Node A | Production control plane only | Website, public APIs, wallet, auth, jobs API, uploads, receipts, workspace/status routes, customer-facing production state | Heavy rendering, experimental workers, backup restore drills that overwrite live paths, BTCPay primary services, broad synthetic/load testing |
| Node B | Warm standby and verification node | Restore tests, synthetic monitoring, canary deploys, non-destructive recovery rehearsal, backup integrity proof | Primary customer traffic, wallet mutation, production payment processing, live render workload unless promoted deliberately |
| Node C | Payments / BTCPay | BTCPay, Bitcoin/Lightning infrastructure, payment rail operations, future render worker migration target after isolation planning | Long-term heavy rendering mixed with payment services, uncontrolled GPU experiments, backup restore tests that risk payment state |
| Storage Box | Encrypted backup destination | Offsite backup copies, backup freshness markers, restore-proof source for Node B | Live serving, production app execution, unencrypted public data exposure, primary operational state |
| IONOS VPS | External synthetic monitor only | Independent uptime checks, public route probes, synthetic monitoring reports | Customer data storage, wallet/payment processing, render execution, backup archive storage unless separately approved |

## Node A: Production Control Plane Only

Node A owns the live production control plane.

Allowed on Node A:

- `farpy.com` website serving and static production output.
- Production API services.
- Authentication and session handling.
- Wallet and ledger state.
- Job submission and status APIs.
- Upload intake and production upload storage.
- Receipt generation and receipt access.
- Download URL issuance and completed package access.
- Caddy/reverse proxy for production web/API traffic.
- Operational logs required for production diagnosis.

Not allowed on Node A without a new freeze exception:

- Heavy render execution as a normal workload.
- Experimental worker processes.
- Destructive restore tests.
- Payment-node duties that belong on Node C.
- Synthetic monitoring loops that can be run from Node B or IONOS.
- Load tests or broad probes against local production internals.

## Node B: Warm Standby, Restore Tests, Synthetic Monitoring, Canary Deploys

Node B exists to prove Farpy can survive without touching live production state.

Allowed on Node B:

- Restore testing from Storage Box or copied backup snapshots.
- Backup checksum verification.
- Non-destructive disaster recovery rehearsal.
- Synthetic monitoring of public Node A routes.
- Canary deploys before promotion to Node A.
- Staging copies of services using non-production data or restored data in isolated paths.

Not allowed on Node B without promotion procedure:

- Serving as live production without an explicit failover decision.
- Mutating the production wallet ledger.
- Processing real payments.
- Accepting customer uploads as production source of truth.
- Completing live render jobs unless Node B is formally promoted or assigned a controlled worker role.

## Node C: Payments / BTCPay

Node C owns payment infrastructure and may become a future render worker migration target only after payment isolation is planned.

Allowed on Node C:

- BTCPay server.
- Bitcoin on-chain payment infrastructure.
- Lightning infrastructure after routing/liquidity proof.
- Payment webhook support infrastructure where appropriate.
- Future render migration tests only if isolated from payment services.

Not allowed on Node C long term:

- Heavy rendering mixed with payment services.
- GPU workloads that can starve BTCPay, Bitcoin, Lightning, or webhook processing.
- Experimental worker jobs without resource isolation.
- Backup restore tests that can overwrite or confuse payment state.

Node C migration rule:

- If Node C is used for future render migration, payment services must remain isolated by service account, directory, resource limits, and monitoring. Heavy rendering should not share failure domains with BTCPay long term.

## Storage Box: Encrypted Backup Destination

Storage Box is the offsite backup destination.

Allowed:

- Offsite backup snapshots from Node A.
- Backup freshness markers such as `OFFSITE_OK.<timestamp>.txt`.
- Restore-proof pulls to Node B.
- Retention-managed backup archives.

Not allowed:

- Serving live customer traffic.
- Running Farpy services.
- Acting as the only copy of production data.
- Storing public web assets as a substitute for deploy artifacts.

Current caveat:

- Storage Box is designated as the encrypted backup destination.
- Current uploaded `.tar.gz` backup artifacts are not independently application-encrypted before upload.
- SSH protects transport, but artifact-level encryption and key custody remain future hardening items.

## IONOS VPS: External Synthetic Monitor Only

IONOS VPS is an outside observer.

Allowed:

- Synthetic checks against public routes.
- Alert delivery checks.
- Monitoring report generation.
- Public HTTP status probes.

Not allowed:

- Storing production customer data.
- Holding backup archives unless explicitly approved later.
- Processing payments.
- Rendering customer packages.
- Mutating production state.

## Migration Rules

1. Node A remains production control plane until a deliberate failover or migration is approved.
2. Node B is the preferred restore-test target and canary target.
3. Node C remains payment-first; render migration to Node C requires isolation planning before any heavy workload.
4. Storage Box receives backups only; restore proof should pull from it to Node B first.
5. IONOS monitors from outside and must not become a data-bearing service.
6. No host should gain a new role by accident during debugging.
7. Any production role change needs a release note naming source host, destination host, affected services, rollback path, and validation checks.
8. Payment, wallet, receipt, and backup state changes must be more conservative than static/frontend deploys.

## Operational Guardrails

- Production changes on Node A require backup or rollback proof first.
- Restore tests should target Node B or `/tmp` paths, not live Node A paths.
- Payment infrastructure changes on Node C must preserve webhook fail-closed behavior.
- Backup pushes to Storage Box require explicit operator approval when production customer data leaves Node A.
- Synthetic monitoring from IONOS must not use secrets unless deliberately scoped and documented.
- Heavy render workloads must not be colocated with payment services without resource isolation.

## Acceptance

- Roles documented: PASS
- What belongs / does not belong per host documented: PASS
- Migration rules documented: PASS
- Code/config changes made: NONE

## Verdict

FARPY_INFRA_ROLE_FREEZE_V1 is GREEN as a documentation freeze.
