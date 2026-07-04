import Link from "next/link";

const ADDON_ZIP_PATH = "/downloads/Farpy-Blender-Addon-unified.zip";
const ADDON_SHA256 = "8D5CA2D53C2C71736BF9D7205D61D07D49AF40C2BB8E6EA97B697ABC6FC6260B";

export default function AddonPage() {
  return (
    <main className="addon">
      <section className="addon-hero">
        <div className="wrap addon-hero-grid">
          <div className="addon-hero-copy">
            <h1 className="h1">
              Farpy Render Delivery.
              <span className="h1-accent">Send Blender packages from Blender.</span>
            </h1>
            <p className="lede">
              Install the Farpy Blender add-on, send a render package, track it in your
              workspace, and open the delivery receipt after the package is delivered.
            </p>
            <div className="addon-actions">
              <a className="btn btn-primary addon-dl" href={ADDON_ZIP_PATH}>
                Download Blender Add-on
              </a>
              <Link className="btn btn-secondary" href="/workspace" prefetch={false}>
                Open Workspace
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="legal">
        <div className="wrap">
          <div className="legal-inner">
            <div className="legal-body">
              <section className="legal-section">
                <h2>Install</h2>
                <ol>
                  <li>Download the add-on ZIP.</li>
                  <li>In Blender, open Preferences, Add-ons, then Install.</li>
                  <li>Open the Farpy Render Delivery panel.</li>
                </ol>
              </section>

              <section className="legal-section">
                <h2>How it works</h2>
                <ol>
                  <li>Choose your scene.</li>
                  <li>Send package to Farpy.</li>
                  <li>Track package delivery in your workspace.</li>
                  <li>Download the result and delivery receipt.</li>
                </ol>
              </section>

              <section className="legal-section">
                <h2>Package support</h2>
                <ul>
                  <li>Blender .blend packages supported.</li>
                  <li>Existing Octane .orbx packages can be sent as 1-frame still packages. Automatic ORBX export is not included yet.</li>
                  <li>No secrets are stored in the add-on.</li>
                  <li>Your workspace tracks package delivery from send to render partner to package delivered.</li>
                  <li>Delivery receipts verify completed packages.</li>
                </ul>
              </section>

              <section className="legal-section">
                <h2>Checksum</h2>
                <p>Verify the downloaded ZIP with this SHA-256 hash:</p>
                <code>{ADDON_SHA256}</code>
              </section>

              <section className="legal-section">
                <h2>Useful links</h2>
                <p className="addon-actions">
                  <Link className="btn btn-secondary" href="/account" prefetch={false}>
                    View Account
                  </Link>
                  <Link className="btn btn-secondary" href="/pricing" prefetch={false}>
                    View Pricing
                  </Link>
                  <Link className="btn btn-secondary" href="/docs" prefetch={false}>
                    Read Docs
                  </Link>
                </p>
              </section>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}


