"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import SiteNav from "@/components/SiteNav";
import { downloadRender } from "@/lib/downloadRender";
import { niceName, sceneFromUrl } from "@/lib/renderStore";
import { useRenderJob } from "@/lib/useRenderJob";
import {
  FRAMES_DONE_OF,
  PCT_OF,
  TOTAL_FRAMES_OF,
  canDownload,
  moneyCents,
  type RenderJob,
} from "@/lib/types";

const Check = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

type StepState = "done" | "active" | "pending";

function steps(pct: number, isDone: boolean): { label: string; state: StepState }[] {
  const at = (threshold: number): StepState => (isDone || pct >= threshold ? "done" : "pending");
  return [
    { label: "Scene uploaded", state: "done" },
    { label: "GPU allocated", state: isDone || pct >= 4 ? "done" : "active" },
    { label: "Rendering frames", state: isDone ? "done" : pct >= 4 ? "active" : "pending" },
    { label: "Frames verified", state: at(100) },
    { label: "ZIP packaged", state: at(100) },
  ];
}

export default function RenderDetail() {
  const { id } = useParams<{ id: string }>();
  const { job, loading, error, notFound } = useRenderJob(id);

  if (loading && !job) {
    return (
      <div className="ws">
        <SiteNav />
        <div className="wrap rd">
          <p className="ws-sub" aria-busy="true">Loading your render…</p>
        </div>
      </div>
    );
  }

  if (notFound || (!job && !error)) {
    return (
      <div className="ws">
        <SiteNav />
        <div className="wrap rd">
          <div className="rd-missing">
            <h1 className="ws-title">Render not found</h1>
            <p className="ws-sub">
              This render isn&apos;t on your account, or the link is wrong. It may have been
              started under a different account.
            </p>
            <Link className="btn btn-primary" href="/workspace" prefetch={false}>
              Back to your studio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="ws">
        <SiteNav />
        <div className="wrap rd">
          <div className="rd-missing">
            <h1 className="ws-title">Couldn&apos;t load this render</h1>
            <p className="ws-sub">{error}</p>
            <Link className="btn btn-primary" href="/workspace" prefetch={false}>
              Back to your studio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <RenderBody job={job} />;
}

function RenderBody({ job }: { job: RenderJob }) {
  const live = job.state === "QUEUED" || job.state === "RUNNING";
  const failed = job.state === "FAILED";
  const pct = PCT_OF(job);
  const frames = TOTAL_FRAMES_OF(job);
  const framesDone = FRAMES_DONE_OF(job);
  const scene = sceneFromUrl(job.scene_url) || sceneFromUrl(job.input_url) || `${job.job_id}.blend`;
  const name = niceName(scene);
  const gpu = job.render_device || "RTX GPU";

  // one-shot completion flourish when the job flips to DONE while watching
  const [fresh, setFresh] = useState(false);
  const prev = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (prev.current === "RUNNING" && job.state === "DONE") {
      setFresh(true);
      const t = setTimeout(() => setFresh(false), 1500);
      prev.current = job.state;
      return () => clearTimeout(t);
    }
    prev.current = job.state;
  }, [job.state]);

  return (
    <div className="ws">
      <SiteNav />
      <div className={`wrap rd${fresh ? " is-fresh" : ""}`}>
        <Link className="proofpage-back" href="/workspace" prefetch={false}>
          <svg viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Render studio
        </Link>

        <div className="rd-grid">
          {/* viewport */}
          <div className="rd-viewport" data-state={live ? "live" : failed ? "failed" : "done"}>
            {live ? (
              <div className="rd-stage ws-live" style={{ ["--p" as string]: `${pct}%` }}>
                <span className="ws-corners" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                  <i />
                </span>
                <span className="ws-renderhead" aria-hidden="true" />
                <div className="rd-hud">
                  <div className="rd-hud-row">
                    <span className="rd-hud-tag">
                      <span className="ws-live-dot" /> Rendering · {gpu}
                    </span>
                    <span className="rd-hud-meta mono">
                      Frame {framesDone.toLocaleString()} / {frames.toLocaleString()}
                    </span>
                  </div>
                  <div className="rd-hud-bottom">
                    <div className="ws-progress">
                      <div className="ws-progress-bar" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="rd-hud-meta mono">{pct}%</span>
                  </div>
                </div>
              </div>
            ) : (
              <figure className="rd-stage rd-done-media">
                <span className={failed ? "proofpage-tag is-failed" : "proofpage-tag"}>
                  {failed ? "Didn’t finish" : (<><Check /> Verified render</>)}
                </span>
              </figure>
            )}
          </div>

          {/* side panel */}
          <aside className="rd-side">
            <header className="pr2-head">
              <span className="pr2-scene">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M13 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                  <path d="M13 3v6h6" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                </svg>
                {scene}
              </span>
              {live ? (
                <span className="rd-status-badge">
                  <span className="ws-live-dot" /> Live
                </span>
              ) : failed ? (
                <span className="pr2-badge">Failed</span>
              ) : (
                <span className="pr2-badge">
                  <Check /> Verified
                </span>
              )}
            </header>

            <h1 className="pr2-title">{name}</h1>

            {live && (
              <>
                <p className="pr2-sub">
                  Rendering on real GPUs now. You can leave this page — it keeps going, and
                  you&apos;re only charged for frames that finish.
                </p>
                <ol className="rd-steps">
                  {steps(pct, false).map((s) => (
                    <li key={s.label} data-st={s.state}>
                      <span className="rd-step-mark" aria-hidden>
                        {s.state === "done" ? (
                          <Check />
                        ) : s.state === "active" ? (
                          <span className="rd-spin" />
                        ) : (
                          <span className="rd-pending-dot" />
                        )}
                      </span>
                      {s.label}
                    </li>
                  ))}
                </ol>
                <div className="rd-total">
                  <span className="rd-total-label">
                    Reserved
                    <small>{frames.toLocaleString()} frames</small>
                  </span>
                  <span className="mono">{moneyCents(job.amount_cents)}</span>
                </div>
                <p className="pr2-note">
                  This is the ceiling — you&apos;re only charged for frames that finish.
                </p>
              </>
            )}

            {failed && (
              <>
                <p className="pr2-sub">
                  This render didn&apos;t finish{job.error ? ` — ${job.error}` : ""}. You weren&apos;t
                  charged for it.
                </p>
                <div className="pr2-total">
                  <span>You paid</span>
                  <span className="pr2-amount">$0.00</span>
                </div>
                <p className="pr2-note">
                  Failed frames cost $0. Fix the scene if needed and start it again.
                </p>
                <div className="pr2-actions">
                  <Link className="btn btn-primary btn-block" href="/workspace" prefetch={false}>
                    Render again
                  </Link>
                </div>
              </>
            )}

            {!live && !failed && (
              <>
                <p className="pr2-sub">Finished and verified — every frame checked before it counted.</p>
                <dl className="pr2-lines">
                  <div>
                    <dt>Frames rendered</dt>
                    <dd className="mono">
                      {framesDone.toLocaleString()} / {frames.toLocaleString()}
                    </dd>
                  </div>
                  <div>
                    <dt>Rendered on</dt>
                    <dd className="mono">{gpu}</dd>
                  </div>
                  {job.ts_utc && (
                    <div>
                      <dt>Date</dt>
                      <dd className="mono">{new Date(job.ts_utc).toLocaleDateString()}</dd>
                    </div>
                  )}
                </dl>
                <div className="pr2-total">
                  <span>You paid</span>
                  <span className="pr2-amount">{moneyCents(job.amount_cents)}</span>
                </div>
                <p className="pr2-note">Failed frames cost $0 — you only pay for the frames that finish.</p>

                <div className="rd-deliver">
                  <div className="rd-deliver-file">
                    <span className="rd-deliver-icon" aria-hidden>
                      <svg viewBox="0 0 24 24" fill="none">
                        <path d="M13 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                        <path d="M13 3v6h6" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <span className="rd-deliver-text">
                      <b className="mono">{scene.replace(/\.blend$/i, "")}_frames.zip</b>
                      <small>{frames.toLocaleString()} PNG frames · ready to encode to video</small>
                    </span>
                  </div>
                  <button
                    className="btn btn-primary btn-block"
                    type="button"
                    disabled={!canDownload(job)}
                    onClick={() => downloadRender({ outputUrl: job.output_url, scene })}
                  >
                    {canDownload(job) ? "Download ZIP" : "Preparing ZIP…"}
                    {canDownload(job) && (
                      <svg viewBox="0 0 24 24" fill="none" aria-hidden>
                        <path d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                </div>

                <div className="rd-secondary">
                  {job.receipt_url && (
                    <a className="ws-receipt-link" href={job.receipt_url} target="_blank" rel="noopener noreferrer">
                      View receipt
                    </a>
                  )}
                  <Link className="ws-receipt-link" href="/workspace" prefetch={false}>
                    Render another
                  </Link>
                </div>
              </>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
