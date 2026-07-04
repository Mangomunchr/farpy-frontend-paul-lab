# PAID_BROWSER_SMOKE_PREP_V1

Status: PASS

Purpose: prepare a browser-driven paid production smoke using the operator's real signed-in browser session.

This is a manual checklist only. It does not bypass auth, fake payment success, log secrets, or change backend APIs.

## Operator checklist

1. Open `https://farpy.com`.
2. Sign in normally.
3. Open `https://farpy.com/account`.
4. Confirm the account page loads and record the starting wallet balance.
5. If balance is too low for a 1-frame Blender package, open `https://farpy.com/topup` and top up using the intended public rail.
6. Return to `https://farpy.com/`.
7. Select Blender.
8. Use a small known-good `.blend` file.
9. Set frames to `1`.
10. Submit/send the package.
11. Open the package tracker workspace.
12. Confirm the package is priced and payment/start behavior is correct.
13. Start the package using wallet balance or checkout, without bypassing payment.
14. Wait until the workspace shows package delivered.
15. Download the ZIP.
16. Compute ZIP SHA-256 locally.
17. Open the delivery receipt.
18. Confirm the receipt output SHA matches the downloaded ZIP or receipt-documented output hash expectation.
19. Open `https://farpy.com/account`.
20. Confirm package history shows the completed package.
21. Confirm wallet history/balance reflects the topup and package debit.

## Required proof fields

Record these fields in the follow-up smoke report:

| Field | Value |
| --- | --- |
| user_email_redacted |  |
| starting_balance |  |
| topup_amount_if_used |  |
| upload_id |  |
| job_id |  |
| final_status |  |
| price_cents |  |
| final_balance |  |
| zip_bytes |  |
| zip_sha256 |  |
| receipt_url |  |
| receipt_output_sha_match | true / false |

## Pass criteria

The paid browser smoke is GREEN only if:

- Signed-in account page loads.
- Wallet balance is sufficient or topup succeeds.
- A real 1-frame Blender package is submitted through the website.
- Package tracker reaches delivered.
- ZIP downloads and is non-empty.
- Delivery receipt opens.
- Receipt/output SHA verification passes.
- Account package history shows the completed package.
- No manual backend repair is required.

## Stop conditions

Stop and capture the exact screen/error if:

- Sign-in fails.
- Checkout cannot open.
- Wallet balance does not update after a completed topup.
- Package cannot be submitted.
- Workspace status stalls without progress.
- Package fails.
- Download URL fails.
- Receipt URL fails.
- Account history does not show the completed package after refresh.

## Result

PAID_BROWSER_SMOKE_PREP_V1 = PASS
