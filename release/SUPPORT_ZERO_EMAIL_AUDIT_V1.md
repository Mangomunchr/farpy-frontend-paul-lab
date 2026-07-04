# SUPPORT_ZERO_EMAIL_AUDIT_V1

Date: 2026-06-30
Mode: read-only audit. No backend changes. No product code changes.

## Verdict

Status: YELLOW

Farpy has good self-service for completed package tracking, ZIP download, delivery receipt viewing, wallet history, refund history visibility, and local account-data export. The main support-email load remains around actions that look self-service but still open mailto links: cancel queued package, delete uploaded source, delete completed package, delete account, billing issue, rendering issue, and generic package issue.

## User Email Surfaces Found

| Location | User reason to email | Can they solve it themselves today? | Evidence | UI recommendation, no backend |
| --- | --- | --- | --- | --- |
| /contact | Render, receipt, wallet, or payment help | No, page is email-only | src/app/contact/page.tsx:24 says email support@farpy.com | Replace the single email handoff with a support hub: Package, Billing, Receipt/download, Wallet, Privacy. Each card should route first to existing Account, Workspace, Receipt, Refunds, Docs, or Status pages, then show email as fallback. |
| /refunds | Duplicate charge, duplicate wallet credit, incorrect debit | Partly. User can see wallet/refund history, but cannot self-check a payment review path | src/app/refunds/page.tsx:20 and src/app/refunds/page.tsx:28 | Add a visible self-check checklist: open Account wallet history, look for refund rows, open the package tracker, open delivery receipt. Keep email fallback only after the checklist. |
| /privacy | Privacy/data handling questions | Partly. User can export account data shown in Account, but privacy page only offers email | src/app/privacy/page.tsx:43; src/components/AccountPage.tsx:374-386 | Add buttons on Privacy: Open Account, Export visible account data, Read Files/Retention, Contact privacy. This reduces questions that are already answered by existing pages. |
| /terms | Terms questions | No, legal email only | src/app/terms/page.tsx:92 | Keep email for legal questions, but add links to Refunds, Privacy, Files, Status before the email. |
| /dmca | Copyright removal/counter-notice | No; email is appropriate | src/app/dmca/page.tsx:15 | Leave as email. DMCA notices require structured legal intake. UI improvement: add a copyable notice template and fields checklist. |
| /security | Security report | No; email is appropriate | src/app/security/page.tsx:15 | Leave as email. UI improvement: add a copyable report template and clarify safe testing scope. |
| FAQ refund answer | Payment, wallet debit, package, render, or receipt wrong | Partly | src/components/FaqSection.tsx:46 | Change FAQ answer to first point users to Account wallet history, Refund history, Workspace, and Receipt. Then say contact support if those do not resolve it. |
| Account: Cancel queued package | User wants to stop a package before render | No. Button opens mailto | src/components/AccountPage.tsx:271-273 | UI-only short-term: relabel as Request cancellation and show Cannot guarantee if already assigned. Long-term backend needed for true cancel. |
| Account: Delete uploaded source | User wants uploaded .blend/.orbx removed | No. Button opens mailto | src/components/AccountPage.tsx:282-284 | UI-only short-term: change to Request source deletion and show retention policy note. Long-term backend needed for self-service deletion. |
| Account: Delete completed package | User wants output/ZIP removed | No. Button opens mailto | src/components/AccountPage.tsx:296-298 | UI-only short-term: change to Request package deletion and explain receipt/payment records may remain. Long-term backend needed for self-service artifact deletion. |
| Account: Report package issue | User has wrong/failed/stuck package | Partly. Workspace shows failure class/code and retry CTA, but Account sends email | src/components/AccountPage.tsx:303-305; src/components/Workspace.tsx:494-500; src/components/Workspace.tsx:652-660 | Add a package issue drawer on Account that first shows Workspace link, Retry failed package, Receipt status, ZIP status, and copied diagnostic IDs before email fallback. |
| Account: Billing issue | User has a wallet/payment concern | Partly. Wallet history and refund history exist, but issue button opens mailto | src/components/AccountPage.tsx:350-354; src/components/AccountPage.tsx:394-396 | Add a billing self-check card: balance, latest 10 transactions, refunds, package debit rows, receipt links. Keep email after the evidence block. |
| Account: Rendering issue | User has render failure or output mismatch | Partly. Workspace has failure classification and retry link, but issue button opens mailto | src/components/AccountPage.tsx:394-396; src/components/Workspace.tsx:211-227 | Add a render issue card that routes to the affected package tracker and explains: retry package, download ZIP if delivered, view receipt, copy diagnostics. |
| Account: Delete my account | User wants account deletion | No. Link opens mailto | src/components/AccountPage.tsx:374-386 | UI-only short-term: add a preflight panel explaining what will remain: receipts/payment records may be retained. Long-term backend needed for actual authenticated deletion request. |
| Receipt page unavailable | User has a bad/expired/private receipt link | Partly. Error tells user to check the link; no path to recover from account history | src/components/ReceiptPage.tsx:129-134 | Add CTA: Open Account history, Open package tracker, and What to check: same browser/session, correct private link. Email fallback only if history has no receipt. |
| Workspace no package selected | User does not know where their package went | Yes, mostly | src/components/Workspace.tsx:515-523 | Keep. It already points to Send package and Account history. Add Recent packages link label only if clarity needed. |
| Workspace failed package | User needs recovery after failure | Yes, mostly for retry; money proof depends on wallet history | src/components/Workspace.tsx:652-660; src/components/Workspace.tsx:494-500 | Add Account refund history link directly in failed state so users can verify returned charge without emailing. |
| Topup checkout/Bitcoin invoice error | User cannot top up | Partly. Errors display, but no guided next step | src/components/TopUpPage.tsx:64-81; src/components/TopUpPage.tsx:84-99; src/components/TopUpPage.tsx:102-117 | Add non-email recovery UI: Retry, switch rail, refresh balance, open Account. If Bitcoin fails, show Use Card for now. |
| Sign-in magic link confusion | User did not receive email | Partly; page can resend by submitting again | src/components/AuthPage.tsx:36; src/components/AuthPage.tsx:60-61 | Add inline checklist: check spam, use same browser, resend link, try Google sign-in if available. No support email needed on first failure. |

## What Users Can Already Solve Themselves

- View balance from Account and Top Up pages.
- View recent package history from Account.
- View wallet history and refund history from Account.
- Export visible account data locally as JSON from Account.
- Open package tracker from Account.
- Download ZIP for completed packages from Account, Workspace, and Receipt pages when URLs are present.
- View delivery receipts from Account and Workspace when URLs are present.
- Retry failed package by sending a new package from Workspace.
- See failure class, failure code, retryability, render partner ID, receipt-created status, and failure detail in Workspace Verification Details.
- Refresh balance on Top Up by reloading/opening Account or using the Top Up page balance check.

## What Still Requires Email Today

Product-support email still required:

1. Cancel queued package.
2. Delete uploaded source.
3. Delete completed package/output.
4. Delete account.
5. Billing review when wallet/receipt history does not explain the issue.
6. Rendering/package issue when the package tracker does not provide enough recovery.
7. Privacy/data handling questions beyond visible account-data export.
8. Terms questions.

Legal/security email appropriately required:

1. DMCA notice or counter-notice.
2. Security report.

## Recommended UI-Only Changes

### P0: Replace broad Contact page with a support router

Current /contact sends every issue to email. Add cards:

- Package issue: link to /account and /workspace, explain package ID and receipt ID.
- Billing issue: link to /account wallet history and /refunds.
- Receipt/download issue: link to /account and /receipt instructions.
- Privacy: link to /privacy and Account export.
- Legal/security: link to /dmca and /security.

Keep support@farpy.com at the bottom as fallback.

### P1: Make Account support actions honest

Current Account has buttons that sound self-service but open mailto links. Rename:

- Cancel queued package -> Request cancellation
- Delete uploaded source -> Request source deletion
- Delete completed package -> Request package deletion
- Delete my account -> Request account deletion

Add small helper text beside each explaining what the user can verify immediately and what requires support.

### P1: Add self-check panels before email fallbacks

For Billing issue:

- Show latest wallet events.
- Show refund history.
- Link matching package tracker.
- Link delivery receipt if present.
- Then email fallback with prefilled evidence.

For Rendering issue:

- Show failure class/code if present.
- Link Retry failed package.
- Link Verification Details.
- Then email fallback.

For Receipt/download issue:

- Link Account history.
- Link package tracker.
- Explain token/private link requirement.
- Then email fallback.

### P1: Add failed-package Account link

Workspace failed state already explains retry and refund policy. Add a direct Account link: Check refund history.

### P2: Legal/support templates

- DMCA page: add copyable notice template.
- Security page: add copyable security report template.
- Terms page: add links to the relevant policy pages before email.
- Privacy page: add Account export and Files/Retention links before privacy email.

## No-Backend Recommendation Queue

These are safe UI-only tasks:

1. /contact support router.
2. Rename mailto-backed Account actions to request language.
3. Add Account/Workspace/Receipt recovery links before email.
4. Add Top Up error recovery choices: Retry, Switch to Card, Open Account.
5. Add Receipt unavailable recovery links.
6. Add FAQ refund answer that points to self-service surfaces first.
7. Add DMCA/security copyable templates.

## Needs Backend Later

These cannot be honestly self-service with UI only:

1. True cancel queued package.
2. True delete uploaded source.
3. True delete completed package/output.
4. True authenticated account deletion request workflow.
5. Structured billing dispute/review ticket.
6. Structured package issue ticket with server-side attachment to job_id.

## Final Answer

Can users solve support issues themselves today?

- Completed package download/receipt/history: yes.
- Failed package retry and failure diagnosis: mostly yes.
- Wallet/refund history visibility: yes.
- Billing dispute, duplicate charge review, artifact deletion, account deletion, cancellation: no, email required.
- DMCA/security/legal: email remains appropriate.

Best next UI move: turn /contact into a support router and rename all mailto-backed Account actions as requests, not immediate self-service actions.

## Commands Run

```powershell
rg -n "support|contact|email|@|help|billing issue|rendering issue|report package|refund|receipt|download|failed|try again|delete account|export my data|privacy|issue" src public docs release -S
rg -n "mailto:|support@|hello@|contact@|danki|farpy.com" src public docs release -S
Get-ChildItem -LiteralPath 'C:\Users\danki\Desktop\farpy-frontend\src' -Recurse -File | Where-Object { $_.FullName -match 'contact|support|faq|refund|privacy|terms|account|workspace|receipt|topup|addon|pricing|status' } | Select-Object FullName
Get-Content -LiteralPath 'C:\Users\danki\Desktop\farpy-frontend\src\app\contact\page.tsx'
Get-Content -LiteralPath 'C:\Users\danki\Desktop\farpy-frontend\src\app\refunds\page.tsx'
Get-Content -LiteralPath 'C:\Users\danki\Desktop\farpy-frontend\src\app\privacy\page.tsx'
Get-Content -LiteralPath 'C:\Users\danki\Desktop\farpy-frontend\src\app\terms\page.tsx'
Get-Content -LiteralPath 'C:\Users\danki\Desktop\farpy-frontend\src\app\dmca\page.tsx'
Get-Content -LiteralPath 'C:\Users\danki\Desktop\farpy-frontend\src\app\security\page.tsx'
Get-Content -LiteralPath 'C:\Users\danki\Desktop\farpy-frontend\src\components\Workspace.tsx' -TotalCount 260
Get-Content -LiteralPath 'C:\Users\danki\Desktop\farpy-frontend\src\components\AccountPage.tsx' -TotalCount 320
Get-Content -LiteralPath 'C:\Users\danki\Desktop\farpy-frontend\src\components\AccountPage.tsx' | Select-Object -Skip 320 -First 260
Get-Content -LiteralPath 'C:\Users\danki\Desktop\farpy-frontend\src\components\TopUpPage.tsx' -TotalCount 320
Get-Content -LiteralPath 'C:\Users\danki\Desktop\farpy-frontend\src\components\ReceiptPage.tsx' -TotalCount 300
Select-String -Path 'C:\Users\danki\Desktop\farpy-frontend\src\components\Workspace.tsx' -Pattern 'failed|Retry|support|mailto|receipt|download|checkout|Sign in|Pay|send package|Unable|error' -Context 2,3
Get-Content -LiteralPath 'C:\Users\danki\Desktop\farpy-frontend\src\components\SiteFooter.tsx'
Get-Content -LiteralPath 'C:\Users\danki\Desktop\farpy-frontend\src\components\SiteNav.tsx'
Get-Content -LiteralPath 'C:\Users\danki\Desktop\farpy-frontend\src\components\FaqSection.tsx'
rg -n "mailto:|Email |email |contact support|support@farpy.com|privacy@farpy.com|security@farpy.com|dmca@farpy.com|Billing issue|Rendering issue|Report package issue|Delete uploaded|Delete completed|Delete my account|Cancel queued" src -S
rg -n "cancel|delete|refund|support|issue|export|account/renders|wallet/transactions|download|receipt|retry|fail|failed|remove" scripts src -S
Get-Content -LiteralPath 'C:\Users\danki\Desktop\farpy-frontend\src\app\docs\page.tsx'
Get-Content -LiteralPath 'C:\Users\danki\Desktop\farpy-frontend\src\app\files\page.tsx'
```
