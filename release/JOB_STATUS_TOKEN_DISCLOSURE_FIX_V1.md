# JOB_STATUS_TOKEN_DISCLOSURE_FIX_V1

Date: 2026-06-28

## Summary

Unauthenticated or wrong-user job status responses no longer include tokenized `download_url` or `receipt_url` fields, and now return only a minimal safe status shape.

## Root Cause

`publicJob()` always serialized tokenized download and receipt URLs whenever output and receipt files existed. The unauthenticated job status endpoint reused that serializer directly.

## Fix

- Added `isAuthenticatedOwner(req, job)` using the existing Farpy session cookie identity.
- Changed `publicJob(job, options)` so private URLs are omitted unless explicitly requested.
- Added `publicJobSafeStatus(job)` for no-cookie/wrong-user status responses.
- The public job status endpoint now returns full private workspace data only when the requester is the authenticated owner of `job.user_id`; otherwise it returns safe status fields only.

## Safe Status Fields

- `ok`
- `job_id`
- `status`
- `renderer`
- `frame_start`
- `frame_end`
- `frame_count`
- `created_at`
- `submitted_at`
- `updated_at`
- `completed_at`

## Intended Behavior

- No cookie or wrong-user cookie: safe status only, no `download_url`, no `receipt_url`, no tokenized URLs, no owner identity, no payment IDs.
- Owner cookie: status may include `download_url` and `receipt_url`.
- Tokenized download and receipt endpoints keep their existing token validation.

## Files

- `scripts/job-api.mjs`
