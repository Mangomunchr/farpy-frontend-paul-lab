#!/usr/bin/env python3
"""Farpy authenticated remote Octane worker.

This worker claims Octane jobs, downloads the .orbx input, runs a configured
Octane command for each requested frame, verifies all requested frame files
exist, packages a ZIP, and posts completion.
"""
import argparse
import hashlib
import json
import os
import shutil
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import zipfile
from datetime import datetime, timezone
from pathlib import Path

DEFAULT_API_BASE = "https://farpy.com/node/v1/web-render"
WORKER_ID = os.environ.get("FARPY_WORKER_ID") or os.environ.get("FARPY_NODE_ID") or "pr-003"
API_BASE = os.environ.get("FARPY_WEB_RENDER_API_BASE", DEFAULT_API_BASE).rstrip("/")
TOKEN = os.environ.get("FARPY_WEB_RENDER_WORKER_TOKEN", "")
POLL_SECONDS = float(os.environ.get("FARPY_WORKER_POLL_SECONDS", "5"))
WORK_ROOT = Path(os.environ.get("FARPY_WORKER_WORK_DIR", "/var/lib/farpy-web-render-worker/work"))
OCTANE_EXE = os.environ.get("OCTANE_EXE") or os.environ.get("FARPY_OCTANE_EXE") or shutil.which("octane") or shutil.which("OctaneRender") or ""
OCTANE_COMMAND_TEMPLATE = os.environ.get("FARPY_OCTANE_RENDER_COMMAND", "")
OCTANE_TIMEOUT_SECONDS = int(os.environ.get("FARPY_OCTANE_TIMEOUT_SECONDS", "1800"))


def now_iso():
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def sha256_file(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def api_url(path):
    if path.startswith("http://") or path.startswith("https://"):
        return path
    base = API_BASE.rstrip("/")
    endpoint = "/" + str(path).strip().lstrip("/")
    for prefix in ("/node/v1/web-render/", "/node/v1/"):
        if endpoint.startswith(prefix):
            endpoint = "/" + endpoint[len(prefix):]
            break
    return base + endpoint


def request_json(method, path, body=None, extra_headers=None, timeout=60):
    data = None
    headers = {
        "x-farpy-worker-token": TOKEN,
        "x-farpy-worker": TOKEN,
        "x-farpy-worker-id": WORKER_ID,
        "x-farpy-renderer": "octane",
        "accept": "application/json",
    }
    if extra_headers:
        headers.update(extra_headers)
    if body is not None:
        data = json.dumps(body).encode("utf-8")
        headers["content-type"] = "application/json"
    req = urllib.request.Request(api_url(path), data=data, headers=headers, method=method)
    with urllib.request.urlopen(req, timeout=timeout) as res:
        return json.loads(res.read().decode("utf-8"))


def request_bytes(method, path, body=None, extra_headers=None, timeout=600):
    headers = {
        "x-farpy-worker-token": TOKEN,
        "x-farpy-worker": TOKEN,
        "x-farpy-worker-id": WORKER_ID,
        "x-farpy-renderer": "octane",
    }
    if extra_headers:
        headers.update(extra_headers)
    req = urllib.request.Request(api_url(path), data=body, headers=headers, method=method)
    with urllib.request.urlopen(req, timeout=timeout) as res:
        return res.read(), dict(res.headers)


def post_fail(job_id, reason):
    try:
        request_json("POST", f"worker/jobs/{urllib.parse.quote(job_id)}/fail", {"failure_reason": reason}, timeout=30)
    except Exception as exc:
        print(f"WARN fail-post failed job_id={job_id} err={exc}", file=sys.stderr)


def render_command(job, input_path, output_dir, frame):
    frame_padded = str(frame).zfill(4)
    output_path = output_dir / f"frame_{frame_padded}.png"
    values = {
        "octane_exe": OCTANE_EXE,
        "input": str(input_path),
        "output_dir": str(output_dir),
        "output": str(output_path),
        "frame": str(frame),
        "frame_padded": frame_padded,
        "frame_start": str(job["frame_start"]),
        "frame_end": str(job["frame_end"]),
        "frame_count": str(job["frame_count"]),
        "render_target": str(job.get("render_target") or "Render target"),
        "samples": str(job.get("samples") or 16),
    }
    if OCTANE_COMMAND_TEMPLATE:
        return OCTANE_COMMAND_TEMPLATE.format(**values)
    if not OCTANE_EXE:
        raise RuntimeError("Octane executable not found and FARPY_OCTANE_RENDER_COMMAND is not set.")
    raise RuntimeError("FARPY_OCTANE_RENDER_COMMAND is required until the Octane CLI invocation is proven for this node.")


def run_frame(job, input_path, output_dir, frame, log_lines):
    cmd = render_command(job, input_path, output_dir, frame)
    print(f"RUN job_id={job['job_id']} frame={frame}", flush=True)
    started = now_iso()
    log_lines.append(f"FRAME_START frame={frame} ts={started} cmd={cmd}")
    proc = subprocess.run(cmd, shell=True, cwd=str(output_dir.parent), stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=OCTANE_TIMEOUT_SECONDS)
    completed = now_iso()
    log_lines.append(f"FRAME_DONE frame={frame} ts={completed} exit_code={proc.returncode}")
    print(f"FRAME_DONE job_id={job['job_id']} frame={frame} exit_code={proc.returncode}", flush=True)
    if proc.stdout:
        log_lines.append(f"FRAME_STDOUT frame={frame}\n{proc.stdout[-4000:]}")
    if proc.stderr:
        log_lines.append(f"FRAME_STDERR frame={frame}\n{proc.stderr[-4000:]}")
    if proc.returncode != 0:
        raise RuntimeError(f"Octane exited with code {proc.returncode} for frame {frame}.")


def output_file_for_frame(output_dir, frame):
    stem = f"frame_{str(frame).zfill(4)}"
    for ext in (".png", ".exr"):
        p = output_dir / f"{stem}{ext}"
        if p.exists() and p.stat().st_size > 0:
            return p
    matches = sorted(output_dir.glob(f"{stem}.*"))
    for p in matches:
        if p.is_file() and p.stat().st_size > 0 and p.suffix.lower() in (".png", ".exr"):
            return p
    return None


def package_zip(job, work_dir, input_path, output_dir, log_lines):
    frame_start = int(job["frame_start"])
    frame_end = int(job["frame_end"])
    expected = list(range(frame_start, frame_end + 1))
    output_files = []
    for frame in expected:
        p = output_file_for_frame(output_dir, frame)
        if not p:
            raise RuntimeError(f"Missing rendered frame {frame}.")
        output_files.append(p)
    completed_at = now_iso()
    manifest = {
        "job_id": job["job_id"],
        "worker_id": WORKER_ID,
        "renderer": "octane",
        "frame_start": frame_start,
        "frame_end": frame_end,
        "frame_count": int(job["frame_count"]),
        "rendered_file_count": len(output_files),
        "output_files": [f"output/{p.name}" for p in output_files],
        "created_at_utc": completed_at,
        "zip_created_by": "farpy-web-render-http-worker",
    }
    job_json = dict(job)
    log_path = work_dir / "render-log.txt"
    log_lines.append(f"INPUT_SHA256 {sha256_file(input_path)}")
    log_lines.append(f"OUTPUT_FILE_COUNT {len(output_files)}")
    log_lines.append(f"ZIP_CREATED_AT {completed_at}")
    log_path.write_text("\n".join(log_lines) + "\n", encoding="utf-8")
    zip_path = work_dir / f"{job['job_id']}.zip"
    with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED) as z:
        z.writestr("manifest.json", json.dumps(manifest, indent=2))
        z.writestr("job.json", json.dumps(job_json, indent=2))
        z.write(log_path, "render-log.txt")
        for p in output_files:
            z.write(p, f"output/{p.name}")
    zip_sha = sha256_file(zip_path)
    print(f"ZIP job_id={job['job_id']} path={zip_path} frames={len(output_files)} sha256={zip_sha}", flush=True)
    return zip_path, len(output_files)


def process_job(job):
    if job.get("renderer") != "octane":
        raise RuntimeError("Claimed non-Octane job.")
    frame_start = int(job.get("frame_start") or 1)
    frame_end = int(job.get("frame_end") or frame_start)
    frame_count = int(job.get("frame_count") or (frame_end - frame_start + 1))
    if frame_start < 1 or frame_end < frame_start or frame_end - frame_start + 1 != frame_count:
        raise RuntimeError("Invalid frame range from claim.")
    job["frame_start"] = frame_start
    job["frame_end"] = frame_end
    job["frame_count"] = frame_count
    work_dir = WORK_ROOT / job["job_id"]
    input_path = work_dir / job.get("filename", "input.orbx")
    output_dir = work_dir / "output"
    output_dir.mkdir(parents=True, exist_ok=True)
    print(f"CLAIMED job_id={job['job_id']} worker_id={WORKER_ID} frames={frame_start}-{frame_end}", flush=True)
    log_lines = [f"WORKER_ID {WORKER_ID}", f"JOB_ID {job['job_id']}", f"STARTED_AT {now_iso()}"]
    data, _headers = request_bytes("GET", job["download_upload_url"], timeout=900)
    input_path.write_bytes(data)
    for frame in range(frame_start, frame_end + 1):
        run_frame(job, input_path, output_dir, frame, log_lines)
    zip_path, rendered_count = package_zip(job, work_dir, input_path, output_dir, log_lines)
    body = zip_path.read_bytes()
    request_bytes(
        "POST",
        f"worker/jobs/{urllib.parse.quote(job['job_id'])}/complete",
        body=body,
        extra_headers={
            "content-type": "application/zip",
            "x-farpy-rendered-file-count": str(rendered_count),
        },
        timeout=900,
    )
    print(f"COMPLETE job_id={job['job_id']} frames={rendered_count}", flush=True)


def once():
    if not TOKEN:
        raise RuntimeError("FARPY_WEB_RENDER_WORKER_TOKEN is required.")
    WORK_ROOT.mkdir(parents=True, exist_ok=True)
    claim = request_json("POST", "worker/claim", timeout=60)
    job = claim.get("job") if isinstance(claim, dict) else None
    if not job:
            return False
    try:
        process_job(job)
    except Exception as exc:
        print(f"JOB_ERROR job_id={job.get('job_id')} error={exc}", file=sys.stderr, flush=True)
        post_fail(job.get("job_id", ""), str(exc))
        return False
    return True


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--once", action="store_true")
    args = parser.parse_args()
    if args.once:
        once()
        return
    while True:
        try:
            once()
        except urllib.error.HTTPError as exc:
            print(f"HTTP_ERROR status={exc.code} body={exc.read().decode('utf-8', 'ignore')[:500]}", file=sys.stderr)
        except Exception as exc:
            print(f"JOB_ERROR error={exc}", file=sys.stderr, flush=True)
        time.sleep(POLL_SECONDS)


if __name__ == "__main__":
    main()
