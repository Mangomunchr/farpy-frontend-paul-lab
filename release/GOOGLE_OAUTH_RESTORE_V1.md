# GOOGLE_OAUTH_RESTORE_V1

Status: GREEN

## Files changed

- `src/components/AuthPage.tsx`

## Provider/config status

- Google OAuth backend is live at `/auth/google`.
- `/auth/google?next=%2Faccount` returns `302` to Google OAuth.
- `/v1/auth/google/start` is not routed and was not used.
- No auth secrets are exposed in frontend code.

## Behavior

- `/signin` now shows primary `Continue with Google` button.
- Google link target preserves redirect state:
  - `/auth/google?next=${encodeURIComponent(next)}`
- Divider `or` appears below Google sign-in.
- Email magic-link form remains unchanged.
- Default missing `next` remains `/account`.
- Signed-out workspace flow can land on `/signin?next=/workspace?job_id=...` with Google sign-in available.

## Build

PASS: `npm.cmd run build`

## Production deploy

Static bundle deployed to `/opt/farpy.com/out`.

Backup:

- `/opt/farpy.com/out.bak.google_oauth_restore.20260627T190444Z`

Production proof:

- `https://farpy.com/signin?cb=google-oauth-restore` -> 200
- `https://farpy.com/signin?next=%2Fworkspace%3Fjob_id%3DJOB-1ED4E57B` -> 200
- `https://farpy.com/auth/google?next=%2Fworkspace%3Fjob_id%3DJOB-1ED4E57B` -> 302 to Google OAuth
- Deployed static output contains `Continue with Google`.
- Deployed static output contains `/auth/google?next=`.
- Deployed static output contains `Email sign-in`.

## Blockers

None.
