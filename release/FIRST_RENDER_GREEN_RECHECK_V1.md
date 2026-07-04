# FIRST_RENDER_GREEN_RECHECK_V1

Status: YELLOW

Mode: recheck only. No backend, API, or product code changes.

Production URL: `https://farpy.com`

Reviewed routes:

- `/`
- `/pricing`
- `/signin`
- `/topup`
- `/workspace`
- `/receipt`
- `/account`

## Live route results

```text
/          200  Farpy - Render Blender + Octane files for less
/pricing   200  Pricing Â· Farpy
/signin    200  Sign in Â· Farpy
/topup     200  Top up balance Â· Farpy
/workspace 200  Package tracker Â· Farpy
/receipt   200  Render receipt Â· Farpy
/account   200  Account Â· Farpy
```

Homepage checks:

```text
Send a package: true
Run a render factory: true
Rendars send packages. NodeMunchers earn by running render factories.: true
Download NodeMuncher: absent
Start Rendering: absent
homepage mojibake markers: absent
```

## P0 blockers

None found.

## Remaining P1 confusion

### 1. Non-homepage titles still show mojibake separator

Evidence:

- `/pricing` title: `Pricing Â· Farpy`
- `/signin` title: `Sign in Â· Farpy`
- `/topup` title: `Top up balance Â· Farpy`
- `/workspace` title: `Package tracker Â· Farpy`
- `/receipt` title: `Render receipt Â· Farpy`
- `/account` title: `Account Â· Farpy`

Impact: visible browser/title metadata still carries encoding damage after homepage title was fixed.

Concrete fix: replace the metadata title template separator in `src/app/layout.tsx` from the mojibake middot string to a plain ASCII separator, e.g. `%s - Farpy`.

### 2. Workspace payment CTA still says `Pay & Render`

Evidence: `src/components/Workspace.tsx`

Impact: package-tracker wording is otherwise consistent, but the key payment action still drops back to older render-job language.

Concrete fix: rename the user-visible button to `Pay and send package` or `Pay and start package`.

### 3. Account page still mixes `render history` and `Workspace` with package language

Evidence:

- `src/components/AccountPage.tsx`
- `src/app/account/page.tsx`

Current user-visible wording includes:

- `Balance, render history, and receipts.`
- `No renders yet.`
- `View Workspace`
- `View Receipt`

Impact: after a first render, Account is the persistence proof page, but it does not fully match the package/delivery language.

Concrete fix:

- `render history` -> `package history`
- `No renders yet.` -> `No packages yet.`
- `View Workspace` -> `View package tracker`
- `View Receipt` -> `View delivery receipt`

## Broken links / CTAs

No broken first-render route was found in this narrow recheck.

Homepage CTA state:

- Primary customer CTA: `Send a package`
- Secondary NodeMuncher CTA: `Run a render factory`
- Old NodeMuncher-first CTA: absent

## Recommendation

Current first-render status: YELLOW.

Reason: no route or render-path blocker was found, but title mojibake remains on non-home routes and two first-render continuation surfaces still mix older render/workspace wording with package/delivery language.
