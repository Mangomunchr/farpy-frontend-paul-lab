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
              <a className="btn btn-primary addon-dl" href={ADDON_ZIP_PATH} download>
                Download add-on ZIP
              </a>
              <Link className="btn btn-secondary" href="/workspace" prefetch={false}>
                Open Workspace
              </Link>
            </div>
            <p className="addon-download-note">
              Public alpha · tested with Blender 4.1 · install the ZIP directly (do not unzip)
            </p>
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
                  <li>Download <strong>Farpy-Blender-Addon-unified.zip</strong>. Keep it zipped.</li>
                  <li>In Blender, open <strong>Edit → Preferences → Add-ons → Install</strong>.</li>
                  <li>Select the downloaded ZIP, then enable <strong>Farpy Render Delivery</strong>.</li>
                  <li>Open the Farpy panel in the 3D View sidebar and send a small test scene first.</li>
                </ol>
                <p>
                  Updating? Remove or disable the older Farpy add-on first, restart Blender, then
                  install this ZIP.
                </p>
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
                  <li>Tested with Blender 4.1 on Windows; other Blender 4.x releases may work but are not yet fully audited.</li>
                  <li>Blender .blend stills and frame ranges are supported.</li>
                  <li>Existing Octane .orbx packages can be sent as 1-frame still packages. Automatic ORBX export is not included yet.</li>
                  <li>Pricing, payment, tracking, downloads, and receipts continue in your browser workspace.</li>
                  <li>No browser password is stored in the add-on.</li>
                  <li>Your workspace tracks package delivery from send to render partner to package delivered.</li>
                  <li>Delivery receipts verify completed packages.</li>
                </ul>
              </section>

              <section className="legal-section">
                <h2>Need help?</h2>
                <p>
                  Start with a small saved scene that has an active camera. If installation or sending
                  fails, include your Blender version, operating system, and package ID when you
                  <Link href="/contact"> contact support</Link>. Do not share private workspace links.
                </p>
              </section>

              <section className="legal-section">
                <h2>Checksum</h2>
                <p>Verify the downloaded ZIP with this SHA-256 hash:</p>
                <code>{ADDON_SHA256}</code>
              </section>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}


