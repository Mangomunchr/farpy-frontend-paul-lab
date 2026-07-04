# ERROR_MESSAGE_AUDIT_V1

Status: YELLOW

Mode: wording audit only. No backend changes, no UI patches, no production mutation.

Date: 2026-06-30

## Scope

Reviewed customer-facing error and failure copy across:

- Homepage package upload and pricing flow
- Workspace package tracker
- Account and wallet history surfaces
- Add-on page and Blender add-on audit notes
- Benchmark desktop app
- NodeMuncher desktop / lease smoke surfaces

## Classification Key

- Helpful: readable and understandable, but may not tell the user what to do next.
- Actionable: readable and includes a next step.
- Confusing: vague, ambiguous, or likely to make a normal user wonder what happened.
- Technical: exposes raw status codes, backend enum strings, tokens/auth jargon, Python/dependency details, or internal concepts.

## Summary

Farpy has improved materially from internal-tool language to customer-safe package/delivery language. Failed package copy, Benchmark missing-Blender copy, and several add-on messages are already clear. The remaining risk is not a launch-stopping backend issue; it is wording leakage. A normal user can still encounter raw strings such as `status_###`, `Upload failed (###)`, `Pricing failed (###)`, `wallet_unavailable`, `forbidden`, or `not_found` depending on the surface.

Overall verdict: YELLOW.

No P0 wording blocker was proven. P1 cleanup should happen before wider retail traffic.

## Surface Matrix

| Surface | Current Examples | Classification | Recommended Wording |
| --- | --- | --- | --- |
| Homepage | `Unsupported package type. Please upload a .blend or .orbx file.` | Actionable | Keep. |
| Homepage | `Upload failed (###).` | Technical / Confusing | `Farpy could not send this package. Check your connection and try again.` |
| Homepage | `Pricing failed (###).` | Technical / Confusing | `Farpy could not price this package. Try again, or send a smaller package.` |
| Homepage | Raw backend `error` passed into UI | Technical | Map known backend errors before display; keep raw codes only in console/dev details. |
| Workspace | `This render partner encountered a problem. No completed delivery was produced.` | Helpful | Keep. |
| Workspace | `If no delivery receipt was created, the completed-render charge is returned.` | Actionable / Trust-building | Keep. |
| Workspace | `Try again and Farpy will route your package to another available render partner.` | Actionable | Keep. |
| Workspace | `Insufficient balance. Add funds to continue.` | Actionable | Keep. |
| Workspace | `Unable to start checkout.` | Helpful | Add next step: `Try again, or add funds from Wallet.` |
| Workspace | `status_###`, raw `result.error`, `output_validation_failed`, `zip_missing_frames` | Technical | `The render output was incomplete. No delivery receipt was created.` |
| Workspace | `Failure class`, `Failure code`, `Failure detail` | Technical but acceptable in Verification Details | Keep only under collapsed Verification Details. |
| Account | Support actions: `Retry failed package`, `Billing issue`, `Rendering issue` | Actionable | Keep. |
| Account | `wallet_unavailable`, `status_###` | Technical | `Wallet history is unavailable right now. Refresh or try again later.` |
| Account | Empty package states | Helpful | Prefer `No packages yet.` consistently. |
| Add-on | Human auth/file/connection messages from audit | Helpful / Actionable | Keep. |
| Add-on | API key/token field and auth expectations | Confusing | `Send package first. You will sign in and pay in your Farpy workspace.` |
| Add-on | `Python requests is missing` | Technical | `Blender is missing the networking library Farpy uses to send packages. Use farpy.com upload, or install the supported add-on package.` |
| Add-on | `.orbx` workflow caveat | Helpful if explicit | `Existing .orbx packages can be sent when supported here. Automatic ORBX export is not included.` |
| Benchmark | `Farpy Benchmark needs Blender 4.x installed to run this test.` | Actionable | Keep. |
| Benchmark | `Preparing...`, `Rendering...`, `Finalizing...` | Helpful | Keep. |
| Benchmark | `Blender did not return a render time.` alone | Confusing if shown without detail | `Blender finished without a benchmark result. Check Blender 4.x and try again.` Put stderr in details. |
| Benchmark | `Benchmark failed before producing a result. <raw error>` | Technical | `Benchmark failed before producing a result.` Raw exception should be in details. |
| NodeMuncher | No-work state in smoke: `no paid submitted compatible job available` | Technical | `No package is available right now.` |
| NodeMuncher | `forbidden`, `not_found`, `missing token`, `invalid token` | Technical | `This PC is not paired with Farpy. Pair it again in Settings.` |
| NodeMuncher | Input download failure | Confusing if raw HTTP/status | `Farpy could not download this package. The failure was reported so it will not stay stuck.` |
| NodeMuncher | Render timeout | Actionable if surfaced as timeout | `Blender took too long. The package was reported failed and no earning was recorded.` |
| NodeMuncher | Complete/report failure | Confusing if raw | `Farpy could not receive the result. Keep the app open and try again.` |

## P0

None proven.

No reviewed customer-facing error copy appears to directly enable a false success state, hidden charge, fake receipt, or unrecoverable customer action.

## P1

1. Homepage should stop displaying raw upload/pricing HTTP status strings.
   - Evidence: `src/components/HomeRenderFlow.tsx` uses messages such as `Upload failed (${response.status}).`, `Pricing failed (${priceResponse.status}).`, and raw caught error messages.
   - Fix: map upload/pricing failures to human wording and keep technical status in console only.

2. Workspace should map backend enum strings before rendering user-visible errors.
   - Evidence: `src/components/Workspace.tsx` fetch paths can surface `json.error`, `result.error`, and `status_###`.
   - Fix: add a small display-error mapper for common cases: `auth_required`, `payment_required`, `insufficient_balance`, `not_found`, `zip_missing_frames`, `output_validation_failed`, `timeout`.

3. Account should replace wallet/status backend strings with calm customer copy.
   - Evidence: `src/components/AccountPage.tsx` can show `wallet_unavailable` and `status_###`.
   - Fix: show `Wallet history is unavailable right now. Refresh or try again later.`

4. Add-on auth wording should be simplified.
   - Evidence: add-on audit notes show a confusing API key/token path while the practical flow is send package, then sign in/pay in workspace.
   - Fix: hide or clearly label token field as Advanced/Internal. Primary copy should say payment and sign-in happen in Farpy workspace.

5. NodeMuncher desktop should translate token/lease/render transport failures.
   - Evidence: NodeMuncher smoke and route outputs include `forbidden`, `not_found`, `missing token`, `lease`, and HTTP details.
   - Fix: user UI should say paired/unpaired, no package available, package download failed, render timed out, result upload failed. Keep raw route codes only in logs.

## P2

1. Add a consistent "What to do next" sentence to every failure state.
   - Examples: refresh, sign in, add funds, send package again, pair this PC again, install Blender.

2. Keep raw failure fields available in collapsed Verification Details or logs.
   - This preserves support/debug value without making the primary page feel broken.

3. Use one shared frontend error vocabulary.
   - `Package`, `render partner`, `delivery receipt`, `wallet`, `download`, `Verification Details`.

4. Add package ID/job ID copy affordance to failure states.
   - This reduces support friction without changing backend behavior.

## Recommended Wording Map

| Raw / Current | Customer Copy |
| --- | --- |
| `auth_required` | `Please sign in to continue.` |
| `forbidden` | `You do not have access to this package.` |
| `payment_required` | `Payment is required before Farpy can send this package.` |
| `insufficient_balance` | `Insufficient balance. Add funds to continue.` |
| `not_found` | `This package link is no longer available.` |
| `wallet_unavailable` | `Wallet history is unavailable right now. Refresh or try again later.` |
| `Upload failed (###).` | `Farpy could not send this package. Check your connection and try again.` |
| `Pricing failed (###).` | `Farpy could not price this package. Try again, or send a smaller package.` |
| `zip_missing_frames` | `The render output was incomplete. No delivery receipt was created.` |
| `output_validation_failed` | `The render output could not be verified. No delivery receipt was created.` |
| `worker failed` | `This render partner encountered a problem. No completed delivery was produced.` |
| `timeout` | `Rendering took too long and stopped before completion.` |
| `missing token` | `This PC is not paired with Farpy. Pair it again in Settings.` |
| `no paid submitted compatible job available` | `No package is available right now.` |

## Commands Run

```powershell
rg -n "error|failed|Unable|Could not|Please|unsupported|auth_required|payment_required|invalid|missing|timeout|stopped|try again|Retry|No .*found|not available|not supported|connection|sign in|Sign in|Upload failed|Pricing failed|checkout|insufficient|forbidden|not_found" src public scripts release\BLENDER_ADDON_FINAL_AUDIT_V1.md release\BENCHMARK_PUBLIC_REPUBLISH_RUNTIME_FIX_V1.md release\NODEMUNCHER_LEASE_FAILURE_REPORT_V1.md -S --glob '!out/**' --glob '!node_modules/**'
```

```powershell
Get-Content src\components\HomeRenderFlow.tsx -Raw
Get-Content src\components\Workspace.tsx -Raw
Get-Content src\components\AccountPage.tsx -Raw
Get-Content src\components\AddonPage.tsx -Raw
```

```powershell
rg -n "forbidden|not_found|auth_required|payment_required|error|failed|timeout|No .*work|lease|Pair|paired|heartbeat|Render failed|Upload failed|Blender|did not return|render time|Run Test|Preparing|Rendering|Finalizing|Coming Soon|Unsupported|missing|invalid" C:\Users\danki\Desktop\nodemuncher-codex\src C:\Users\danki\Desktop\nodemuncher-codex\src-tauri C:\Users\danki\Desktop\nodemuncher-codex\scripts -S --glob '!target/**' --glob '!node_modules/**'
```

## Files Changed

- `release/ERROR_MESSAGE_AUDIT_V1.md`

## Final Verdict

YELLOW.

No P0 copy blocker was proven. Before wider retail traffic, the main cleanup is to map raw backend/status errors into human package/delivery language and keep technical details in Verification Details or logs.
