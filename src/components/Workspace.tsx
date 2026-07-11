"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { WEB_RENDER_API_BASE } from "@/lib/webRenderApi";
import { JourneyTimeline, type JourneyTimelineStateMap } from "@/components/JourneyTimeline";
import {
  formatRendererName,
  packageTitleForStatus,
  worldStatusLabels,
} from "@/lib/worldLanguage";

type JobStatus = "queued" | "submitted" | "running" | "complete" | "failed";

type JobResponse = {
  ok: boolean;
  job_id?: string;
  status?: JobStatus;
  status_label?: string;
  status_message?: string;
  can_start_render?: boolean;
  can_download?: boolean;
  can_view_receipt?: boolean;
  created_at?: string;
  submitted_at?: string;
  started_at?: string;
  completed_at?: string;
  updated_at?: string;
  filename?: string;
  renderer?: string;
  upload_id?: string;
  render_request_id?: string;
  engine?: string;
  worker_id?: string;
  node_id?: string;
  render_seconds?: number;
  failure_reason?: string;
  error_detail?: string;
  failed_at?: string;
  frame_start?: number;
  frame_end?: number;
  frame_count?: number;
  current_frame?: number | null;
  rendered_frame_count?: number | null;
  rendered_file_count?: number;
  progress_percent?: number | null;
  render_timeout_seconds?: number;
  render_timeout_ms?: number;
  price_cents?: number | null;
  payment_status?: "unpriced" | "priced" | "checkout_created" | "authorized" | "captured" | "failed" | "not_charged";
  payment_mode?: "wallet" | "direct_checkout" | string;
  wallet_debit_cents?: number | null;
  balance_after_cents?: number | null;
  payment_captured_at?: string | null;
  output_filename?: string;
  output_sha256?: string;
  output_size_bytes?: number;
  receipt_id?: string;
  receipt_created_at?: string;
  error?: string;
};

type AuthResponse = {
  authenticated?: boolean;
  email?: string | null;
  user_id?: string | null;
};

type WalletResponse = {
  ok?: boolean;
  balance_cents?: number;
};

const JOB_API_BASE = WEB_RENDER_API_BASE;

const statusLabel: Record<JobStatus, string> = worldStatusLabels;

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const formatDate = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return dateFormatter.format(date);
};

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

const formatCents = (value?: number | null) => {
  if (!Number.isInteger(value)) return "-";
  return `$${((value || 0) / 100).toFixed(2)}`;
};

const formatDuration = (seconds?: number | null) => {
  if (!Number.isFinite(seconds || NaN)) return "-";
  const whole = Math.max(0, Math.floor(Number(seconds)));
  const mins = Math.floor(whole / 60);
  const secs = whole % 60;
  if (mins <= 0) return `${secs}s`;
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  if (hours <= 0) return `${mins}m ${secs}s`;
  return `${hours}h ${remMins}m`;
};

const shortHash = (value?: string | null) => {
  if (!value) return null;
  return value.length > 16 ? `${value.slice(0, 12)}...${value.slice(-6)}` : value;
};

const receiptPageUrl = (jobId: string, receiptToken: string, downloadToken: string) => {
  const params = new URLSearchParams({
    job_id: jobId,
    receipt_token: receiptToken,
  });
  if (downloadToken) params.set("download_token", downloadToken);
  return `/receipt?${params.toString()}`;
};

async function getJob(jobId: string, signal?: AbortSignal): Promise<JobResponse> {
  const res = await fetch(`${JOB_API_BASE}/jobs/${encodeURIComponent(jobId)}`, {
    cache: "no-store",
    credentials: "include",
    signal,
  });
  const json = (await res.json().catch(() => ({}))) as JobResponse;
  if (!res.ok) return { ok: false, error: json.error || `status_${res.status}` };
  return json;
}

async function submitRender(jobId: string): Promise<JobResponse> {
  const res = await fetch(`${JOB_API_BASE}/jobs/${encodeURIComponent(jobId)}/submit-render`, {
    method: "POST",
    cache: "no-store",
    credentials: "include",
  });
  const json = (await res.json().catch(() => ({}))) as JobResponse;
  if (!res.ok) return { ok: false, error: json.error || `status_${res.status}` };
  return json;
}

async function createCheckoutSession(jobId: string): Promise<JobResponse & { checkout_url?: string }> {
  const res = await fetch(`${JOB_API_BASE}/jobs/${encodeURIComponent(jobId)}/create-checkout-session`, {
    method: "POST",
    cache: "no-store",
    credentials: "include",
  });
  const json = (await res.json().catch(() => ({}))) as JobResponse & { checkout_url?: string };
  if (!res.ok) return { ok: false, error: json.error || `status_${res.status}` };
  return json;
}

async function getAuthMe(signal?: AbortSignal): Promise<AuthResponse> {
  const res = await fetch("/v1/auth/me", {
    cache: "no-store",
    credentials: "include",
    signal,
  });
  if (!res.ok) return { authenticated: false };
  return (await res.json().catch(() => ({ authenticated: false }))) as AuthResponse;
}

async function getWalletBalance(signal?: AbortSignal): Promise<number | null> {
  const res = await fetch("/v1/wallet/balance", {
    cache: "no-store",
    credentials: "include",
    signal,
  });
  if (!res.ok) return null;
  const json = (await res.json().catch(() => ({}))) as WalletResponse;
  return Number.isInteger(json.balance_cents) ? Number(json.balance_cents) : null;
}

function DetailGrid({ rows }: { rows: Array<[string, string | number | null | undefined]> }) {
  return (
    <dl className="render-dashboard-grid render-real-job-grid">
      {rows
        .filter(([, value]) => value !== undefined && value !== null && value !== "")
        .map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
    </dl>
  );
}

function plural(value: number | null, singular: string, pluralValue = `${singular}s`) {
  if (!Number.isInteger(value)) return null;
  return `${value} ${value === 1 ? singular : pluralValue}`;
}

function classifyFailure(job?: JobResponse | null) {
  const raw = (job?.failure_reason || job?.error_detail || "").trim();
  const normalized = raw.toLowerCase();
  if (normalized.includes("timed out") || normalized.includes("timeout")) {
    return { message: "The render reached its time limit before delivery.", className: "Timeout", code: "render_timed_out" };
  }
  if (normalized.includes("remote worker") || normalized.includes("worker failed")) {
    return { message: "The render stopped before a completed delivery was produced.", className: "Render", code: "render_stopped" };
  }
  if (normalized.includes("exited") || normalized.includes("stopped")) {
    return { message: "The render stopped before completion.", className: "Render", code: "render_stopped_before_completion" };
  }
  if (normalized.includes("zip") || normalized.includes("output") || normalized.includes("frame")) {
    return { message: "Farpy could not verify a complete output package.", className: "Output validation", code: "output_validation_failed" };
  }

  return { message: raw || "The render stopped before completion.", className: "Render", code: "render_failed" };
}

type WorkspaceProps = {
  /** Render only the tracker card (no page shell) inside another page. */
  embedded?: boolean;
  jobId?: string;
  downloadToken?: string;
  receiptToken?: string;
};

export default function Workspace({
  embedded = false,
  jobId: jobIdProp,
  downloadToken: downloadTokenProp,
  receiptToken: receiptTokenProp,
}: WorkspaceProps = {}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pathJobId = useMemo(() => {
    const match = pathname.match(/^\/workspace\/([^/?#]+)/);
    if (!match || match[1] === "status") return "";
    return decodeURIComponent(match[1]).trim();
  }, [pathname]);
  const jobId = jobIdProp ?? (searchParams.get("job_id")?.trim() || pathJobId);
  const downloadToken = downloadTokenProp ?? (searchParams.get("download_token")?.trim() || "");
  const receiptToken = receiptTokenProp ?? (searchParams.get("receipt_token")?.trim() || "");
  const [job, setJob] = useState<JobResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const [auth, setAuth] = useState<AuthResponse>({ authenticated: false });
  const [authChecked, setAuthChecked] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [copiedCompletionId, setCopiedCompletionId] = useState(false);

  const refreshWalletBalance = async (signal?: AbortSignal) => {
    if (!auth.authenticated) {
      setWalletBalance(null);
      return;
    }
    const cents = await getWalletBalance(signal).catch(() => null);
    setWalletBalance(cents);
  };

  useEffect(() => {
    let alive = true;
    const controller = new AbortController();
    getAuthMe(controller.signal)
      .then((result) => {
        if (!alive) return;
        setAuth(result);
        if (result.authenticated) {
          void getWalletBalance(controller.signal).then((cents) => {
            if (alive) setWalletBalance(cents);
          });
        }
        setAuthChecked(true);
      })
      .catch(() => {
        if (alive) setAuth({ authenticated: false });
        if (alive) setAuthChecked(true);
      });
    return () => {
      alive = false;
      controller.abort();
    };
  }, []);

  useEffect(() => {
    if (!jobId) {
      setJob(null);
      setError("");
      setLoading(false);
      return;
    }

    let alive = true;
    const controller = new AbortController();

    const load = async (showLoading = false) => {
      if (showLoading) setLoading(true);
      const result = await getJob(jobId, controller.signal).catch((err: Error) => ({
        ok: false,
        error: err.name === "AbortError" ? "" : err.message,
      }));
      if (!alive) return;
      setLoading(false);
      if (result.ok) {
        setJob(result);
        setError("");
      } else if (result.error) {
        setJob(null);
        setError(result.error);
      }
    };

    void load(true);
    const timer = window.setInterval(() => {
      void load();
    }, 5000);

    return () => {
      alive = false;
      controller.abort();
      window.clearInterval(timer);
    };
  }, [jobId]);

  useEffect(() => {
    if (job?.status !== "running") return;
    const timer = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [job?.status]);

  const status = useMemo<JobStatus | null>(() => job?.status || null, [job]);
  const failure = useMemo(() => classifyFailure(job), [job]);

  const startRender = async () => {
    if (!jobId || submitting) return;
    setSubmitting(true);
    setError("");
    const result = await submitRender(jobId).catch((err: Error) => ({
      ok: false,
      error: err.message,
    }));
    setSubmitting(false);
    if (result.ok) {
      setJob(result);
      void refreshWalletBalance();
      return;
    }
    setError(result.error === "insufficient_balance" ? "Insufficient balance. Add funds to continue." : result.error || "Could not send this package.");
  };

  const payAndRender = async () => {
    if (!jobId || paying) return;
    setPaying(true);
    setError("");
    const result: JobResponse & { checkout_url?: string } = await createCheckoutSession(jobId).catch((err: Error) => ({
      ok: false,
      error: err.message,
    }));
    if (result.ok && result.checkout_url) {
      window.location.href = result.checkout_url;
      return;
    }
    setPaying(false);
    setError("Unable to start checkout.");
  };

  const signInToPay = () => {
    const current = typeof window !== "undefined"
      ? `${window.location.pathname}${window.location.search}`
      : `/workspace?job_id=${encodeURIComponent(jobId)}`;
    window.location.href = `/signin?next=${encodeURIComponent(current)}`;
  };

  const copyCompletionId = async () => {
    const value = job?.receipt_id || job?.job_id || jobId;
    if (!value || typeof navigator === "undefined" || !navigator.clipboard) return;
    await navigator.clipboard.writeText(value);
    setCopiedCompletionId(true);
  };

  const frameCount = Number.isInteger(job?.frame_count) ? Number(job?.frame_count) : null;
  const renderedCount = Number.isInteger(job?.rendered_frame_count)
    ? Number(job?.rendered_frame_count)
    : status === "complete" && Number.isInteger(job?.rendered_file_count)
      ? Number(job?.rendered_file_count)
      : null;
  const nodeLabel = job?.worker_id || job?.node_id || null;
  const priceCents = Number.isInteger(job?.price_cents) ? Number(job?.price_cents) : 0;
  const hasPrice = priceCents > 0;
  const isAuthenticated = Boolean(auth.authenticated);
  const walletCanCover = isAuthenticated && hasPrice && walletBalance != null && walletBalance >= priceCents;
  const walletInsufficient =
    isAuthenticated && hasPrice && walletBalance != null && walletBalance < priceCents && job?.payment_status !== "captured";
  const shortfall = walletInsufficient ? priceCents - Number(walletBalance) : 0;
  const canStartWithWallet = Boolean(job?.can_start_render) && job?.payment_status !== "captured" && walletCanCover;
  const canStartCaptured = Boolean(job?.can_start_render) && job?.payment_status === "captured";
  const needsSignInToPay = Boolean(job) && authChecked && !isAuthenticated && job?.payment_status === "priced" && !job?.can_start_render;
  const showCheckout = Boolean(job) && authChecked && isAuthenticated && job?.payment_status === "priced" && !job?.can_start_render && !walletInsufficient && !canStartWithWallet;
  const progressText = frameCount && renderedCount != null ? `${renderedCount} / ${frameCount} frames` : "Waiting for first frame...";
  const progressPct = Number.isInteger(job?.progress_percent)
    ? Math.min(100, Math.max(0, Number(job?.progress_percent)))
    : frameCount && renderedCount != null
      ? Math.min(100, Math.max(0, (renderedCount / frameCount) * 100))
      : null;
  const currentFrame = Number.isInteger(job?.current_frame) ? Number(job?.current_frame) : null;
  const startedAtMs = job?.started_at ? new Date(job.started_at).getTime() : NaN;
  const elapsedSeconds =
    status === "running" && Number.isFinite(startedAtMs)
      ? Math.max(0, Math.floor((nowMs - startedAtMs) / 1000))
      : Number.isFinite(job?.render_seconds || NaN)
        ? Number(job?.render_seconds)
        : null;
  const timeoutSeconds = Number.isInteger(job?.render_timeout_seconds)
    ? Number(job?.render_timeout_seconds)
    : Number.isInteger(job?.render_timeout_ms)
      ? Math.floor(Number(job?.render_timeout_ms) / 1000)
      : null;
  const paymentCaptured = job?.payment_status === "captured";
  const backendDispatchStatus = status === "submitted" || status === "running" || status === "complete" || status === "failed";
  const hasEnteredDispatch = Boolean(job?.submitted_at || paymentCaptured || backendDispatchStatus);
  const isPreSubmit =
    Boolean(job) &&
    Boolean(job?.upload_id || job?.job_id) &&
    !hasEnteredDispatch &&
    status !== "complete" &&
    status !== "failed";
  const displayStatus = status === "queued" && hasEnteredDispatch ? "submitted" : status;
  const displayTitle =
    isPreSubmit
      ? canStartWithWallet
        ? "Ready to send"
        : "Payment required"
      : displayStatus === "queued" || displayStatus === "submitted" || walletInsufficient || canStartCaptured || canStartWithWallet || showCheckout || needsSignInToPay
      ? packageTitleForStatus(displayStatus || "submitted")
      : packageTitleForStatus(displayStatus);
  const cardTitle = status === "complete" ? "Package delivered successfully." : displayTitle;
  const statusIcon =
    status === "complete" ? (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="m5 12.5 4.5 4.5L19 7.5" />
      </svg>
    ) : status === "failed" ? (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
        <path d="M12 4.5v10" />
        <path d="M12 19.5v.01" />
      </svg>
    ) : status === "running" ? (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
        <path d="M12 3a9 9 0 1 0 9 9" />
      </svg>
    ) : (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
        <circle cx="12" cy="12" r="8.5" />
      </svg>
    );
  const renderSeconds = Number.isFinite(Number(job?.render_seconds)) ? Math.round(Number(job?.render_seconds)) : null;
  const packageId = job?.job_id || jobId || null;
  const startCtaLabel = showCheckout ? "Pay and start render" : canStartWithWallet || canStartCaptured ? "Send package" : walletInsufficient ? "Top Up" : needsSignInToPay ? "Sign in to Pay" : null;
  const showStartedNotice = hasEnteredDispatch && (status === "queued" || status === "submitted") && job?.payment_status === "captured";
  const downloadMeta = [
    job?.output_filename || null,
    job?.output_size_bytes ? formatBytes(job.output_size_bytes) : null,
    Number.isInteger(job?.rendered_file_count) ? plural(Number(job?.rendered_file_count), "file") : null,
  ].filter(Boolean).join(" • ");
  const summaryParts = [
    plural(frameCount, "frame"),
    formatRendererName(job?.renderer),
    renderSeconds != null ? formatDuration(renderSeconds) : null,
    Number.isInteger(job?.wallet_debit_cents) ? formatCents(job?.wallet_debit_cents) : hasPrice ? formatCents(priceCents) : null,
  ].filter(Boolean);
  const hasPackage = Boolean(job?.upload_id || job?.job_id);
  const hasRenderFactory = Boolean(nodeLabel || job?.started_at || status === "running" || status === "complete" || status === "failed");
  const hasOutput = Boolean(job?.output_filename || job?.output_sha256);
  const displayStage =
    status === "complete" ? "Complete"
      : status === "failed" ? "Failed"
        : hasOutput ? "Packaging"
          : status === "running" ? "Rendering"
            : nodeLabel || job?.started_at ? "Accepted"
              : hasEnteredDispatch ? "Waiting for render partner"
                : "Received";
  const displayStageCopy =
    displayStage === "Complete" ? "Your verified output is ready."
      : displayStage === "Failed" ? failure.message
        : displayStage === "Packaging" ? "Rendering finished. Farpy is preparing the download package."
          : displayStage === "Rendering"
            ? progressPct == null
              ? "Rendering is active. Progress will appear when completed-frame data is available."
              : "Completed-frame progress is updating from the render job."
            : displayStage === "Accepted" ? "A render partner accepted the package and is preparing to render it."
              : displayStage === "Waiting for render partner" ? "Your package is in dispatch. This page updates when a render partner accepts it."
                : "Farpy received the package. Complete the required start step to enter dispatch.";
  const etaLabel = status === "complete" ? "Complete" : status === "failed" ? "Unavailable" : "Estimating";
  const downloadReadiness = job?.can_download && downloadToken ? "Ready" : hasOutput ? "Preparing" : status === "complete" ? "Unavailable" : "Not ready";
  const receiptReadiness = job?.can_view_receipt && receiptToken ? "Ready" : status === "complete" ? "Preparing" : "Not ready";
  const paymentOutcome = job?.payment_status === "not_charged" ? "Not charged" : job?.payment_status === "failed" ? "Payment failed" : null;
  const paymentResult = paymentOutcome
    || (Number.isInteger(job?.wallet_debit_cents) ? formatCents(job?.wallet_debit_cents) : job?.payment_status === "captured" ? "Paid" : "Unavailable");
  const receiptVerified = Boolean(job?.receipt_id && job?.output_sha256 && job?.can_view_receipt && receiptToken);
  const completionId = job?.receipt_id || packageId;
  const completedSummaryRows = [
    ["Frames completed", renderedCount ?? frameCount ?? "Unavailable"],
    ["Render duration", renderSeconds != null ? formatDuration(renderSeconds) : "Unavailable"],
    ["GPU / node", nodeLabel || "Unavailable"],
    ["Payment", paymentResult],
    ["File", downloadReadiness],
    ["Receipt", receiptReadiness],
  ];
  const journeyStates: JourneyTimelineStateMap = {
    received: hasPackage ? "complete" : Boolean(job) ? "active" : "upcoming",
    payment: hasPackage ? (hasEnteredDispatch ? "complete" : "active") : "upcoming",
    dispatcher: hasRenderFactory ? "complete" : hasEnteredDispatch && status !== "complete" && status !== "failed" ? "active" : "upcoming",
    factory: status === "complete" || status === "running" || status === "failed" || hasOutput
      ? "complete"
      : hasRenderFactory
        ? "active"
        : "upcoming",
    rendering: status === "failed" ? "failed" : status === "complete" || hasOutput ? "complete" : status === "running" ? "active" : "upcoming",
    packaging: status === "complete" && Boolean(job?.can_download || hasOutput) ? "complete" : hasOutput && status !== "complete" ? "active" : "upcoming",
    delivered: status === "complete" && Boolean(job?.can_download) ? "complete" : status === "complete" ? "active" : "upcoming",
  };
  const detailRows: Array<[string, string | number | null | undefined]> = [
    ["Package ID", job?.job_id],
    ["File", job?.filename],
    ["Renderer", formatRendererName(job?.renderer || job?.engine)],
    ["Status", status ? statusLabel[status] : null],
    ["Render Partner ID", nodeLabel],
    ["Frames", frameCount && renderedCount != null ? `${renderedCount} / ${frameCount}` : frameCount],
    ["Current frame", currentFrame],
    ["Created", formatDate(job?.created_at)],
    ["Submitted", formatDate(job?.submitted_at)],
    ["Started", formatDate(job?.started_at)],
    ["Completed", formatDate(job?.completed_at)],
    ["Updated", formatDate(job?.updated_at)],
    ["Elapsed", elapsedSeconds != null ? formatDuration(elapsedSeconds) : null],
    ["Timeout window", timeoutSeconds != null ? formatDuration(timeoutSeconds) : null],
    ["Payment", job?.payment_status],
    ["Payment captured", formatDate(job?.payment_captured_at)],
    ["Payment method", job?.payment_mode],
    ["Paid", Number.isInteger(job?.wallet_debit_cents) ? formatCents(job?.wallet_debit_cents) : null],
    ["Remaining Balance", Number.isInteger(job?.balance_after_cents) ? formatCents(job?.balance_after_cents) : null],
    ["Render request ID", job?.render_request_id],
    ["Upload ID", job?.upload_id],
    ["Receipt ID", job?.receipt_id],
    ["Receipt time", formatDate(job?.receipt_created_at)],
    ["Output file", job?.output_filename],
    ["Output SHA-256", job?.output_sha256],
    ["Output size", formatBytes(job?.output_size_bytes)],
    ["Rendered files", job?.rendered_file_count],
    ["Failure message", status === "failed" ? failure.message : null],
    ["Failure class", status === "failed" ? failure.className : null],
    ["Failure code", status === "failed" ? failure.code : null],
    ["Render Partner ID", status === "failed" ? job?.node_id || job?.worker_id : null],
    ["Receipt Created", status === "failed" ? (job?.receipt_id || job?.receipt_created_at || job?.can_view_receipt ? "Yes" : "No") : null],
    ["Failure detail", status === "failed" ? job?.failure_reason || job?.error_detail : null],
  ];

  const trackerCard = (
        <section className="render-job-card render-status-hero" aria-labelledby="render-status-title">
          {!jobId || (error && !job) ? (
            <div className="render-empty-state">
              <strong>No package selected.</strong>
              <span>No active package selected.</span>
              <span>Start with a small package from the homepage or open one from Account history.</span>
              <div className="render-actions">
                <a className="pj-btn pj-btn--blue" href="/#start">Send package</a>
                <a className="pj-btn" href="/account">Account history</a>
              </div>
            </div>
          ) : loading && !job ? (
            <div className="render-empty-state">
              <strong>Loading package</strong>
              <span>Checking the package tracker link.</span>
            </div>
          ) : job ? (
            <>
              <div className="render-compressed-top" role="status" aria-live="polite" aria-atomic="true">
                <div className={`render-status-icon render-status-icon-${status || "queued"}`} aria-hidden="true">
                  {statusIcon}
                </div>
                <div className="render-compressed-copy">
                  <span className={`render-stage-pill render-stage-pill-${status || "queued"}`}>{displayStage}</span>
                  <h2 id="render-status-title">{cardTitle}</h2>
                  <p>{displayStageCopy}</p>
                  {job.filename ? <strong className="render-file-name">{job.filename}</strong> : null}
                  {summaryParts.length ? <span className="render-job-summary">{summaryParts.join(" \u2022 ")}</span> : null}
                </div>
              </div>

              {isPreSubmit && startCtaLabel ? (
                <div className="render-start-cta" aria-label="Start package">
                  <div>
                    <strong>Your package is priced but not rendering yet.</strong>
                    <span>Use the final action below to start this package.</span>
                  </div>
                  {walletInsufficient ? (
                    <a className="pj-btn pj-btn--blue render-start-cta-button" href="/topup">{startCtaLabel}</a>
                  ) : showCheckout ? (
                    <button className="pj-btn pj-btn--blue render-start-cta-button" type="button" disabled={paying || priceCents <= 0} onClick={payAndRender}>
                      {paying ? "Opening checkout..." : startCtaLabel}
                    </button>
                  ) : needsSignInToPay ? (
                    <button className="pj-btn pj-btn--blue render-start-cta-button" type="button" onClick={signInToPay}>
                      {startCtaLabel}
                    </button>
                  ) : (
                    <button className="pj-btn pj-btn--blue render-start-cta-button" type="button" disabled={submitting} onClick={startRender}>
                      {submitting ? "Sending..." : startCtaLabel}
                    </button>
                  )}
                </div>
              ) : null}

              {showStartedNotice ? (
                <div className="render-start-cta render-start-cta-muted" aria-label="Rendering started">
                  <div>
                    <strong>Rendering started</strong>
                    <span>Your package has entered dispatch and is waiting for an available render partner.</span>
                  </div>
                </div>
              ) : null}

              <dl className="render-status-facts" aria-label="Current render facts">
                <div><dt>Job ID</dt><dd>{packageId}</dd></div>
                <div><dt>State</dt><dd>{displayStage}</dd></div>
                <div><dt>Frames</dt><dd>{frameCount && renderedCount != null ? `${renderedCount} of ${frameCount}` : frameCount ?? "Waiting"}</dd></div>
                <div><dt>Current frame</dt><dd>{currentFrame ?? (status === "running" ? "Waiting for data" : "Not active")}</dd></div>
                <div><dt>ETA</dt><dd>{etaLabel}</dd></div>
                {nodeLabel ? <div><dt>Assigned node</dt><dd>{nodeLabel}</dd></div> : null}
                <div><dt>Download</dt><dd>{downloadReadiness}</dd></div>
                <div><dt>Receipt</dt><dd>{receiptReadiness}</dd></div>
              </dl>

              <JourneyTimeline states={journeyStates} includePaymentStep />

              {status === "running" ? (
                <div className="render-progress-compact" aria-label="Render progress">
                  <div className="render-progress-row">
                    <span>{progressPct == null ? "Waiting for completed-frame data" : progressText}</span>
                    {progressPct != null ? <b>{Math.round(progressPct)}%</b> : <b>Estimating</b>}
                  </div>
                  <div
                    className={`render-progress-bar ${progressPct == null ? "render-progress-bar-waiting" : ""}`}
                    role={progressPct == null ? undefined : "progressbar"}
                    aria-valuemin={progressPct == null ? undefined : 0}
                    aria-valuemax={progressPct == null ? undefined : 100}
                    aria-valuenow={progressPct == null ? undefined : Math.round(progressPct)}
                  >
                    {progressPct == null ? <span /> : <span style={{ width: `${progressPct}%` }} />}
                  </div>
                </div>
              ) : null}

              {!isPreSubmit && (canStartCaptured || canStartWithWallet || walletInsufficient) ? (
                <>
                  <div className="render-actions">
                    {walletInsufficient ? (
                  <a className="pj-btn pj-btn--blue" href="/topup">Top Up</a>
                ) : (
                  <button className="pj-btn pj-btn--blue" type="button" disabled={submitting} onClick={startRender}>
                        {submitting ? "Sending..." : "Send package"}
                  </button>
                )}
                  </div>
                </>
              ) : null}

              {!isPreSubmit && showCheckout ? (
                <>
                  <div className="render-actions">
                    <button className="pj-btn pj-btn--blue" type="button" disabled={paying || priceCents <= 0} onClick={payAndRender}>
                      {paying ? "Opening checkout..." : "Pay and start render"}
                    </button>
                    {error === "Unable to start checkout." ? (
                      <button className="pj-btn" type="button" disabled={paying || priceCents <= 0} onClick={payAndRender}>
                        Retry
                      </button>
                    ) : null}
                  </div>
                </>
              ) : null}

              {!isPreSubmit && needsSignInToPay ? (
                <div className="render-actions">
                  <button className="pj-btn pj-btn--blue" type="button" onClick={signInToPay}>
                    Sign in to Pay
                  </button>
                </div>
              ) : null}

              {status === "queued" && job.payment_status === "checkout_created" ? (
                <button className="pj-btn render-disabled-action" type="button" disabled>
                  Waiting for payment confirmation
                </button>
              ) : null}

              {(status === "queued" || status === "submitted") && job.payment_status === "captured" ? (
                  <button className="pj-btn render-disabled-action" type="button" disabled>
                  Looking for an available render partner.
                </button>
              ) : null}

              {status === "running" && !hasOutput ? (
                <button className="pj-btn render-disabled-action" type="button" disabled>
                  Rendering in progress
                </button>
              ) : null}

              {hasOutput && status !== "complete" && status !== "failed" ? (
                <div className="render-packaging-note" role="status">
                  <div>
                    <strong>Preparing your download</strong>
                    <span>Output exists and is being packaged. Download and receipt actions will appear only when they are ready.</span>
                  </div>
                </div>
              ) : null}

              {status === "complete" ? (
                <div className="render-complete-panel" role="status" aria-labelledby="render-status-title">
                  <div className="render-success-summary">
                    <span className="render-success-mark" aria-hidden="true">✓</span>
                    <div>
                      <strong>Render complete</strong>
                      <span>
                        {renderedCount ?? frameCount ? `${renderedCount ?? frameCount} completed frame${(renderedCount ?? frameCount) === 1 ? "" : "s"}` : "Completed output"}
                        {renderSeconds != null ? ` in ${formatDuration(renderSeconds)}` : ""}.
                      </span>
                    </div>
                  </div>

                  {completionId ? (
                    <div className="render-result-id">
                      <div>
                        <span>{job.receipt_id ? "Receipt ID" : "Job ID"}</span>
                        <code>{completionId}</code>
                      </div>
                      <button className="pj-btn pj-btn--tertiary" type="button" onClick={() => void copyCompletionId()}>
                        {copiedCompletionId ? "Copied" : "Copy ID"}
                      </button>
                    </div>
                  ) : null}

                  <dl className="render-complete-summary">
                    {completedSummaryRows.map(([label, value]) => (
                      <div key={label}>
                        <dt>{label}</dt>
                        <dd>{value}</dd>
                      </div>
                    ))}
                  </dl>
                  <div className="render-actions render-actions-primary render-complete-actions">
                    {job.can_download && downloadToken ? (
                      <a className="pj-btn pj-btn--blue render-download-primary" href={`${JOB_API_BASE}/jobs/${encodeURIComponent(jobId)}/download?token=${encodeURIComponent(downloadToken)}`}>
                        <span>Download result</span>
                        {downloadMeta ? <small>{downloadMeta}</small> : null}
                      </a>
                    ) : (
                      <button className="pj-btn pj-btn--blue render-download-primary" type="button" disabled aria-describedby="download-readiness-note">
                        <span>{hasOutput ? "Preparing download" : "Download unavailable"}</span>
                        <small>{job?.output_filename || "No ready artifact"}</small>
                      </button>
                    )}
                    {job.can_view_receipt && receiptToken ? (
                      <a className="pj-btn" href={receiptPageUrl(jobId, receiptToken, downloadToken)}>
                        View receipt
                      </a>
                    ) : (
                      <button className="pj-btn" type="button" disabled>Receipt preparing</button>
                    )}
                    {receiptVerified ? <span className="render-verified-badge">Receipt verified &middot; SHA-256</span> : null}
                  </div>
                  <nav className="render-complete-secondary" aria-label="Completed render options">
                    <Link href="/#dropzone" prefetch={false}>Render another package</Link>
                    <Link href="/account" prefetch={false}>Account history</Link>
                  </nav>
                  {downloadReadiness !== "Ready" || receiptReadiness !== "Ready" ? (
                    <p className="render-note" id="download-readiness-note">Final files are still being prepared. This page updates automatically.</p>
                  ) : null}
                </div>
              ) : null}

              {status === "failed" ? (
                <div className="render-failure-panel" role="alert">
                  <div>
                    <strong>Delivery was not completed</strong>
                    <p>{failure.message}</p>
                    {paymentOutcome ? <span>Payment status: {paymentOutcome}</span> : null}
                  </div>
                  <div className="render-actions">
                    <Link className="pj-btn pj-btn--blue" href="/#dropzone" prefetch={false}>Render again</Link>
                  </div>
                </div>
              ) : null}

              <details className="render-details">
                <summary>Verification Details</summary>
                <DetailGrid rows={detailRows} />
              </details>

              {error ? (
                <p className="render-error" role="alert">
                  {error}
                </p>
              ) : null}
            </>
          ) : null}
        </section>
  );

  if (embedded) return trackerCard;

  return (
    <div className="ws">
      <main className="wrap render-flow-page render-dashboard">
        <section className="render-flow-head render-dashboard-head">
          <div>
            <span className="render-label">Package tracker</span>
            <h1>{job ? displayTitle : "Package tracker"}</h1>
            <p>Track your render from upload to download.</p>
          </div>
        </section>
        {trackerCard}
      </main>
    </div>
  );
}


