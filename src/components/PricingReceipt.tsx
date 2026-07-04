"use client";

import { useState } from "react";

// The rates here mirror PricingSection's source of truth: Normal $0.01,
// Fast $0.02. This is a worked example of a real estimate, not a separate price.
const SAMPLE_FRAMES = 120;
const RATES = {
  normal: { label: "Normal queue", rate: 0.01 },
  fast: { label: "Fast · priority GPUs", rate: 0.02 },
} as const;

type Speed = keyof typeof RATES;

const money = (n: number) => "$" + n.toFixed(2);

export default function PricingReceipt() {
  const [speed, setSpeed] = useState<Speed>("normal");
  const { label, rate } = RATES[speed];
  const total = SAMPLE_FRAMES * rate;

  return (
    <div className="receipt" data-reveal="resolve">
      <div className="receipt-head">
        <span className="receipt-file">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M13 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
            <path d="M13 3v6h6" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          </svg>
          <span>Cyberpunk_Alley.blend</span>
        </span>
        <div className="speed-toggle" role="group" aria-label="Render speed">
          <button
            type="button"
            aria-pressed={speed === "normal"}
            onClick={() => setSpeed("normal")}
          >
            Normal
          </button>
          <button
            type="button"
            aria-pressed={speed === "fast"}
            onClick={() => setSpeed("fast")}
          >
            Fast
          </button>
        </div>
      </div>

      <div className="receipt-lines">
        <div className="receipt-line">
          <span>Frames detected</span>
          <span className="mono">{SAMPLE_FRAMES.toLocaleString()}</span>
        </div>
        <div className="receipt-line">
          <span>Speed</span>
          <span className="mono">{label}</span>
        </div>
        <div className="receipt-line">
          <span>Rate</span>
          <span className="mono">{money(rate)} / frame</span>
        </div>
      </div>

      <div className="receipt-total">
        <span>Your price</span>
        <span className="receipt-amount" aria-live="polite">
          {money(total)}
        </span>
      </div>

      <p className="receipt-foot">
        This is exactly how every estimate reads. Failed frames cost $0, so it&apos;s the
        most you would ever pay.
      </p>

      {/* the proof, made tangible: every finished render ships with a line like this */}
      <div className="receipt-sign" aria-hidden="true">
        <span className="receipt-sign-hash">sha256 4f9a2c·b7e1·…·e7b1</span>
        <span className="receipt-sign-mark">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          signed
        </span>
      </div>
    </div>
  );
}
