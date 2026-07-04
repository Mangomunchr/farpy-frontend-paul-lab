// Typed client layer for Farpy's public frontend contracts.
//
// Account, auth, wallet, and render-history endpoints live under `/v1`.
// Web-render job endpoints live under `/node/v1/web-render`.

import type { Balance, RenderJob, UploadResult, User } from "./types";
import { normalizeRenderJob } from "./types";
import { WEB_RENDER_API_BASE } from "./webRenderApi";

/* ---------------------------------------------------------------- config -- */

function resolveBase(): string {
  const raw =
    (typeof process !== "undefined" && process.env.NEXT_PUBLIC_FARPY_API_BASE) || "/v1";
  return raw.replace(/\/+$/, "");
}

export const API_BASE = resolveBase();

/* ------------------------------------------------------------ result type -- */

export type ApiErrorKind =
  | "network"
  | "http"
  | "parse"
  | "unauthorized"
  | "not_implemented";

export type ApiError = {
  kind: ApiErrorKind;
  status?: number;
  message: string;
  detail?: unknown;
};

export type ApiResult<T> =
  | { ok: true; data: T; status: number }
  | { ok: false; error: ApiError };

const fail = (error: ApiError): { ok: false; error: ApiError } => ({ ok: false, error });
const done = <T>(data: T, status: number): { ok: true; data: T; status: number } => ({
  ok: true,
  data,
  status,
});

/* --------------------------------------------------------------- request -- */

type RequestOpts = {
  method?: string;
  body?: unknown;
  form?: FormData;
  signal?: AbortSignal;
  timeoutMs?: number;
};

async function doRequest<T>(base: string, path: string, opts: RequestOpts = {}): Promise<ApiResult<T>> {
  const { method = "GET", body, form, signal, timeoutMs = 20000 } = opts;
  const url = `${base}${path}`;

  const ctrl = new AbortController();
  const onAbort = () => ctrl.abort();
  if (signal) {
    if (signal.aborted) ctrl.abort();
    else signal.addEventListener("abort", onAbort, { once: true });
  }
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);

  const headers: Record<string, string> = {};
  let payload: BodyInit | undefined;
  if (form) {
    payload = form;
  } else if (body !== undefined) {
    headers["content-type"] = "application/json";
    payload = JSON.stringify(body);
  }

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: payload,
      credentials: "include",
      signal: ctrl.signal,
    });
  } catch (e) {
    return fail({
      kind: "network",
      message:
        ctrl.signal.aborted && !signal?.aborted
          ? "The request timed out. Check your connection and try again."
          : "Couldn't reach Farpy. Check your connection and try again.",
      detail: String((e as Error)?.message ?? e),
    });
  } finally {
    clearTimeout(timer);
    if (signal) signal.removeEventListener("abort", onAbort);
  }

  let parsed: unknown = null;
  const text = await res.text().catch(() => "");
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = null;
    }
  }

  if (res.ok) return done(parsed as T, res.status);

  const errBody = (parsed ?? {}) as { err?: string; error?: string; detail?: unknown };
  const serverMsg = errBody.err || errBody.error;
  if (res.status === 401) {
    return fail({ kind: "unauthorized", status: 401, message: "Please sign in to continue." });
  }
  if (res.status === 501) {
    return fail({
      kind: "not_implemented",
      status: 501,
      message: "This isn't available yet.",
      detail: serverMsg,
    });
  }
  return fail({
    kind: "http",
    status: res.status,
    message: serverMsg ? `Request failed: ${serverMsg}` : `Request failed (${res.status}).`,
    detail: errBody.detail ?? parsed,
  });
}

const request = <T>(path: string, opts: RequestOpts = {}) => doRequest<T>(API_BASE, path, opts);
const webRenderRequest = <T>(path: string, opts: RequestOpts = {}) =>
  doRequest<T>(WEB_RENDER_API_BASE, path, opts);

/* ============================================================ endpoints == */

export function getHealth(signal?: AbortSignal) {
  return request<{ ok: boolean; service?: string; ts?: string }>("/health", { signal });
}

export async function getAuthMe(signal?: AbortSignal): Promise<ApiResult<User>> {
  const r = await request<Record<string, unknown>>("/auth/me", { signal });
  if (!r.ok) {
    if (r.error.kind === "unauthorized") {
      return done<User>({ email: null, user_id: null, authenticated: false }, 401);
    }
    return r;
  }
  const b = r.data ?? {};
  const nested = b.user as { email?: string; user_id?: string; id?: string } | undefined;
  const email = (b.email as string) || nested?.email || null;
  const userId = (b.user_id as string) || (b.id as string) || nested?.user_id || nested?.id || email;
  const authenticated = typeof b.authenticated === "boolean" ? b.authenticated : !!email;
  return done<User>({ email, user_id: userId || null, authenticated }, r.status);
}

export function postLogout(signal?: AbortSignal) {
  return request<{ ok: boolean }>("/auth/logout", { method: "POST", signal });
}

export async function getBalance(signal?: AbortSignal): Promise<ApiResult<Balance>> {
  const r = await request<Record<string, unknown>>("/wallet/balance", { signal });
  if (!r.ok) return r;
  const cents = Number(r.data?.balance_cents ?? 0);
  return done<Balance>({ balance_cents: Number.isFinite(cents) ? cents : 0 }, r.status);
}

export function postUpload(file: File, signal?: AbortSignal): Promise<ApiResult<UploadResult>> {
  const form = new FormData();
  form.append("file", file, file.name);
  return webRenderRequest<UploadResult>("/uploads/create", {
    method: "POST",
    form,
    signal,
    timeoutMs: 120000,
  });
}

export function priceJob(
  jobId: string,
  price_cents: number,
  frame_count?: number,
  signal?: AbortSignal,
): Promise<ApiResult<Record<string, unknown>>> {
  return webRenderRequest<Record<string, unknown>>(`/jobs/${encodeURIComponent(jobId)}/price`, {
    method: "POST",
    body: {
      price_cents,
      ...(Number.isInteger(frame_count) ? { frame_count, frame_start: 1, frame_end: frame_count } : {}),
    },
    signal,
  });
}

export async function submitJob(jobId: string, signal?: AbortSignal): Promise<ApiResult<RenderJob>> {
  const r = await webRenderRequest<Record<string, unknown>>(
    `/jobs/${encodeURIComponent(jobId)}/submit-render`,
    { method: "POST", signal },
  );
  if (!r.ok) return r;
  const job = normalizeRenderJob(r.data);
  if (!job) {
    return fail({
      kind: "parse",
      status: r.status,
      message: "Render submitted but the response was unreadable.",
    });
  }
  return done(job, r.status);
}

export async function getRender(jobId: string, signal?: AbortSignal): Promise<ApiResult<RenderJob>> {
  const r = await webRenderRequest<Record<string, unknown>>(
    `/jobs/${encodeURIComponent(jobId)}`,
    { signal },
  );
  if (!r.ok) return r;
  const job = normalizeRenderJob(r.data);
  if (!job) {
    return fail({ kind: "parse", status: r.status, message: "That render couldn't be read." });
  }
  return done(job, r.status);
}

export async function getWorkspaceRenders(signal?: AbortSignal): Promise<ApiResult<RenderJob[]>> {
  const r = await request<{ renders?: unknown[] }>("/account/renders", { signal });
  if (!r.ok) return r;
  const list = Array.isArray(r.data?.renders) ? r.data.renders : [];
  return done(
    list.map((x) => normalizeRenderJob(x as Record<string, unknown>)).filter(Boolean) as RenderJob[],
    r.status,
  );
}
