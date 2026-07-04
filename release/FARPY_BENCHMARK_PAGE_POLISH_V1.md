# FARPY_BENCHMARK_PAGE_POLISH_V1

Date: 2026-07-01

## Files Changed

- `public/benchmark/index.html`
- `release/FARPY_BENCHMARK_PAGE_POLISH_V1.md`

## What Changed

Updated the public `/benchmark` static page as an SEO, trust, and download entry point:

- Reframed the page headline:
  - `Compare real GPU benchmark results.`
  - `Run Farpy Benchmark on Windows and submit your score.`
- Added a compact trust strip:
  - Real submissions only
  - Public leaderboard
  - Checksums available
  - Windows release
- Improved the download card:
  - Primary CTA: `Download Windows Installer`
  - Secondary CTA: `Download MSI`
  - Existing `Checksums` link preserved
  - Added note: `Unsigned until EV code signing completes.`
- Fixed awkward data-state wording:
  - `1 GPU group`
  - `3 public submissions`
  - Uses real API data only; no fake counts.
- Added short SEO/support copy below the table:
  - What the benchmark measures
  - Why results are public
  - How to submit a result
- Added internal links:
  - `/benchmark/leaderboard`
  - `/addon`
  - `/pricing`
  - `/docs`
  - `/status`
- Updated metadata:
  - Title: `Farpy Benchmark GPU Index | Public Blender GPU Results`
  - Description: `Compare real Farpy Benchmark GPU submissions, download the Windows benchmark, and view public Blender render performance by GPU.`
  - OpenGraph/Twitter title and description updated to match.

## What Was Intentionally Not Changed

- No benchmark API behavior changed.
- No score calculation changed.
- No fake GPU data added.
- No fake submissions added.
- Existing download URLs were preserved.
- Existing table/API loading behavior was preserved.
- No backend, payment, render, or leaderboard service code was touched.

## Build / Test Result

Command:

```powershell
npm.cmd run build
```

Result:

- Build passed.
- TypeScript passed.
- Static generation passed.

Targeted validation:

- Exported `/benchmark/index.html` contains the new SEO title.
- Exported page contains `Compare real GPU benchmark results.`
- Exported page contains `Download Windows Installer`.
- Exported page contains `Unsigned until EV code signing completes.`
- Exported page contains the internal links to leaderboard, add-on, pricing, docs, and status.
- Exported page contains pluralization code for `GPU group/GPU groups` and `public submission/public submissions`.
- No fake-data wording was introduced.

FARPY_BENCHMARK_PAGE_POLISH_V1 = GREEN
