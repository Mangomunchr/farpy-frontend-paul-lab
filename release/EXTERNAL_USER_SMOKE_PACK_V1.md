# EXTERNAL_USER_SMOKE_PACK_V1

Status: READY

Purpose: small public-alpha smoke kit for 3-5 external testers.

Scope: account, Card top-up, Blender upload, render, ZIP download, receipt, issue reporting.

## Tester Instructions

1. Open `https://farpy.com`.
2. Sign up or sign in with your email.
3. Open `Top Up`.
4. Add funds by Card.
5. Return to the homepage.
6. Upload a Blender `.blend` file.
7. Choose a small frame count first, preferably 1-8 frames.
8. Start the render from the workspace.
9. Wait for the render to complete.
10. Download the ZIP.
11. Open the receipt.
12. Report any issue using the template below.

## Test File

Recommended:

- Blender splash file or another tiny known-good `.blend`.
- Keep the first test small: 1-8 frames.
- Keep file size under 100 MB.
- Use a scene that renders locally in Blender before uploading.

Avoid for this smoke:

- Very large simulations.
- Missing linked assets.
- Private add-ons required to open the file.
- Long animation tests before a 1-frame test succeeds.

## Success Checklist

Tester should confirm:

- Account created.
- Card payment succeeded.
- Wallet balance updated.
- Upload succeeded.
- Render completed.
- ZIP downloaded.
- Receipt opened.
- Output SHA-256/hash is visible on receipt.
- Account history shows the render.

## Failure Reporting Template

Send the following to support:

```text
Email:
Browser:
OS:
Job ID:
Receipt ID, if any:
Screenshot attached: yes/no

What happened:

What you expected:

Did payment complete?
Did the render complete?
Did the ZIP download?
Did the receipt open?
```

## Operator Checklist

During each tester run:

1. Open `/ops`.
2. Watch active alerts.
3. Confirm the job appears in recent jobs.
4. Verify wallet debit amount matches frame cost.
5. Verify receipt is minted after successful completion.
6. Verify download URL returns a ZIP.
7. Verify receipt `output_sha256` matches the downloaded ZIP hash when checking manually.
8. If a render fails without completed output, verify no completed-output receipt was minted.
9. Refund wallet debit if a wallet-funded job failed without output and automatic refund did not already apply.
10. Record job_id, receipt_id, and any alert IDs in the tester notes.

## Safety Notes

- Card is the only public top-up path for this smoke.
- Bitcoin Lightning is disabled while routing is being verified.
- NodeMuncher is internal.
- Only real renders count.
- Do not mark a test successful unless ZIP download and receipt both work.
- Do not ask testers to use private endpoints, operator URLs, or manual repair flows.

## Tester Flow

Sign up -> Top up by Card -> Upload `.blend` -> Start render -> Complete -> Download ZIP -> Open receipt -> Report outcome.

## Operator Flow

Watch `/ops` -> Check alerts -> Verify debit -> Verify receipt -> Verify download -> Refund only if failed without output.
