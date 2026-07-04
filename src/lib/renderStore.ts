// Render data layer — now backed by the Farpy public adapter (`/v1`), not a
// simulation. A module singleton + useSyncExternalStore gives every signed-in
// surface (masthead, workspace, account) one shared, live view of the user:
// their balance, their renders, and the scene currently being staged for render.
//
// All network access goes through lib/api.ts. This file's job is to cache the
// results, keep them fresh (poll while a render is live), and translate the
// adapter's RenderJob into the UI's artist-language `Render` shape (dollars,
// scene names, "rendering / done / failed") — never job hashes, cents, or beans
// in the rendered output.

import { useSyncExternalStore } from "react";
import {
  getAuthMe,
  getBalance,
  getWorkspaceRenders,
  priceJob,
  postUpload,
  submitJob,
} from "./api";
import {
  FRAMES_DONE_OF,
  PCT_OF,
  TOTAL_FRAMES_OF,
  moneyCents,
  type RenderJob,
  type UploadResult,
  type User,
} from "./types";

/* ------------------------------------------------------------- UI types -- */

export type Status = "rendering" | "done" | "failed";
export type Queue = "Normal" | "Fast";

// The artist-facing render. Mapped from a RenderJob; optional fields are absent
// when the backend doesn't provide them (e.g. no thumbnail today).
export type Render = {
  id: string; // job_id
  name: string; // human scene name
  scene: string; // .blend file name
  frames: number;
  framesDone: number;
  pct: number;
  cost: number; // dollars (amount_cents / 100)
  queue: Queue;
  gpu: string;
  date: string;
  status: Status;
  outputUrl?: string;
  receiptUrl?: string;
  verifyOk?: boolean;
  error?: string;
  errorDetail?: string;
  src?: string; // output thumbnail — none from the backend yet
};

// A scene staged for render: uploaded, priced, awaiting "Start render".
export type StageStatus = "uploading" | "estimating" | "ready" | "error";
export type Staged = {
  status: StageStatus;
  filename: string;
  name: string;
  frames: number | null;
  // Authoritative price from the backend estimate for the current queue. The UI
  // displays and gates on THIS — never a client-computed number — so what's
  // shown always matches what the backend will charge.
  priceCents: number | null;
  queue: Queue;
  repricing: boolean; // a queue change is being re-priced by the backend
  upload: UploadResult | null;
  error: string | null;
};

export const RATE = { Normal: 0.01, Fast: 0.02 } as const;
const GPU_FALLBACK = "RTX GPU";

/* ------------------------------------------------------------- helpers -- */

export { moneyCents };

// Dollars → "$1.23". Kept for components that already think in dollars.
export const money = (usd: number) =>
  `$${Math.max(0, usd).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const costOf = (frames: number, queue: Queue) => +(frames * RATE[queue]).toFixed(2);

export const niceName = (file: string) =>
  file
    .replace(/\.blend$/i, "")
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase()) || "Untitled render";

export const fmtClock = (ms: number) => {
  const s = Math.max(0, Math.round(ms / 1000));
  return s >= 60 ? `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s` : `${s}s`;
};

export const sceneFromUrl = (url?: string): string => {
  if (!url) return "";
  try {
    const tail = decodeURIComponent(url.split("?")[0].split("/").pop() || "");
    return /\.blend$/i.test(tail) ? tail : "";
  } catch {
    return "";
  }
};

const fmtDate = (iso?: string): string => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const uploadJobId = (upload: UploadResult | null): string =>
  typeof upload?.job_id === "string" ? upload.job_id : "";

const quotedFrames = (upload: UploadResult | null, fallback?: number | null): number =>
  Number.isInteger(upload?.frames)
    ? Number(upload?.frames)
    : Number.isInteger(upload?.total_frames)
      ? Number(upload?.total_frames)
      : Number.isInteger(fallback)
        ? Number(fallback)
        : 120;

const quoteCents = (frames: number, queue: Queue) =>
  Math.max(1, Math.round(Math.max(1, frames) * RATE[queue] * 100));

// RenderJob (adapter) → Render (UI).
function toRender(j: RenderJob): Render {
  const scene = sceneFromUrl(j.scene_url) || sceneFromUrl(j.input_url) || `${j.job_id}.blend`;
  return {
    id: j.job_id,
    name: niceName(scene),
    scene,
    frames: TOTAL_FRAMES_OF(j),
    framesDone: FRAMES_DONE_OF(j),
    pct: PCT_OF(j),
    cost: (j.amount_cents ?? 0) / 100,
    queue: "Normal",
    gpu: j.render_device || GPU_FALLBACK,
    date: fmtDate(j.ts_utc),
    status: j.state === "DONE" ? "done" : j.state === "FAILED" ? "failed" : "rendering",
    outputUrl: j.output_url,
    receiptUrl: j.receipt_url,
    verifyOk: j.verify_ok,
    error: j.error ?? undefined,
    errorDetail: j.error_detail,
  };
}

/* --------------------------------------------------------------- state -- */

export type State = {
  ready: boolean; // first load attempted
  user: User;
  balanceCents: number;
  balance: number; // dollars
  renders: Render[];
  jobs: RenderJob[]; // raw normalized jobs (for detail seeding)
  staged: Staged | null;
  loadingRenders: boolean;
  rendersError: string | null;
  balanceError: string | null;
  authError: string | null;
};

const EMPTY_USER: User = { email: null, authenticated: false };

const serverState: State = {
  ready: false,
  user: EMPTY_USER,
  balanceCents: 0,
  balance: 0,
  renders: [],
  jobs: [],
  staged: null,
  loadingRenders: false,
  rendersError: null,
  balanceError: null,
  authError: null,
};

let state: State = serverState;

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const set = (patch: Partial<State>) => {
  state = { ...state, ...patch };
  emit();
};

/* ------------------------------------------------------------- loading -- */

let bootStarted = false;
let pollTimer: ReturnType<typeof setTimeout> | null = null;
let refreshingRenders = false;

async function refreshAuth() {
  const r = await getAuthMe();
  if (r.ok) set({ user: r.data, authError: null });
  else set({ authError: r.error.message });
}

async function refreshBalance() {
  const r = await getBalance();
  if (r.ok) set({ balanceCents: r.data.balance_cents, balance: r.data.balance_cents / 100, balanceError: null });
  else set({ balanceError: r.error.message });
}

export async function refreshRenders() {
  if (refreshingRenders) return; // avoid overlapping fetches resolving out of order
  refreshingRenders = true;
  set({ loadingRenders: true });
  try {
    const r = await getWorkspaceRenders();
    if (r.ok) {
      set({ jobs: r.data, renders: r.data.map(toRender), rendersError: null, loadingRenders: false });
      scheduleRenderPoll();
    } else {
      set({ rendersError: r.error.message, loadingRenders: false });
    }
  } finally {
    refreshingRenders = false;
  }
}

// Poll the workspace list while anything is still rendering, then stop.
function scheduleRenderPoll() {
  if (typeof window === "undefined") return;
  if (pollTimer) clearTimeout(pollTimer);
  const live = state.renders.some((r) => r.status === "rendering");
  if (!live) return;
  pollTimer = setTimeout(() => {
    refreshRenders();
    refreshBalance();
  }, 4000);
}

function boot() {
  if (bootStarted || typeof window === "undefined") return;
  bootStarted = true;
  Promise.allSettled([refreshAuth(), refreshBalance(), refreshRenders()]).finally(() =>
    set({ ready: true }),
  );
}

/* ------------------------------------------------------------- staging -- */

// Upload a .blend, then price it. Drives the landing widget + workspace composer.
export async function stageFile(file: File, queue: Queue = "Normal") {
  set({
    staged: {
      status: "uploading",
      filename: file.name,
      name: niceName(file.name),
      frames: null,
      priceCents: null,
      queue,
      repricing: false,
      upload: null,
      error: null,
    },
  });

  const up = await postUpload(file);
  if (!up.ok) {
    return set({
      staged: { ...(state.staged as Staged), status: "error", error: up.error.message },
    });
  }

  set({ staged: { ...(state.staged as Staged), status: "estimating", upload: up.data } });

  const frames = quotedFrames(up.data);
  const priceCents = quoteCents(frames, queue);
  const jobId = uploadJobId(up.data);
  const priced = jobId
    ? await priceJob(jobId, priceCents, frames)
    : ({ ok: false, error: { message: "Upload did not return a job id." } } as const);
  if (!priced.ok) {
    return set({
      staged: { ...(state.staged as Staged), status: "error", error: priced.error.message },
    });
  }

  set({
    staged: {
      ...(state.staged as Staged),
      status: "ready",
      frames,
      priceCents,
    },
  });
}

// Re-price the staged scene when the queue changes, so the displayed price comes
// from the backend for that queue (never a client-side Fast multiplier).
export async function reestimate(queue: Queue) {
  const s = state.staged;
  if (!s || !s.upload || s.status !== "ready" || s.queue === queue) return;
  set({ staged: { ...s, queue, repricing: true } });

  const frames = quotedFrames(s.upload, s.frames);
  const priceCents = quoteCents(frames, queue);
  const jobId = uploadJobId(s.upload);
  const priced = jobId ? await priceJob(jobId, priceCents, frames) : ({ ok: false } as const);

  // Bail if the user swapped files mid-flight.
  const cur = state.staged;
  if (!cur || cur.upload !== s.upload) return;

  if (priced.ok) {
    set({ staged: { ...cur, repricing: false, frames, priceCents } });
  } else {
    set({ staged: { ...cur, repricing: false } });
  }
}

export function clearStaged() {
  if (!state.staged) return;
  set({ staged: null });
}

export type SubmitResult =
  | { ok: true; id: string }
  | { ok: false; reason: "no-scene" | "not-ready" | "balance" | "error"; message?: string };

// Submit the staged scene for render. Returns the new job_id on success.
// The client-side balance check is advisory (the backend is the authority);
// a backend "insufficient balance" rejection is mapped back to `reason: balance`
// so the UI still shows the top-up CTA rather than a generic error.
export async function submitStaged(queue: Queue): Promise<SubmitResult> {
  const s = state.staged;
  if (!s || !s.upload) return { ok: false, reason: "no-scene" };
  if (s.status !== "ready" || s.frames == null || s.priceCents == null) return { ok: false, reason: "not-ready" };

  // Advisory gate against the backend-quoted price (cents), not a client estimate.
  if (s.priceCents / 100 > state.balance) return { ok: false, reason: "balance" };

  const jobId = uploadJobId(s.upload);
  if (!jobId) return { ok: false, reason: "error", message: "Upload did not return a job id." };

  const r = await submitJob(jobId);
  if (!r.ok) {
    const msg = (r.error.message || "").toLowerCase();
    if (r.error.status === 402 || msg.includes("insufficient") || msg.includes("balance")) {
      // backend says funds are short — refresh and route to top-up
      void refreshBalance();
      return { ok: false, reason: "balance" };
    }
    return { ok: false, reason: "error", message: r.error.message };
  }

  set({ staged: null });
  await Promise.allSettled([refreshRenders(), refreshBalance()]);
  return { ok: true, id: r.data.job_id };
}

/* --------------------------------------------------------------- hooks -- */

function subscribe(listener: () => void) {
  listeners.add(listener);
  boot();
  return () => listeners.delete(listener);
}

export function useRenderStore(): State {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => serverState,
  );
}
