"use client";

// Live status for a single render, for the detail page. Polls GET /v1/renders/:id
// while the job is still QUEUED/RUNNING, then stops once it's DONE or FAILED.
// Returns the normalized RenderJob plus loading/error so the page can render a
// graceful state at every stage.

import { useEffect, useRef, useState } from "react";
import { getRender } from "./api";
import type { RenderJob } from "./types";

type JobState = {
  job: RenderJob | null;
  loading: boolean;
  error: string | null;
  notFound: boolean;
};

const POLL_MS = 3000;
const MAX_ERRORS = 5; // stop retrying a hard-failing endpoint after this many

export function useRenderJob(jobId: string | undefined): JobState {
  const [s, setS] = useState<JobState>({ job: null, loading: true, error: null, notFound: false });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!jobId) return;
    let alive = true;
    let errors = 0;
    const ctrl = new AbortController();

    const tick = async () => {
      const r = await getRender(jobId, ctrl.signal);
      if (!alive) return;
      if (r.ok) {
        errors = 0;
        setS({ job: r.data, loading: false, error: null, notFound: false });
        const live = r.data.state === "QUEUED" || r.data.state === "RUNNING";
        if (live) timer.current = setTimeout(tick, POLL_MS);
      } else if (r.error.status === 404) {
        setS({ job: null, loading: false, error: null, notFound: true });
      } else {
        errors += 1;
        setS((prev) => ({ ...prev, loading: false, error: r.error.message }));
        // back off on transient errors, but give up after a cap so a broken
        // endpoint doesn't poll forever
        if (errors < MAX_ERRORS) timer.current = setTimeout(tick, POLL_MS * 2);
      }
    };

    tick();
    return () => {
      alive = false;
      ctrl.abort();
      if (timer.current) clearTimeout(timer.current);
    };
  }, [jobId]);

  if (!jobId) return { job: null, loading: false, error: null, notFound: true };
  return s;
}
