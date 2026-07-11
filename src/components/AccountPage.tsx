"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import SiteNav from "@/components/SiteNav";
import Workspace from "@/components/Workspace";
import TopUpPage from "@/components/TopUpPage";

type Transaction = {
  event_id: string;
  type: "credit" | "debit" | "refund" | "adjustment";
  amount_cents: number;
  balance_after_cents: number;
  job_id?: string | null;
  created_at: string;
};

type WalletResponse = {
  ok?: boolean;
  email?: string | null;
  balance_cents?: number;
  transactions?: Transaction[];
  error?: string;
};

type AccountRender = {
  job_id: string;
  upload_id?: string | null;
  filename?: string | null;
  status?: string;
  status_label?: string | null;
  frame_count?: number | null;
  rendered_file_count?: number | null;
  renderer?: string | null;
  price_cents?: number | null;
  payment_status?: string | null;
  payment_mode?: string | null;
  created_at?: string;
  completed_at?: string;
  output_size_bytes?: number | null;
  download_url?: string | null;
  receipt_url?: string | null;
};

const COMPLETE_STATUSES = new Set(["complete"]);
const ACTIVE_STATUSES = new Set(["queued", "submitted", "running"]);
const CANCELLABLE_STATUSES = new Set(["queued", "submitted"]);
const DEFAULT_RENDER_COUNT = 5;
const DEFAULT_TRANSACTION_COUNT = 10;
const SUPPORT_EMAIL = "support@farpy.com";

const formatCents = (value?: number | null) => {
  if (!Number.isInteger(value)) return "-";
  return `$${((value || 0) / 100).toFixed(2)}`;
};

const formatDate = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

const formatBytes = (value?: number | null) => {
  if (!Number.isFinite(value)) return "-";
  const units = ["B", "KB", "MB", "GB"];
  let size = Math.max(0, Number(value || 0));
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }
  return `${size.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`;
};

const renderStatusLabel = (render: AccountRender) =>
  render.status_label || render.status || "unknown";

const receiptPageFromUrls = (receiptUrl?: string | null, downloadUrl?: string | null) => {
  if (!receiptUrl) return "";
  try {
    const parsed = new URL(receiptUrl, window.location.origin);
    const match = parsed.pathname.match(/\/jobs\/([^/]+)\/receipt$/);
    const jobId = match?.[1] ? decodeURIComponent(match[1]) : "";
    const receiptToken = parsed.searchParams.get("token") || "";
    if (!jobId || !receiptToken) return receiptUrl;
    const params = new URLSearchParams({ job_id: jobId, receipt_token: receiptToken });
    if (downloadUrl) {
      const download = new URL(downloadUrl, window.location.origin);
      const downloadToken = download.searchParams.get("token");
      if (downloadToken) params.set("download_token", downloadToken);
    }
    return `/receipt?${params.toString()}`;
  } catch {
    return receiptUrl;
  }
};

type TrackerTarget = {
  jobId: string;
  downloadToken: string;
  receiptToken: string;
};

const trackerTargetFromRender = (render: AccountRender): TrackerTarget => {
  let downloadToken = "";
  let receiptToken = "";
  try {
    if (render.download_url) {
      const download = new URL(render.download_url, window.location.origin);
      downloadToken = download.searchParams.get("token") || "";
    }
    if (render.receipt_url) {
      const receipt = new URL(render.receipt_url, window.location.origin);
      receiptToken = receipt.searchParams.get("token") || "";
    }
  } catch {
    // Legacy URLs still get a useful tracker by job id.
  }
  return { jobId: render.job_id, downloadToken, receiptToken };
};

const supportUrl = (subject: string, body: string) => {
  const params = new URLSearchParams({ subject, body });
  return `mailto:${SUPPORT_EMAIL}?${params.toString()}`;
};

const packageSupportBody = (render: AccountRender, action: string) =>
  [
    `Action: ${action}`,
    `Package ID: ${render.job_id}`,
    render.upload_id ? `Upload ID: ${render.upload_id}` : "",
    render.filename ? `File: ${render.filename}` : "",
    `Status: ${render.status || "unknown"}`,
    "",
    "Describe what you need:",
  ].filter(Boolean).join("\n");

// Dev-only preview data: open /account?demo=1 (or /account#demo) while running
// `npm run dev` to see the signed-in page with populated history. Never active
// in production. Matched loosely because some openers percent-encode the "=".
const isDemoMode = () =>
  process.env.NODE_ENV === "development" &&
  typeof window !== "undefined" &&
  (/demo/.test(window.location.search) || /demo/.test(window.location.hash));

const DEMO_TRANSACTIONS: Transaction[] = [
  { event_id: "evt_009", type: "debit", amount_cents: 290, balance_after_cents: 2890, job_id: "pkg_d4f81a", created_at: "2026-07-05T14:22:00Z" },
  { event_id: "evt_008", type: "refund", amount_cents: 640, balance_after_cents: 3180, job_id: "pkg_c3e970", created_at: "2026-07-04T09:15:00Z" },
  { event_id: "evt_007", type: "debit", amount_cents: 640, balance_after_cents: 2540, job_id: "pkg_c3e970", created_at: "2026-07-03T21:48:00Z" },
  { event_id: "evt_006", type: "credit", amount_cents: 2500, balance_after_cents: 3180, job_id: null, created_at: "2026-07-02T11:05:00Z" },
  { event_id: "evt_005", type: "refund", amount_cents: 510, balance_after_cents: 680, job_id: "pkg_b2c655", created_at: "2026-07-01T16:30:00Z" },
  { event_id: "evt_004", type: "debit", amount_cents: 510, balance_after_cents: 170, job_id: "pkg_b2c655", created_at: "2026-06-30T19:02:00Z" },
  { event_id: "evt_003", type: "debit", amount_cents: 320, balance_after_cents: 680, job_id: "pkg_a1904e", created_at: "2026-06-29T08:44:00Z" },
  { event_id: "evt_002", type: "credit", amount_cents: 1000, balance_after_cents: 1000, job_id: null, created_at: "2026-06-28T10:00:00Z" },
];

const DEMO_WALLET: WalletResponse = {
  ok: true,
  email: "demo@farpy.com",
  balance_cents: 2890,
  transactions: DEMO_TRANSACTIONS,
};

const DEMO_RENDERS: AccountRender[] = [
  {
    job_id: "pkg_d4f81a",
    upload_id: "upl_5510aa",
    filename: "studio-loft.blend",
    status: "complete",
    status_label: "Delivered",
    frame_count: 120,
    rendered_file_count: 120,
    renderer: "cycles",
    price_cents: 290,
    payment_status: "captured",
    payment_mode: "wallet",
    created_at: "2026-07-05T13:58:00Z",
    completed_at: "2026-07-05T14:21:00Z",
    output_size_bytes: 482344960,
    download_url: "/node/v1/web-render/jobs/pkg_d4f81a/download?token=demo-download",
    receipt_url: "/node/v1/web-render/jobs/pkg_d4f81a/receipt?token=demo-receipt",
  },
  {
    job_id: "pkg_e5a02b",
    upload_id: "upl_6621bb",
    filename: "hero-shot.blend",
    status: "running",
    status_label: "Rendering",
    frame_count: 300,
    rendered_file_count: 184,
    renderer: "cycles",
    price_cents: 720,
    payment_status: "captured",
    payment_mode: "wallet",
    created_at: "2026-07-05T22:10:00Z",
  },
  {
    job_id: "pkg_c3e970",
    upload_id: "upl_4409cc",
    filename: "smoke-sim.blend",
    status: "failed",
    status_label: "Failed - refunded",
    frame_count: 250,
    renderer: "cycles",
    price_cents: 640,
    payment_status: "captured",
    payment_mode: "wallet",
    created_at: "2026-07-03T21:40:00Z",
  },
  {
    job_id: "pkg_b2c655",
    upload_id: "upl_3308dd",
    filename: "product-turntable.blend",
    status: "complete",
    status_label: "Delivered",
    frame_count: 90,
    rendered_file_count: 90,
    renderer: "eevee",
    price_cents: 510,
    payment_status: "captured",
    payment_mode: "wallet",
    created_at: "2026-06-30T18:40:00Z",
    completed_at: "2026-06-30T19:01:00Z",
    output_size_bytes: 268435456,
    download_url: "/node/v1/web-render/jobs/pkg_b2c655/download?token=demo-download",
    receipt_url: "/node/v1/web-render/jobs/pkg_b2c655/receipt?token=demo-receipt",
  },
  {
    job_id: "pkg_a1904e",
    upload_id: "upl_2207ee",
    filename: "kitchen-still.blend",
    status: "complete",
    status_label: "Delivered",
    frame_count: 1,
    rendered_file_count: 1,
    renderer: "cycles",
    price_cents: 320,
    payment_status: "captured",
    payment_mode: "wallet",
    created_at: "2026-06-29T08:30:00Z",
    completed_at: "2026-06-29T08:43:00Z",
    output_size_bytes: 18874368,
    download_url: "/node/v1/web-render/jobs/pkg_a1904e/download?token=demo-download",
    receipt_url: "/node/v1/web-render/jobs/pkg_a1904e/receipt?token=demo-receipt",
  },
];

type AccountTab = "packages" | "wallet" | "settings";

const ACCOUNT_TABS: { id: AccountTab; label: string }[] = [
  { id: "packages", label: "Packages" },
  { id: "wallet", label: "Wallet" },
  { id: "settings", label: "Settings" },
];

const downloadJson = (filename: string, data: unknown) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export default function AccountPage() {
  const [wallet, setWallet] = useState<WalletResponse | null>(null);
  const [renders, setRenders] = useState<AccountRender[]>([]);
  const [showAllRenders, setShowAllRenders] = useState(false);
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [tracker, setTracker] = useState<TrackerTarget | null>(null);
  const [tab, setTab] = useState<AccountTab>("packages");
  const [historyState, setHistoryState] = useState<"loading" | "ready" | "unavailable">("loading");

  useEffect(() => {
    // Allow /account?job_id=...&download_token=...&receipt_token=... links to
    // open the package tracker directly, and /account#topup to open the wallet.
    const params = new URLSearchParams(window.location.search);
    const jobId = params.get("job_id")?.trim();
    if (jobId) {
      setTracker({
        jobId,
        downloadToken: params.get("download_token")?.trim() || "",
        receiptToken: params.get("receipt_token")?.trim() || "",
      });
    }
    if (/topup|wallet/.test(window.location.hash)) setTab("wallet");
  }, []);

  useEffect(() => {
    let alive = true;
    if (isDemoMode()) {
      setWallet(DEMO_WALLET);
      setRenders(DEMO_RENDERS);
      setHistoryState("ready");
      return () => {
        alive = false;
      };
    }
    fetch("/v1/wallet/transactions", { credentials: "include", cache: "no-store" })
      .then(async (res) => ({ res, json: (await res.json().catch(() => ({}))) as WalletResponse }))
      .then(({ res, json }) => {
        if (!alive) return;
        setWallet(res.ok ? json : { error: json.error || `status_${res.status}` });
      })
      .catch(() => alive && setWallet({ error: "wallet_unavailable" }));
    fetch("/v1/account/renders", { credentials: "include", cache: "no-store" })
      .then(async (res) => (res.ok ? await res.json() : null))
      .then((json) => {
        if (!alive) return;
        if (Array.isArray(json?.renders)) {
          setRenders(json.renders);
          setHistoryState("ready");
        } else {
          setHistoryState("unavailable");
        }
      })
      .catch(() => alive && setHistoryState("unavailable"));
    return () => {
      alive = false;
    };
  }, []);

  const signedIn = wallet?.ok || Number.isInteger(wallet?.balance_cents);
  const transactions = wallet?.transactions || [];
  const sortedRenders = [...renders].sort((a, b) => {
    const priority = (render: AccountRender) => ACTIVE_STATUSES.has(render.status || "") ? 0 : COMPLETE_STATUSES.has(render.status || "") ? 1 : 2;
    const priorityDelta = priority(a) - priority(b);
    if (priorityDelta) return priorityDelta;
    return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
  });
  const visibleRenders = showAllRenders ? sortedRenders : sortedRenders.slice(0, DEFAULT_RENDER_COUNT);
  const visibleTransactions = showAllTransactions ? transactions : transactions.slice(0, DEFAULT_TRANSACTION_COUNT);
  const refundTransactions = transactions.filter((txn) => txn.type === "refund");
  const activeRenderCount = renders.filter((render) => ACTIVE_STATUSES.has(render.status || "")).length;
  const completedRenderCount = renders.filter((render) => COMPLETE_STATUSES.has(render.status || "")).length;
  const totalDebitedCents = transactions.filter((txn) => txn.type === "debit").reduce((sum, txn) => sum + txn.amount_cents, 0);
  const balanceCents = Number.isInteger(wallet?.balance_cents) ? Number(wallet?.balance_cents) : null;
  const hiddenRenderCount = Math.max(0, sortedRenders.length - visibleRenders.length);
  const hiddenTransactionCount = Math.max(0, transactions.length - visibleTransactions.length);

  const exportAccountData = () => {
    downloadJson("farpy-account-data.json", {
      exported_at: new Date().toISOString(),
      email: wallet?.email || null,
      balance_cents: Number.isInteger(wallet?.balance_cents) ? wallet?.balance_cents : null,
      renders,
      wallet_transactions: transactions,
    });
  };

  const signOut = async () => {
    await fetch("/v1/auth/logout", { method: "POST", credentials: "include" }).catch(() => null);
    window.location.href = "/signin";
  };

  return (
    <div className="ws acct account-compact">
      <SiteNav />

      <main className="wrap render-flow-page">
        <section className="render-flow-head">
          <div className="account-head-row">
            <h1>Account</h1>
            {signedIn ? (
              <button className="pj-btn" type="button" onClick={signOut}>
                Sign out
              </button>
            ) : null}
          </div>
          <p>Balance, top-ups, package tracking, and delivery receipts.</p>
          {signedIn && wallet?.email ? <p className="fy-auth__sub">{wallet.email}</p> : null}
        </section>

        <div className="account-tabs" role="tablist" aria-label="Account sections">
          {ACCOUNT_TABS.map((entry) => (
            <button
              key={entry.id}
              className={`account-tab${tab === entry.id ? " is-active" : ""}`}
              type="button"
              role="tab"
              aria-selected={tab === entry.id}
              onClick={() => setTab(entry.id)}
            >
              {entry.label}
            </button>
          ))}
        </div>

        {tab === "wallet" ? <TopUpPage embedded /> : null}

        {tab === "packages" ? (
        <section className="render-job-card">
          <h2 className="acct-card-title">Package management</h2>
          <p className="fy-auth__sub">Active packages, completed downloads, and delivery receipts.</p>

          {signedIn ? (
            <section className="account-package-overview" aria-label="Account summary">
              <div className="account-balance-summary">
                <span>Available balance</span>
                <strong>{balanceCents == null ? "Unavailable" : formatCents(balanceCents)}</strong>
                {balanceCents != null && balanceCents <= 0 ? (
                  <button className="pj-btn pj-btn--blue" type="button" onClick={() => setTab("wallet")}>Add funds</button>
                ) : null}
              </div>
              <dl className="account-fact-summary">
                <div><dt>Total jobs</dt><dd>{renders.length}</dd></div>
                <div><dt>Active</dt><dd>{activeRenderCount}</dd></div>
                <div><dt>Completed</dt><dd>{completedRenderCount}</dd></div>
                <div><dt>Total debited</dt><dd>{formatCents(totalDebitedCents)}</dd></div>
              </dl>
            </section>
          ) : null}

          {signedIn && activeRenderCount === 0 && historyState === "ready" ? (
            <div className="account-inline-state" role="status">
              <strong>No active jobs</strong>
              <span>Completed and previous jobs remain available below.</span>
            </div>
          ) : null}

          {tracker ? (
            <div className="account-tracker">
              <div className="account-tracker-head">
                <span className="render-label">Package tracker</span>
                <button className="acct-receipt-link" type="button" onClick={() => setTracker(null)}>
                  Close tracker
                </button>
              </div>
              <Suspense fallback={<div />}>
                <Workspace
                  embedded
                  jobId={tracker.jobId}
                  downloadToken={tracker.downloadToken}
                  receiptToken={tracker.receiptToken}
                />
              </Suspense>
            </div>
          ) : null}

          {signedIn && historyState === "loading" ? (
            <div className="account-history-state" role="status" aria-live="polite">
              <strong>Loading render history</strong>
              <span>Checking your account jobs.</span>
            </div>
          ) : signedIn && historyState === "unavailable" ? (
            <div className="account-history-state account-history-state-error" role="alert">
              <strong>Render history unavailable</strong>
              <span>Your balance and account remain available. Try this page again later.</span>
            </div>
          ) : signedIn && renders.length ? (
            <ul className="acct-render-list">
              {visibleRenders.map((render) => (
                <li className={`acct-render-row acct-render-row--${render.status || "unknown"}`} key={render.job_id}>
                  <div className="acct-render-main">
                    <div>
                      <b>{render.filename || render.job_id}</b>
                      <span className="acct-render-id">{render.job_id}</span>
                    </div>
                    <span className="acct-render-status">{renderStatusLabel(render)}</span>
                  </div>

                  <dl className="acct-render-meta">
                    <div>
                      <dt>Frames</dt>
                      <dd>{render.rendered_file_count || render.frame_count || "-"}</dd>
                    </div>
                    <div>
                      <dt>Cost</dt>
                      <dd>{formatCents(render.price_cents)}</dd>
                    </div>
                    <div>
                      <dt>Submitted</dt>
                      <dd>{formatDate(render.created_at)}</dd>
                    </div>
                    <div>
                      <dt>Completed</dt>
                      <dd>{formatDate(render.completed_at)}</dd>
                    </div>
                    <div>
                      <dt>Renderer</dt>
                      <dd>{render.renderer || "-"}</dd>
                    </div>
                    <div>
                      <dt>Output</dt>
                      <dd>{formatBytes(render.output_size_bytes)}</dd>
                    </div>
                    <div>
                      <dt>Payment</dt>
                      <dd>{render.payment_status || "-"}</dd>
                    </div>
                    <div>
                      <dt>Download</dt>
                      <dd>{render.download_url ? "Ready" : COMPLETE_STATUSES.has(render.status || "") ? "Unavailable" : "Not ready"}</dd>
                    </div>
                    <div>
                      <dt>Receipt</dt>
                      <dd>{render.receipt_url ? "Ready" : COMPLETE_STATUSES.has(render.status || "") ? "Unavailable" : "Not ready"}</dd>
                    </div>
                  </dl>

                  <div className="acct-render-actions">
                    {COMPLETE_STATUSES.has(render.status || "") && render.download_url ? (
                      <a className="pj-btn pj-btn--blue acct-row-primary" href={render.download_url}>Download ZIP</a>
                    ) : null}
                    <button
                      className={ACTIVE_STATUSES.has(render.status || "") ? "pj-btn pj-btn--blue acct-row-primary" : "acct-receipt-link"}
                      type="button"
                      onClick={() => {
                        setTracker(trackerTargetFromRender(render));
                        window.setTimeout(() => {
                          document.querySelector(".account-tracker")?.scrollIntoView({ behavior: "smooth", block: "start" });
                        }, 50);
                      }}
                    >
                      {ACTIVE_STATUSES.has(render.status || "") ? "Track active job" : "View details"}
                    </button>
                    {CANCELLABLE_STATUSES.has(render.status || "") ? (
                      <a
                        className="acct-receipt-link"
                        href={supportUrl("Cancel queued Farpy package", packageSupportBody(render, "Cancel queued package"))}
                      >
                        Cancel queued package
                      </a>
                    ) : null}
                    {render.status === "failed" ? (
                      <a className="acct-receipt-link" href="/#start">Retry failed package</a>
                    ) : null}
                    {render.upload_id ? (
                      <a
                        className="acct-receipt-link"
                        href={supportUrl("Delete uploaded Farpy source", packageSupportBody(render, "Delete uploaded source"))}
                      >
                        Delete uploaded source
                      </a>
                    ) : null}
                    {COMPLETE_STATUSES.has(render.status || "") && render.receipt_url ? (
                      <a className="acct-receipt-link" href={receiptPageFromUrls(render.receipt_url, render.download_url)}>View delivery receipt</a>
                    ) : null}
                    {COMPLETE_STATUSES.has(render.status || "") ? (
                      <a
                        className="acct-receipt-link"
                        href={supportUrl("Delete completed Farpy package", packageSupportBody(render, "Delete completed package"))}
                      >
                        Delete completed package
                      </a>
                    ) : null}
                    <a
                      className="acct-receipt-link"
                      href={supportUrl("Farpy package issue", packageSupportBody(render, "Report package issue"))}
                    >
                      Report package issue
                    </a>
                  </div>
                </li>
              ))}
              {hiddenRenderCount > 0 ? (
                <li className="acct-show-more-row">
                  <button className="acct-show-more" type="button" onClick={() => setShowAllRenders(true)}>
                    Show more renders ({hiddenRenderCount})
                  </button>
                </li>
              ) : null}
            </ul>
          ) : (
            <div className="account-history-state">
              <strong>{signedIn ? "No renders yet" : "Sign in to view history"}</strong>
              <span>{signedIn ? "Your first submitted package will appear here." : "Balance, jobs, downloads, and receipts are private to your account."}</span>
              {signedIn ? <Link className="pj-btn pj-btn--blue" href="/#dropzone" prefetch={false}>Send a package</Link> : null}
            </div>
          )}
        </section>
        ) : null}

        {tab === "wallet" ? (
        <section className="render-job-card">
          <h2 className="acct-card-title">Wallet history</h2>
          {signedIn && transactions.length ? (
            <ul className="acct-receipts">
              {visibleTransactions.map((txn) => (
                <li className="acct-receipt" key={txn.event_id}>
                  <span className="acct-receipt-main">
                    <b>{txn.type}{txn.job_id ? ` - ${txn.job_id}` : ""}</b>
                    <span>{formatDate(txn.created_at)}</span>
                  </span>
                  <span className="acct-receipt-amount">{txn.type === "debit" ? "-" : "+"}{formatCents(txn.amount_cents)}</span>
                  <span className="acct-receipt-link is-muted">Balance {formatCents(txn.balance_after_cents)}</span>
                </li>
              ))}
              {hiddenTransactionCount > 0 ? (
                <li className="acct-show-more-row">
                  <button className="acct-show-more" type="button" onClick={() => setShowAllTransactions(true)}>
                    Show more wallet history ({hiddenTransactionCount})
                  </button>
                </li>
              ) : null}
            </ul>
          ) : (
            <p className="fy-auth__sub">{signedIn ? "No wallet transactions yet." : "No account data shown until sign-in."}</p>
          )}
        </section>
        ) : null}

        {tab === "wallet" ? (
        <section className="render-job-card account-self-service-card">
          <div className="account-self-service-head">
            <h2 className="acct-card-title">Refund history</h2>
            <a className="acct-receipt-link" href={supportUrl("Farpy billing issue", "Describe the billing issue. Include package ID, receipt ID, or payment reference if available.")}>
              Billing issue
            </a>
          </div>
          {signedIn && refundTransactions.length ? (
            <ul className="acct-receipts">
              {refundTransactions.map((txn) => (
                <li className="acct-receipt" key={txn.event_id}>
                  <span className="acct-receipt-main">
                    <b>Refund{txn.job_id ? ` - ${txn.job_id}` : ""}</b>
                    <span>{formatDate(txn.created_at)}</span>
                  </span>
                  <span className="acct-receipt-amount">+{formatCents(txn.amount_cents)}</span>
                  <span className="acct-receipt-link is-muted">Balance {formatCents(txn.balance_after_cents)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="fy-auth__sub">{signedIn ? "No refunds yet." : "Refund history shown after sign-in."}</p>
          )}
        </section>
        ) : null}

        {tab === "settings" ? (
        <>
        <section className="render-job-card account-self-service-card">
          <h2 className="acct-card-title">Privacy</h2>
          <p className="fy-auth__sub">Export the account data shown on this page, or request account deletion through support.</p>
          <div className="account-self-service-actions">
            <button className="pj-btn" type="button" disabled={!signedIn} onClick={exportAccountData}>
              Export my data
            </button>
            <a
              className="pj-btn"
              href={supportUrl("Delete my Farpy account", "Please delete my Farpy account. I understand this may affect package history, delivery receipt access, and wallet records that Farpy must retain for operational or legal reasons.")}
            >
              Delete my account
            </a>
          </div>
        </section>

        <section className="render-job-card account-self-service-card">
          <h2 className="acct-card-title">Support</h2>
          <p className="fy-auth__sub">
            Email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> if you have a package issue to report, a billing issue, or a rendering issue.
            Include your package ID, receipt ID, and account email so we can help faster. We reply within 1 business day.
          </p>
        </section>
        </>
        ) : null}
      </main>
    </div>
  );
}
