"use client";

import { useEffect, useMemo, useState } from "react";

type HealthCheck = {
  label: string;
  status: "pass" | "fail" | "checking";
  evidence: string;
};

type OpsSummary = {
  ok: boolean;
  generated_at: string;
  health_status?: "GREEN" | "YELLOW" | "RED";
  system?: Record<string, unknown>;
  render?: Record<string, unknown>;
  nodes?: Record<string, unknown>;
  financial?: Record<string, unknown>;
  storage?: Record<string, unknown>;
  recent?: {
    jobs?: Record<string, unknown>[];
    receipts?: Record<string, unknown>[];
    failures?: Record<string, unknown>[];
  };
  alerts?: Record<string, unknown>[] | Record<string, Record<string, unknown>[]>;
  alert_counts?: {
    critical?: number;
    warn?: number;
    info?: number;
    active?: number;
    resolved?: number;
  };
};

type Metric = [string, unknown, ("money" | "bytes" | "text")?];

const WEB_RENDER_BASE = "/node/v1/web-render";

const money = (value: unknown) => {
  const cents = Number(value);
  return Number.isFinite(cents) ? `$${(cents / 100).toFixed(2)}` : "no data";
};

const bytes = (value: unknown) => {
  const size = Number(value);
  if (!Number.isFinite(size)) return "no data";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  if (size < 1024 * 1024 * 1024) return `${(size / 1024 / 1024).toFixed(1)} MB`;
  return `${(size / 1024 / 1024 / 1024).toFixed(1)} GB`;
};

const valueText = (value: unknown) => {
  if (value === null || value === undefined || value === "") return "no data";
  if (typeof value === "boolean") return value ? "yes" : "no";
  if (Array.isArray(value)) return value.length ? value.join(", ") : "no data";
  return String(value);
};

const shortHash = (value: unknown) => {
  const text = String(value || "");
  return text.length > 14 ? `${text.slice(0, 10)}...` : valueText(value);
};

const statusClass = (status: HealthCheck["status"]) => {
  if (status === "pass") return "bg-[#ecf4ee] text-[#108548]";
  if (status === "fail") return "bg-[#fcf1ef] text-[#c02f12]";
  return "bg-[#ececef] text-[#626168]";
};

const healthClass = (status?: string) => {
  if (status === "RED") return "border-[#fcb5aa] bg-[#fcf1ef] text-[#a32c12]";
  if (status === "YELLOW") return "border-[#f5d9a8] bg-[#fdf1dd] text-[#995715]";
  if (status === "GREEN") return "border-[#c3e6cd] bg-[#ecf4ee] text-[#306440]";
  return "border-line bg-paper text-ink-3";
};

async function probe(label: string, url: string): Promise<HealthCheck> {
  try {
    const response = await fetch(url, { cache: "no-store" });
    return {
      label,
      status: response.ok ? "pass" : "fail",
      evidence: `${response.status} ${url}`,
    };
  } catch (error) {
    return {
      label,
      status: "fail",
      evidence: `${url} ${error instanceof Error ? error.message : "request failed"}`,
    };
  }
}

function MetricGrid({ title, metrics }: { title: string; metrics: Metric[] }) {
  return (
    <section className="rounded-[8px] border border-line bg-card p-4 shadow-sm">
      <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map(([label, value, kind]) => (
          <div key={label} className="border-t border-line pt-2">
            <div className="text-xs uppercase tracking-[0.08em] text-ink-3">{label}</div>
            <div className="mt-1 text-xl font-semibold text-ink">
              {kind === "money" ? money(value) : kind === "bytes" ? bytes(value) : valueText(value)}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function SimpleTable({ title, rows, columns }: { title: string; rows: Record<string, unknown>[]; columns: [string, string][] }) {
  return (
    <section className="rounded-[8px] border border-line bg-card p-4 shadow-sm">
      <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
      {rows.length ? (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.08em] text-ink-3">
              <tr>
                {columns.map(([key, label]) => (
                  <th key={key} className="border-b border-line py-2 pr-3 font-medium">{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={String(row.job_id || row.receipt_id || index)} className="border-b border-line last:border-0">
                  {columns.map(([key]) => (
                    <td key={key} className="py-2 pr-3 text-ink-2">
                      {key.includes("sha") ? shortHash(row[key]) : valueText(row[key])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-3 text-sm text-ink-3">no data</p>
      )}
    </section>
  );
}

export function OpsCommandCenter() {
  const [checks, setChecks] = useState<HealthCheck[]>([
    { label: "Website", status: "checking", evidence: "/" },
    { label: "Jobs API", status: "checking", evidence: `${WEB_RENDER_BASE}/health` },
    { label: "Worker API", status: "checking", evidence: `${WEB_RENDER_BASE}/worker/status` },
    { label: "Leaderboard API", status: "checking", evidence: "/node/v1/leaderboard/stats" },
    { label: "Benchmark API", status: "checking", evidence: "/node/v1/leaderboard/top" },
  ]);
  const [token, setToken] = useState("");
  const [summary, setSummary] = useState<OpsSummary | null>(null);
  const [privateStatus, setPrivateStatus] = useState("Operator token required for private metrics.");
  const [ackStatus, setAckStatus] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([
      probe("Website", "/"),
      probe("Jobs API", `${WEB_RENDER_BASE}/health`),
      probe("Worker API", `${WEB_RENDER_BASE}/worker/status`),
      probe("Leaderboard API", "/node/v1/leaderboard/stats"),
      probe("Benchmark API", "/node/v1/leaderboard/top"),
    ]).then((next) => {
      if (active) setChecks(next);
    });
    return () => {
      active = false;
    };
  }, []);

  const alertRows = useMemo(() => {
    if (!summary?.alerts) return [];
    if (Array.isArray(summary.alerts)) {
      return summary.alerts
        .map((row) => row as Record<string, unknown>)
        .sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")));
    }
    return Object.entries(summary.alerts)
      .flatMap(([type, rows]) => rows.map((row) => ({ alert: type, ...row }) as Record<string, unknown>))
      .sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")));
  }, [summary]);

  const activeAlertRows = alertRows.filter((row) => row.resolved !== true);

  async function loadSummary() {
    setPrivateStatus("Loading private metrics...");
    setSummary(null);
    try {
      const response = await fetch(`${WEB_RENDER_BASE}/ops/summary`, {
        cache: "no-store",
        headers: token ? { "x-farpy-ops-token": token } : {},
      });
      if (!response.ok) {
        setPrivateStatus(response.status === 403 ? "No data: operator token rejected." : "No data: ops summary endpoint unavailable or token not configured.");
        return;
      }
      const json = (await response.json()) as OpsSummary;
      setSummary(json);
      setAckStatus("");
      setPrivateStatus(`Loaded ${json.generated_at}`);
    } catch (error) {
      setPrivateStatus(`No data: ${error instanceof Error ? error.message : "request failed"}`);
    }
  }

  async function acknowledgeAlerts() {
    const ids = activeAlertRows.map((row) => String(row.id || "")).filter(Boolean);
    if (!ids.length) {
      setAckStatus("No active alerts to acknowledge.");
      return;
    }
    if (!token) {
      setAckStatus("Operator token required to acknowledge alerts.");
      return;
    }
    setAckStatus("Acknowledging alerts...");
    try {
      const response = await fetch(`${WEB_RENDER_BASE}/ops/alerts/ack`, {
        method: "POST",
        cache: "no-store",
        headers: {
          "content-type": "application/json",
          "x-farpy-ops-token": token,
        },
        body: JSON.stringify({ ids }),
      });
      if (!response.ok) {
        setAckStatus(response.status === 403 ? "Operator token rejected." : `Acknowledge failed: ${response.status}`);
        return;
      }
      setAckStatus(`Acknowledged ${ids.length} alert${ids.length === 1 ? "" : "s"}.`);
      await loadSummary();
    } catch (error) {
      setAckStatus(`Acknowledge failed: ${error instanceof Error ? error.message : "request failed"}`);
    }
  }

  return (
    <main className="min-h-screen bg-paper px-4 py-6 text-ink sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1180px]">
        <header className="flex flex-col gap-4 border-b border-line pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-accent">Internal</p>
            <h1 className="mt-1 font-display text-3xl font-semibold text-ink">Farpy Operations Command Center</h1>
            <p className="mt-2 max-w-2xl text-sm text-ink-3">
              Read-only production monitoring. Private metrics require the operator token; unavailable widgets say no data.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              aria-label="Operator token"
              className="h-10 min-w-[260px] rounded-[8px] border border-line bg-card px-3 text-sm text-ink outline-none focus:border-accent"
              onChange={(event) => setToken(event.target.value)}
              placeholder="Operator token"
              type="password"
              value={token}
            />
            <button
              className="h-10 min-w-[110px] whitespace-nowrap rounded-[8px] bg-ink px-4 text-sm font-semibold text-white"
              onClick={loadSummary}
              type="button"
            >
              Refresh
            </button>
          </div>
        </header>

        <section className="mt-5 rounded-[8px] border border-line bg-card p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-lg font-semibold text-ink">System</h2>
            <p className="text-sm text-ink-3">{privateStatus}</p>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {checks.map((check) => (
              <div key={check.label} className="rounded-[8px] border border-line bg-paper p-3">
                <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${statusClass(check.status)}`}>
                  {check.status.toUpperCase()}
                </span>
                <div className="mt-2 font-semibold text-ink">{check.label}</div>
                <div className="mt-1 break-words text-xs text-ink-3">{check.evidence}</div>
              </div>
            ))}
          </div>
        </section>

        <section className={`mt-5 rounded-[8px] border p-4 shadow-sm ${healthClass(summary?.health_status)}`}>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.12em]">Production health</div>
              <div className="mt-1 font-display text-2xl font-semibold">{summary?.health_status || "No private data"}</div>
              <p className="mt-1 text-sm">
                {summary
                  ? `${summary.alert_counts?.critical || 0} critical, ${summary.alert_counts?.warn || 0} warning, ${summary.alert_counts?.active || 0} active alerts`
                  : "Load private metrics with the operator token to see alert state."}
              </p>
              {ackStatus ? <p className="mt-1 text-sm">{ackStatus}</p> : null}
            </div>
            <button
              className="h-10 rounded-[8px] bg-ink px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45"
              disabled={!activeAlertRows.length}
              onClick={acknowledgeAlerts}
              type="button"
            >
              Acknowledge active alerts
            </button>
          </div>
        </section>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <MetricGrid
            title="Render"
            metrics={[
              ["Jobs queued", summary?.render?.jobs_queued],
              ["Jobs rendering", summary?.render?.jobs_rendering],
              ["Completed today", summary?.render?.jobs_completed_today],
              ["Failed today", summary?.render?.failed_today],
              ["Avg render seconds", summary?.render?.average_render_time_seconds],
              ["Avg queue wait seconds", summary?.render?.average_queue_wait_seconds],
            ]}
          />
          <MetricGrid
            title="Nodes"
            metrics={[
              ["Blender workers online", summary?.nodes?.blender_workers_online],
              ["Octane workers online", summary?.nodes?.octane_workers_online],
              ["Last heartbeat", summary?.nodes?.last_heartbeat],
              ["Worker version", summary?.nodes?.worker_version],
              ["GPU count", summary?.nodes?.gpu_count],
              ["Active jobs", summary?.nodes?.active_jobs],
            ]}
          />
          <MetricGrid
            title="Financial"
            metrics={[
              ["Wallet debits today", summary?.financial?.wallet_debits_today_cents, "money"],
              ["Wallet credits today", summary?.financial?.wallet_credits_today_cents, "money"],
              ["Revenue today", summary?.financial?.revenue_today_cents, "money"],
              ["Receipts minted", summary?.financial?.receipts_minted_today],
            ]}
          />
          <MetricGrid
            title="Storage"
            metrics={[
              ["Upload storage", summary?.storage?.upload_storage_bytes, "bytes"],
              ["Output storage", summary?.storage?.output_storage_bytes, "bytes"],
              ["Free disk", summary?.storage?.free_disk_bytes, "bytes"],
              ["Recent ZIP count", summary?.storage?.recent_zip_count],
            ]}
          />
        </div>

        <div className="mt-5 grid gap-4">
          <SimpleTable
            title="Alerts"
            rows={alertRows}
            columns={[
              ["severity", "Severity"],
              ["category", "Category"],
              ["message", "Message"],
              ["source", "Source"],
              ["created_at", "Created"],
              ["resolved", "Resolved"],
              ["id", "ID"],
            ]}
          />
          <SimpleTable
            title="Last 20 Jobs"
            rows={summary?.recent?.jobs || []}
            columns={[
              ["job_id", "Job"],
              ["filename", "File"],
              ["renderer", "Renderer"],
              ["status", "Status"],
              ["payment_status", "Payment"],
              ["frame_count", "Frames"],
              ["worker_id", "Worker"],
              ["updated_at", "Updated"],
            ]}
          />
          <SimpleTable
            title="Last 20 Receipts"
            rows={summary?.recent?.receipts || []}
            columns={[
              ["receipt_id", "Receipt"],
              ["job_id", "Job"],
              ["filename", "File"],
              ["renderer", "Renderer"],
              ["frame_count", "Frames"],
              ["cost_cents", "Cost cents"],
              ["output_sha256", "Output SHA"],
              ["receipt_created_at", "Created"],
            ]}
          />
          <SimpleTable
            title="Last 20 Failures"
            rows={summary?.recent?.failures || []}
            columns={[
              ["job_id", "Job"],
              ["filename", "File"],
              ["renderer", "Renderer"],
              ["frame_count", "Frames"],
              ["worker_id", "Worker"],
              ["failure_reason", "Reason"],
              ["failed_at", "Failed"],
            ]}
          />
        </div>
      </div>
    </main>
  );
}
