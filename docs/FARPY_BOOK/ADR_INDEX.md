# ADR_INDEX

Status: ACTIVE

Date: 2026-06-30

Mode: Documentation only. No code or production changes.

## Purpose

Architecture Decision Record index for major Farpy V1 decisions.

Each ADR captures:

- Decision
- Reason
- Alternatives rejected
- Consequences

## ADR-001: Package Metaphor

### Decision

Use `package` language for the customer render journey.

Customer-facing flow:

Upload package -> render partner processes it -> download package result -> delivery receipt.

### Reason

Normal users understand package tracking faster than distributed compute, job queue, worker lease, scheduler, or backend terminology. The metaphor keeps the surface simple while preserving technical truth in verification details.

### Alternatives Rejected

- `Render job`: accurate internally, but too operational and queue-like for first-time customers.
- `Task`: generic and weak for customer trust.
- `Scene`: useful for Blender/Octane context, but does not describe the whole delivery lifecycle.
- Full technical language: precise but slower to understand and higher support burden.

### Consequences

- Customer UI should say `package`, not `job`, except IDs and advanced/developer surfaces.
- Backend/API names remain unchanged.
- Docs and support copy must explain that a package is the uploaded render file plus its delivery state.
- Some historical release notes still use old terms and should be treated as history, not copy source.

## ADR-002: Render Partner Terminology

### Decision

Use `Render Partner` for customer-facing compute providers/render machines.

### Reason

`Render Partner` is warmer and less industrial than `Render Factory`, while still implying external processing capacity. It avoids overclaiming a fake location, map, or physical facility.

### Alternatives Rejected

- `Render Factory`: clear but sounded too literal and risked fake factory/location expectations.
- `Worker`: accurate internally, but too technical and dehumanized for customers.
- `Node`: accurate for infrastructure, but not customer-friendly.
- `GPU`: technical and hardware-centric; useful only in advanced details or Benchmark contexts.

### Consequences

- Customer surfaces should say `Render Partner`.
- Internal code, APIs, NodeMuncher, scheduler, and worker docs may keep `worker`, `node`, and `lease`.
- Status text should avoid `worker`, `node`, `queue`, and `lease` unless in advanced/developer views.

## ADR-003: Receipt-Backed Trust

### Decision

Every completed package should be backed by a delivery receipt.

### Reason

Farpy asks users to trust a remote render process. A receipt makes completion auditable: what was rendered, how many frames, what it cost, when it completed, and which output SHA-256 was produced.

### Alternatives Rejected

- UI-only success state: too easy to fake or lose.
- Email-only confirmation: hard to verify and not tightly tied to artifact SHA.
- Payment-provider receipt only: proves payment, not render delivery.
- Public proof only: useful for marketing, not enough for a private user package.

### Consequences

- Completed packages without receipts are invalid states.
- Missing receipt is an incident class.
- Receipt pages must preserve technical fields even when customer copy is simplified.
- Account history should link to receipts when available.

## ADR-004: Wallet Debit And Refund Semantics

### Decision

Wallet-funded packages may debit when submitted/captured, but failed packages with no delivery receipt/output must be reversed/refunded idempotently.

### Reason

The customer promise is delivery-backed money movement. A user should not remain charged for a completed render if no completed delivery was produced.

### Alternatives Rejected

- Charge only after completion: simpler promise but harder to reserve funds and coordinate render admission.
- Keep failed charges for compute attempt: bad customer trust fit for early retail alpha.
- Manual refund-only process: too slow and support-heavy for small package prices.

### Consequences

- Failed wallet-funded jobs need a canonical refund/reversal path.
- Refund events must be idempotent.
- No receipt/output means no completed-render charge should remain.
- Card-funded failure handling may still require provider-specific review and must remain clearly documented.

## ADR-005: SHA-256 Verification

### Decision

Use SHA-256 hashes for downloads, receipts, artifacts, and public package proof where applicable.

### Reason

SHA-256 gives customers and operators a stable way to verify that the downloaded ZIP matches the recorded delivery receipt. It is simple, widely supported, and independent of Farpy UI styling.

### Alternatives Rejected

- Trusting filename/size only: insufficient integrity proof.
- Proprietary checksum: unnecessary and less verifiable.
- Cryptographic signing everywhere immediately: stronger but more operationally heavy than needed for V1 retail alpha.

### Consequences

- Receipts should include output SHA-256 when output exists.
- Download responses should expose hash proof where safe.
- Public artifacts should have `.sha256` sidecars.
- Customer-side verification remains partly manual until an in-browser/local verifier is added.

## ADR-006: NodeMuncher Architecture

### Decision

Keep NodeMuncher as a controlled-alpha worker product that pairs with production, heartbeats, leases compatible work, renders locally, reports completion/failure, and remains separate from the public customer website launch.

### Reason

NodeMuncher is core to future render capacity but has different risks than the customer product: local execution, token persistence, install/uninstall, earnings, crash recovery, update/signing, and external machine trust.

### Alternatives Rejected

- Broad public NodeMuncher launch with Farpy retail alpha: too much trust/support/update surface at once.
- Running all render work on the control plane: violates scaling and infrastructure boundary goals.
- Reusing global worker token for public nodes: unsafe; paired node tokens are the safer direction.
- Fake/demo worker outputs: violates receipt-first trust.

### Consequences

- NodeMuncher remains controlled alpha until signing/update/token/CSP/support gaps are closed.
- NodeMuncher uses real pairing/heartbeat/lease/auth flows.
- Render failures must report back to production and not strand leases.
- Earnings/history must come from real completed jobs, not placeholder data.

## ADR-007: Benchmark Separation

### Decision

Treat Farpy Benchmark as a separate public desktop utility from NodeMuncher and the customer render flow.

### Reason

Benchmark proves local GPU/render capability and provides public performance pages, but it should not be confused with the worker product or the paid render customer path.

### Alternatives Rejected

- Merge Benchmark and NodeMuncher into one public product: increases confusion and support burden.
- Hide Benchmark entirely: loses useful public artifact and proof channel.
- Use Benchmark as worker onboarding: premature until NodeMuncher broad launch is ready.

### Consequences

- Benchmark has separate installers, hashes, public pages, and leaderboard APIs.
- Benchmark must clearly require local Blender where needed.
- NodeMuncher remains separate/future worker product.
- Benchmark promotion can be paused without blocking Farpy retail alpha.

## ADR-008: Blender Vs Octane Strategy

### Decision

Support Blender packages as the primary retail alpha path and Octane packages as a bounded/controlled path with explicit policy and infrastructure proof requirements.

### Reason

Blender is the most accessible starting path for normal users and easier to validate locally. Octane requires licensed/headless infrastructure, ORBX handling, and GPU-node readiness; it is real but more operationally fragile.

### Alternatives Rejected

- Octane-first launch: higher infrastructure/license risk.
- Disable Octane entirely: loses important customer segment and proven ORBX work.
- Promise broad Octane animation/fleet support before repeated proof: overclaims beyond current safe stage.

### Consequences

- Customer copy must stay bounded: small packages, previews, tests, short frame ranges.
- Add-on and website copy must agree on Octane frame policy.
- Octane worker readiness must be proven before broad promotion.
- No fake Octane outputs or fallback rows are acceptable.

## ADR Status Table

| ADR | Status | Primary Areas |
| --- | --- | --- |
| ADR-001 Package Metaphor | Accepted | Website, Workspace, Account, Receipt, Add-on |
| ADR-002 Render Partner Terminology | Accepted | Customer UI, Docs, Support |
| ADR-003 Receipt-Backed Trust | Accepted | Receipts, Downloads, Wallet, Trust |
| ADR-004 Wallet Debit And Refund Semantics | Accepted | Wallet, Payments, Failed Packages |
| ADR-005 SHA-256 Verification | Accepted | Receipts, Downloads, Artifacts, Public Proof |
| ADR-006 NodeMuncher Architecture | Accepted / Controlled Alpha | NodeMuncher, Worker Plane |
| ADR-007 Benchmark Separation | Accepted | Benchmark, Downloads, Leaderboard |
| ADR-008 Blender Vs Octane Strategy | Accepted / Bounded | Rendering, Add-on, Octane |

## Related Documents

- `docs/FARPY_BOOK/COPY_LANGUAGE_FREEZE_V1.md` if created later
- `docs/FARPY_BOOK/CODE_MAP.md`
- `docs/FARPY_BOOK/TECH_DEBT_REGISTER.md`
- `docs/FARPY_BOOK/V1_LAUNCH_SCORECARD.md`
- `release/COPY_LANGUAGE_FREEZE_V1.md`
- `release/WORLD_LAYER_V3_RENDER_PARTNER.md`
- `release/TRUST_CHAIN_AUDIT_V1.md`
- `release/FAILED_WALLET_REFUND_FIX_V1.md`
- `release/NODEMUNCHER_LAUNCH_AUDIT_V1.md`
- `release/BENCHMARK_LAUNCH_AUDIT_V1.md`
- `release/OCTANE_READINESS_AUDIT_V1.md`
