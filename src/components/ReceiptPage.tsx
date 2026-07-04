"use client";

import { type KeyboardEvent, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { WEB_RENDER_API_BASE } from "@/lib/webRenderApi";
import { formatRendererName } from "@/lib/worldLanguage";

type Receipt = {
  receipt_id?: string;
  job_id?: string;
  upload_id?: string;
  output_id?: string;
  filename?: string;
  output_filename?: string;
  renderer?: string;
  frame_start?: number;
  frame_end?: number;
  frame_count?: number;
  rendered_file_count?: number;
  render_seconds?: number;
  cost_cents?: number;
  payment_status?: string;
  payment_mode?: string;
  payment_intent_id?: string;
  wallet_debit_cents?: number | null;
  balance_after_cents?: number | null;
  output_sha256?: string;
  output_size_bytes?: number;
  created_at?: string;
  receipt_created_at?: string;
};

const formatCents = (value?: number | null) => {
  if (!Number.isInteger(value)) return "-";
  return `$${((value || 0) / 100).toFixed(2)}`;
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date);
};

const formatSeconds = (value?: number) => {
  if (!Number.isFinite(value)) return "-";
  return `${Number(value).toFixed(Number(value) >= 10 ? 1 : 2)}s`;
};

const hasSeconds = (value?: number) => Number.isFinite(value);

const formatBytes = (value?: number) => {
  if (!Number.isFinite(value)) return "-";
  const units = ["B", "KB", "MB", "GB"];
  let size = Math.max(0, value || 0);
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }
  return `${size.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`;
};

const formatPaymentMethod = (receipt: Receipt) => {
  if (receipt.payment_mode === "wallet") return "Wallet";
  if (receipt.payment_mode === "direct_checkout") return "Stripe Checkout";
  return receipt.payment_mode || receipt.payment_status || "-";
};

function ReceiptRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="receipt-page-row">
      <dt>{label}</dt>
      <dd>{value === undefined || value === null || value === "" ? "-" : value}</dd>
    </div>
  );
}

export default function ReceiptPage() {
  const params = useSearchParams();
  const jobId = params.get("job_id")?.trim() || "";
  const receiptToken = params.get("receipt_token")?.trim() || params.get("token")?.trim() || "";
  const downloadToken = params.get("download_token")?.trim() || "";
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [rawJson, setRawJson] = useState("");
  const [loading, setLoading] = useState(Boolean(jobId && receiptToken));
  const [error, setError] = useState("");
  const [showRaw, setShowRaw] = useState(false);
  const [copiedSha, setCopiedSha] = useState(false);

  const rawReceiptUrl = useMemo(() => {
    if (!jobId || !receiptToken) return "";
    return `${WEB_RENDER_API_BASE}/jobs/${encodeURIComponent(jobId)}/receipt?token=${encodeURIComponent(receiptToken)}`;
  }, [jobId, receiptToken]);

  const downloadUrl = useMemo(() => {
    if (!jobId || !downloadToken) return "";
    return `${WEB_RENDER_API_BASE}/jobs/${encodeURIComponent(jobId)}/download?token=${encodeURIComponent(downloadToken)}`;
  }, [downloadToken, jobId]);

  useEffect(() => {
    if (!jobId || !receiptToken) {
      setLoading(false);
      setError("Receipt link is missing a job id or token.");
      return;
    }

    let alive = true;
    const controller = new AbortController();

    setLoading(true);
    fetch(rawReceiptUrl, {
      cache: "no-store",
      credentials: "include",
      signal: controller.signal,
    })
      .then(async (res) => {
        const text = await res.text();
        if (!res.ok) throw new Error(`receipt_${res.status}`);
        return text;
      })
      .then((text) => {
        if (!alive) return;
        const json = JSON.parse(text) as Receipt;
        setReceipt(json);
        setRawJson(JSON.stringify(json, null, 2));
        setError("");
      })
      .catch((err: Error) => {
        if (!alive || err.name === "AbortError") return;
        setReceipt(null);
        setRawJson("");
        setError("Receipt unavailable. Check the private receipt link.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
      controller.abort();
    };
  }, [jobId, receiptToken, rawReceiptUrl]);

  const framesRendered =
    Number.isInteger(receipt?.rendered_file_count) && Number(receipt?.rendered_file_count) > 0
      ? receipt?.rendered_file_count
      : receipt?.frame_count;
  const cost = receipt?.wallet_debit_cents ?? receipt?.cost_cents;
  const outputMeta = [
    receipt?.output_size_bytes ? `${formatBytes(receipt.output_size_bytes)}` : null,
    Number.isInteger(receipt?.rendered_file_count) ? `${receipt?.rendered_file_count} rendered file${receipt?.rendered_file_count === 1 ? "" : "s"}` : null,
  ].filter(Boolean).join(" • ");
  const completedAt = formatDate(receipt?.receipt_created_at || receipt?.created_at);
  const workspaceUrl = jobId ? `/workspace?job_id=${encodeURIComponent(jobId)}${downloadToken ? `&download_token=${encodeURIComponent(downloadToken)}` : ""}${receiptToken ? `&receipt_token=${encodeURIComponent(receiptToken)}` : ""}` : "";
  const copySha = async () => {
    if (!receipt?.output_sha256 || typeof navigator === "undefined" || !navigator.clipboard) return;
    await navigator.clipboard.writeText(receipt.output_sha256);
    setCopiedSha(true);
    window.setTimeout(() => setCopiedSha(false), 1600);
  };
  const copyShaFromBox = () => {
    void copySha();
  };
  const copyShaFromKey = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    void copySha();
  };

  return (
    <div className="ws">
      <main className="wrap receipt-page">
        <section className="render-flow-head receipt-page-head">
          <span className="render-label">Delivery Receipt</span>
          <h1>{receipt?.receipt_id || "Delivery Receipt"}</h1>
        </section>

        <section className="render-job-card receipt-page-card">
          {loading ? (
            <p className="fy-auth__sub">Loading receipt.</p>
          ) : error ? (
            <p className="render-error" role="alert">{error}</p>
          ) : receipt ? (
            <>
              <section className="receipt-summary-card" aria-label="Job Summary">
                <div>
                  <span className="render-label">Package Summary</span>
                  <h2>Package delivered successfully.</h2>
                  <p className="receipt-summary-proof">Verified delivery receipt</p>
                  {receipt.filename ? <p className="receipt-summary-file">{receipt.filename}</p> : null}
                </div>
                <dl className="receipt-summary-grid">
                  <ReceiptRow label="Renderer" value={formatRendererName(receipt.renderer) || "-"} />
                  <ReceiptRow label="Frames" value={framesRendered} />
                  <ReceiptRow label="📬 Package delivered" value={completedAt} />
                  <ReceiptRow label="Verified" value={receipt.output_sha256 ? "SHA-256" : "-"} />
                </dl>
              </section>

              <dl className="receipt-page-grid">
                <ReceiptRow label="Receipt ID" value={receipt.receipt_id} />
                <ReceiptRow label="Job ID" value={receipt.job_id} />
                <ReceiptRow label="Payment method" value={formatPaymentMethod(receipt)} />
                <ReceiptRow label="Paid" value={formatCents(receipt.wallet_debit_cents)} />
                <ReceiptRow label="Remaining Balance" value={formatCents(receipt.balance_after_cents)} />
                {hasSeconds(receipt.render_seconds) ? <ReceiptRow label="Render Seconds" value={formatSeconds(receipt.render_seconds)} /> : null}
                <ReceiptRow label="Created time" value={formatDate(receipt.receipt_created_at || receipt.created_at)} />
                <ReceiptRow label="Upload ID" value={receipt.upload_id} />
              </dl>

              {receipt.output_sha256 ? (
                <section
                  className="receipt-sha-card receipt-sha-copybox"
                  aria-label="Output SHA-256"
                  role="button"
                  tabIndex={0}
                  onClick={copyShaFromBox}
                  onKeyDown={copyShaFromKey}
                  title="Copy SHA-256"
                >
                  <div>
                    <span className="render-label">Output SHA-256</span>
                    <code>{receipt.output_sha256}</code>
                  </div>
                  <span className="receipt-copy-hint">{copiedSha ? "Copied" : "Click to copy"}</span>
                </section>
              ) : null}

              <div className="receipt-page-actions">
                {downloadUrl ? (
                  <a className="pj-btn pj-btn--blue render-download-primary" href={downloadUrl}>
                    <span>Download ZIP</span>
                    {outputMeta ? <small>{outputMeta}</small> : null}
                  </a>
                ) : null}
                {workspaceUrl ? (
                  <a className="pj-btn" href={workspaceUrl}>
                    View package tracker
                  </a>
                ) : null}
                {rawReceiptUrl ? (
                  <button className="pj-btn" type="button" onClick={() => setShowRaw((value) => !value)}>
                    Verification Details
                  </button>
                ) : null}
              </div>

              {rawReceiptUrl ? (
                <details className="receipt-advanced-json" open={showRaw} onToggle={(event) => setShowRaw(event.currentTarget.open)}>
                  <summary>Verification Details</summary>
                  <a className="receipt-raw-link" href={rawReceiptUrl}>Open raw JSON</a>
                  <pre className="receipt-page-json" aria-label="Raw receipt JSON">
                    {rawJson}
                  </pre>
                </details>
              ) : null}
            </>
          ) : null}
        </section>
      </main>
    </div>
  );
}



