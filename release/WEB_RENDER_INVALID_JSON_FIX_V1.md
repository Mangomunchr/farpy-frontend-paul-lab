# WEB_RENDER_INVALID_JSON_FIX_V1

Status: IMPLEMENTED
Date: 2026-06-30

## Objective

Make malformed JSON on `POST /node/v1/web-render/jobs/create` fail closed with `400 invalid_json` instead of falling through to a public `500 internal_error`.

## Files Changed

- `scripts/job-api.mjs`

## Patch

The job create handler now wraps its raw JSON parse in a narrow `try/catch` and returns:

```json
{ "ok": false, "error": "invalid_json" }
```

with HTTP `400` when the request body is malformed JSON.

## Behavior Preserved

- Existing auth/payment/render logic was not changed.
- Existing valid JSON create path continues into the same job creation logic.
- Existing unsupported file validation remains unchanged.

## Validation

Required checks:

- `node --check scripts/job-api.mjs`
- `GET /node/v1/web-render/health` returns `200`
- malformed JSON to `POST /node/v1/web-render/jobs/create` returns `400 invalid_json`
- valid unauth JSON behavior is preserved by the existing route logic

## Production Notes

Deploy requires backing up `/opt/farpy-web-render/scripts/job-api.mjs`, copying the patched script, and restarting `farpy-web-render-api.service`.

## Production Validation - 2026-06-30

Deployment:

- Backed up production script to `/opt/farpy-web-render/scripts/job-api.mjs.bak.web-render-invalid-json-fix-v1.20260630T193914Z`.
- Copied patched `scripts/job-api.mjs` to `/opt/farpy-web-render/scripts/job-api.mjs`.
- Ran production `node --check /opt/farpy-web-render/scripts/job-api.mjs`.
- Restarted `farpy-web-render-api.service`; service returned `active`.

Results:

- `GET https://farpy.com/node/v1/web-render/health` -> `200 OK`.
- malformed JSON to `POST https://farpy.com/node/v1/web-render/jobs/create` -> `400 {"ok":false,"error":"invalid_json"}`.
- valid unauth JSON to `POST https://farpy.com/node/v1/web-render/jobs/create` -> `200 OK` with new job `JOB-0DFB7C4F`.

Remaining blocker:

- The requested `valid unauth JSON -> 401 auth_required` behavior is not present in the current production create route. The route still allows unauthenticated job creation for valid JSON. This task did not change auth logic because the contract explicitly said not to change auth/payment/render logic.

Verdict:

- Malformed JSON fix: PASS.
- Full requested verification set: YELLOW due pre-existing unauthenticated valid create behavior.
