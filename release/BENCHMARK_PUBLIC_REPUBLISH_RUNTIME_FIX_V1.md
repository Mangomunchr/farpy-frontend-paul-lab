# BENCHMARK_PUBLIC_REPUBLISH_RUNTIME_FIX_V1

Status: GREEN
Date: 2026-06-26

## Goal

Publish rebuilt Farpy Benchmark installers containing the Windows Run Test runtime fix:

- no CMD popup
- visible running phases
- hidden Blender process
- GUI subsystem flag
- surfaced backend errors

## Installer Paths

| Artifact | Local source | Public URL | SHA256 |
|---|---|---|---|
| NSIS EXE | `C:\Users\danki\Desktop\nodemuncher-codex\src-tauri\target\release\bundle\nsis\Farpy Benchmark_0.1.0_x64-setup.exe` | `https://farpy.com/downloads/farpy-benchmark-windows-amd64.exe` | `2B3FA677DB85232F1640BBFB5B862E7D0FD61926577B092DF7ADE8C80EC7D73A` |
| MSI | `C:\Users\danki\Desktop\nodemuncher-codex\src-tauri\target\release\bundle\msi\Farpy Benchmark_0.1.0_x64_en-US.msi` | `https://farpy.com/downloads/farpy-benchmark-windows-amd64.msi` | `FDFFDA04D38AA36F7F9D2ABF2AF29BEF3CC5E04248A5E4FEEDF88684E4A37135` |

## Build

`npm.cmd run build` passed in `C:\Users\danki\Desktop\farpy-frontend`.

## Deploy

Backup created:

`/opt/farpy.com/out.backup-benchmark-runtime-fix-republish.20260626T221259Z`

Deploy commands used:

```powershell
scp -q C:\tmp\benchmark-runtime-fix-republish-v1.tgz root@farpy.com:/tmp/benchmark-runtime-fix-republish-v1.tgz
```

```bash
tar -xzf /tmp/benchmark-runtime-fix-republish-v1.tgz -C /opt/farpy.com/out
```

Only `/downloads` HTML and Benchmark download artifacts were replaced. No backend, Caddy, NodeMuncher, wallet, render, or Benchmark API changes were made.

## Production URL Checks

| URL | Status |
|---|---:|
| `https://farpy.com/downloads` | 200 |
| `https://farpy.com/downloads/farpy-benchmark-windows-amd64.exe` | 200 |
| `https://farpy.com/downloads/farpy-benchmark-windows-amd64.exe.sha256` | 200 |
| `https://farpy.com/downloads/farpy-benchmark-windows-amd64.msi` | 200 |
| `https://farpy.com/downloads/farpy-benchmark-windows-amd64.msi.sha256` | 200 |
| `https://farpy.com/benchmark` | 200 |

## Public SHA256 Verification

Redownloaded production artifacts matched:

```text
2B3FA677DB85232F1640BBFB5B862E7D0FD61926577B092DF7ADE8C80EC7D73A  farpy-benchmark-windows-amd64.exe
FDFFDA04D38AA36F7F9D2ABF2AF29BEF3CC5E04248A5E4FEEDF88684E4A37135  farpy-benchmark-windows-amd64.msi
```

Sidecars matched the same hashes.

## Public Install Smoke

Installed redownloaded EXE to:

`C:\tmp\FarpyBenchmarkRuntimeFixSmoke`

Smoke result:

- installer exit code `0`
- app opened from installed public artifact
- no recent `cmd.exe` process/window appeared
- Run Test showed `Preparing...` with spinner immediately
- benchmark completed
- score shown: `69`
- Share button enabled

Screenshots:

- `C:\tmp\benchmark-public-runtime-fix-running.png`
- `C:\tmp\benchmark-public-runtime-fix-complete.png`
