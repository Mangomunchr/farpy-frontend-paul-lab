# MISSING / INSUFFICIENT ADAPTER ENDPOINTS

What the frontend needs from the public adapter (`/v1`) that is **not there yet**,
is **stubbed**, or returns the **wrong shape**. Audited against the adapter
`server.js` and the production job samples the client shared.

Per the brief: the frontend does **not** implement workarounds. It calls the
adapter as documented below and renders graceful loading/error states until the
backend team maps these. Frontend talks to the adapter only — never to the
production services (8090/8092/8097/8098) directly.

Priority: **P0** blocks the July‑1 paying flow (upload → estimate → pay →
submit → status → download → receipt). **P1** important. **P2** can ship after.

---

## P0 — blocks the first paying customer

### 1. `POST /v1/uploads` — currently `501 not_wired_yet`
The whole funnel starts here. Need a real multipart upload of the `.blend`.

**Request** (frontend sends):
```
POST /v1/uploads
Content-Type: multipart/form-data
field: file=<the .blend>          # browser sets the boundary
cookie: <session>                 # if uploads are auth-gated
```

**Response needed:**
```json
{
  "ok": true,
  "upload_id": "UP-1780521695094-2d5eab",
  "input_url": "https://api.farpy.com/real-upload/UP-xxxx.blend",
  "scene_url": "https://api.farpy.com/real-upload/UP-xxxx.blend",
  "frames": 240,            // OPTIONAL but ideal: server-parsed frame count
  "total_frames": 240,      // alias accepted
  "filename": "Studio_Car.blend"
}
```
Frontend consumes: `upload_id` (or `input_url`) to estimate + submit, and
`frames` to skip a separate parse. If `frames` is omitted, estimate must derive it.

---

### 2. `POST /v1/renders/estimate` — exists but is a flat passthrough
Today it returns `price_cents = frames` from the **client-supplied** number and
ignores the file (`estimated_seconds: null`). Need it to price the **real**
uploaded scene.

**Request:**
```json
{ "upload_id": "UP-...", "input_url": "https://...", "frames": 240 }
```

**Response needed:**
```json
{ "ok": true, "frames": 240, "price_cents": 240, "estimated_seconds": null }
```
- `frames` must reflect the actual scene frame range (from the upload), not echo
  the client.
- `estimated_seconds` may stay `null` for now (UI does not require an ETA).
- **Queue pricing:** the UI offers Normal and Fast, and now **always displays and
  charges against the backend `price_cents`** (it re-calls estimate with
  `"queue"` whenever the toggle changes — no client-side multiplier). Please make
  estimate **accept `queue` and return the matching `price_cents`**. If estimate
  ignores `queue`, Normal and Fast simply show the same (backend-quoted) price —
  honest, but Fast won't be priced higher until the backend differentiates.

---

### 3. `GET /v1/balance` — stub, always `0`
Returns `balance_cents: 0` with `note: "adapter_stub_until_balance_endpoint_mapped"`.
Gates rendering and drives /topup + /account.

**Request:** `GET /v1/balance` (cookie session)

**Response needed:**
```json
{ "ok": true, "email": "user@example.com", "balance_cents": 740 }
```
Must reflect the real per-user balance from the balance service.

---

### 4. `GET /v1/auth/me` — proxies `:8092`, shape unconfirmed
Frontend accepts either `{ "email": "..." }` or `{ "user": { "email": "..." } }`,
and treats `401` as "signed out". Please confirm the success shape:
```json
{ "ok": true, "email": "user@example.com" }
```
and that an unauthenticated call returns **`401`** (not `200` with null).

---

### 5. Auth — magic link + Google OAuth (model decided; endpoints not wired)
The auth model is **passwordless: magic link + Google OAuth**. The frontend now
ships `/signin` and `/signup` pages (same flow — a new email auto-creates the
account) that call the two endpoints below. Both currently fail (501/404), so
submissions surface an honest "not yet" state instead of pretending to succeed.

**5a. `POST /v1/auth/magic-link`** — email a one-time sign-in link.
```
POST /v1/auth/magic-link
{ "email": "user@example.com", "next": "/workspace" }
```
`next` is where the user should land after clicking the link (validated,
rooted path). Response:
```json
{ "ok": true }
```
The emailed link must, on click, **set the session cookie** and 302 to `next`.
A new email creates the account. Frontend shows a "Check your inbox" state and
offers resend / change-email; the link should expire (~15 min) — tell us the TTL
if different.

**5b. `GET /v1/auth/google/start?next=...`** — kick off Google OAuth.
A full-page navigation (not fetch). The backend does the OAuth dance, sets the
session cookie, then 302 back to `next` (rooted path, default `/workspace`).
Frontend renders this as a real `<a>` so it works without JS. New emails create
the account, same as the magic link.

Until these exist, every authed call falls back to a signed-out state. The
frontend already probes `GET /v1/auth/me` (§4) on the auth page and skips it for
signed-in users.

---

### 6. `POST /v1/topup/checkout` — proxies `:8090`, response shape unconfirmed
Frontend posts the amount and **redirects** to the returned URL.

**Request:**
```json
{ "amount_cents": 500, "method": "stripe" }   // method optional: "stripe" | "lightning"
```

**Response needed:**
```json
{ "ok": true, "checkout_url": "https://checkout.stripe.com/c/pay/cs_..." }
```
Frontend reads `checkout_url` (or `url`) and does `window.location = url`. If no
URL is returned, it shows a "follow the instructions" notice — but a hosted URL
is required for the instant Stripe path.

---

### 7. `POST /v1/renders` (submit) — proxies `:8097/submit`, shape unconfirmed
**Request** the frontend sends:
```json
{
  "upload_id": "UP-...",
  "input_url": "https://...",
  "scene_url": "https://...",
  "frames": 240,
  "queue": "Normal"
}
```
Please confirm which fields submit requires (upload_id vs input_url; frames as a
count vs an explicit list like `[1,2,3,...]`).

**Response needed:** the created job, ideally the normalized shape (§8), at
minimum:
```json
{ "ok": true, "job_id": "JOB-1780521695094-2d5eab", "state": "QUEUED" }
```

---

### 8. `GET /v1/renders/:job_id` — proxies raw `:8098/status`; must be normalized
This is the heartbeat of the workspace + detail page (polled while live). The
adapter should **hide the messy production fields** and return the agreed shape:
```json
{
  "job_id": "JOB-1780521695094-2d5eab",
  "state": "DONE",                 // QUEUED | RUNNING | DONE | FAILED
  "status": "DONE",
  "amount_cents": 5,
  "frames_done": 5,
  "total_frames": 5,
  "progress": { "frames_done": 5, "total_frames": 5, "pct": 100,
                "current_frame": 5, "node_id": "pr-001-g1", "updated_at": "..." },
  "output_url": "https://farpy.com/outputs/2d/JOB-...zip",
  "receipt_url": "/receipt-static/JOB-.../index.json",
  "verify_ok": true,
  "error": null,
  "scene_url": "https://api.farpy.com/real-upload/UP-xxxx.blend",
  "ts_utc": "2026-06-03T21:21:35.094Z"
}
```
**Note:** the client layer (`lib/types.ts → normalizeRenderJob`) already tolerates
the raw production shape (`current_frame`, `rendered_frames`, `job.frames[]`,
lowercase states, etc.), so this works today — but normalizing in the adapter is
cleaner and the agreed contract.
Also confirm the **404** behavior for an unknown/again-other-user job_id.

---

## P1 — needed for a complete experience

### 9. `GET /v1/workspace/renders` — must be user-scoped + normalized
Today it reads the local filesystem `/var/lib/farpy/jobs` and is **not** scoped to
the signed-in user. Need: the **current user's** jobs (by session), newest first,
each in the normalized §8 shape:
```json
{ "ok": true, "renders": [ { /* normalized job */ }, ... ] }
```
The frontend polls this every 4s while any job is live.

### 10. Receipt URL reachability
Jobs return `receipt_url: "/receipt-static/JOB-.../index.json"` (relative). The
frontend links to it directly. Confirm it is reachable from the web origin
(same-origin or absolute `https://...`) and whether it needs auth. Document the
receipt JSON schema so we can render it inline on a future `/proof` page instead
of opening raw JSON.

### 11. `GET /v1/renders/:job_id/download` — wrong shape; not used
Currently returns a guessed `...<job>.png` URL. The frontend **ignores** this and
uses `output_url` (a `.zip`) straight off the job. Either remove this endpoint or
make it a 302 redirect to the signed ZIP. **Confirm `output_url` is the canonical,
signed, web-reachable ZIP link.**

---

## P2 — after launch

### 12. `GET /v1/public/recent-renders` — lacks display fields
Returns `{ job_id, status, frames, price_cents, verified }`. The public showcase
(landing filmstrip) needs visuals it can't get from this: no **thumbnail/preview
image** and no **scene/title**. Until those exist the landing keeps its curated
showcase. Requested additions:
```json
{ "job_id": "...", "thumbnail_url": "https://...", "title": "Studio render",
  "frames": 240, "verified": true }
```

### 13. Per-job thumbnail / preview image (all surfaces)
No job payload has a preview image. Workspace cards + the detail viewport show no
output thumbnail as a result. Add an optional `thumbnail_url` / `preview_url` to
the job shape (§8) to restore the finished-render imagery.

### 14. `GET/POST/DELETE /v1/api-keys` — disabled / `501`
`api_keys_not_enabled`. The account page now says "read-only API, no key needed"
(honest, matches today). When write/keys land, wire these.

### 15. Cancel a render — no endpoint
There is no way to cancel a running job. The detail page's old "Cancel render"
was removed. If cancel-with-refund is desired, add e.g. `POST /v1/renders/:id/cancel`.

### 16. `POST /v1/auth/logout`
Returns `{ ok: true }` but it's unclear whether it clears the session cookie.
Confirm it invalidates the session server-side (frontend calls it on sign-out).

---

## Open questions to resolve with the real payloads (tomorrow)
1. ~~Auth model for `/v1/auth/login` (password / magic link / OAuth)?~~ → **decided: magic link + Google OAuth** (see §5).
2. Does `/v1/uploads` require a session, or can anonymous visitors price a file?
3. `submit` frame format: count (`240`) or explicit list (`[1..240]`)?
4. Queue support in estimate/submit, and confirm Fast = 2× Normal.
5. Is `output_url` always the signed, web-reachable ZIP? TTL?
6. Is `receipt_url` web-reachable and what is its JSON schema?
7. 404 contract for unknown / cross-account `job_id`.
