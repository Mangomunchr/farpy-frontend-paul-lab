# FARPY_PUBLIC_PROOF_PAGE_V1

Status: GREEN.

## Summary

Created a public-safe evidence page at:

- `https://farpy.com/proof/`

The page intentionally avoids customer render data until Farpy has an explicitly public receipt feed. Render proof sections show `No public proof yet.` rather than exposing private jobs, filenames, access tokens, user data, or operational paths.

## Files changed

- `src/app/proof/page.tsx`
- `src/components/PublicProofPage.tsx`
- `src/components/SiteFooter.tsx`

## Data sources used

Public sources only:

- `GET /node/v1/web-render/health`
- `GET /node/v1/web-render/worker/status`
- `GET /node/v1/leaderboard/stats`
- `GET /node/v1/leaderboard/latest?limit=5`
- `/downloads/farpy-benchmark-windows-amd64.exe.sha256`
- `/downloads/farpy-benchmark-windows-amd64.msi.sha256`

Not used:

- private ops summary
- tokenized receipt URLs
- tokenized download URLs
- wallet/account APIs
- raw job storage

## Redactions applied

The page does not show:

- emails
- tokens
- internal filesystem paths
- raw wallet or user identifiers
- secret ops metrics
- customer filenames or upload names

Render sections without public-safe data show:

- `No public proof yet.`

## Deploy

Production backup:

- `/opt/farpy.com/out/proof.html.bak.public-proof-v1.20260626T234740Z`
- `/opt/farpy.com/out/proof.html.bak.public-proof-v1-copy-fix.20260626T234909Z`

Production deploy method:

- Built local static export with `npm.cmd run build`
- Packaged `proof.html`, `proof/index.html`, updated `_next`, and selected updated footer pages
- Uploaded to `/tmp/farpy-public-proof-v1-static.tgz`
- Extracted over `/opt/farpy.com/out`

## Validation

Build:

- `npm.cmd run build` passed.

Production:

- `https://farpy.com/proof/` -> `200`
- `https://farpy.com/node/v1/web-render/health` -> `200`
- `https://farpy.com/node/v1/web-render/worker/status` -> `200`
- `https://farpy.com/node/v1/leaderboard/latest?limit=5` -> `200`
- benchmark EXE SHA sidecar -> `200`
- benchmark MSI SHA sidecar -> `200`

Static redaction grep on deployed `/proof/`:

- `email` absent
- `download_token` absent
- `receipt_token` absent
- `wallet` absent
- `/var/lib` absent
- `/opt/farpy` absent
