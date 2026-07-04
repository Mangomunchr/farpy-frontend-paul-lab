# BENCHMARK_PUBLIC_DEPLOY_VERIFY_V1

Date: 2026-06-26

## Result

GREEN

## Production deploy

Local static export was built with `npm.cmd run build`, packaged, uploaded, and deployed to production.

Static root discovered:

- `/opt/farpy.com/out`

Additional served Benchmark root discovered:

- `/var/www/farpy/benchmark`

Backups created:

- `/opt/farpy.com/out.prev-benchmark-public-deploy-v1.20260626T210640Z`
- `/var/www/farpy/benchmark.prev-benchmark-public-deploy-v1.20260626T211114Z`

Deploy notes:

- `/opt/farpy.com/out` contains protected `receipt-static` files that cannot be removed by `rm -rf`, so the static export was overlaid into the existing tree after the backup.
- `/downloads/index.html` was added from `downloads.html` so `https://farpy.com/downloads` serves the downloads page while preserving binary files under `/downloads/*`.
- `/benchmark` is served from `/var/www/farpy/benchmark`, so the deployed `/opt/farpy.com/out/benchmark` directory was overlaid there as well.

## Production URLs verified

| URL | Status | Evidence |
| --- | ---: | --- |
| `https://farpy.com/downloads` | 200 | Contains Farpy Benchmark section |
| `https://farpy.com/benchmark` | 200 | Contains `Download Farpy Benchmark for Windows` CTA |
| `https://farpy.com/downloads/farpy-benchmark-windows-amd64.exe` | 200 | Downloaded and hashed |
| `https://farpy.com/downloads/farpy-benchmark-windows-amd64.exe.sha256` | 200 | Sidecar returned |
| `https://farpy.com/downloads/farpy-benchmark-windows-amd64.msi` | 200 | Downloaded and hashed |
| `https://farpy.com/downloads/farpy-benchmark-windows-amd64.msi.sha256` | 200 | Sidecar returned |

## SHA256

| Artifact | SHA256 |
| --- | --- |
| `farpy-benchmark-windows-amd64.exe` | `A073E301BA542205155F34F4524BB2FFFC648EA10DDE8CFCFF3C47688936FC8D` |
| `farpy-benchmark-windows-amd64.msi` | `A2D81F3E532939F8CCC7C593D172DB27C781F6F2BCEC5079C643726D68B765E2` |

Sidecars return lowercase equivalents:

- `a073e301ba542205155f34f4524bb2fffc648ea10dde8cfcff3c47688936fc8d  farpy-benchmark-windows-amd64.exe`
- `a2d81f3e532939f8ccc7c593d172db27c781f6f2bcec5079c643726d68b765e2  farpy-benchmark-windows-amd64.msi`

## NodeMuncher handling

NodeMuncher installer links were removed from the public downloads page. The page now states:

> NodeMuncher worker builds are internal alpha artifacts and are not published as public user downloads. Farpy Benchmark is the public desktop utility for this release.

Verification:

- `DOWNLOADS_HAS_NODEMUNCHER_PUBLIC_LINK=False`
- `DOWNLOADS_NODEMUNCHER_INTERNAL_COPY=True`

## Commands run

```powershell
npm.cmd run build
tar -czf C:\tmp\farpy-out-benchmark-public-deploy-v1.tgz -C C:\Users\danki\Desktop\farpy-frontend\out .
scp -q C:\tmp\farpy-out-benchmark-public-deploy-v1.tgz root@farpy.com:/tmp/farpy-out-benchmark-public-deploy-v1.tgz
ssh root@farpy.com 'cp -a /opt/farpy.com/out /opt/farpy.com/out.prev-benchmark-public-deploy-v1.20260626T210640Z'
ssh root@farpy.com 'cp -a /opt/farpy.com/out.new-benchmark-public-deploy-v1.20260626T210640Z/. /opt/farpy.com/out/'
ssh root@farpy.com 'cp /opt/farpy.com/out/downloads.html /opt/farpy.com/out/downloads/index.html'
ssh root@farpy.com 'cp -a /var/www/farpy/benchmark /var/www/farpy/benchmark.prev-benchmark-public-deploy-v1.20260626T211114Z'
ssh root@farpy.com 'cp -a /opt/farpy.com/out/benchmark/. /var/www/farpy/benchmark/'
curl.exe -L -s -o NUL -w "%{http_code}" https://farpy.com/downloads
curl.exe -L -s -o NUL -w "%{http_code}" https://farpy.com/benchmark
curl.exe -L -s -o NUL -w "%{http_code}" https://farpy.com/downloads/farpy-benchmark-windows-amd64.exe
curl.exe -L -s -o NUL -w "%{http_code}" https://farpy.com/downloads/farpy-benchmark-windows-amd64.exe.sha256
curl.exe -L -s -o NUL -w "%{http_code}" https://farpy.com/downloads/farpy-benchmark-windows-amd64.msi
curl.exe -L -s -o NUL -w "%{http_code}" https://farpy.com/downloads/farpy-benchmark-windows-amd64.msi.sha256
Get-FileHash -Algorithm SHA256 C:\tmp\farpy-benchmark-windows-amd64.live.exe,C:\tmp\farpy-benchmark-windows-amd64.live.msi
```