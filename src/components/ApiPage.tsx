import Link from "next/link";

const WEB_RENDER_BASE = "https://farpy.com/node/v1/web-render";
const ACCOUNT_BASE = "https://farpy.com/v1";

const WEB_RENDER_ENDPOINTS = [
  ["GET", "/health", "Service health."],
  ["GET", "/worker/status", "Worker heartbeat and queue counts."],
  ["POST", "/uploads/create", "Upload a .blend or .orbx file and receive upload_id, job_id, and private tokens."],
  ["GET", "/jobs/{job_id}", "Read a real stored job status."],
  ["POST", "/jobs/{job_id}/price", "Set the quoted price in cents before checkout."],
  ["POST", "/jobs/{job_id}/create-checkout-session", "Create Stripe Checkout for a priced job."],
  ["POST", "/jobs/{job_id}/submit-render", "Submit a paid job to the render worker."],
  ["GET", "/jobs/{job_id}/download?token=...", "Download output only when a real output file exists and the token matches."],
  ["GET", "/jobs/{job_id}/receipt?token=...", "Read receipt JSON only when a real receipt exists and the token matches."],
];

const ACCOUNT_ENDPOINTS = [
  ["GET", "/wallet/balance", "Read the signed-in user's wallet balance."],
  ["GET", "/wallet/transactions", "Read the signed-in user's wallet ledger entries."],
  ["POST", "/wallet/topup/session", "Create a Stripe Checkout session for wallet top-up."],
  ["GET", "/account/renders", "Read the signed-in user's package history."],
];

export default function ApiPage() {
  return (
    <main className="api">
      <section className="addon-hero">
        <div className="wrap addon-hero-grid">
          <div className="addon-hero-copy">
            <h1 className="h1">
              Beta API.
              <span className="h1-accent">Anonymous jobs and account wallet endpoints.</span>
            </h1>
            <p className="lede">
              These are the public beta endpoints currently used by the web render flow.
              Anonymous render jobs are supported. Authenticated wallet and account
              endpoints are also supported.
            </p>
            <ul className="assure">
              <li>Render base URL: <code>{WEB_RENDER_BASE}</code></li>
              <li>Account base URL: <code>{ACCOUNT_BASE}</code></li>
              <li>Uploads accept <code>.blend</code> and <code>.orbx</code>.</li>
              <li>Download and receipt endpoints require per-job tokens.</li>
              <li>Wallet and account endpoints use the Farpy session cookie.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="border-t border-line bg-paper-2">
        <div className="wrap py-16 sm:py-24">
          <div className="section-head">
            <h2 className="section-title">Live beta endpoints.</h2>
            <p className="section-lede">
              Render jobs can be created anonymously with private tokens. Signed-in users
              can also read wallet balance, wallet transactions, and package history.
            </p>
          </div>

          <ul className="api-endpoints">
            {WEB_RENDER_ENDPOINTS.map(([method, path, desc]) => (
              <li className="api-endpoint" key={`${method}-${path}`}>
                <div className="api-endpoint-head">
                  <span className="api-method">{method}</span>
                  <code className="api-path">{path}</code>
                </div>
                <p className="api-endpoint-desc">{desc}</p>
              </li>
            ))}
            {ACCOUNT_ENDPOINTS.map(([method, path, desc]) => (
              <li className="api-endpoint" key={`${method}-${path}`}>
                <div className="api-endpoint-head">
                  <span className="api-method">{method}</span>
                  <code className="api-path">{path}</code>
                </div>
                <p className="api-endpoint-desc">{desc}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="addon-final border-t border-line bg-paper-2">
        <div className="wrap addon-final-inner">
          <div className="addon-final-copy">
            <h2 className="addon-final-title">Start with the web flow.</h2>
            <p className="addon-final-sub">
              Upload a file on the homepage to create a real job and private workspace link.
            </p>
          </div>
          <Link className="btn btn-primary addon-dl" href="/#start" prefetch={false}>
            Send package
          </Link>
        </div>
      </section>
    </main>
  );
}
