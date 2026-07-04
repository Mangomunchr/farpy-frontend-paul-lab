# REGRESSION_SUITE_IMPLEMENTATION_V1

Status: WARN

Date: 2026-06-30

## Summary

Implemented a read-only Farpy production regression suite with one PowerShell command.

The suite verifies public launch surfaces and optional tokenized/private proof URLs without mutating production.

## Files Changed

- `scripts/regression/run-regression-suite-v1.ps1`
- `release/REGRESSION_SUITE_IMPLEMENTATION_V1.md`

## One Command

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\regression\run-regression-suite-v1.ps1 -OutputPath C:\tmp\farpy-regression-suite-v1-latest.json
```

## Checks Covered

- Homepage
- Sign in
- Account
- Workspace
- Upload
- Wallet
- Topup
- Receipt
- Download
- Status
- Add-on
- Benchmark
- Node health

## Optional Private Proof Inputs

These are skipped with WARN when absent, not silently passed:

- `FARPY_REGRESSION_JOB_STATUS_URL` or `FARPY_AUDIT_JOB_STATUS_URL`
- `FARPY_REGRESSION_RECEIPT_URL` or `FARPY_AUDIT_RECEIPT_URL`
- `FARPY_REGRESSION_DOWNLOAD_URL` or `FARPY_AUDIT_DOWNLOAD_URL`

## Exit Behavior

- `PASS`: no failures or warnings.
- `WARN`: public checks pass, but optional/private checks are skipped or non-critical UI proof text is not found.
- `FAIL`: one or more required public checks fail. The script exits nonzero.

## Command Run

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File C:\Users\danki\Desktop\farpy-frontend\scripts\regression\run-regression-suite-v1.ps1 -OutputPath C:\tmp\farpy-regression-suite-v1-latest.json
```

## Run Result

- PASS: 40
- WARN: 7
- FAIL: 0
- Verdict: WARN
- Evidence: `C:\tmp\farpy-regression-suite-v1-latest.json`

## Warnings

The run produced no hard failures.

Warnings:

- Workspace static HTML shell did not contain `Track your render from upload to download`.
- Workspace static HTML shell did not contain `Package received`.
- Topup static HTML shell did not contain `Bitcoin`.
- Receipt static HTML shell did not contain `Verification Details`.
- Completed job status check skipped because no tokenized/private job status URL env var was provided.
- Tokenized receipt check skipped because no tokenized/private receipt URL env var was provided.
- Tokenized download check skipped because no tokenized/private download URL env var was provided.

The route checks themselves returned HTTP 200. The UI text warnings may be client-rendering/static-shell limitations and should be reviewed before treating them as copy regressions.

## Production Mutation

None. The suite uses read-only `GET` and `HEAD` requests.

## Next Step

Run again with real completed job evidence:

```powershell
$env:FARPY_REGRESSION_JOB_STATUS_URL="https://..."
$env:FARPY_REGRESSION_RECEIPT_URL="https://..."
$env:FARPY_REGRESSION_DOWNLOAD_URL="https://..."
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\regression\run-regression-suite-v1.ps1 -OutputPath C:\tmp\farpy-regression-suite-v1-latest.json
```
