"use client";

// Hidden-by-default peek at the raw receipt for the technical minority.
// Artists never see this unless they ask for it.

import { useState } from "react";

export default function RawReceiptToggle({ json }: { json: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rawreceipt">
      <button
        type="button"
        className="text-btn"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        {open ? "Hide raw receipt" : "View raw receipt"}
      </button>
      {open && (
        <pre className="rawreceipt-pre" aria-label="Raw receipt JSON">
          {json}
        </pre>
      )}
    </div>
  );
}
