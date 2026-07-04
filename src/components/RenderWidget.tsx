"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { moneyCents, clearStaged, stageFile, useRenderStore } from "@/lib/renderStore";

// The landing widget is the quote + hook: drop a .blend, we upload it and price
// it against the real backend, then "Continue to render" hands the staged scene
// off to the workspace (the store keeps it across client navigation). No fake
// estimate — the frame count and price come from /uploads + /renders/estimate.

export default function RenderWidget() {
  const router = useRouter();
  const { staged } = useRenderStore();
  const [dragging, setDragging] = useState(false);
  const [rejected, setRejected] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files || !files.length) return;
    const f = files[0];
    if (!/\.blend$/i.test(f.name)) {
      setRejected(`“${f.name}” isn’t a .blend. Farpy renders Blender files only.`);
      return;
    }
    setRejected(null);
    void stageFile(f);
  }, []);

  const reset = useCallback(() => {
    if (fileInputRef.current) fileInputRef.current.value = "";
    setRejected(null);
    clearStaged();
  }, []);

  const handoff = useCallback(() => {
    router.push("/workspace");
  }, [router]);

  // Derive the visual state from the shared staging status.
  const state: "idle" | "error" | "reading" | "estimate" = rejected
    ? "error"
    : !staged
      ? "idle"
      : staged.status === "uploading" || staged.status === "estimating"
        ? "reading"
        : staged.status === "error"
          ? "error"
          : "estimate";

  const errMsg = rejected ?? staged?.error ?? "Something went wrong reading your scene.";
  const readingLabel = staged?.status === "estimating" ? "Pricing your render" : "Uploading your scene";

  return (
    <div className="hero-widget anim-w" id="start">
      <div className={`widget${dragging ? " is-drag" : ""}`} id="widget" data-state={state}>
        <div className="widget-head">
          <span className="widget-title">Render a file</span>
          {/* the live render beside this is the system indicator now — no second pill */}
        </div>

        <div className="stage" aria-live="polite">
          {/* idle / error */}
          <div className="panel panel-drop" data-panel="idle">
            <label
              className="dropzone"
              id="dropzone"
              tabIndex={0}
              role="button"
              aria-label="Drop a .blend file or choose a file"
              onDragEnter={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDragEnd={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                handleFiles(e.dataTransfer.files);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".blend"
                hidden
                onChange={(e) => handleFiles(e.target.files)}
              />
              <span className="dz-corners" aria-hidden="true">
                <i />
                <i />
                <i />
                <i />
              </span>
              <span className="blend-token" aria-hidden="true">
                <span>.blend</span>
              </span>
              <span className="dz-title">
                Drag a <code>.blend</code> file here
              </span>
              <span className="btn btn-outline btn-sm dz-choose">Choose a file</span>
              <span className="dz-hint">
                You&apos;ll see the exact price before anything renders.
              </span>
              <span className="drop-error">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
                  <path d="M12 8v4m0 4h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <span id="errMsg">{errMsg}</span>
              </span>
            </label>
            {state === "error" && (
              <button className="sample-btn" type="button" onClick={reset}>
                <u>Try another file</u>
              </button>
            )}
          </div>

          {/* reading (uploading / pricing) */}
          <div className="panel panel-reading" data-panel="reading">
            <div className="spinner" />
            <span className="reading-title">{readingLabel}</span>
            <span className="reading-sub">{staged?.filename}</span>
          </div>

          {/* estimate */}
          <div className="panel panel-estimate" data-panel="estimate">
            <div className="file-row">
              <span className="file-name">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M13 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                  <path d="M13 3v6h6" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                </svg>
                <span>{staged?.filename}</span>
              </span>
              <button className="text-btn" type="button" onClick={reset}>
                change
              </button>
            </div>
            <div className="estimate">
              <div className="est-line">
                <span>Frames detected</span>
                <span className="mono">{(staged?.frames ?? 0).toLocaleString()}</span>
              </div>
              <div className="est-line">
                <span>Rate</span>
                <span className="mono">$0.01 / frame</span>
              </div>
              <div className="est-line est-total">
                <span>Your price</span>
                <span className="mono price">{moneyCents(staged?.priceCents ?? 0)}</span>
              </div>
              <p className="est-note">
                You&apos;re charged only for frames that finish. Failed frames cost $0.
              </p>
            </div>
            <button className="btn btn-primary btn-block" type="button" onClick={handoff}>
              Continue to render
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <p className="gate-hint">
              You&apos;ll pick your queue and start the render in your workspace. No anonymous
              jobs — your renders stay private to you.
            </p>
          </div>
        </div>
      </div>
      <p className="widget-foot">
        <svg viewBox="0 0 24 24" fill="none">
          <rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="1.8" />
          <path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.8" />
        </svg>
        Files are retained according to Farpy operational policies.
      </p>
    </div>
  );
}
