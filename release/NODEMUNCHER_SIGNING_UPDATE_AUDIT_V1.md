# NODEMUNCHER_SIGNING_UPDATE_AUDIT_V1

Status: YELLOW

Date: 2026-07-01

Scope: audit only. No code changes. No production changes.

Objective: audit Windows signing and update readiness for NodeMuncher.

## Verdict

NodeMuncher is acceptable for controlled alpha distribution to known testers with explicit hash verification.

NodeMuncher is not ready for broad public launch because:

- current Windows executable and installers are unsigned
- EV/AuthentiCode signing is not complete
- no Tauri updater is configured
- rollback is manual
- MSI has a known privilege/install caveat; NSIS is the safer alpha installer

## Current Installer Artifacts

Current local artifacts inspected:

| Artifact | Path | Exists | SHA256 | Authenticode status |
| --- | --- | --- | --- | --- |
| NSIS installer | `C:\Users\danki\Desktop\nodemuncher-codex\src-tauri\target\release\bundle\nsis\Farpy NodeMuncher_0.1.0_x64-setup.exe` | yes | `59F802F22CB8BF52B8CAF28E2923DD7479D28929FAED16CFF26F81B4E2F1FB3E` | `NotSigned` |
| MSI installer | `C:\Users\danki\Desktop\nodemuncher-codex\src-tauri\target\release\bundle\msi\Farpy NodeMuncher_0.1.0_x64_en-US.msi` | yes | `2092D1060C45E8A01148958ADD642D4FCC1720D97972CB067C736BC4A635582A` | `NotSigned` |
| Release executable | `C:\Users\danki\Desktop\nodemuncher-codex\src-tauri\target\release\farpy-nodemuncher.exe` | yes | `8625FB6A6E88B59D3892A31D46B8EF7E6205E7787C395147AF95EA3E95073A85` | `NotSigned` |

Notes:

- These hashes reflect the current local artifacts at audit time.
- Earlier release notes contain older hashes for prior release candidates; those should not be treated as the current artifact truth without an explicit artifact freeze.

## Signed / Unsigned State

Observed result:

```text
SIGNATURE_STATUS NotSigned
```

for:

- NSIS installer
- MSI installer
- release executable

Evidence command:

```powershell
Get-AuthenticodeSignature -LiteralPath <artifact>
```

Risk:

- Windows SmartScreen/Defender reputation warnings are likely or at least not disproven.
- External users cannot verify publisher identity from Authenticode signature.
- Distribution must rely on explicit SHA256 verification for controlled alpha.

Classification:

- Controlled alpha: accepted YELLOW.
- Broad public launch: blocking P1.

## EV Certificate Dependency

Current state:

- EV signing is not complete.
- `RELEASE_CANDIDATE_V1.md` records:
  - code signing is not present
  - EV signing is not complete
  - macOS DMG is unsigned
- `NODEMUNCHER_ALPHA_GATE.md` records that EV signing is not required for controlled alpha with known testers, but is required before broad public NodeMuncher launch.

Decision boundary:

- If Farpy chooses broad NodeMuncher launch with unsigned builds, that must be an explicit business/security exception.
- Default launch policy remains: Authenticode-sign Windows installer and executable before broad distribution.

Recommended proof before broad launch:

- certificate subject
- certificate issuer
- thumbprint
- timestamping status
- `Get-AuthenticodeSignature` status `Valid`
- SmartScreen/Defender install smoke result

Do not print or store private key material in release notes.

## Auto-Update Path

Config inspected:

```text
C:\Users\danki\Desktop\nodemuncher-codex\src-tauri\tauri.nodemuncher.conf.json
```

Observed:

```json
"bundle": {
  "active": true,
  "targets": ["msi", "nsis"],
  "resources": ["resources/blender/**/*"],
  "icon": ["icons/32x32.png", "icons/128x128.png", "icons/128x128@2x.png", "icons/icon.icns", "icons/icon.ico"]
}
```

No updater configuration was found in the NodeMuncher Tauri config.

Existing release evidence:

- `NODEMUNCHER_TRUST_HARDENING_V1.md` says no production auto-update mechanism is configured and no updater source, signature validation, or rollback behavior exists.
- `NODEMUNCHER_LAUNCH_AUDIT_V1.md` says no signed update, rollback, or emergency patch path exists.

Risk:

- A bad alpha build requires manual uninstall/reinstall.
- A security fix requires manual operator contact.
- There is no signed automatic rollback path.

Classification:

- Controlled alpha: acceptable with operator supervision.
- Broad public launch: blocking P1.

## Rollback / Install Path

Current rollback path:

- manual
- operator-driven
- versioned installer plus SHA256
- tester instructed to uninstall/reinstall

Existing alpha gate rollback plan:

1. Stop sending the bad installer.
2. Mark artifact revoked internally.
3. Tell testers to stop NodeMuncher.
4. Ask testers to uninstall through Windows Apps.
5. Preserve logs if debugging is needed.
6. Rebuild known-good installer.
7. Record new SHA256.
8. Re-run clean install smoke.
9. Send replacement only after alpha gate is GREEN again.

MSI reliability note:

- `NODEMUNCHER_CLEAN_INSTALL_SMOKE_V1.md` records MSI error 1925 / exit 1603 in the tested environment.
- NSIS user-scope install/launch/uninstall passed.

Current recommendation:

- Controlled alpha should use NSIS.
- MSI should remain internal or explicitly marked admin/elevation test-only until revalidated.

## Current Launch Posture

| Area | Status | Controlled alpha | Broad public launch |
| --- | --- | --- | --- |
| NSIS artifact exists | GREEN | Use with SHA256 | Needs signing/reputation proof |
| MSI artifact exists | YELLOW | Avoid unless testing MSI specifically | Needs install reliability proof |
| Executable signing | RED for public | Accepted only with known testers | Must be signed or exception approved |
| Installer signing | RED for public | Accepted only with known testers | Must be signed or exception approved |
| EV dependency | YELLOW | Not required | Required by current alpha gate |
| Auto-update | YELLOW | Manual updates acceptable | Signed updater or documented rollback required |
| Rollback | YELLOW | Manual operator rollback exists | Needs scalable public policy |

## Required Before Broad Launch

1. Sign `farpy-nodemuncher.exe`.
2. Sign NSIS installer.
3. Sign MSI if MSI remains distributed.
4. Timestamp signatures.
5. Record certificate issuer/subject/thumbprint without exposing secrets.
6. Re-run clean install smoke on signed NSIS.
7. Re-run MSI smoke or hide MSI.
8. Define signed updater or hash-pinned manual update policy.
9. Document rollback path on the operator side.
10. Update public/internal download copy to match signing state.

## Accepted Controlled Alpha Procedure

For known testers only:

1. Use NSIS installer.
2. Share exact filename and SHA256.
3. Tell tester it is controlled alpha and may be unsigned.
4. Monitor first pair/heartbeat/render.
5. Preserve logs before uninstall if something fails.
6. Do not market this as broad public NodeMuncher launch.

## Commands Run

```powershell
$root='C:\Users\danki\Desktop\nodemuncher-codex'; Get-ChildItem -LiteralPath "$root\src-tauri\target\release\bundle" -Recurse -File -ErrorAction SilentlyContinue | Where-Object { $_.Extension -in '.exe','.msi','.dmg','.zip','.sha256' -or $_.Name -match 'NodeMuncher|nodemuncher' } | Select-Object FullName,Length,LastWriteTime
$root='C:\Users\danki\Desktop\nodemuncher-codex'; Get-Content -LiteralPath "$root\src-tauri\tauri.nodemuncher.conf.json" -Raw
$root='C:\Users\danki\Desktop\nodemuncher-codex'; rg -n "sign|signed|unsigned|EV|Sectigo|Bizee|D&B|update|updater|rollback|NSIS|MSI|installer|sha256" "$root\release" "$root\src-tauri" "$root\package.json"
$paths=@('C:\Users\danki\Desktop\nodemuncher-codex\src-tauri\target\release\bundle\nsis\Farpy NodeMuncher_0.1.0_x64-setup.exe','C:\Users\danki\Desktop\nodemuncher-codex\src-tauri\target\release\bundle\msi\Farpy NodeMuncher_0.1.0_x64_en-US.msi','C:\Users\danki\Desktop\nodemuncher-codex\src-tauri\target\release\farpy-nodemuncher.exe'); foreach($p in $paths){ Write-Host "--- $p"; if(Test-Path -LiteralPath $p){ $item=Get-Item -LiteralPath $p; $hash=Get-FileHash -Algorithm SHA256 -LiteralPath $p; $sig=Get-AuthenticodeSignature -LiteralPath $p; Write-Host "EXISTS true"; Write-Host "LENGTH $($item.Length)"; Write-Host "SHA256 $($hash.Hash)"; Write-Host "SIGNATURE_STATUS $($sig.Status)"; Write-Host "SIGNER $($sig.SignerCertificate.Subject)" } else { Write-Host "EXISTS false" } }
$paths=@('C:\Users\danki\Desktop\farpy-frontend\docs\FARPY_BOOK\NODEMUNCHER_ALPHA_GATE.md','C:\Users\danki\Desktop\farpy-frontend\docs\FARPY_BOOK\04_NODEMUNCHER.md','C:\Users\danki\Desktop\farpy-frontend\release\NODEMUNCHER_P1_RISK_AUDIT_V1.md'); foreach($p in $paths){ if(Test-Path -LiteralPath $p){ Write-Host "--- $p"; Select-String -LiteralPath $p -Pattern 'sign|EV|update|rollback|MSI|NSIS|installer|Broad public|Controlled alpha' | ForEach-Object { "$($_.LineNumber):$($_.Line)" } } }
```

## Final Recommendation

Keep NodeMuncher in controlled alpha.

Use the NSIS installer for known testers with explicit SHA256 verification.

Do not broadly publish NodeMuncher until signing, update/rollback, MSI policy, and artifact manifest rules are complete.
