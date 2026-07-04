# FARPY_DEMO_PROOF_PACK_V1

## Status

GREEN / PARTIAL PROOF PACK

## Purpose

Create a clean investor, SBIR, and customer-facing demo proof pack showing the current Farpy Retail Alpha surfaces without fake metrics, fake jobs, private credentials, or staged testimonials.

## Folder

`release/demo-proof-pack/`

## Screenshots captured

| File | Captures | What it proves |
| --- | --- | --- |
| `01-homepage-desktop.png` | Homepage desktop | The homepage explains upload -> rendering -> download + receipt, with primary CTA and trust strip visible. |
| `02-homepage-mobile.png` | Homepage mobile | Mobile layout fits at 390px and keeps the customer story readable. |
| `03-pricing-topup.png` | Pricing plus top-up auth boundary | Pricing/no-subscription copy is visible, and wallet top-up reaches the sign-in/payment boundary without exposing Stripe/private details. |
| `04-workspace-upload.png` | Homepage package upload card | Real package upload UI, output choice, frame control, delivery choice, summary, and disabled CTA before file selection. |
| `06-receipt-proof.png` | Receipt route shell | Receipt route exists and fails safely when job id/token is missing. No fake receipt data is shown. |
| `07-addon.png` | Blender add-on page | Public install/download handoff for Farpy Render Delivery. |
| `08-benchmark.png` | Benchmark page | Public Benchmark page and artifact links; it shows no fake leaderboard data. |
| `09-status.png` | Status page | Public status pillars and current public-safe status wording. |

## Skipped

| Requested proof | Reason |
| --- | --- |
| `05-job-progress.png` | Skipped because no real queued/rendering/packaging/ready job state was available in the local public-safe preview. No fake job states were staged. |
| Screenshot after package selected | Skipped because selecting a local file in headless browser automation would not prove a real upload and could create a misleading staged state. |
| Real receipt with output SHA-256 | Skipped because no real completed job receipt URL/token was provided for this proof-pack run. The receipt shell was captured instead. |
| Blender runtime panel screenshot | Skipped because Blender UI automation was not available in this tool session. Add-on page and ZIP proof are included instead. |

## No fake telemetry statement

This proof pack intentionally avoids:

- fake render counts,
- fake job progress,
- fake receipt IDs,
- fake SHA-256 output proofs,
- fake benchmark submissions,
- fake testimonials,
- private payment screenshots,
- private customer/account data.

## Commands run

```powershell
npm.cmd run build
```

```powershell
python -m http.server 3111 --bind 127.0.0.1
```

Chrome DevTools Protocol was used to capture local static screenshots from `http://127.0.0.1:3111`.

## Build/test results

- Frontend build: PASS
- Static local preview: PASS
- Homepage mobile capture: PASS, 390px viewport had no horizontal overflow.
- Screenshot pack generated: PASS

## Notes

- Screenshots are generated from the local static export, not production.
- The pack is safe for demo use as a product-surface proof pack, but it is not a substitute for a fresh paid-user end-to-end render proof.
