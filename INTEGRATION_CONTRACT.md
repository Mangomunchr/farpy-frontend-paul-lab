# Frontend ⇄ Adapter Integration Contract

How each page is wired to the public adapter (`/v1`), the request/response it
relies on, and the loading + error states it renders. This is the map for
mapping real production payloads behind the adapter.

- **Base URL:** `process.env.NEXT_PUBLIC_FARPY_API_BASE` (default `/v1`). See `.env.example`.
- **Auth:** all requests send `credentials: "include"` (session cookie).
- **Client layer:** `src/lib/api.ts` (wrappers) + `src/lib/types.ts` (models +
  `normalizeRenderJob`). Nothing in the UI calls `fetch` directly.
- **Result type:** every wrapper returns `ApiResult<T>` =
  `{ ok: true, data } | { ok: false, error: { kind, status?, message } }`.
  `kind` ∈ `network | http | parse | unauthorized | not_implemented`.

Status of each endpoint is tracked in **MISSING_ENDPOINTS.md**.

---

## Landing — `/` (`RenderWidget`)
Drop a `.blend`, upload it, price it, hand off to the workspace.

| | |
|---|---|
| **Endpoints** | `POST /v1/uploads`, then `POST /v1/renders/estimate` |
| **Request** | upload: multipart `file`. estimate: `{ upload_id, input_url, frames? }` |
| **Response** | upload: `{ upload_id, input_url, scene_url, frames? }`. estimate: `{ frames, price_cents, estimated_seconds? }` |
| **Loading** | "Uploading your scene…" then "Pricing your render…" (spinner panel) |
| **Error** | invalid file → inline reject copy; upload/estimate failure → error panel + "Try another file" |
| **Notes** | staged result lives in the shared store and survives client nav to `/workspace`. Price shown via `price_cents`. |

## Landing showcase — `/` (`ProofFilmstrip`)
| | |
|---|---|
| **Endpoint** | `GET /v1/public/recent-renders` (wrapper exists; **not bound** to the UI) |
| **Why** | endpoint lacks `thumbnail_url`/title → can't drive the visual filmstrip. Landing keeps the curated showcase until those fields exist (MISSING_ENDPOINTS §12). |

---

## Workspace — `/workspace` (`Workspace`, `WorkspaceMasthead`)
The studio: stage/submit a render, list live + finished + failed.

| | |
|---|---|
| **Endpoints** | `GET /v1/auth/me`, `GET /v1/balance`, `GET /v1/workspace/renders`, `POST /v1/renders`; masthead also `POST /v1/auth/logout` |
| **Submit request** | `{ upload_id, input_url, scene_url, frames, queue }` |
| **Submit response** | normalized job (`{ job_id, state, ... }`) → routes to `/workspace/{job_id}` |
| **List response** | `{ renders: [ normalized job, ... ] }` |
| **Loading** | "Loading your renders…"; balance shows `—` until ready |
| **Error** | list error → red notice banner; submit error → inline notice; balance error → `—` |
| **Empty** | first-run empty state ("Your renders will show up here") |
| **Live updates** | store re-polls `/workspace/renders` + `/balance` every 4s while any job is `RUNNING`/`QUEUED` |
| **Gating** | if price > balance → "Add funds to render" → `/topup` |

States rendered from a job:
- `RUNNING`/`QUEUED` → live card with `pct` + `frames_done/total_frames`
- `DONE` + `output_url` → "Download ZIP"; `+ receipt_url` → "Receipt"
- `FAILED` → "Didn't finish", `$0.00`, refund copy, "Render again"

---

## Render detail — `/workspace/[id]` (`RenderDetail`, `useRenderJob`)
| | |
|---|---|
| **Endpoint** | `GET /v1/renders/:job_id` (polled every 3s while `QUEUED`/`RUNNING`) |
| **Response** | normalized job (MISSING_ENDPOINTS §8) |
| **Loading** | "Loading your render…" |
| **Error** | `404`/missing → "Render not found"; other → "Couldn't load this render" + message |
| **DONE** | frames, GPU, date, amount paid; "Download ZIP" (uses `output_url`, disabled → "Preparing ZIP…" until present); "View receipt" (`receipt_url`) |
| **FAILED** | failure reason (`error`), `$0.00`, "Render again" |
| **RUNNING** | progress steps, `pct`, reserved amount (ceiling) |

---

## Top up — `/topup` (`TopUpPage`)
| | |
|---|---|
| **Endpoints** | `GET /v1/topup/options`, `POST /v1/topup/checkout`, `GET /v1/balance` (via store) |
| **Options response** | `{ options: [ { amount_cents, label } ] }` → preset buttons (falls back to $5/$10/$25/$50 if unavailable) |
| **Checkout request** | `{ amount_cents, method? }` (`method`: `stripe` default / `lightning`) |
| **Checkout response** | `{ checkout_url }` → `window.location` redirect |
| **Loading** | button → "Starting checkout…" |
| **Error** | unauthorized → "Please sign in before topping up"; other → "Couldn't start checkout. <msg>"; no URL → "follow the instructions" notice |
| **Notes** | nothing is credited client-side; balance refreshes from the backend on return. Regional rails remain `mailto:` (manual, by design). |

---

## Account — `/account` (`AccountPage`)
| | |
|---|---|
| **Endpoints** | `GET /v1/auth/me`, `GET /v1/balance`, `GET /v1/workspace/renders` (all via store) |
| **Real data** | profile email (read-only, from session); balance + "frames left"; usage stats + recent receipts (from finished jobs, `receipt_url`) |
| **Loading** | balance/email show `—`/`…` until ready |
| **Honest-empty (no endpoint yet)** | cards: no stored card to manage (Stripe at checkout); API access read-only / no key; Blender add-on "no paired device"; notifications/security are cosmetic toggles |
| **Missing** | profile edit, payment-method management, API keys, device pairing — see MISSING_ENDPOINTS §12–16 |

---

## Developer API page — `/api` (`ApiPage`)
Static documentation of the public read-only API. No live calls. Sample shapes
mirror `lib/proofs.ts`. Update copy if the public endpoint paths change.

---

## July‑1 critical path (P0) coverage
| Step | Page | Endpoint | Wired |
|---|---|---|---|
| Upload `.blend` | `/` or `/workspace` | `POST /v1/uploads` | ✅ client; ⛔ backend stub |
| See estimate | `/` or `/workspace` | `POST /v1/renders/estimate` | ✅ client; ⚠️ backend flat |
| Pay | `/topup` | `POST /v1/topup/checkout` | ✅ client; ⚠️ confirm `checkout_url` |
| Submit render | `/workspace` | `POST /v1/renders` | ✅ client; ⚠️ confirm req/resp |
| View status | `/workspace/[id]` | `GET /v1/renders/:id` | ✅ client (+ normalizer) |
| Download ZIP | `/workspace/[id]` | job `output_url` | ✅ client; ⚠️ confirm signed ZIP |
| View receipt | `/workspace/[id]` | job `receipt_url` | ✅ client; ⚠️ confirm reachable |

✅ = frontend done · ⚠️ = needs backend confirmation · ⛔ = backend blocking
