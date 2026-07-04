# BENCHMARK_PUBLIC_REPUBLISH_BLENDER_REQUIRED_V1

Status: GREEN
Date: 2026-06-26

## Goal

Replace the public Farpy Benchmark Windows downloads with the BENCHMARK_BLENDER_REQUIRED_UX_V1 installers.

## Source Artifacts

| Artifact | Source | SHA256 |
|---|---|---|
| EXE | `C:\Users\danki\Desktop\nodemuncher-codex\src-tauri\target\release\bundle\nsis\Farpy Benchmark_0.1.0_x64-setup.exe` | `830424E56F2C1B1699BEF87D6913D4EE1DF54F7D2B1098D9CDBBA604CCF5C422` |
| MSI | `C:\Users\danki\Desktop\nodemuncher-codex\src-tauri\target\release\bundle\msi\Farpy Benchmark_0.1.0_x64_en-US.msi` | `D2580A64FFD3CFB2B1DDE55B070EA25D6B6E63D6F199BB7DAEF486597C7207A7` |

## Public URLs Verified

| URL | Status | Proof |
|---|---:|---|
| `https://farpy.com/downloads` | 200 | Page contains both new Benchmark hashes. |
| `https://farpy.com/downloads/farpy-benchmark-windows-amd64.exe` | 200 | Live download SHA256 matches requested EXE hash. |
| `https://farpy.com/downloads/farpy-benchmark-windows-amd64.exe.sha256` | 200 | Sidecar contains requested EXE hash. |
| `https://farpy.com/downloads/farpy-benchmark-windows-amd64.msi` | 200 | Live download SHA256 matches requested MSI hash. |
| `https://farpy.com/downloads/farpy-benchmark-windows-amd64.msi.sha256` | 200 | Sidecar contains requested MSI hash. |
| `https://farpy.com/benchmark` | 200 | Benchmark page remains reachable. |

## SHA256 Verification

Live public artifact hashes:

```text
830424E56F2C1B1699BEF87D6913D4EE1DF54F7D2B1098D9CDBBA604CCF5C422  farpy-benchmark-windows-amd64.exe
D2580A64FFD3CFB2B1DDE55B070EA25D6B6E63D6F199BB7DAEF486597C7207A7  farpy-benchmark-windows-amd64.msi
```

Sidecars:

```text
830424e56f2c1b1699bef87d6913d4ee1df54f7d2b1098d9cdbba604ccf5c422  farpy-benchmark-windows-amd64.exe
d2580a64ffd3cfb2b1dde55b070ea25d6b6e63d6f199bb7daef486597c7207a7  farpy-benchmark-windows-amd64.msi
```

## Deploy Notes

Updated production files only under `/opt/farpy.com/out/downloads` and the downloads page HTML. No backend, Caddy, NodeMuncher, wallet, render, or Benchmark API changes were made.

NodeMuncher remains marked as internal alpha on `/downloads`; it is not presented as the public Benchmark download.

## Build

`npm.cmd run build` passed.
