"use client";

import { useRef, useState } from "react";
import { WEB_RENDER_API_BASE } from "@/lib/webRenderApi";
import { detectBlendFrames } from "@/lib/blendFrames";
import { trackAnalyticsEvent } from "@/lib/analytics";

type Queue = "normal" | "fast";
type Renderer = "blender" | "octane";

const MIN_FRAME = 1;
const MAX_FRAMES = 100000;
const RENDERERS = {
  blender: { label: "Blender", ext: ".blend", accept: ".blend" },
  octane: { label: "Octane", ext: ".orbx", accept: ".orbx" },
} satisfies Record<Renderer, { label: string; ext: string; accept: string }>;
const QUEUES = {
  normal: { label: "Standard", desc: "Lowest cost", rate: 0.01 },
  fast: { label: "Priority", desc: "Fastest available", rate: 0.02 },
} satisfies Record<Queue, { label: string; desc: string; rate: number }>;
const UPLOAD_ENDPOINT = `${WEB_RENDER_API_BASE}/uploads/create`;

const money = (amount: number) => `$${amount.toFixed(2)}`;

function clampFrame(value: number) {
  if (!Number.isFinite(value)) return MIN_FRAME;
  return Math.min(MAX_FRAMES, Math.max(MIN_FRAME, Math.round(value)));
}

function inferRenderer(fileName: string): Renderer | null {
  if (/\.blend$/i.test(fileName)) return "blender";
  if (/\.orbx$/i.test(fileName)) return "octane";
  return null;
}

function formatSize(bytes: number) {
  if (!bytes) return "scene file";
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

type FrameInfo = {
  start: number;
  end: number;
  count: number;
  detected: boolean;
};

const SINGLE_FRAME: FrameInfo = { start: MIN_FRAME, end: MIN_FRAME, count: 1, detected: false };

export default function HomeRenderFlow() {
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepthRef = useRef(0);
  const [file, setFile] = useState<File | null>(null);
  const [renderer, setRenderer] = useState<Renderer>("blender");
  const [queue, setQueue] = useState<Queue>("normal");
  const [frames, setFrames] = useState<FrameInfo>(SINGLE_FRAME);
  const [detecting, setDetecting] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const rate = QUEUES[queue].rate;
  const total = frames.count * rate;

  const chooseFile = async (nextFile: File | null) => {
    if (!nextFile) return;
    const inferredRenderer = inferRenderer(nextFile.name);
    if (!inferredRenderer) {
      setError("Unsupported package type. Please upload a .blend or .orbx file.");
      setFile(null);
      return;
    }

    setError("");
    setFile(nextFile);
    setRenderer(inferredRenderer);

    if (inferredRenderer === "octane") {
      // Octane public alpha is still-only: always one frame.
      setFrames(SINGLE_FRAME);
      return;
    }

    setDetecting(true);
    setFrames(SINGLE_FRAME);
    const range = await detectBlendFrames(nextFile);
    setDetecting(false);
    if (range && range.frameCount >= 1 && range.frameCount <= MAX_FRAMES) {
      setFrames({
        start: Math.max(MIN_FRAME, range.frameStart),
        end: Math.max(MIN_FRAME, range.frameEnd),
        count: range.frameCount,
        detected: true,
      });
    } else {
      setFrames(SINGLE_FRAME);
    }
  };

  const updateFrameCount = (value: number) => {
    const count = clampFrame(value);
    setFrames({ start: MIN_FRAME, end: count, count, detected: false });
  };

  const resetFile = () => {
    setFile(null);
    setFrames(SINGLE_FRAME);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const startRender = async () => {
    if (!file || uploading) return;
    const inferredRenderer = inferRenderer(file.name);
    if (!inferredRenderer) {
      setError("Unsupported package type. Please upload a .blend or .orbx file.");
      return;
    }
    setUploading(true);
    setError("");

    const submitFrameStart = frames.start;
    const submitFrameEnd = frames.end;
    const submitFrameCount = submitFrameEnd - submitFrameStart + 1;

    const form = new FormData();
    form.append("file", file, file.name);
    form.append("renderer", inferredRenderer);
    form.append("frame_count", String(submitFrameCount));
    form.append("frame_start", String(submitFrameStart));
    form.append("frame_end", String(submitFrameEnd));

    const analyticsMetadata = {
      frame_count: submitFrameCount,
      renderer: inferredRenderer,
      price_cents: Math.round(total * 100),
      file_type: RENDERERS[inferredRenderer].ext.slice(1),
    };
    trackAnalyticsEvent("package_upload_started", analyticsMetadata);

    try {
      const response = await fetch(UPLOAD_ENDPOINT, {
        method: "POST",
        body: form,
        credentials: "include",
      });
      const result = await response.json().catch(() => null) as {
        ok?: boolean;
        job_id?: string;
        download_token?: string;
        receipt_token?: string;
        error?: string;
      } | null;
      if (!response.ok || !result?.ok || !result.job_id) {
        throw new Error(result?.error || `Upload failed (${response.status}).`);
      }
      trackAnalyticsEvent("package_upload_completed", { ...analyticsMetadata, status: "complete" });
      const priceResponse = await fetch(`${WEB_RENDER_API_BASE}/jobs/${encodeURIComponent(result.job_id)}/price`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          price_cents: Math.round(total * 100),
          frame_count: submitFrameCount,
          frame_start: submitFrameStart,
          frame_end: submitFrameEnd,
        }),
      });
      const priceResult = await priceResponse.json().catch(() => null) as { ok?: boolean; error?: string } | null;
      if (!priceResponse.ok || !priceResult?.ok) {
        throw new Error(priceResult?.error || `Pricing failed (${priceResponse.status}).`);
      }
      trackAnalyticsEvent("render_priced", { ...analyticsMetadata, status: "priced" });
      const params = new URLSearchParams({
        job_id: result.job_id,
        download_token: result.download_token || "",
        receipt_token: result.receipt_token || "",
      });
      window.location.href = `/workspace?${params.toString()}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
      setUploading(false);
    }
  };

  return (
    <main className="fy-home" id="start">
      <section className="fy-home-hero">
        <h1 className="fy-home-title">
          Send a render package.
          <br />
          Get completed frames back.
        </h1>
        <p className="fy-home-sub">
          Farpy routes Blender and Octane render packages across available render partners. Upload, track progress, download your results.
        </p>
        <div className="fy-home-actions" aria-label="Homepage actions">
          <a className="pj-btn pj-btn--blue" href="#dropzone">
            Send package
          </a>
          <a
            className="pj-btn pj-btn--tertiary"
            href="/downloads"
            onClick={() => trackAnalyticsEvent("nodemuncher_clicked", { status: "cta" })}
          >
            Become a render partner
          </a>
        </div>
        <p className="fy-estimator-trust">
          3D artists send render packages. GPU owners earn by completing them.
        </p>
      </section>

      <section className="fy-estimator" id="pricing" aria-label="Package label flow">
        {!file ? (
          <div className="fy-estimator-step">
            <span className="fy-estimator-label">Package</span>
            <label
              className={`fy-upload-zone${isDragging ? " is-dragging" : ""}`}
              id="dropzone"
              onDragEnter={(event) => {
                event.preventDefault();
                dragDepthRef.current += 1;
                setIsDragging(true);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                event.dataTransfer.dropEffect = "copy";
              }}
              onDragLeave={(event) => {
                event.preventDefault();
                dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
                if (dragDepthRef.current === 0) setIsDragging(false);
              }}
              onDrop={(event) => {
                event.preventDefault();
                dragDepthRef.current = 0;
                setIsDragging(false);
                void chooseFile(event.dataTransfer.files[0]);
              }}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".blend,.orbx"
                aria-label="Choose a Blender or Octane render package"
                onChange={(event) => void chooseFile(event.target.files?.[0] ?? null)}
              />
              <span className="fy-upload-icon" aria-hidden="true" />
              <span className="fy-upload-kicker">
                {isDragging ? "Drop to add your package" : "Drop your render package here"}
              </span>
              <span className="fy-upload-types">Blender .blend or Octane .orbx</span>
              <span className="fy-upload-action">Browse files</span>
              <span className="fy-upload-rate">From {money(QUEUES.normal.rate)} per frame &middot; pay only for what renders</span>
            </label>
          </div>
        ) : (
          <div className="fy-job" id="dropzone" aria-live="polite">
            <section className={`pj-card fy-selected-upload${uploading ? " is-uploading" : ""}`} aria-busy={uploading}>
              <div className="pj-card__body">
                <div className="fy-file">
                  <span className="fy-file__icon" aria-hidden="true" />
                  <div className="fy-file__meta">
                    <span className="fy-file__name">{file.name}</span>
                    <span className="fy-file__size">
                      {formatSize(file.size)} &middot; {RENDERERS[renderer].label} package
                    </span>
                  </div>
                  <button className="pj-btn pj-btn--tertiary fy-file__change" type="button" disabled={uploading} onClick={resetFile}>
                    Change
                  </button>
                </div>

                <hr className="pj-card__divider" />

                <div className="fy-tiers" role="radiogroup" aria-label="Delivery speed">
                  {Object.entries(QUEUES).map(([key, option]) => (
                    <label className="fy-tier" key={key}>
                      <input
                        className="pj-radio"
                        type="radio"
                        name="home-queue"
                        checked={queue === key}
                        onChange={() => setQueue(key as Queue)}
                      />
                      <span className="fy-tier__text">
                        <span className="fy-tier__name">{option.label}</span>
                        <span className="fy-tier__desc">{option.desc}</span>
                        <span className="fy-tier__price">{money(option.rate)} / frame</span>
                      </span>
                    </label>
                  ))}
                </div>

                <hr className="pj-card__divider" />

                <div className="fy-quote">
                  <div className="fy-quote__row">
                    <span>Frames detected</span>
                    {detecting ? (
                      <span>Reading scene&hellip;</span>
                    ) : frames.detected ? (
                      <span>{frames.count.toLocaleString()}</span>
                    ) : (
                      <input
                        className="fy-frame-input fy-frame-input--quote"
                        type="number"
                        aria-label="Frame count"
                        min={MIN_FRAME}
                        max={MAX_FRAMES}
                        step={1}
                        value={frames.count}
                        onChange={(event) => updateFrameCount(Number(event.target.value))}
                        onBlur={(event) => updateFrameCount(Number(event.target.value))}
                      />
                    )}
                  </div>
                  {frames.detected && frames.count > 1 && (
                    <div className="fy-quote__row">
                      <span>Range</span>
                      <span>
                        {frames.start.toLocaleString()}&ndash;{frames.end.toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div className="fy-quote__row">
                    <span>Speed</span>
                    <span>{QUEUES[queue].label}</span>
                  </div>
                  <div className="fy-quote__row">
                    <span>Rate</span>
                    <span>{money(rate)} / frame</span>
                  </div>
                  <div className="fy-quote__row fy-quote__row--total">
                    <span>Your price</span>
                    <span className="fy-quote__total">{money(total)}</span>
                  </div>
                </div>
              </div>
              <footer className="pj-card__footer">
                <div className="fy-upload-status">
                  <p className="pj-card__footer-text">
                    {uploading ? "Securely sending your package…" : "Failed frames cost $0, so this is the most you would ever pay."}
                  </p>
                  <div
                    className="fy-upload-progress"
                    role={uploading ? "progressbar" : undefined}
                    aria-label={uploading ? "Uploading package" : undefined}
                    aria-hidden={uploading ? undefined : true}
                  >
                    <span />
                  </div>
                </div>
                <div className="pj-card__actions">
                  <button
                    className="pj-btn pj-btn--blue"
                    type="button"
                    disabled={uploading || detecting}
                    onClick={() => {
                      void startRender();
                    }}
                  >
                    {uploading && <span className="fy-button-spinner" aria-hidden="true" />}
                    {uploading ? "Sending package…" : "Send package"}
                  </button>
                </div>
              </footer>
            </section>
          </div>
        )}

        {error && (
          <p className="fy-error" role="alert">
            {error}
          </p>
        )}

        <div className="fy-after-send" aria-label="After you send">
          <span>After you send:</span>
          <ol className="fy-send-timeline">
            <li><b>Package received</b></li>
            <li><b>Render Partner accepts it</b></li>
            <li><b>Rendering</b></li>
            <li><b>Download package + receipt</b></li>
          </ol>
        </div>
      </section>

      <section className="pj-card fy-privacy" aria-label="File privacy">
        <div className="pj-card__body fy-privacy__body">
          <svg
            className="fy-privacy__icon"
            aria-hidden="true"
            viewBox="0 0 16 16"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M8 14.5a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13ZM8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16Zm-1-5a1 1 0 1 1 2 0 1 1 0 0 1-2 0Zm.25-6.25a.75.75 0 0 1 1.5 0v3.5a.75.75 0 0 1-1.5 0v-3.5Z"
            />
          </svg>
          <p className="fy-privacy__text">
            <strong>File Privacy:</strong> Uploaded .blend and .orbx files are not sold and are not used for AI training, and are deleted after you download.
          </p>
        </div>
      </section>
    </main>
  );
}