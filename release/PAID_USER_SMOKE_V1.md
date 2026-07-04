# PAID_USER_SMOKE_V1

Status: YELLOW

Result: paid completion not executed. The production app path is healthy through public route checks, upload, pricing, workspace status, and checkout auth gates, but the real paid render requires legitimate authenticated customer/session and operator-approved payment input that was not available to this run.

No code changes were made.

## Objective

Run one real paid/new-user-style render through production:

sign in -> wallet/topup -> submit package -> workspace tracking -> package delivered -> ZIP download -> delivery receipt -> account package history.

## What was verified

### Public routes

- `https://farpy.com/` -> 200
- `https://farpy.com/signin` -> 200
- `https://farpy.com/topup` -> 200

Existing preflight evidence:

```text
FRESH_CUSTOMER_E2E_SMOKE_PREFLIGHT_V1
VERDICT=BLOCKED_MISSING_ENV
PASS_COUNT=3
FAIL_COUNT=0
```

Evidence file:

```text
C:\tmp\paid-user-smoke-v1-preflight.json
```

### Upload and price path

Known smoke file:

```text
C:\Users\danki\Desktop\farpy-frontend\public\smoke\real-smoke.blend
```

Upload result:

```text
ok=true
upload_id=UP-A87366CB
job_id=JOB-E98D8822
filename=paid-user-smoke-v1.blend
size_bytes=849212
sha256=9c3dcfc994ca10b7c1f3151f7685e38814013b2cdbac4a318826a08bfaaf7698
price_cents=1
payment_status=priced
```

Price/status result:

```text
GET /node/v1/web-render/jobs/JOB-E98D8822 -> 200
POST /node/v1/web-render/jobs/JOB-E98D8822/price -> 200
status=queued
renderer=blender
frame_count=1
price_cents=1
payment_status=priced
can_start_render=false
can_download=false
can_view_receipt=false
```

### Auth/payment gates

Unauthenticated render checkout:

```text
POST /node/v1/web-render/jobs/JOB-E98D8822/create-checkout-session
-> 401 auth_required
```

Unauthenticated wallet topup checkout with valid JSON:

```text
POST /checkout
body={"amount_cents":1000}
-> 401 auth_required
```

This is the correct fail-closed behavior.

## What was not completed

The following acceptance items were not completed because no legitimate authenticated customer session/payment approval was available in the shell environment, and the in-app browser connector failed before it could attach to the logged-in browser session:

- signed-in wallet/topup checkout
- real payment/topup
- wallet balance change
- paid render submission
- package delivered
- ZIP download and SHA check
- delivery receipt verification
- account package history update

## Missing inputs

The existing smoke preflight reported these required inputs missing:

```text
FARPY_SMOKE_EMAIL
FARPY_SMOKE_AUTH_METHOD
FARPY_SMOKE_STRIPE_MODE
FARPY_SMOKE_BLEND_PATH
FARPY_SMOKE_TOPUP_AMOUNT_CENTS
FARPY_SMOKE_PAYMENT_APPROVED
```

Optional/private proof inputs also absent:

```text
FARPY_SMOKE_SESSION_COOKIE
FARPY_AUDIT_JOB_STATUS_URL
FARPY_AUDIT_DOWNLOAD_URL
FARPY_AUDIT_RECEIPT_URL
```

## Commands run

```powershell
rg -n "PAID_USER|FRESH|smoke|checkout|blend|FARPY_WEB_RENDER_COOKIE|FARPY_AUTH_COOKIE|known-good|cube\.blend" scripts release src -S
Get-ChildItem -LiteralPath . -Recurse -File -Include *.blend,*.blend1,*.zip
Get-ChildItem Env:FARPY*
curl.exe -sS -X POST https://farpy.com/node/v1/web-render/uploads/create -F file=@public\smoke\real-smoke.blend;filename=paid-user-smoke-v1.blend -F renderer=blender -F frame_count=1 -F frame_start=1 -F frame_end=1
curl.exe -sS -i https://farpy.com/node/v1/web-render/jobs/JOB-E98D8822
curl.exe -sS -i -X POST https://farpy.com/node/v1/web-render/jobs/JOB-E98D8822/price -H content-type:application/json --data-binary @C:\tmp\farpy-price-valid.json
curl.exe -sS -i -X POST https://farpy.com/node/v1/web-render/jobs/JOB-E98D8822/create-checkout-session -H content-type:application/json --data {}
curl.exe -sS -i -X POST https://farpy.com/checkout -H content-type:application/json --data-binary @C:\tmp\farpy-checkout-valid.json
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\fresh-customer-e2e-smoke-v1.ps1 -OutputPath C:\tmp\paid-user-smoke-v1-preflight.json
```

## Final status

PAID_USER_SMOKE_V1 = YELLOW

No P0 production defect was proven. The remaining blocker is operational: provide a legitimate signed-in customer session plus explicit approval for one real card topup/payment, then rerun the paid portion to produce ZIP, receipt, hash, and account-history proof.
