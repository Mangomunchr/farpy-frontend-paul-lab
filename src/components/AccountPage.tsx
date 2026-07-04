"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import SiteNav from "@/components/SiteNav";

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

const workspaceUrlFromRender = (render: AccountRender) => {
  const params = new URLSearchParams({ job_id: render.job_id });
  try {
    if (render.download_url) {
      const download = new URL(render.download_url, window.location.origin);
      const token = download.searchParams.get("token");
      if (token) params.set("download_token", token);
    }
    if (render.receipt_url) {
      const receipt = new URL(render.receipt_url, window.location.origin);
      const token = receipt.searchParams.get("token");
      if (token) params.set("receipt_token", token);
    }
  } catch {
    // Legacy URLs still get a useful workspace link by job id.
  }
  return `/workspace?${params.toString()}`;
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
  const [loading, setLoading] = useState(true);
  const [showAllRenders, setShowAllRenders] = useState(false);
  const [showAllTransactions, setShowAllTransactions] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch("/v1/wallet/transactions", { credentials: "include", cache: "no-store" })
      .then(async (res) => ({ res, json: (await res.json().catch(() => ({}))) as WalletResponse }))
      .then(({ res, json }) => {
        if (!alive) return;
        setWallet(res.ok ? json : { error: json.error || `status_${res.status}` });
      })
      .catch(() => alive && setWallet({ error: "wallet_unavailable" }))
      .finally(() => alive && setLoading(false));
    fetch("/v1/account/renders", { credentials: "include", cache: "no-store" })
      .then(async (res) => (res.ok ? await res.json() : null))
      .then((json) => {
        if (alive && Array.isArray(json?.renders)) setRenders(json.renders);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const signedIn = wallet?.ok || Number.isInteger(wallet?.balance_cents);
  const transactions = wallet?.transactions || [];
  const visibleRenders = showAllRenders ? renders : renders.slice(0, DEFAULT_RENDER_COUNT);
  const visibleTransactions = showAllTransactions ? transactions : transactions.slice(0, DEFAULT_TRANSACTION_COUNT);
  const refundTransactions = transactions.filter((txn) => txn.type === "refund");
  const hiddenRenderCount = Math.max(0, renders.length - visibleRenders.length);
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
          <h1>Account</h1>
          <p>Balance, package history, and delivery receipts.</p>
          {signedIn && wallet?.email ? <p className="fy-auth__sub">{wallet.email}</p> : null}
          {signedIn ? (
            <button className="pj-btn" type="button" onClick={signOut}>
              Sign out
            </button>
          ) : null}
        </section>

        <section className="render-job-card account-balance-card account-overview-card">
          <div>
            <h2 className="acct-card-title">Overview</h2>
            <span className="render-label">Balance</span>
            <strong className="render-price">{loading ? "..." : signedIn ? formatCents(wallet?.balance_cents) : "-"}</strong>
          </div>
          <div className="account-overview-actions">
            {signedIn ? (
              <Link className="pj-btn pj-btn--blue" href="/topup" prefetch={false}>Top up</Link>
            ) : (
              <Link className="pj-btn pj-btn--blue" href="/signin?next=/account" prefetch={false}>Sign in</Link>
            )}
          </div>
        </section>

        <section className="render-job-card">
          <h2 className="acct-card-title">Package management</h2>
          <p className="fy-auth__sub">Manage recent packages, downloads, delivery receipts, and support requests.</p>
          {signedIn && renders.length ? (
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
                      <dt>Created</dt>
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
                  </dl>

                  <div className="acct-render-actions">
                    <a className="acct-receipt-link" href={workspaceUrlFromRender(render)}>View workspace</a>
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
                    {COMPLETE_STATUSES.has(render.status || "") && render.download_url ? (
                      <a className="acct-receipt-link" href={render.download_url}>Download ZIP</a>
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
            <p className="fy-auth__sub">{signedIn ? "No packages yet." : "No package history shown until sign-in."}</p>
          )}
        </section>

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
          <div className="account-self-service-actions">
            <a className="pj-btn" href={supportUrl("Farpy package issue", "Describe the package issue. Include package ID and screenshot if available.")}>Report package issue</a>
            <a className="pj-btn" href={supportUrl("Farpy billing issue", "Describe the billing issue. Include receipt ID or payment reference if available.")}>Billing issue</a>
            <a className="pj-btn" href={supportUrl("Farpy rendering issue", "Describe the rendering issue. Include package ID, renderer, frame count, and any error shown.")}>Rendering issue</a>
          </div>
        </section>
      </main>
    </div>
  );
}
