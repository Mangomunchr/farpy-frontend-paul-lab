# NIGHTLY_PLATFORM_SMOKE_V1

Status: WARN

Date: 2026-06-30

## Summary

Implemented a single-command nightly read-only smoke for Farpy production.

The smoke checks public launch routes, non-mutating malformed-JSON failure gates, public assets, node health, and optional tokenized receipt/download URLs when explicitly provided by environment variable.

## Files Changed

- `scripts/nightly-platform-smoke-v1.ps1`
- `release/NIGHTLY_PLATFORM_SMOKE_V1.md`

## One Command

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\nightly-platform-smoke-v1.ps1 -OutputPath C:\tmp\nightly-platform-smoke-v1-latest.json
```

## Areas Covered

- Homepage
- Upload endpoint
- Wallet endpoint
- Receipt endpoint
- Download endpoint
- Node health
- Benchmark
- Status

## Optional Private Inputs

These checks are reported as `WARN` when env vars are absent:

- `FARPY_NIGHTLY_RECEIPT_URL`, `FARPY_REGRESSION_RECEIPT_URL`, or `FARPY_AUDIT_RECEIPT_URL`
- `FARPY_NIGHTLY_DOWNLOAD_URL`, `FARPY_REGRESSION_DOWNLOAD_URL`, or `FARPY_AUDIT_DOWNLOAD_URL`

## Non-Mutation Guard

The final script uses:

- `GET` for public pages.
- `HEAD` for public static assets.
- malformed JSON `POST` probes for create/checkout gates, which must fail before any production mutation.

During initial harness validation, an earlier draft used `{}` against `/node/v1/web-render/jobs/create` and production returned `JOB-D2D7C4BA`. The script was corrected immediately so nightly runs no longer use a mutating valid create payload.

## Commands Run

Initial validation run:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File C:\Users\danki\Desktop\farpy-frontend\scripts\nightly-platform-smoke-v1.ps1 -OutputPath C:\tmp\nightly-platform-smoke-v1-latest.json
```

Corrected validation run:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File C:\Users\danki\Desktop\farpy-frontend\scripts\nightly-platform-smoke-v1.ps1 -OutputPath C:\tmp\nightly-platform-smoke-v1-latest.json
```

## Corrected Run Result

- PASS: 24
- WARN: 2
- FAIL: 0
- Verdict: WARN
- Evidence: `C:\tmp\nightly-platform-smoke-v1-latest.json`

## Warnings

- Tokenized receipt URL check skipped because no env var was provided.
- Tokenized download URL check skipped because no env var was provided.

## Current Nightly Verdict

WARN.

Public surfaces and fail-closed gates passed. The suite remains WARN until real tokenized receipt and download URLs are supplied for nightly verification.
