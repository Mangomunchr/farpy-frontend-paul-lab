"use client";

import { useEffect, useMemo, useState } from "react";
import { JourneyTimeline } from "@/components/JourneyTimeline";

type Check = {
  label: string;
  status: "pass" | "fail" | "checking";
  evidence: string;
};

type BenchmarkResult = {
  result_id?: string;
  receipt_id?: string;
  created_at?: string;
  gpu_name?: string;
  score?: number;
  render_seconds?: number;
  benchmark_version?: string;
  public_result_url?: string;
};

type BenchmarkLatest = {
  ok?: boolean;
  results?: BenchmarkResult[];
};

const DOWNLOADS = [
  {
    label: "Farpy Benchmark Windows EXE",
    file: "/downloads/farpy-benchmark-windows-amd64.exe",
    sha: "/downloads/farpy-benchmark-windows-amd64.exe.sha256",
  },
  {
    label: "Farpy Benchmark Windows MSI",
    file: "/downloads/farpy-benchmark-windows-amd64.msi",
    sha: "/downloads/farpy-benchmark-windows-amd64.msi.sha256",
  },
];

const value = (input: unknown) => {
  if (input === null || input === undefined || input === "") return "unknown";
  return String(input);
};

const shortHash = (input: unknown) => {
  const text = value(input);
  return text.length > 20 ? `${text.slice(0, 16)}...` : text;
};

async function probe(label: string, url: string): Promise<Check> {
  try {
    const response = await fetch(url, { cache: "no-store" });
    return { label, status: response.ok ? "pass" : "fail", evidence: `${response.status} ${url}` };
  } catch (error) {
    return {
      label,
      status: "fail",
      evidence: `${url} ${error instanceof Error ? error.message : "request failed"}`,
    };
  }
}

async function fetchSha(path: string) {
  try {
    const response = await fetch(path, { cache: "no-store" });
    if (!response.ok) return null;
    const text = await response.text();
    return text.trim().split(/\s+/)[0] || null;
  } catch {
    return null;
  }
}

export function PublicProofPage() {
  const [checks, setChecks] = useState<Check[]>([
    { label: "Website", status: "checking", evidence: "/" },
    { label: "Render API", status: "checking", evidence: "/node/v1/web-render/health" },
    { label: "Render partner status", status: "checking", evidence: "/node/v1/web-render/worker/status" },
    { label: "Leaderboard API", status: "checking", evidence: "/node/v1/leaderboard/stats" },
  ]);
  const [benchmark, setBenchmark] = useState<BenchmarkResult[]>([]);
  const [downloadProof, setDownloadProof] = useState<{ label: string; file: string; sha: string | null }[]>([]);

  useEffect(() => {
    let active = true;
    Promise.all([
      probe("Website", "/"),
      probe("Render API", "/node/v1/web-render/health"),
      probe("Render partner status", "/node/v1/web-render/worker/status"),
      probe("Leaderboard API", "/node/v1/leaderboard/stats"),
    ]).then((next) => {
      if (active) setChecks(next);
    });

    fetch("/node/v1/leaderboard/latest?limit=5", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((json: BenchmarkLatest | null) => {
        if (active) setBenchmark(json?.results || []);
      })
      .catch(() => {
        if (active) setBenchmark([]);
      });

    Promise.all(DOWNLOADS.map(async (item) => ({ ...item, sha: await fetchSha(item.sha) }))).then((items) => {
      if (active) setDownloadProof(items);
    });

    return () => {
      active = false;
    };
  }, []);

  const publicPassCount = useMemo(() => checks.filter((check) => check.status === "pass").length, [checks]);

  return (
    <main className="wrap render-flow-page">
      <section className="render-flow-head">
        <span className="render-label">Public proof</span>
        <h1>Farpy evidence page</h1>
        <p>
          Public-safe operational proof from health checks, benchmark receipts, and downloadable artifact hashes.
          Customer identity, payment records, access tokens, and internal paths are not shown.
        </p>
      </section>

      <section className="render-job-card">
        <div className="proof-receipt-head">
          <span className="pj-badge">Live checks</span>
          <strong>{publicPassCount}/{checks.length} pass</strong>
        </div>
        <div className="render-proof-lines">
          {checks.map((check) => (
            <div key={check.label}>
              <dt>{check.label}</dt>
              <dd>{check.status.toUpperCase()} - {check.evidence}</dd>
            </div>
          ))}
        </div>
      </section>

      <section className="render-job-card">
        <h2>Render proof</h2>
        <p className="proof-journey-note">
          Public proof shows the same package journey language without exposing private package telemetry.
        </p>
        <JourneyTimeline states={{}} label="Public package journey stages" />
        <div className="render-proof-lines">
          <div><dt>Jobs completed</dt><dd>No public proof yet.</dd></div>
          <div><dt>Frames rendered</dt><dd>No public proof yet.</dd></div>
          <div><dt>Receipts minted</dt><dd>No public proof yet.</dd></div>
          <div><dt>Latest successful renders</dt><dd>No public proof yet.</dd></div>
          <div><dt>Latest public receipts</dt><dd>No public proof yet.</dd></div>
          <div><dt>Latest output SHA256 examples</dt><dd>No public proof yet.</dd></div>
        </div>
      </section>

      <section className="render-job-card">
        <h2>Latest Benchmark results</h2>
        {benchmark.length ? (
          <div className="render-proof-lines">
            {benchmark.map((result) => (
              <div key={result.result_id || result.receipt_id || result.created_at}>
                <dt>{result.gpu_name || "unknown GPU"}</dt>
                <dd>
                  {result.result_id ? <a href={result.public_result_url || `/benchmark/result/${result.result_id}`}>{result.result_id}</a> : "unknown result"}
                  {" - "}score {value(result.score)} - {value(result.render_seconds)}s - {value(result.benchmark_version)}
                </dd>
              </div>
            ))}
          </div>
        ) : (
          <p>No public proof yet.</p>
        )}
      </section>

      <section className="render-job-card">
        <h2>Public downloads and artifact SHA256s</h2>
        <div className="render-proof-lines">
          {downloadProof.map((item) => (
            <div key={item.file}>
              <dt>{item.label}</dt>
              <dd>
                <a href={item.file}>{item.file}</a>
                {" - SHA256 "}
                {item.sha ? shortHash(item.sha) : "unknown"}
              </dd>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
