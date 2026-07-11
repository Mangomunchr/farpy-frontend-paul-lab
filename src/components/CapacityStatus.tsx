"use client";

import { useEffect, useState } from "react";

type WorkerStatus = {
  ok?: boolean;
  running?: boolean;
  poll_seconds?: number;
  processed_jobs?: number;
  submitted_jobs?: number;
  running_jobs?: number;
  queue_cap?: number;
};

type LoadState = "loading" | "ready" | "unavailable";

const STATUS_URL = "/node/v1/web-render/worker/status";

const count = (value: unknown) => Number.isInteger(value) && Number(value) >= 0 ? Number(value) : null;

export default function CapacityStatus() {
  const [data, setData] = useState<WorkerStatus | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("loading");

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    const load = async () => {
      try {
        const response = await fetch(STATUS_URL, { cache: "no-store", signal: controller.signal });
        const json = (await response.json().catch(() => null)) as WorkerStatus | null;
        if (!active) return;
        if (!response.ok || !json?.ok) {
          setLoadState("unavailable");
          return;
        }
        setData(json);
        setLoadState("ready");
      } catch (error) {
        if (active && !(error instanceof DOMException && error.name === "AbortError")) setLoadState("unavailable");
      }
    };

    void load();
    const timer = window.setInterval(() => void load(), 15000);
    return () => {
      active = false;
      controller.abort();
      window.clearInterval(timer);
    };
  }, []);

  const waiting = count(data?.submitted_jobs);
  const activeJobs = count(data?.running_jobs);
  const processed = count(data?.processed_jobs);
  const queueCap = count(data?.queue_cap);
  const processorRunning = data?.running === true;

  const state = loadState === "loading"
    ? { tone: "neutral", label: "Checking", title: "Checking queue activity", text: "Reading the current public queue status." }
    : loadState === "unavailable"
      ? { tone: "warning", label: "Unavailable", title: "Capacity status is temporarily unavailable", text: "Existing package trackers continue to show each job's real state. No queue estimate is available right now." }
      : !processorRunning && (waiting || 0) > 0
        ? { tone: "danger", label: "Delayed", title: "Dispatch is delayed", text: "Packages are waiting, but the public processing heartbeat is not currently active. Farpy is not showing an ETA until processing resumes." }
        : !processorRunning
          ? { tone: "warning", label: "Limited visibility", title: "Processing status is unavailable", text: "The public processing heartbeat is not currently active. Compatible capacity and ETA cannot be confirmed." }
          : (waiting || 0) > 0 && (activeJobs || 0) > 0
            ? { tone: "blue", label: "Busy but moving", title: "The queue is active", text: "Packages are waiting while other packages are rendering. ETA remains estimating because compatible capacity is not reported." }
            : (waiting || 0) > 0
              ? { tone: "blue", label: "Waiting", title: "Packages are waiting for assignment", text: "Dispatch is checking for a compatible render partner. No reliable ETA is available." }
              : { tone: "green", label: "No queue", title: "No packages are waiting", text: "The public queue currently reports no waiting packages. Compatibility is still checked separately for every package." };

  return (
    <section className="capacity-card" aria-labelledby="capacity-title">
      <div className="capacity-head" role="status" aria-live="polite" aria-atomic="true">
        <div>
          <span className={`capacity-pill capacity-pill-${state.tone}`}>{state.label}</span>
          <h2 id="capacity-title">{state.title}</h2>
          <p>{state.text}</p>
        </div>
        <span className="capacity-eta"><small>ETA</small><strong>Estimating</strong></span>
      </div>

      {loadState === "ready" ? (
        <dl className="capacity-facts" aria-label="Current public queue facts">
          <div><dt>Waiting</dt><dd>{waiting ?? "Unavailable"}</dd></div>
          <div><dt>Rendering</dt><dd>{activeJobs ?? "Unavailable"}</dd></div>
          <div><dt>Processing</dt><dd>{processorRunning ? "Active" : "Unavailable"}</dd></div>
          <div><dt>Compatible capacity</dt><dd>Not reported</dd></div>
        </dl>
      ) : null}

      <details className="capacity-details">
        <summary>Technical details</summary>
        <dl>
          <div><dt>Public endpoint</dt><dd>{STATUS_URL}</dd></div>
          {processed != null ? <div><dt>Processed jobs</dt><dd>{processed}</dd></div> : null}
          {queueCap != null ? <div><dt>Queue intake limit</dt><dd>{queueCap}</dd></div> : null}
          {count(data?.poll_seconds) != null ? <div><dt>Reported poll interval</dt><dd>{count(data?.poll_seconds)} seconds</dd></div> : null}
          <div><dt>Oldest job age</dt><dd>Not reported</dd></div>
        </dl>
      </details>
    </section>
  );
}
