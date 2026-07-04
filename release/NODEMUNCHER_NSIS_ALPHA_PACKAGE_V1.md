# NODEMUNCHER_NSIS_ALPHA_PACKAGE_V1

Status: GREEN

Date: 2026-07-01

Scope: packaging/documentation only. No build performed. No production deploy. No claim of broad public readiness.

## Objective

Prepare NSIS as the official controlled-alpha installer for NodeMuncher.

Rules:

- Do not claim broad public readiness.
- Do not require EV signing for controlled alpha.
- Document unsigned state honestly.
- Document MSI caveat.

## Official Controlled-Alpha Installer

NSIS:

```text
C:\Users\danki\Desktop\nodemuncher-codex\src-tauri\target\release\bundle\nsis\Farpy NodeMuncher_0.1.0_x64-setup.exe
```

Exists: yes.

Length:

```text
1978812 bytes
```

Last write:

```text
2026-06-30T19:09:18
```

SHA256:

```text
83B2F77C9F2B5D96AE343FB6FDC61D5EE36772BC166F3A5B1F8C4304F5ED28FA
```

Authenticode status:

```text
NotSigned
```

Signer:

```text
<none>
```

## MSI Caveat

MSI artifact:

```text
C:\Users\danki\Desktop\nodemuncher-codex\src-tauri\target\release\bundle\msi\Farpy NodeMuncher_0.1.0_x64_en-US.msi
```

Exists: yes.

SHA256:

```text
4C4170D8964868D2371A783298F95C49B1B06F8698C7829A01400C284544BA63
```

Authenticode status:

```text
NotSigned
```

MSI is not the preferred controlled-alpha install path. Prior clean-install smoke recorded MSI error 1925 / exit 1603 in the available environment. MSI should be used only when deliberately testing MSI/admin behavior.

## Alpha Guidance

Use NSIS for controlled alpha friend installs.

Operator must tell tester:

- this is controlled alpha
- this is not a broad public launch
- the installer may be unsigned until EV signing is complete
- use the provided SHA256 to verify the artifact
- NodeMuncher requires Blender 4.x for Blender package work
- first render should happen while an operator watches `/ops`

Broad public launch remains blocked until signing/update/rollback and other alpha-gate requirements are complete.

## Farpy Book Update

Updated:

```text
C:\Users\danki\Desktop\farpy-frontend\docs\FARPY_BOOK\NODEMUNCHER_ALPHA_GATE.md
```

Changes:

- NSIS named as official controlled-alpha installer.
- SHA256 recorded.
- Authenticode status recorded.
- MSI caveat documented.
- Friend-install proof now requires Authenticode status.
- EV signing remains not required for controlled alpha, but required before broad public launch under current gate.

## Verification Commands

```powershell
$path='C:\Users\danki\Desktop\nodemuncher-codex\src-tauri\target\release\bundle\nsis\Farpy NodeMuncher_0.1.0_x64-setup.exe'; if(Test-Path -LiteralPath $path){ $item=Get-Item -LiteralPath $path; $hash=Get-FileHash -Algorithm SHA256 -LiteralPath $path; $sig=Get-AuthenticodeSignature -LiteralPath $path; Write-Host "EXISTS true"; Write-Host "PATH $path"; Write-Host "LENGTH $($item.Length)"; Write-Host "LASTWRITE $($item.LastWriteTime.ToString('s'))"; Write-Host "SHA256 $($hash.Hash)"; Write-Host "AUTHENTICODE_STATUS $($sig.Status)"; Write-Host "SIGNER $($sig.SignerCertificate.Subject)" } else { Write-Host "EXISTS false"; Write-Host "PATH $path"; exit 1 }
$path='C:\Users\danki\Desktop\nodemuncher-codex\src-tauri\target\release\bundle\msi\Farpy NodeMuncher_0.1.0_x64_en-US.msi'; if(Test-Path -LiteralPath $path){ $item=Get-Item -LiteralPath $path; $hash=Get-FileHash -Algorithm SHA256 -LiteralPath $path; $sig=Get-AuthenticodeSignature -LiteralPath $path; Write-Host "EXISTS true"; Write-Host "PATH $path"; Write-Host "LENGTH $($item.Length)"; Write-Host "SHA256 $($hash.Hash)"; Write-Host "AUTHENTICODE_STATUS $($sig.Status)" } else { Write-Host "EXISTS false"; Write-Host "PATH $path" }
Get-Content -LiteralPath 'C:\Users\danki\Desktop\farpy-frontend\docs\FARPY_BOOK\NODEMUNCHER_ALPHA_GATE.md' -Raw
```

## Result

GREEN.

NSIS is now documented as the official controlled-alpha NodeMuncher installer. The package remains unsigned and controlled-alpha only. No broad public readiness is claimed.
