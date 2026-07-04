# ADDON_PRODUCTION_DEPLOY_V1

Status: PASS

## Scope

Static frontend deploy only. No backend/API files were changed and no services were restarted.

## Files deployed

- `/addon` static page and chunks
- `/downloads` static page and chunks
- `/downloads/Farpy-Blender-Addon-unified.zip`
- `/downloads/Farpy-Blender-Addon-unified.zip.sha256`

## Local artifact

- Source ZIP: `C:\Users\danki\Desktop\farpy-frontend\public\downloads\Farpy-Blender-Addon-unified.zip`
- SHA256: `BE2312CE5E77A1E62C1255A95765AE1C89BEF73E5CEDF114B9E7D75A6DAA7708`

## Build and deploy

Build:

```powershell
Set-Location 'C:\Users\danki\Desktop\farpy-frontend'
npm.cmd run build
```

Archive:

```powershell
tar -czf C:\tmp\farpy-out-addon-production-deploy-v1-20260629T173703.tar.gz -C C:\Users\danki\Desktop\farpy-frontend\out .
```

Upload:

```powershell
scp -q C:\tmp\farpy-out-addon-production-deploy-v1-20260629T173703.tar.gz root@farpy.com:/tmp/farpy-out-addon-production-deploy-v1-20260629T173703.tar.gz
```

Deploy:

```bash
ssh root@farpy.com 'set -e; stamp=20260629T173703; backup=/opt/farpy.com/out.bak.addon_production_deploy_v1.$stamp; cp -a /opt/farpy.com/out $backup; tar -xzf /tmp/farpy-out-addon-production-deploy-v1-$stamp.tar.gz -C /opt/farpy.com/out; test -f /opt/farpy.com/out/addon.html; test -f /opt/farpy.com/out/downloads/Farpy-Blender-Addon-unified.zip; test -f /opt/farpy.com/out/downloads/Farpy-Blender-Addon-unified.zip.sha256'
```

Production backup:

- `/opt/farpy.com/out.bak.addon_production_deploy_v1.20260629T173703`

Uploaded archive:

- `/tmp/farpy-out-addon-production-deploy-v1-20260629T173703.tar.gz`

## Production verification

HTTP checks:

| URL | Status | Evidence |
| --- | ---: | --- |
| `https://farpy.com/addon` | 200 | length `22766` |
| `https://farpy.com/downloads` | 200 | length `23571` |
| `https://farpy.com/downloads/Farpy-Blender-Addon-unified.zip` | 200 | length `5095` |
| `https://farpy.com/downloads/Farpy-Blender-Addon-unified.zip.sha256` | 200 | length `99` |

Live downloaded ZIP hash:

```text
SHA256 BE2312CE5E77A1E62C1255A95765AE1C89BEF73E5CEDF114B9E7D75A6DAA7708
```

Live sidecar content:

```text
BE2312CE5E77A1E62C1255A95765AE1C89BEF73E5CEDF114B9E7D75A6DAA7708  Farpy-Blender-Addon-unified.zip
```

`/addon` content checks:

- `Farpy Render Delivery`: present
- `Download Blender Add-on`: present
- `BE2312CE5E77A1E62C1255A95765AE1C89BEF73E5CEDF114B9E7D75A6DAA7708`: present
- old hash `2ADA03BA28C1014EA3498C7E440C8FCE190D4E08EA4F8C5D1836894D4DD3B061`: absent
- old hash `03B9F6039396C06AB83C87E71F7846975DE661D0F2CA216BC60C0ACC4B14A4BF`: absent

`/downloads` content checks:

- `Download Farpy Render Delivery Blender add-on`: present
- `BE2312CE5E77A1E62C1255A95765AE1C89BEF73E5CEDF114B9E7D75A6DAA7708`: present
- old hash `2ADA03BA28C1014EA3498C7E440C8FCE190D4E08EA4F8C5D1836894D4DD3B061`: absent
- old hash `03B9F6039396C06AB83C87E71F7846975DE661D0F2CA216BC60C0ACC4B14A4BF`: absent

## Result

- Production `/addon` live: PASS
- Production `/downloads` live: PASS
- Production ZIP live: PASS
- Production SHA sidecar live: PASS
- Displayed hash matches deployed ZIP: PASS
- Old hashes absent from live pages: PASS
- Backend/API unchanged: PASS
