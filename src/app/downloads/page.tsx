import type { Metadata } from "next";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Downloads",
  description: "Frozen Farpy public alpha desktop downloads and checksums.",
  alternates: { canonical: "/downloads" },
};

const BENCHMARK_DOWNLOADS = [
  {
    label: "Farpy Benchmark Windows installer",
    href: "/downloads/farpy-benchmark-windows-amd64.exe",
    sha256: "2B3FA677DB85232F1640BBFB5B862E7D0FD61926577B092DF7ADE8C80EC7D73A",
  },
  {
    label: "Farpy Benchmark Windows MSI",
    href: "/downloads/farpy-benchmark-windows-amd64.msi",
    sha256: "FDFFDA04D38AA36F7F9D2ABF2AF29BEF3CC5E04248A5E4FEEDF88684E4A37135",
  },
];

export default function DownloadsPage() {
  return (
    <>
      <SiteNav />
      <main className="legal">
        <div className="wrap">
          <div className="legal-inner">
            <header className="legal-head">
              <p className="legal-eyebrow">Downloads</p>
              <h1 className="legal-title">Farpy public alpha downloads</h1>
              <p className="legal-lede">
                Frozen desktop artifacts and SHA-256 checksums for the current public alpha. Completed render packages download from their workspace or delivery receipt links. Start with a small package before larger work.
              </p>
            </header>

            <div className="legal-body">
              <section className="legal-section">
                <h2>Farpy Benchmark</h2>
                <ul>
                  {BENCHMARK_DOWNLOADS.map((item) => (
                    <li key={item.href}>
                      <a href={item.href}>{item.label}</a>
                      <br />
                      <code>{item.sha256}</code>
                    </li>
                  ))}
                </ul>
                <p>Windows artifacts only. No macOS or Linux Benchmark installer is published in this release.</p>
              </section>

              <section className="legal-section">
                <h2>NodeMuncher</h2>
                <p>
                  NodeMuncher worker builds are internal alpha artifacts and are not published as
                  public user downloads. Farpy Benchmark is the public desktop utility for this release.
                </p>
              </section>

              <section className="legal-section">
                <h2>Blender add-on alpha</h2>
                <p>
                  <a href="/downloads/Farpy-Blender-Addon-unified.zip">Download Farpy Render Delivery Blender add-on</a>
                  <br />
                  ZIP SHA-256:
                  <br />
                  <code>8D5CA2D53C2C71736BF9D7205D61D07D49AF40C2BB8E6EA97B697ABC6FC6260B</code>
                </p>
              </section>

              <section className="legal-section">
                <h2>Non-blockers</h2>
                <ul>
                  <li>Linux download is not advertised in this release.</li>
                  <li>Windows code signing and SmartScreen reputation are not established.</li>
                  <li>macOS DMG is unsigned and not notarized.</li>
                </ul>
              </section>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}



