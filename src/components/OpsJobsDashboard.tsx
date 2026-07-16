"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type OpsJob = {
  job_id?: string | null; user_id?: string | null; email?: string | null; status?: string | null;
  frame_count?: number | null; rendered_file_count?: number | null; rendered_frame_count?: number | null;
  progress_percent?: number | null; gpu?: string | null; gpu_model?: string | null;
  worker_id?: string | null; node_id?: string | null; created_at?: string | null; submitted_at?: string | null;
  started_at?: string | null; completed_at?: string | null; failed_at?: string | null; updated_at?: string | null;
  render_seconds?: number | null; eta_seconds?: number | null; download_url?: string | null; receipt_url?: string | null;
  retry_count?: number | null; failure_reason?: string | null; last_error?: string | null;
};

type OpsSummary = {
  ok: boolean; generated_at: string;
  render?: { jobs_queued?: number | null; jobs_rendering?: number | null; jobs_completed_today?: number | null; failed_today?: number | null };
  recent?: { jobs?: OpsJob[] };
};

type Filter = "all" | "queued" | "running" | "uploading" | "failed" | "completed";
const ENDPOINT = "/node/v1/web-render/ops/summary";
const FILTERS: Array<{ key: Filter; label: string }> = [
  { key: "all", label: "All" }, { key: "queued", label: "Queued" }, { key: "running", label: "Running" },
  { key: "uploading", label: "Uploading" }, { key: "failed", label: "Failed" }, { key: "completed", label: "Completed" },
];

const normalizedStatus = (value?: string | null) => {
  const status = String(value || "").toLowerCase();
  if (["queued", "submitted", "leased"].includes(status)) return "queued";
  if (["complete", "completed", "done"].includes(status)) return "completed";
  if (["failed", "error"].includes(status)) return "failed";
  if (["cancelled", "canceled"].includes(status)) return "cancelled";
  return status;
};
const statusLabel = (value?: string | null) => { const status = normalizedStatus(value); return status ? status[0].toUpperCase() + status.slice(1) : ""; };
const statusTone = (value?: string | null) => {
  const status = normalizedStatus(value);
  if (status === "completed") return "border-emerald-400/30 bg-emerald-400/10 text-emerald-300";
  if (["running", "uploading", "verifying"].includes(status)) return "border-blue-400/30 bg-blue-400/10 text-blue-300";
  if (["failed", "cancelled"].includes(status)) return "border-red-400/30 bg-red-400/10 text-red-300";
  if (status === "retrying") return "border-amber-400/30 bg-amber-400/10 text-amber-300";
  return "border-white/15 bg-white/5 text-zinc-300";
};
const numberOrBlank = (value: unknown) => Number.isFinite(Number(value)) ? String(Number(value)) : "";
const duration = (seconds?: number | null) => {
  if (!Number.isFinite(Number(seconds))) return "";
  const total = Math.max(0, Math.round(Number(seconds))); const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60); const secs = total % 60;
  return hours ? `${hours}h ${minutes}m` : minutes ? `${minutes}m ${secs}s` : `${secs}s`;
};
const elapsedSeconds = (job: OpsJob, now: number) => {
  if (Number.isFinite(Number(job.render_seconds))) return Number(job.render_seconds);
  const start = Date.parse(String(job.started_at || "")); if (!Number.isFinite(start)) return null;
  const end = Date.parse(String(job.completed_at || job.failed_at || ""));
  return Math.max(0, ((Number.isFinite(end) ? end : now) - start) / 1000);
};
const timeText = (value?: string | null) => { if (!value) return ""; const parsed = Date.parse(value); return Number.isFinite(parsed) ? new Date(parsed).toLocaleString() : ""; };
const jobUser = (job: OpsJob) => job.email || job.user_id || "";
const jobNode = (job: OpsJob) => job.node_id || job.worker_id || "";
const jobGpu = (job: OpsJob) => job.gpu_model || job.gpu || "";

export function OpsJobsDashboard() {
  const [token, setToken] = useState(""); const [summary, setSummary] = useState<OpsSummary | null>(null);
  const [filter, setFilter] = useState<Filter>("all"); const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false); const [message, setMessage] = useState("Operator token required.");
  const [now, setNow] = useState(() => Date.now());

  const load = useCallback(async () => {
    if (!token) return; setLoading(true);
    try {
      const response = await fetch(ENDPOINT, { cache: "no-store", headers: { "x-farpy-ops-token": token } });
      if (!response.ok) { setSummary(null); setMessage(response.status === 403 ? "Operator token rejected." : `Operations endpoint returned ${response.status}.`); return; }
      const data = (await response.json()) as OpsSummary; setSummary(data); setMessage(""); setNow(Date.now());
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to load production jobs."); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    const initial = window.setTimeout(() => void load(), 0);
    const refresh = window.setInterval(() => void load(), 5_000); const clock = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => { window.clearTimeout(initial); window.clearInterval(refresh); window.clearInterval(clock); };
  }, [load, token]);

  const jobs = useMemo(() => summary?.recent?.jobs || [], [summary]);
  const filteredJobs = useMemo(() => {
    const query = search.trim().toLowerCase();
    return jobs.filter((job) => {
      if (filter !== "all" && normalizedStatus(job.status) !== filter) return false;
      if (!query) return true;
      return [job.job_id, jobUser(job), jobNode(job), jobGpu(job)].some((value) => String(value || "").toLowerCase().includes(query));
    });
  }, [filter, jobs, search]);
  const retriesAvailable = jobs.some((job) => Number.isFinite(Number(job.retry_count)));
  const retries = jobs.reduce((total, job) => total + (Number.isFinite(Number(job.retry_count)) ? Number(job.retry_count) : 0), 0);
  const oldestActive = jobs.filter((job) => ["queued", "running", "uploading", "verifying", "retrying"].includes(normalizedStatus(job.status)))
    .map((job) => Date.parse(String(job.submitted_at || job.created_at || ""))).filter(Number.isFinite).sort((a, b) => a - b)[0];
  const cards = [
    ["Queued", summary?.render?.jobs_queued], ["Running", summary?.render?.jobs_rendering],
    ["Completed Today", summary?.render?.jobs_completed_today], ["Failed Today", summary?.render?.failed_today],
    ["Retries", retriesAvailable ? retries : null], ["Oldest Job Age", Number.isFinite(oldestActive) ? duration((now - oldestActive) / 1000) : null],
  ] as const;

  return (
    <main className="min-h-screen bg-[#0d0b12] px-3 py-5 text-zinc-100 sm:px-5 lg:px-7"><div className="mx-auto max-w-[1800px]">
      <header className="flex flex-col gap-4 border-b border-white/10 pb-5 xl:flex-row xl:items-end xl:justify-between">
        <div><a className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-400 hover:text-orange-300" href="/ops">Farpy Ops</a><h1 className="mt-1 text-3xl font-semibold tracking-tight">Production jobs</h1><p className="mt-1 text-sm text-zinc-400">Live read-only view. Refreshes every five seconds.</p></div>
        <form className="flex w-full max-w-xl gap-2" onSubmit={(event) => { event.preventDefault(); void load(); }}>
          <label className="sr-only" htmlFor="ops-jobs-token">Operator token</label><input autoComplete="current-password" className="h-10 min-w-0 flex-1 rounded-md border border-white/15 bg-white/5 px-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-orange-400" id="ops-jobs-token" onChange={(event) => setToken(event.target.value)} placeholder="Operator token" type="password" value={token} />
          <button className="h-10 rounded-md bg-orange-500 px-4 text-sm font-semibold text-black hover:bg-orange-400 disabled:opacity-50" disabled={!token || loading} type="submit">{loading ? "Refreshing" : "Refresh"}</button>
        </form>
      </header>
      <section className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6" aria-label="Job summary">{cards.map(([label, value]) => <div className="rounded-lg border border-white/10 bg-[#17131f] p-4" key={label}><div className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">{label}</div><div className="mt-2 min-h-8 text-2xl font-semibold tabular-nums">{value ?? ""}</div></div>)}</section>
      <section className="mt-5 rounded-lg border border-white/10 bg-[#17131f]">
        <div className="flex flex-col gap-3 border-b border-white/10 p-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-1" aria-label="Filter jobs">{FILTERS.map((item) => <button className={`rounded-md px-3 py-2 text-sm font-medium ${filter === item.key ? "bg-white text-black" : "text-zinc-400 hover:bg-white/5 hover:text-white"}`} key={item.key} onClick={() => setFilter(item.key)} type="button">{item.label}</button>)}</div>
          <label className="relative block w-full lg:max-w-sm"><span className="sr-only">Search jobs</span><input className="h-10 w-full rounded-md border border-white/15 bg-black/20 px-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-orange-400" onChange={(event) => setSearch(event.target.value)} placeholder="Search job, user, node, or GPU" type="search" value={search} /></label>
        </div>
        {message ? <div className="border-b border-white/10 px-4 py-3 text-sm text-amber-300">{message}</div> : null}
        <div className="overflow-x-auto"><table className="w-full min-w-[1900px] border-collapse text-left text-xs"><thead className="sticky top-0 bg-[#17131f] text-[11px] uppercase tracking-[0.07em] text-zinc-500"><tr>{["Job ID", "User", "Status", "Progress", "Frames", "GPU", "Node", "Started", "Elapsed", "ETA", "Download", "Receipt", "Retry Count", "Last Error", "Actions"].map((label) => <th className="border-b border-white/10 px-3 py-3 font-semibold" key={label}>{label}</th>)}</tr></thead>
          <tbody>{filteredJobs.map((job) => {
            const rendered = Number.isFinite(Number(job.rendered_file_count ?? job.rendered_frame_count)) ? Number(job.rendered_file_count ?? job.rendered_frame_count) : null;
            const progress = Number.isFinite(Number(job.progress_percent)) ? Number(job.progress_percent) : rendered !== null && Number(job.frame_count) > 0 ? Math.round((rendered / Number(job.frame_count)) * 100) : null;
            return <tr className="border-b border-white/5 align-top hover:bg-white/[0.025]" key={String(job.job_id)}>
              <td className="px-3 py-3 font-mono text-zinc-200">{job.job_id || ""}</td><td className="max-w-48 truncate px-3 py-3 text-zinc-300">{jobUser(job)}</td>
              <td className="px-3 py-3"><span className={`inline-flex rounded-full border px-2 py-1 font-semibold ${statusTone(job.status)}`}>{statusLabel(job.status)}</span></td>
              <td className="px-3 py-3 tabular-nums text-zinc-300">{progress === null ? "" : `${progress}%`}</td><td className="px-3 py-3 tabular-nums text-zinc-300">{rendered === null ? numberOrBlank(job.frame_count) : `${rendered}/${numberOrBlank(job.frame_count)}`}</td>
              <td className="px-3 py-3 text-zinc-300">{jobGpu(job)}</td><td className="px-3 py-3 font-mono text-zinc-300">{jobNode(job)}</td><td className="whitespace-nowrap px-3 py-3 text-zinc-400">{timeText(job.started_at)}</td>
              <td className="px-3 py-3 tabular-nums text-zinc-300">{duration(elapsedSeconds(job, now))}</td><td className="px-3 py-3 tabular-nums text-zinc-300">{duration(job.eta_seconds)}</td>
              <td className="px-3 py-3">{job.download_url ? <a className="text-blue-300 hover:text-blue-200" href={job.download_url}>Download</a> : ""}</td><td className="px-3 py-3">{job.receipt_url ? <a className="text-blue-300 hover:text-blue-200" href={job.receipt_url}>Receipt</a> : ""}</td>
              <td className="px-3 py-3 tabular-nums text-zinc-300">{numberOrBlank(job.retry_count)}</td><td className="max-w-64 px-3 py-3 text-red-300">{job.last_error || job.failure_reason || ""}</td>
              <td className="px-3 py-3"><div className="flex gap-2 whitespace-nowrap">{job.job_id ? <a className="text-blue-300 hover:text-blue-200" href={`/workspace?job_id=${encodeURIComponent(job.job_id)}`}>Open</a> : null}{job.job_id ? <button className="text-zinc-400 hover:text-white" onClick={() => void navigator.clipboard.writeText(String(job.job_id))} type="button">Copy Job ID</button> : null}</div></td>
            </tr>;
          })}</tbody></table></div>
        <footer className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-xs text-zinc-500"><span>{summary ? `${filteredJobs.length} of ${jobs.length} recent jobs` : ""}</span><span>{summary?.generated_at ? `Updated ${timeText(summary.generated_at)}` : ""}</span></footer>
      </section>
    </div></main>
  );
}
