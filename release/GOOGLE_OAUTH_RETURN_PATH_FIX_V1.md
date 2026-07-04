# GOOGLE_OAUTH_RETURN_PATH_FIX_V1

Status: GREEN

## Files changed

- Production: `/opt/farpy/app/auth/server.js`
- Release note: `release/GOOGLE_OAUTH_RETURN_PATH_FIX_V1.md`

## Root cause

The live Google OAuth callback ignored the requested `next` path and always redirected to:

- `/real/?farpy_user=<email>`

That route is stale and exposes the user identifier in the URL.

## Fix

- `/auth/google` now stores a sanitized `next` path in the existing Express session:
  - `req.session.google_next = farpySafeNextPath(req.query.next || "/account")`
- `/auth/google/callback` now:
  - sets the existing `farpy_user` cookie
  - grants the signup wallet credit as before
  - redirects to `nextPath`
  - does not append `farpy_user` to the final URL
- Fallback redirect is `/account`.
- Current auth server no longer contains `/real/`.

## Deploy commands

```powershell
scp root@farpy.com:/opt/farpy/app/auth/server.js C:\tmp\farpy-auth-server-google-return-fix.js
node --check C:\tmp\farpy-auth-server-google-return-fix.js
scp C:\tmp\farpy-auth-server-google-return-fix.js root@farpy.com:/tmp/server.js.google_return_fix
ssh root@farpy.com "<backup, install, node --check, grep, restart farpy-auth.service>"
npm.cmd run build
```

Production backup:

- `/opt/farpy/app/auth/server.js.bak.google_oauth_return_path_fix.20260627T191504Z`

## Production proof

- `farpy-auth.service` active.
- `/opt/farpy/app/auth/server.js` contains:
  - `req.session.google_next = farpySafeNextPath(req.query.next || "/account")`
  - `const nextPath = farpySafeNextPath(req.session?.google_next || "/account")`
  - `res.redirect(nextPath)`
- `/opt/farpy/app/auth/server.js` contains no `/real/`.
- `GET https://farpy.com/auth/google?next=%2Faccount` returns `302` to Google and sets a session cookie.
- `GET https://farpy.com/auth/google?next=%2Fworkspace%3Fjob_id%3DJOB-1ED4E57B` returns `302` to Google.
- The Google start redirect location does not contain `/real/`.
- `https://farpy.com/account` returns `200`.
- `https://farpy.com/workspace?job_id=JOB-1ED4E57B` returns `200`.

## Validation limit

The final Google callback requires completing the real Google OAuth consent flow in a browser. The callback code path now redirects to the session-stored safe `nextPath`; no operator OAuth session was used in this automated validation.
