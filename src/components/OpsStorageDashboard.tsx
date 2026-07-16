"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type StorageRow = Record<string, unknown>;

type OpsSummary = {
  ok: boolean;
  generated_at: string;
  storage?: {
    bunny_storage_bytes?: number | null;
    upload_storage_bytes?: number | null;
    output_storage_bytes?: number | null;
    pending_upload_count?: number | null;
    failed_upload_count?: number | null;
    retry_queue_count?: number | null;
    oldest_pending_upload_at?: string | null;
    pending_uploads?: StorageRow[];
    recent_uploads?: StorageRow[];
    recent_failures?: StorageRow[];
  };
};

const ENDPOINT = "/node/v1/web-render/ops/summary";

const finiteNumber = (value: unknown) => Number.isFinite(Number(value)) ? Number(value) : null;

const bytes = (value: unknown) => {
  const size = finiteNumber(value);
  if (size === null) return "";
  if (size < 1024) return `${size} B`;
  if (size < 1024 ** 2) return `${(size / 1024).toFixed(1)} KB`;
  if (size < 1024 ** 3) return `${(size / 1024 ** 2).toFixed(1)} MB`;
  if (size < 1024 ** 4) return `${(size / 1024 ** 3).toFixed(1)} GB`;
  return `${(size / 1024 ** 4).toFixed(1)} TB`;
};

const duration = (seconds: unknown) => {
  const parsed = finiteNumber(seconds);
  if (parsed === null) return "";
  const total = Math.max(0, Math.round(parsed));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  return hours ? `${hours}h ${minutes}m` : minutes ? `${minutes}m ${secs}s` : `${secs}s`;
};

const age = (value: unknown, now: number) => {
  const parsed = Date.parse(String(value || ""));
  return Number.isFinite(parsed) ? duration((now - parsed) / 1000) : "";
};

const timeText = (value: unknown) => {
  const parsed = Date.parse(String(value || ""));
  return Number.isFinite(parsed) ? new Date(parsed).toLocaleString() : "";
};

const text = (value: unknown) => value === null || value === undefined ? "" : String(value);

function DataTable({
  title,
  rows,
  columns,
}: {
  title: string;
  rows: StorageRow[];
  columns: Array<[string, string, ((value: unknown, row: StorageRow) => string)?]>;
}) {
  return (
    <section className="rounded-lg border border-white/10 bg-[#17131f]">
      <header className="border-b border-white/10 px-4 py-3">
        <h2 className="text-base font-semibold text-zinc-100">{title}</h2>
      </header>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-left text-xs">
          <thead className="text-[11px] uppercase tracking-[0.07em] text-zinc-500">
            <tr>{columns.map(([key, label]) => <th className="border-b border-white/10 px-3 py-3 font-semibold" key={key}>{label}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr className="border-b border-white/5 hover:bg-white/[0.025]" key={String(row.job_id || index)}>
                {columns.map(([key, , format]) => <td className="max-w-80 px-3 py-3 text-zinc-300" key={key}>{format ? format(row[key], row) : text(row[key])}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!rows.length ? <div className="h-12" aria-label="No records returned" /> : null}
    </section>
  );
}

export function OpsStorageDashboard() {
  const [token, setToken] = useState("");
  const [summary, setSummary] = useState<OpsSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("Operator token required.");
  const [now, setNow] = useState(() => Date.now());

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await fetch(ENDPOINT, {
        cache: "no-store",
        headers: { "x-farpy-ops-token": token },
      });
      if (!response.ok) {
        setSummary(null);
        setMessage(response.status === 403 ? "Operator token rejected." : `Operations endpoint returned ${response.status}.`);
        return;
      }
      const data = (await response.json()) as OpsSummary;
      setSummary(data);
      setMessage("");
      setNow(Date.now());
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load production storage data.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    const initial = window.setTimeout(() => void load(), 0);
    const refresh = window.setInterval(() => void load(), 5_000);
    const clock = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(refresh);
      window.clearInterval(clock);
    };
  }, [load, token]);

  const storage = summary?.storage;
  const localBytes = useMemo(() => {
    const upload = finiteNumber(storage?.upload_storage_bytes);
    const output = finiteNumber(storage?.output_storage_bytes);
    return upload === null && output === null ? null : (upload || 0) + (output || 0);
  }, [storage]);

  const cards = [
    ["Bunny Storage Used", bytes(storage?.bunny_storage_bytes)],
    ["Local Storage Used", bytes(localBytes)],
    ["Pending Uploads", finiteNumber(storage?.pending_upload_count)],
    ["Failed Uploads", finiteNumber(storage?.failed_upload_count)],
    ["Retry Queue", finiteNumber(storage?.retry_queue_count)],
    ["Oldest Pending Upload", age(storage?.oldest_pending_upload_at, now)],
  ] as const;

  return (
    <main className="min-h-screen bg-[#0d0b12] px-3 py-5 text-zinc-100 sm:px-5 lg:px-7">
      <div className="mx-auto max-w-[1600px]">
        <header className="flex flex-col gap-4 border-b border-white/10 pb-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <a className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-400 hover:text-orange-300" href="/ops">Farpy Ops</a>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">Production storage</h1>
            <p className="mt-1 text-sm text-zinc-400">Live read-only view. Refreshes every five seconds.</p>
          </div>
          <form className="flex w-full max-w-xl gap-2" onSubmit={(event) => { event.preventDefault(); void load(); }}>
            <label className="sr-only" htmlFor="ops-storage-token">Operator token</label>
            <input
              autoComplete="current-password"
              className="h-10 min-w-0 flex-1 rounded-md border border-white/15 bg-white/5 px-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-orange-400"
              id="ops-storage-token"
              onChange={(event) => setToken(event.target.value)}
              placeholder="Operator token"
              type="password"
              value={token}
            />
            <button className="h-10 rounded-md bg-orange-500 px-4 text-sm font-semibold text-black hover:bg-orange-400 disabled:opacity-50" disabled={!token || loading} type="submit">
              {loading ? "Refreshing" : "Refresh"}
            </button>
          </form>
        </header>

        <section className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6" aria-label="Storage summary">
          {cards.map(([label, value]) => (
            <div className="rounded-lg border border-white/10 bg-[#17131f] p-4" key={label}>
              <div className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">{label}</div>
              <div className="mt-2 min-h-8 text-2xl font-semibold tabular-nums">{value ?? ""}</div>
            </div>
          ))}
        </section>

        {message ? <div className="mt-5 rounded-lg border border-amber-400/20 bg-amber-400/5 px-4 py-3 text-sm text-amber-300">{message}</div> : null}

        <div className="mt-5 grid gap-4">
          <DataTable
            title="Pending Uploads"
            rows={storage?.pending_uploads || []}
            columns={[
              ["job_id", "Job ID"], ["status", "Status"], ["local_path", "Local Path"], ["destination", "Destination"],
              ["size_bytes", "Size", bytes], ["created_at", "Age", (value) => age(value, now)], ["last_error", "Last Error"],
            ]}
          />
          <DataTable
            title="Recent Uploads"
            rows={storage?.recent_uploads || []}
            columns={[
              ["job_id", "Job ID"], ["size_bytes", "Size", bytes], ["duration_seconds", "Duration", duration],
              ["storage", "Storage"], ["completed_at", "Completed", timeText], ["verification", "Verification"],
            ]}
          />
          <DataTable
            title="Recent Failures"
            rows={storage?.recent_failures || []}
            columns={[
              ["job_id", "Job ID"], ["reason", "Reason"], ["attempts", "Attempts"],
              ["last_retry_at", "Last Retry", timeText], ["next_retry_at", "Next Retry", timeText],
            ]}
          />
        </div>

        <footer className="flex justify-end px-1 py-4 text-xs text-zinc-500">
          {summary?.generated_at ? `Updated ${timeText(summary.generated_at)}` : ""}
        </footer>
      </div>
    </main>
  );
}
