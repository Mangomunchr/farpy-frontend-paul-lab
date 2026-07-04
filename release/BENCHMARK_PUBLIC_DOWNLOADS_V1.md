# BENCHMARK_PUBLIC_DOWNLOADS_V1

Status: implemented locally

Goal:
- Publish the real Farpy Benchmark Windows desktop installers through the Farpy static frontend.

Artifacts copied:
- `public/downloads/farpy-benchmark-windows-amd64.exe`
- `public/downloads/farpy-benchmark-windows-amd64.exe.sha256`
- `public/downloads/farpy-benchmark-windows-amd64.msi`
- `public/downloads/farpy-benchmark-windows-amd64.msi.sha256`

Source artifacts:
- `C:\Users\danki\Desktop\nodemuncher-codex\src-tauri\target\release\bundle\nsis\Farpy Benchmark_0.1.0_x64-setup.exe`
- `C:\Users\danki\Desktop\nodemuncher-codex\src-tauri\target\release\bundle\msi\Farpy Benchmark_0.1.0_x64_en-US.msi`

Public URL shapes after deploy:
- `/downloads/farpy-benchmark-windows-amd64.exe`
- `/downloads/farpy-benchmark-windows-amd64.exe.sha256`
- `/downloads/farpy-benchmark-windows-amd64.msi`
- `/downloads/farpy-benchmark-windows-amd64.msi.sha256`

SHA256:
- EXE: `A073E301BA542205155F34F4524BB2FFFC648EA10DDE8CFCFF3C47688936FC8D`
- MSI: `A2D81F3E532939F8CCC7C593D172DB27C781F6F2BCEC5079C643726D68B765E2`

Page changes:
- `/downloads` now includes a Farpy Benchmark section before NodeMuncher worker artifacts.
- `/benchmark` now includes a Windows download CTA for Farpy Benchmark.
- Copy states Windows-only for Benchmark and does not imply macOS/Linux Benchmark artifacts exist.
- NodeMuncher worker downloads remain present and separate.

Validation:
- Local file exists.
- SHA256 sidecars exist.
- Downloads page links exist.
- Benchmark page CTA exists.
- `npm.cmd run build`

Deploy command needed:
- Use the existing static deploy flow that replaces `/opt/farpy.com/out` with the freshly built local `out` directory.
