// Canonical frontend state models for the Farpy public adapter (`/v1`).
//
// The adapter is meant to hide the messy production fields and hand us a clean,
// normalized object (see the client brief). We still normalize *defensively*
// here so the UI survives whatever the adapter actually returns today — raw
// production job shapes, lowercase legacy states, or the tidy normalized shape.
// That way nothing breaks while the backend team maps real payloads behind the
// adapter.
//
// Everything stays in the product's data language at this layer (cents, frames,
// job_id). The *display* layer (components) translates to artist language —
// dollars, scene names — and never surfaces job hashes or "beans".

/* ---------------------------------------------------------------- auth ---- */

export type User = {
  email: string | null;
  user_id?: string | null;
  authenticated: boolean;
};

/* -------------------------------------------------------------- balance ---- */

export type Balance = {
  balance_cents: number;
};

/* --------------------------------------------------------------- renders ---- */

export type RenderState = "QUEUED" | "RUNNING" | "DONE" | "FAILED";

export type RenderProgress = {
  current_frame?: number;
  frames_done?: number;
  total_frames?: number;
  pct?: number;
  node_id?: string;
  updated_at?: string;
};

// The normalized render the UI works with. `state` and `status` are kept in sync
// (production sends both); prefer `state`. Optional fields mirror what the jobs
// API may omit (e.g. a FAILED job has no progress/output).
export type RenderJob = {
  job_id: string;
  state: RenderState;
  status: RenderState;
  amount_cents: number;
  frames_done?: number;
  total_frames?: number;
  progress?: RenderProgress;
  output_url?: string;
  receipt_url?: string;
  verify_ok?: boolean;
  error?: string | null;
  error_detail?: string;
  // passthrough context the adapter may include (display-only, never required)
  scene_url?: string;
  input_url?: string;
  ts_utc?: string;
  farpy_user?: string;
  engine?: string;
  render_device?: string;
};

/* ----------------------------------------------------------------- topup ---- */

export type TopupOption = {
  amount_cents: number;
  // `cool_beans` is an adapter-internal field. It is never shown to artists.
  cool_beans?: number;
  label: string;
};

export type CheckoutResult = {
  // Stripe (or rail) hosted-checkout URL to redirect to, when present.
  checkout_url?: string;
  url?: string;
  session_id?: string;
  ok?: boolean;
  [k: string]: unknown;
};

/* ---------------------------------------------------------------- upload ---- */

export type UploadResult = {
  // Reference handed back by the upload service; passed into estimate/submit.
  upload_id?: string;
  input_url?: string;
  scene_url?: string;
  // Some upload services parse the .blend and return a frame count up front.
  frames?: number;
  total_frames?: number;
  filename?: string;
  [k: string]: unknown;
};

/* -------------------------------------------------------------- estimate ---- */

export type EstimateResult = {
  frames: number;
  price_cents: number;
  // `null` is acceptable for now per the brief — we just don't show an ETA.
  estimated_seconds?: number | null;
};

/* ---------------------------------------------------------- normalizers ---- */

const RAW = (v: unknown) => (typeof v === "string" ? v.trim().toLowerCase() : "");

// Map any state string the backend might use onto the canonical four.
export function normalizeState(raw: unknown): RenderState {
  const s = RAW(raw);
  if (["queued", "pending", "waiting", "submitted", "new"].includes(s)) return "QUEUED";
  if (["running", "rendering", "claimed", "in_progress", "active", "processing"].includes(s))
    return "RUNNING";
  if (["done", "completed", "complete", "finished", "success", "succeeded"].includes(s))
    return "DONE";
  if (["failed", "error", "errored", "cancelled", "canceled", "crash"].includes(s))
    return "FAILED";
  // Unknown but truthy: assume it's mid-flight rather than lost.
  return s ? "RUNNING" : "QUEUED";
}

const num = (v: unknown): number | undefined => {
  const n = typeof v === "string" ? Number(v) : (v as number);
  return Number.isFinite(n) ? n : undefined;
};

type RawJob = Record<string, unknown> & {
  job?: { frames?: unknown[] };
  progress?: Record<string, unknown>;
};

// Coerce the raw production job (with its many duplicate frame fields) into the
// clean RenderJob the UI consumes. Tolerant of missing fields by design.
export function normalizeRenderJob(raw: RawJob | RenderJob | null | undefined): RenderJob | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as RawJob;

  const job_id = String(r.job_id ?? r["id"] ?? "");
  if (!job_id) return null;

  const state = normalizeState(r.state ?? r.status);

  const p = (r.progress ?? {}) as Record<string, unknown>;
  const frameList = Array.isArray(r.job?.frames) ? (r.job!.frames as unknown[]).length : undefined;

  const total_frames =
    num(r.total_frames) ?? num(p.total_frames) ?? frameList;

  // Count of *completed* frames only. Deliberately NOT `current_frame` — that's
  // the frame number being worked on (e.g. 240 of a 1..240 range), not a count,
  // so using it would inflate progress on jobs that only carry current_frame.
  const frames_done =
    num(r.frames_done) ?? num(p.frames_done) ?? num(r["rendered_frames"]);

  const progress: RenderProgress | undefined =
    Object.keys(p).length || frames_done != null || total_frames != null
      ? {
          current_frame: num(p.current_frame) ?? num(r["current_frame"]),
          frames_done,
          total_frames,
          pct: num(p.pct),
          node_id: typeof p.node_id === "string" ? p.node_id : undefined,
          updated_at: typeof p.updated_at === "string" ? p.updated_at : undefined,
        }
      : undefined;

  const job = r.job as { engine?: string } | undefined;

  return {
    job_id,
    state,
    status: state,
    // A failed render is never charged — guarantee $0 at the model level so the
    // UI can't accidentally show the reserved ceiling as an amount paid.
    amount_cents: state === "FAILED" ? 0 : num(r.amount_cents) ?? 0,
    frames_done,
    total_frames,
    progress,
    output_url: typeof r.output_url === "string" ? r.output_url : undefined,
    receipt_url: typeof r.receipt_url === "string" ? r.receipt_url : undefined,
    verify_ok: typeof r.verify_ok === "boolean" ? r.verify_ok : undefined,
    error: (r.error as string | null | undefined) ?? null,
    error_detail: typeof r["error_detail"] === "string" ? (r["error_detail"] as string) : undefined,
    scene_url: typeof r.scene_url === "string" ? r.scene_url : undefined,
    input_url: typeof r.input_url === "string" ? r.input_url : undefined,
    ts_utc: typeof r.ts_utc === "string" ? r.ts_utc : undefined,
    farpy_user: typeof r.farpy_user === "string" ? r.farpy_user : undefined,
    engine: typeof job?.engine === "string" ? job.engine : undefined,
    render_device: typeof r["render_device"] === "string" ? (r["render_device"] as string) : undefined,
  };
}

/* -------------------------------------------------------- derived/display -- */

export const PCT_OF = (j: Pick<RenderJob, "progress" | "frames_done" | "total_frames" | "state">) => {
  if (j.state === "DONE") return 100;
  const pct = j.progress?.pct;
  if (typeof pct === "number") return Math.max(0, Math.min(100, Math.round(pct)));
  const done = j.frames_done ?? j.progress?.frames_done ?? 0;
  const total = j.total_frames ?? j.progress?.total_frames ?? 0;
  if (total > 0) return Math.max(0, Math.min(100, Math.round((done / total) * 100)));
  return 0;
};

export const FRAMES_DONE_OF = (j: RenderJob) => j.frames_done ?? j.progress?.frames_done ?? 0;
export const TOTAL_FRAMES_OF = (j: RenderJob) => j.total_frames ?? j.progress?.total_frames ?? 0;

// cents → "$1.23". Single conversion point so the UI never hand-rolls money math.
export const moneyCents = (cents: number) =>
  `$${(Math.max(0, cents) / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

// A finished render is downloadable only when DONE *and* it has an output.
export const canDownload = (j: RenderJob) => j.state === "DONE" && !!j.output_url;
export const hasReceipt = (j: RenderJob) => !!j.receipt_url;
