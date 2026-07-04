"use client";

import { useRef, useState } from "react";
import { WEB_RENDER_API_BASE } from "@/lib/webRenderApi";

type Queue = "normal" | "fast";
type Renderer = "blender" | "octane";
type OutputMode = "still" | "animation";

const DEFAULT_ANIMATION_END = 120;
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

export default function HomeRenderFlow() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [renderer, setRenderer] = useState<Renderer>("blender");
  const [queue, setQueue] = useState<Queue>("normal");
  const [outputMode, setOutputMode] = useState<OutputMode>("still");
  const [frameStart, setFrameStart] = useState(MIN_FRAME);
  const [frameEnd, setFrameEnd] = useState(DEFAULT_ANIMATION_END);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  const rate = QUEUES[queue].rate;
  const selectedRenderer = RENDERERS[renderer];
  const isOctane = renderer === "octane";
  const normalizedStart = clampFrame(frameStart);
  const normalizedEnd = Math.max(normalizedStart, clampFrame(frameEnd));
  const effectiveFrameStart = isOctane ? MIN_FRAME : normalizedStart;
  const effectiveFrameEnd = isOctane || outputMode === "still" ? effectiveFrameStart : normalizedEnd;
  const effectiveFrames = effectiveFrameEnd - effectiveFrameStart + 1;
  const total = effectiveFrames * rate;
  const packageTypeLabel = `${selectedRenderer.label} package`;

  const chooseFile = (file: File | null) => {
    if (!file) return;
    const inferredRenderer = inferRenderer(file.name);
    if (!inferredRenderer) {
      setError("Unsupported package type. Please upload a .blend or .orbx file.");
      setFile(null);
      setFileName("");
      return;
    }

    setRenderer(inferredRenderer);
    if (inferredRenderer === "octane") {
      setOutputMode("still");
      setFrameStart(MIN_FRAME);
      setFrameEnd(MIN_FRAME);
    }
    setError("");
    setFile(file);
    setFileName(file.name);
  };

  const changeOutputMode = (next: OutputMode) => {
    if (isOctane && next === "animation") return;
    setOutputMode(next);
    if (next === "still") {
      setFrameEnd(frameStart);
    } else if (frameEnd < frameStart) {
      setFrameEnd(frameStart);
    }
  };

  const updateFrameStart = (value: number) => {
    if (isOctane) return;
    const next = clampFrame(value);
    setFrameStart(next);
    if (outputMode === "animation" && frameEnd < next) {
      setFrameEnd(next);
    }
  };

  const updateFrameEnd = (value: number) => {
    if (isOctane) return;
    const next = clampFrame(value);
    setFrameEnd(Math.max(frameStart, next));
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

    const form = new FormData();
    form.append("file", file, file.name);
    form.append("renderer", inferredRenderer);
    const submitFrameStart = inferredRenderer === "octane" ? MIN_FRAME : effectiveFrameStart;
    const submitFrameEnd = inferredRenderer === "octane" ? MIN_FRAME : effectiveFrameEnd;
    const submitFrameCount = submitFrameEnd - submitFrameStart + 1;
    form.append("frame_count", String(submitFrameCount));
    form.append("frame_start", String(submitFrameStart));
    form.append("frame_end", String(submitFrameEnd));

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
          <a className="pj-btn" href="/downloads">
            Become a render partner
          </a>
        </div>
        <p className="fy-estimator-trust">
          Rendars send packages. NodeMunchers earn by running render partners.
        </p>
        <div className="fy-first-minute-grid" aria-label="How Farpy works">
          <article className="fy-first-minute-card">
            <span aria-hidden="true">1</span>
            <strong>Upload</strong>
            <p>Choose a Blender or Octane package.</p>
          </article>
          <article className="fy-first-minute-card">
            <span aria-hidden="true">2</span>
            <strong>Rendering</strong>
            <p>A render partner processes your package.</p>
          </article>
          <article className="fy-first-minute-card">
            <span aria-hidden="true">3</span>
            <strong>Download + Receipt</strong>
            <p>Get a ZIP and verified SHA-256 receipt.</p>
          </article>
        </div>
        <div className="fy-trust-strip" aria-label="Farpy trust checks">
          <a href="/pricing">Receipt-backed</a>
          <a href="/docs">SHA-256 verified</a>
          <a href="/refunds">Wallet tracked</a>
          <a href="/faq">No subscription</a>
        </div>
      </section>

      <section className="fy-estimator" id="pricing" aria-label="Package label flow">
        <div className="fy-estimator-step">
          <span className="fy-estimator-label">Package</span>
          <label
            className={`fy-upload-zone${fileName ? " has-file" : ""}`}
            id="dropzone"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              chooseFile(event.dataTransfer.files[0]);
            }}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".blend,.orbx"
              onChange={(event) => chooseFile(event.target.files?.[0] ?? null)}
            />
            <span className="fy-upload-kicker">Send package</span>
            <span className="fy-upload-types">Drop a .blend or .orbx package here.</span>
            <span className="fy-upload-action">Choose package</span>
          </label>
          {fileName && (
            <div className="fy-selected-package" aria-live="polite">
              <span>Selected</span>
              <strong>{fileName}</strong>
              <small>{packageTypeLabel}</small>
            </div>
          )}
          {error && (
            <p className="fy-error" role="alert">
              {error}
            </p>
          )}
        </div>

        <div className="fy-estimator-step">
          <span className="fy-estimator-label">Output</span>
          <div className="fy-queue-grid" role="radiogroup" aria-label="Output type">
            <label className="fy-queue-card">
              <input
                type="radio"
                name="home-output"
                checked={outputMode === "still"}
                onChange={() => changeOutputMode("still")}
              />
              <span>Still image</span>
              <small>One frame</small>
            </label>
            <label className="fy-queue-card">
              <input
                type="radio"
                name="home-output"
                checked={!isOctane && outputMode === "animation"}
                disabled={isOctane}
                onChange={() => changeOutputMode("animation")}
              />
              <span>Animation</span>
              <small>{isOctane ? "Blender only in public alpha" : "Choose a frame range"}</small>
            </label>
          </div>
        </div>

        <div className="fy-estimator-step">
          <span className="fy-estimator-label">Frames</span>
          {outputMode === "still" ? (
            <label className="fy-frame-field" htmlFor="frame-start">
              <span className="fy-frame-sub-label">Frame</span>
              <input
                id="frame-start"
                className="fy-frame-count"
                type="number"
                min={MIN_FRAME}
                max={MAX_FRAMES}
                step={1}
                value={effectiveFrameStart}
                onChange={(event) => updateFrameStart(Number(event.target.value))}
                onBlur={(event) => updateFrameStart(Number(event.target.value))}
                disabled={isOctane}
              />
              {isOctane && <small className="fy-frame-helper">Octane public alpha is still-only: 1 frame.</small>}
            </label>
          ) : (
            <div className="fy-frame-range" aria-label="Animation frame range">
              <label>
                <span>From</span>
                <input
                  className="fy-frame-input"
                  type="number"
                  min={MIN_FRAME}
                  max={MAX_FRAMES}
                  step={1}
                  value={effectiveFrameStart}
                  onChange={(event) => updateFrameStart(Number(event.target.value))}
                  onBlur={(event) => updateFrameStart(Number(event.target.value))}
                />
              </label>
              <label>
                <span>To</span>
                <input
                  className="fy-frame-input"
                  type="number"
                  min={MIN_FRAME}
                  max={MAX_FRAMES}
                  step={1}
                  value={effectiveFrameEnd}
                  onChange={(event) => updateFrameEnd(Number(event.target.value))}
                  onBlur={(event) => updateFrameEnd(Number(event.target.value))}
                />
              </label>
              <p className="fy-frame-helper">
                {effectiveFrames.toLocaleString()} frame{effectiveFrames === 1 ? "" : "s"}
              </p>
            </div>
          )}
        </div>

        <div className="fy-estimator-step">
          <span className="fy-estimator-label">Delivery</span>
          <div className="fy-queue-grid" role="radiogroup" aria-label="Delivery speed">
            {Object.entries(QUEUES).map(([key, option]) => (
              <label className="fy-queue-card" key={key}>
                <input
                  type="radio"
                  name="home-queue"
                  checked={queue === key}
                  onChange={() => setQueue(key as Queue)}
                />
                <span>{option.label}</span>
                <small>{option.desc}</small>
                <strong>{money(option.rate)}/frame</strong>
              </label>
            ))}
          </div>
        </div>

        <div className="fy-estimator-step fy-price-panel">
          <span className="fy-price-label">Summary</span>
          <span className="fy-price-formula">
            {effectiveFrames.toLocaleString()} frame{effectiveFrames === 1 ? "" : "s"}
          </span>
          <span className="fy-price-formula">{QUEUES[queue].label}</span>
          <strong className="fy-price-total">{money(total)}</strong>
        </div>

        <button
          className="pj-btn pj-btn--blue fy-start-button"
          type="button"
          disabled={!file || uploading}
          onClick={() => {
            void startRender();
          }}
        >
          {uploading ? "Sending package..." : file ? "Send package" : "Choose package to continue"}
        </button>

        <p className="fy-estimator-trust">
          Receipt-backed | SHA-256 verified | No subscription
        </p>

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
    </main>
  );
}




