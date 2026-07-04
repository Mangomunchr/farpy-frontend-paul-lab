# WORKSPACE_AUTH_GATE_V1

Status: GREEN for frontend/auth-gated workspace surface.

## Files changed

- `src/components/Workspace.tsx`

## Behavior

- Workspace now waits for `/v1/auth/me` before showing payment actions.
- Signed-out priced jobs show `Sign in to Pay` instead of `Pay & Render`.
- `Sign in to Pay` redirects to `/signin?next=<current workspace URL>`.
- Signed-in users keep the existing checkout/render actions.
- Stripe checkout creation failures shown by the workspace UI are normalized to `Unable to start checkout.` with a `Retry` button.
- Raw backend strings such as `stripe_checkout_failed` are not present in the built frontend output.

## Build

PASS: `npm.cmd run build`

## Production deploy

Static bundle deployed to `/opt/farpy.com/out`.

Backup:

- `/opt/farpy.com/out.bak.workspace_auth_gate.20260627T181800Z`

Production static proof:

- `Sign in to Pay` present in `/opt/farpy.com/out/_next/static`
- `Unable to start checkout` present in `/opt/farpy.com/out/_next/static`
- `stripe_checkout_failed` absent from `/opt/farpy.com/out`

## Signed-out smoke

Created a public unpaid/priced smoke job through the normal upload endpoint:

- upload_id: `UP-2D2B03BF`
- job_id: `JOB-1ED4E57B`
- status: `queued`
- payment_status: `priced`
- can_start_render: `false`
- price_cents: `1`

Routes:

- `https://farpy.com/workspace?job_id=JOB-1ED4E57B` -> 200
- `https://farpy.com/signin?next=%2Fworkspace%3Fjob_id%3DJOB-1ED4E57B` -> 200

Direct unauthenticated checkout API still returns the backend raw error, but the workspace UI no longer calls checkout while signed out.

## Signed-in smoke

No reusable authenticated smoke cookie/session was available in the operator environment:

- `FARPY_AUTH_COOKIE`: absent
- `FARPY_SMOKE_COOKIE`: absent
- `FARPY_AUDIT_COOKIE`: absent
- `FARPY_SIGNED_IN_COOKIE`: absent

Authenticated code path proof:

- `showCheckout` is gated by `authChecked && isAuthenticated`.
- `needsSignInToPay` is gated by `authChecked && !isAuthenticated`.

A full signed-in browser checkout smoke still requires a real operator session or explicit smoke cookie.
