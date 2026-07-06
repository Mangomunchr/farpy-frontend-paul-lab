"use client";

import { useRef, useState } from "react";
import Link from "next/link";

const STATUS_CURL = "curl https://farpy.com/v1/renders/rnd_8f3c2a91";

const STATUS_JSON = `{
  "id": "rnd_8f3c2a91",
  "scene": "Studio_Car.blend",
  "engine": "Cycles",
  "state": "done",
  "frames_done": 240,
  "frames_total": 240,
  "percent_done": 100,
  "queue": "Standard",
  "gpu": "RTX 4090"
}`;

const RECEIPT_JSON = `{
  "render": "Studio_Car.blend",
  "engine": "Cycles",
  "frames_rendered": 240,
  "frames_failed": 0,
  "rate_per_frame": "$0.01",
  "total_charged": "$2.40",
  "gpu": "RTX 4090",
  "queue": "Standard",
  "render_time": "6m 02s",
  "status": "completed",
  "verified": true,
  "output": "studio-render.zip",
  "output_zip_sha256": "9f2c4e\u2026a417b3",
  "finished": "2026-06-14T18:32:00Z"
}`;

const HERO_RESPONSE = `$ ${STATUS_CURL}

{
  "id": "rnd_8f3c2a91",
  "scene": "Octane_Loft.orbx",
  "engine": "Octane",
  "state": "rendering",
  "frames_done": 156,
  "frames_total": 240,
  "percent_done": 65,
  "queue": "Standard"
}`;

const ENDPOINTS = [
  {
    path: "/renders/{id}",
    desc: (
      <>
        Live status for a render. <code>state</code> is one of <code>queued</code>,{" "}
        <code>rendering</code>, <code>done</code>, or <code>failed</code> — poll this until it
        reads <code>done</code>.
      </>
    ),
    curl: "curl https://farpy.com/v1/renders/rnd_8f3c2a91",
  },
  {
    path: "/renders/{id}/receipt",
    desc: (
      <>
        The signed receipt as JSON: frames rendered, rate, total charged, render time, finish
        timestamp, and a hash of the output ZIP.
      </>
    ),
    curl: "curl https://farpy.com/v1/renders/rnd_8f3c2a91/receipt",
  },
  {
    path: "/renders/{id}/proof",
    desc: (
      <>
        Returns the URL of a shareable proof page — the finished image plus its receipt, ready to
        send a client.
      </>
    ),
    curl: "curl https://farpy.com/v1/renders/rnd_8f3c2a91/proof",
  },
  {
    path: "/renders/{id}/download",
    desc: (
      <>
        Follows a short-lived link to the finished frames as a ZIP. The link may be gated to your
        account. Failed frames are never in the file or the bill.
      </>
    ),
    curl: "curl -L https://farpy.com/v1/renders/rnd_8f3c2a91/download -o frames.zip",
  },
];

const STEPS = [
  {
    num: "01",
    title: "Start a render",
    desc: (
      <>
        Upload a .blend or .orbx on the web or hit Render in the add-on. You get back a render ID
        like <code>rnd_8f3c2a91</code>.
      </>
    ),
  },
  {
    num: "02",
    title: "Poll its status",
    desc: (
      <>
        Call <code>GET /renders/{"{id}"}</code> until <code>state</code> is <code>done</code>.
        Progress comes back as <code>frames_done</code> over <code>frames_total</code>.
      </>
    ),
  },
  {
    num: "03",
    title: "Pull the receipt",
    desc: (
      <>
        Call <code>/receipt</code> for a machine-readable record of exactly what rendered and what
        it cost — proof you can keep.
      </>
    ),
  },
  {
    num: "04",
    title: "Download the output",
    desc: (
      <>
        Call <code>/download</code> for a ZIP of the finished frames. You&rsquo;re charged only for
        frames that finished.
      </>
    ),
  },
];

const ROADMAP = [
  {
    title: "Submit renders by API",
    desc: "Kick off a job with a .blend or .orbx and a frame range — no browser, straight from your pipeline.",
  },
  {
    title: "API keys & scopes",
    desc: "Per-key auth so you can wire Farpy into CI and shared tooling without sharing a login.",
  },
  {
    title: "Batch submission",
    desc: "Queue many renders in a single call and get one combined receipt back.",
  },
  {
    title: "Deadlines & SLAs",
    desc: "Ask for a finish-by time and pay for guaranteed priority on the farm.",
  },
  {
    title: "Webhooks",
    desc: "Get a callback the moment a render finishes, instead of polling for it.",
  },
  {
    title: "Worker marketplace",
    desc: "Bring your own RTX GPUs to the farm and earn on every finished frame.",
  },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1200);
  }

  return (
    <button className="pj-btn pj-btn--tertiary api-copy" type="button" onClick={copy}>
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export default function ApiPage() {
  return (
    <main className="fy-shell fy-api">
      <section className="fy-hero">
        <div className="fy-hero__copy">
          <h1 className="fy-h1">
            Plug Farpy into your pipeline.
            <br />
            Track, verify, fetch — in code.
          </h1>
          <p className="fy-hero__sub">
            A small, read-only REST API for the renders you start on the web or through the Blender
            add-on — Blender .blend or Octane .orbx. Check progress, pull a receipt as JSON, and
            download the finished frames — no SDK, no setup.
          </p>
        </div>

        <ul className="fy-trust fy-trust--stack">
          <li>
            <span className="pj-icon" aria-hidden="true" />
            Plain REST + JSON — call it with curl, fetch, or anything that speaks HTTP
          </li>
          <li>
            <span className="pj-icon" aria-hidden="true" />
            Read-only today: track, verify, and download renders you&rsquo;ve already started
          </li>
          <li>
            <span className="pj-icon" aria-hidden="true" />
            Same pricing as everywhere — $0.01 / frame, failed frames cost $0
          </li>
        </ul>

        <div className="api-code">
          <div className="api-code__head">
            <span className="pj-badge pj-badge--info">
              <span className="api-method">GET</span>
            </span>
            <span className="api-code__label">/v1/renders/{"{id}"}</span>
            <span className="api-code__spacer" />
            <CopyButton text={STATUS_CURL} />
          </div>
          <pre className="api-pre">{HERO_RESPONSE}</pre>
        </div>
      </section>

      <section className="fy-section" aria-labelledby="ep-title">
        <h2 className="fy-section__title fy-section__title--center" id="ep-title">
          Four endpoints. That&rsquo;s the whole surface.
        </h2>
        <p className="fy-section__sub fy-section__sub--center">
          Everything is a <code className="api-inline">GET</code> against{" "}
          <code className="api-inline">https://farpy.com/v1</code>. Each one takes a render ID and
          needs no SDK — just an HTTP call.
        </p>

        <div className="api-endpoints">
          <section className="pj-card api-endpoint">
            <div className="pj-card__body">
              <div className="api-endpoint__sig">
                <span className="pj-badge">Render ID</span>
              </div>
              <p className="api-endpoint__desc">
                Every call needs one. Start a job in the workspace or the Blender add-on, then grab
                the <code>rnd_&hellip;</code> ID — it&rsquo;s in the workspace URL (
                <code>/workspace/rnd_8f3c2a91</code>) and shown in the add-on. No separate signup or
                key needed for the read-only API.
              </p>
            </div>
          </section>

          {ENDPOINTS.map((ep) => (
            <section className="pj-card api-endpoint" key={ep.path}>
              <div className="pj-card__body">
                <div className="api-endpoint__sig">
                  <span className="pj-badge pj-badge--info">
                    <span className="api-method">GET</span>
                  </span>
                  <span className="api-path">{ep.path}</span>
                </div>
                <p className="api-endpoint__desc">{ep.desc}</p>
                <div className="api-curl">
                  <code>{ep.curl}</code>
                  <CopyButton text={ep.curl} />
                </div>
              </div>
            </section>
          ))}

          <section className="pj-card api-endpoint">
            <div className="pj-card__body">
              <div className="api-endpoint__sig">
                <span className="pj-badge pj-badge--warning">Auth</span>
              </div>
              <p className="api-endpoint__desc">
                While the API is read-only, a render&rsquo;s ID is its access token — anyone with
                the ID can read its status, so treat IDs like unlisted links. Key-based auth arrives
                alongside write access.
              </p>
            </div>
          </section>
        </div>
      </section>

      <section className="fy-section" aria-labelledby="flow-title">
        <h2 className="fy-section__title fy-section__title--center" id="flow-title">
          From render ID to finished ZIP.
        </h2>
        <p className="fy-section__sub fy-section__sub--center">
          Start a job once, then drive the rest from your own code in four calls.
        </p>
        <ol className="fy-steps">
          {STEPS.map((step) => (
            <li className="fy-step" key={step.num}>
              <span className="fy-step__head">
                <span className="fy-step__num">{step.num}</span>
              </span>
              <span className="fy-step__title">{step.title}</span>
              <p className="fy-step__desc">{step.desc}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="fy-section" aria-labelledby="pl-title">
        <h2 className="fy-section__title fy-section__title--center" id="pl-title">
          Exactly what comes back.
        </h2>
        <p className="fy-section__sub fy-section__sub--center">
          Readable keys, no surprises. The same receipt you&rsquo;d see on the proof page, as JSON.
        </p>

        <div className="api-payloads">
          <div className="api-code">
            <div className="api-code__head">
              <span className="pj-badge pj-badge--info">
                <span className="api-method">GET</span>
              </span>
              <span className="api-code__label">Render status</span>
              <span className="api-code__spacer" />
              <CopyButton text={STATUS_JSON} />
            </div>
            <pre className="api-pre">{STATUS_JSON}</pre>
          </div>

          <div className="api-code">
            <div className="api-code__head">
              <span className="pj-badge pj-badge--info">
                <span className="api-method">GET</span>
              </span>
              <span className="api-code__label">Receipt</span>
              <span className="api-code__spacer" />
              <CopyButton text={RECEIPT_JSON} />
            </div>
            <pre className="api-pre">{RECEIPT_JSON}</pre>
          </div>
        </div>
      </section>

      <section className="fy-section" aria-labelledby="rm-title">
        <h2 className="fy-section__title fy-section__title--center" id="rm-title">
          On the roadmap.
        </h2>
        <p className="fy-section__sub fy-section__sub--center">
          We shipped read-only first on purpose: get the render path — upload, render, status,
          proof, receipt, ZIP — boring and repeatable before opening up writes. Here&rsquo;s
          what&rsquo;s next, in order.
        </p>
        <div className="api-roadmap">
          {ROADMAP.map((item) => (
            <section className="pj-card api-road" key={item.title}>
              <div className="pj-card__body">
                <div className="api-road__head">
                  <span className="api-road__title">{item.title}</span>
                  <span className="pj-badge">Planned</span>
                </div>
                <p className="api-road__desc">{item.desc}</p>
              </div>
            </section>
          ))}
        </div>
      </section>

      <section className="fy-section fy-cta" aria-labelledby="cta-title">
        <h2 className="fy-section__title fy-section__title--center" id="cta-title">
          Start a render, then call it from your code.
        </h2>
        <p className="fy-section__sub fy-section__sub--center">
          Kick one off in the workspace, grab the render ID, and the four endpoints above do the
          rest.
        </p>
        <div className="fy-cta__actions">
          <Link className="pj-btn pj-btn--blue" href="/#dropzone" prefetch={false}>
            Open the workspace
          </Link>
          <Link className="pj-btn" href="/addon" prefetch={false}>
            Get the Blender add-on
          </Link>
        </div>
        <p className="fy-cta__note">Read-only API · no key needed today · same $0.01 / frame pricing</p>
      </section>
    </main>
  );
}
