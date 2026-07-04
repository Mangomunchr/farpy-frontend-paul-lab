# ACCOUNT_SELF_SERVICE_V1

Status: PASS

## Scope

Frontend account-page self-service polish only. No backend, API, wallet ledger, render, receipt, or payment behavior changed.

## Files changed

- `src/components/AccountPage.tsx`
- `src/app/globals.css`
- `release/ACCOUNT_SELF_SERVICE_V1.md`

## Implemented

### Package management

- Existing `Download ZIP` and `View delivery receipt` links remain available for completed packages.
- `Cancel queued package` is shown for queued/submitted packages as a support request link because no cancel mutation endpoint is currently exposed.
- `Retry failed package` links failed packages back to the package upload flow.
- `Delete uploaded source` and `Delete completed package` are support request links because no delete mutation endpoint is currently exposed.
- `Report package issue` pre-fills package ID, upload ID, filename, and status when available.

### Wallet

- Existing wallet history remains visible.
- Added a dedicated `Refund history` section filtered from wallet transactions with `type=refund`.
- Added a `Billing issue` support path.

### Privacy

- Added `Export my data`, which downloads the account data already loaded in the browser: email, balance, package history, and wallet transactions.
- Added `Delete my account` as a support request link. No account deletion is faked in the frontend.

### Support

- Added support actions for package, billing, and rendering issues.

## Notes

- Destructive actions that do not have a proven backend endpoint are presented as support requests, not fake immediate success actions.
- Existing package links, receipt links, wallet data, and account data are preserved.

## Validation

- `npm.cmd run build`
