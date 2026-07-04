# STATE_MACHINE_AUDIT_V1

Status: DOCUMENTED
Date: 2026-06-30
Mode: Read-only audit, no code/API changes

## Objective

Audit state transitions for:

- Job: created, queued, claimed, rendering, completed, failed, refunded
- Wallet: pending, captured, refunded
- Receipt: none, generated, verified
- Node: offline, pairing, paired, idle, claimed, rendering, reporting

Find impossible and missing transitions.

## Overall Verdict

YELLOW.

Farpy has a mostly coherent lifecycle, but several states are conceptual/UI states rather than persisted backend states. The biggest ambiguity is that `claimed` and `rendering` collapse into backend `status="running"`, while `created` collapses into `status="queued"`. Receipt `verified` is not a stored state. Node state is split between pairing/heartbeat/lease behavior and desktop UI rather than one authoritative state machine.

No RED transition was proven in this audit.

## Source Evidence

Primary evidence:

- `scripts/job-api.mjs:525-560` creates jobs as `status="queued"` and `payment_status="priced"|"unpriced"`.
- `scripts/job-api.mjs:711-765` submits paid jobs and sets `status="submitted"`.
- `scripts/job-api.mjs:819-838` prices jobs and sets `payment_status="priced"`.
- `scripts/job-api.mjs:921-985` finalizes Stripe and sets `payment_status="captured"`.
- `scripts/job-api.mjs:988-1039` creates Stripe checkout and sets `payment_status="checkout_created"`.
- `scripts/job-api.mjs:416-453` refunds failed wallet-funded jobs and sets `payment_status="refunded"`.
- `scripts/job-api.mjs:798-817` mints receipts after output exists.
- `scripts/job-api.mjs:2190-2232` NodeMuncher claim sets `status="running"`, `node_id`, `worker_id`, `lease_id`, `claimed_by="nodemuncher"`.
- `scripts/job-api.mjs:2234-2250` legacy/remote worker claim sets `status="running"` and `worker_id`.
- `scripts/job-api.mjs:2336-2400` worker/NodeMuncher complete sets `status="complete"`, output fields, and mints receipt.
- `scripts/job-api.mjs:2403-2461` worker/NodeMuncher fail sets `status="failed"`, deletes output/receipt fields, and triggers eligible refund.
- `scripts/job-api.mjs:1534-1564` Node token auth and lease eligibility.

## Canonical Persisted State Names

The requested state labels do not all match persisted code values.

| Conceptual state | Persisted value / fields |
| --- | --- |
| Job created | No separate persisted state; new jobs start as `status="queued"`. |
| Job queued | `status="queued"`. |
| Job submitted | `status="submitted"`. This exists and is required before worker claim. |
| Job claimed | No separate status; NodeMuncher/worker claim sets `status="running"` plus `claimed_by`, `node_id`, `worker_id`, `lease_id`, `claimed_at` where applicable. |
| Job rendering | `status="running"`; progress fields may indicate rendered count. |
| Job completed | Persisted as `status="complete"`, not `completed`. |
| Job failed | `status="failed"`. |
| Job refunded | Not a job status; represented by `payment_status="refunded"` plus wallet refund fields. |
| Wallet pending | Conceptual; persisted payment states include `unpriced`, `priced`, `checkout_created`, `authorized` dev-only, and external pending checkout. |
| Wallet captured | `payment_status="captured"`; wallet debits also append ledger event. |
| Wallet refunded | `payment_status="refunded"` plus `wallet_refund_*` fields and ledger `type="refund"`. |
| Receipt none | No `receipt_id`/`receipt_path`. |
| Receipt generated | `receipt_id`, `receipt_path`, `receipt_created_at` exist. |
| Receipt verified | Not persisted; customer/operator verification action based on tokenized receipt and SHA-256. |
| Node offline | No fresh heartbeat / missing node status. |
| Node pairing | Desktop/pairing flow state, not proven in `job-api.mjs`. |
| Node paired | Paired node token resolves through `findPairedNodeByToken`. |
| Node idle | Paired/heartbeat green and lease peek returns `job:null`. |
| Node claimed | Node has job with `claimed_by="nodemuncher"`, matching `node_id`, and `status="running"`/`"leased"`. |
| Node rendering | Same job state as claimed plus local desktop executing render; progress reports update rendered counts. |
| Node reporting | Node posts progress/complete/fail; not persisted as a separate node state. |

## Job State Machine

### Observed Allowed Transitions

| From | To | Trigger | Evidence |
| --- | --- | --- | --- |
| none | queued | `createJob` via metadata or upload create | `scripts/job-api.mjs:525-560`, `2576`, `2597-2606` |
| queued | queued with priced payment | `priceJob` | `scripts/job-api.mjs:819-838` |
| queued | queued with checkout_created | `createStripeCheckoutSession` | `scripts/job-api.mjs:988-1039` |
| queued/priced/checkout_created | captured | Stripe webhook or wallet debit during submit | `scripts/job-api.mjs:921-985`, `721-744` |
| queued + captured | submitted | `submitRender` | `scripts/job-api.mjs:757-764` |
| submitted | running | NodeMuncher claim or remote worker claim | `scripts/job-api.mjs:2218-2227`, `2245-2250` |
| running/submitted | complete | worker complete with valid ZIP/output | `scripts/job-api.mjs:2341-2365` |
| running/leased | complete | NodeMuncher complete with valid ZIP/output | `scripts/job-api.mjs:2376-2400` |
| running/leased | failed | NodeMuncher fail | `scripts/job-api.mjs:2403-2435` |
| any remote worker job found | failed | remote worker fail route | `scripts/job-api.mjs:2438-2461` |
| failed + wallet debit + no artifact | failed + payment_status refunded | `refundFailedWalletDebit` | `scripts/job-api.mjs:416-453` |
| complete + output exists | complete + receipt generated | `mintReceipt` called by complete | `scripts/job-api.mjs:798-817`, `2364`, `2399` |

### Impossible / Rejected Transitions

| Transition | Current behavior |
| --- | --- |
| unpaid/unpriced -> submitted | rejected with `402 payment_required` or `insufficient_balance`. |
| non-submitted -> NodeMuncher claim | not lease eligible. |
| wrong node -> input/progress/complete/fail | rejected `404`/`403` by node token and node/job match. |
| complete -> fail via NodeMuncher | rejected `409 job_already_complete`. |
| complete -> refund via `refundFailedWalletDebit` | blocked because job status must be `failed` and delivery artifact must not exist. |
| missing ZIP/frame validation -> complete | rejected `400` by `validateWorkerZip`. |
| missing output -> receipt generation | rejected `400 output_not_found`. |
| missing output SHA -> receipt generation | rejected `400 missing_output_sha256`. |
| production dev mark/attach/mint/payment routes | guarded by `IS_PRODUCTION`, returns `404`. |

### Missing / Ambiguous Transitions

| Missing transition | Risk |
| --- | --- |
| `created` as a separate persisted state | Low. New jobs immediately become `queued`; docs/UI should not imply a separate created state. |
| `claimed` as a separate persisted job status | Medium. Claim is encoded by `status="running"` plus claim fields; hard to distinguish assigned-but-not-started from actively rendering. |
| `rendering` as distinct from `running` | Medium. `running` covers claimed, downloading input, launching Blender, and actual rendering. This caused earlier “running with zero frames” concerns. |
| `leased` is accepted in some NodeMuncher routes but claim sets `running` | Medium. Code checks `running || leased`, but normal claim writes `running`. `leased` appears legacy/conceptual and should be formalized or removed. |
| cancel queued/submitted package | Known support gap. Account UI uses support request link; no mutation endpoint. |
| release/requeue stale claimed job | Partial. Alerts exist, but formal state transition from stale `running` back to `submitted`/`failed` is not clear in this audit. |
| retry failed package as same job | Missing. UI sends user to new package flow; no canonical failed -> queued retry transition. |
| delete uploaded source/completed package | Missing by design; support request only. |
| complete without receipt recovery | Alert exists for completion without receipt; recovery transition is not formally exposed. |

## Wallet State Machine

### Observed Persisted States

| State | Meaning |
| --- | --- |
| `unpriced` | Job has no price. |
| `priced` | Job has deterministic price but no payment captured. |
| `checkout_created` | Stripe checkout session created. |
| `captured` | Wallet debit or Stripe webhook captured payment. |
| `refunded` | Wallet-funded failed package was refunded through ledger event. |
| `authorized` | Dev-only payment state, production route guarded. |
| `failed` | Dev-only payment failure state, production route guarded. |

### Observed Allowed Transitions

| From | To | Trigger |
| --- | --- | --- |
| unpriced | priced | `priceJob` |
| priced | checkout_created | Stripe checkout session creation |
| priced/unpriced + wallet balance | captured | `submitRender` appends wallet debit |
| checkout_created | captured | Stripe webhook `checkout.session.completed` |
| captured + failed/no delivery/wallet mode | refunded | `refundFailedWalletDebit` |
| authorized | captured | dev-only capture route |
| any | failed | dev-only fail route |

### Impossible / Rejected Transitions

| Transition | Current behavior |
| --- | --- |
| captured -> checkout_created | rejected by `payment_already_captured` in checkout creation. |
| insufficient wallet -> captured | rejected with `402 insufficient_balance`. |
| failed/no delivery card checkout -> automatic wallet refund | Not applicable; refund helper only handles wallet-mode debit. |
| refunded -> second refund | deterministic `wallet-refund-<job_id>` event prevents duplicate refund. |

### Missing / Ambiguous Transitions

| Missing transition | Risk |
| --- | --- |
| explicit `pending` payment state | Medium. Stripe checkout in progress is represented by `checkout_created`, while wallet debit happens inline. Docs should map pending -> checkout_created. |
| card refund/reversal state | Medium. Wallet refund is automated; card refund is policy/support/provider-driven. |
| failed payment recovery | Low/Medium. Dev-only `payment_status="failed"` exists, but production payment failure states mostly come from provider errors rather than persisted status. |
| Bitcoin/BTCPay pending/expired/cancelled states in job/wallet history | Medium. Invoice creation and webhook credit exist, but invoice pending/expired may not be visible as wallet state. |

## Receipt State Machine

### Observed States

| State | Representation |
| --- | --- |
| none | No `receipt_id`, `receipt_path`, `receipt_created_at`. |
| generated | Receipt JSON exists and job has receipt fields. |
| verified | Not stored; user/operator verifies by fetching tokenized receipt and comparing SHA-256/download. |

### Observed Allowed Transitions

| From | To | Trigger |
| --- | --- | --- |
| none | generated | `mintReceipt` after output exists and output SHA exists. |
| generated | generated with captured payment fields | Stripe finalize updates existing receipt if receipt already exists. |
| generated | none | failure routes delete receipt fields when marking failed. |

### Impossible / Rejected Transitions

| Transition | Current behavior |
| --- | --- |
| none -> generated without output | rejected `output_not_found`. |
| none -> generated without output SHA | rejected `missing_output_sha256`. |
| wrong token -> receipt JSON | rejected `404 not_found`. |

### Missing / Ambiguous Transitions

| Missing transition | Risk |
| --- | --- |
| persisted `verified` flag | Low. Verification is customer/action-derived; storing it could imply Farpy self-attests. Better as external/audit evidence. |
| receipt regeneration/immutability rule | Medium. `mintReceipt` can write a new receipt if called after output exists; production direct mint route is disabled, but worker complete calls mint. Duplicate complete behavior should be formalized. |
| receipt mismatch recovery | Medium. Ops alert exists, but canonical repair transition is not documented. |

## Node State Machine

### Observed / Inferred States

| State | Representation |
| --- | --- |
| offline | Missing/stale heartbeat or no valid node token. |
| pairing | NodeMuncher UI/pairing flow; not visible in `job-api.mjs`. |
| paired | Token resolves via `findPairedNodeByToken`. |
| idle | Valid token; lease peek returns `job:null`. |
| claimed | Job has `claimed_by="nodemuncher"`, matching `node_id`, `lease_id`; job status `running`/`leased`. |
| rendering | Local app is executing Blender; backend sees `running` and progress fields. |
| reporting | Node posts progress, complete, or fail; not persisted as separate state. |

### Observed Allowed Transitions

| From | To | Trigger |
| --- | --- | --- |
| paired | idle | heartbeat green, lease peek no job. |
| idle | claimed/rendering | lease claim sets job `running`, node/lease fields. |
| claimed/rendering | reporting progress | progress endpoint updates rendered counts. |
| claimed/rendering | complete | complete endpoint accepts valid ZIP, mints receipt. |
| claimed/rendering | failed | fail endpoint records failure/refund path. |
| any with invalid token | rejected | auth helper fails. |

### Impossible / Rejected Transitions

| Transition | Current behavior |
| --- | --- |
| unpaired/missing token -> claim | rejected `403`. |
| wrong node -> input/progress/complete/fail | rejected `404`/`403`. |
| claim unpaid job | `402 payment_required` or not lease eligible. |
| claim non-smoke public NodeMuncher job | current eligibility requires `nodemuncher_smoke === true`; normal production worker skips smoke lane. |
| fail already complete job | rejected `409 job_already_complete`. |

### Missing / Ambiguous Transitions

| Missing transition | Risk |
| --- | --- |
| authoritative node state endpoint | Medium. UI likely synthesizes from local persisted token + heartbeat + lease. |
| interrupted lease recovery contract | Medium. There was a milestone for startup recovery; this audit did not prove deployed/current behavior. |
| lease release/requeue | Medium. No clear public transition from claimed stale job back to submitted. |
| offline detection interval contract | Low/Medium. Ops alerts exist, but public node state timing should be documented. |
| `reporting` persisted state | Low. Usually unnecessary, but useful for diagnosing upload/complete hangs. |

## Impossible Transition Findings

These are good constraints and should be preserved:

1. Unpaid jobs cannot enter submitted/renderable state.
2. NodeMuncher cannot access input/complete/fail for jobs claimed by another node.
3. Complete jobs cannot be failed by NodeMuncher.
4. Missing/incomplete ZIPs cannot complete jobs or mint receipts.
5. Receipts cannot be generated without output and output SHA.
6. Failed wallet-funded jobs without delivery artifact can refund idempotently.
7. Dev mutation/payment routes are not public in production.
8. Wrong receipt/download tokens return `404`.

## Missing Transition Findings

Ranked by launch risk:

| Rank | Finding | Risk | Recommendation |
| --- | --- | --- | --- |
| P1 | `claimed`/`rendering` are collapsed into `running` | Makes stalls harder to distinguish: assigned, downloading, launching, rendering, packaging all look similar | Add non-breaking progress fields or failure_stage fields; do not rename API status yet. |
| P1 | Stale claimed/running requeue/fail transition is not clearly formalized | Claimed jobs can strand if app/node dies before reporting fail | Ensure NodeMuncher startup recovery and server-side stale lease recovery are proven and documented. |
| P1 | Card-funded failed-render refund/reversal state is not as explicit as wallet refund | Customer trust gap if card paid job fails after capture without receipt | Document Stripe refund/reversal workflow and expose status if implemented. |
| P1 | Receipt mismatch recovery transition is not defined | Ops can detect mismatch, but repair flow is unclear | Add runbook: preserve evidence, disable download if mismatch, regenerate/reconcile only with proof. |
| P2 | No true cancel queued package transition | Support burden, not core render blocker | Add cancel endpoint later with refund/no-charge semantics. |
| P2 | No same-job retry transition from failed -> queued/submitted | UI creates new package; acceptable alpha behavior | Keep copy honest: “Send package again” rather than “retry same job.” |
| P2 | No persisted receipt verified state | Fine; external verification should remain customer/operator action | Keep as UI badge only unless adding explicit independent verifier. |
| P2 | Node `pairing/paired/idle` state is split across app/backend | Can confuse debugging | Document NodeMuncher local state model separately. |

## Recommended Canonical State Vocabulary

Use these in docs and UI mapping:

| Domain | Canonical terms |
| --- | --- |
| Job backend | `queued`, `submitted`, `running`, `complete`, `failed` |
| Job UI | Package received, Dispatcher, Rendering, Packaging, Package delivered, Package stopped |
| Payment backend | `unpriced`, `priced`, `checkout_created`, `captured`, `refunded` |
| Receipt backend | none/generated; verified is external proof |
| Node backend | paired token, idle/no-work, claimed/running, progress, complete/fail |

Avoid documenting `created`, `claimed`, `rendering`, `completed`, or `refunded` as literal persisted job statuses unless the code is changed.

## Commands Run

Read-only inspection only:

```powershell
rg -n "status =|payment_status|refund|receipt_id|receipt_path|claimed_by|claimed_at|lease_id|node_id|pair|heartbeat|offline|paired|running|submitted|queued|complete|failed|refunded|captured|priced|unpriced|pending" scripts src release -S
Select-String -Path scripts\job-api.mjs -Pattern "const createJob|const submitRender|const priceJob|const createStripeCheckoutSession|const finalizeStripeCheckoutSession|const mintReceipt|const publicJob|const isNodeLeaseEligible|const requireNodeTokenAuth|const saveReceipt|const refundFailedWalletDebit|job.status =|job.payment_status =|job.receipt_id =|job.claimed_by =|job.node_id =|job.lease_id ="
Get-Content selected ranges from scripts\job-api.mjs
```

No code changes were made.
No API changes were made.
No production changes were made.
No secrets were printed.
