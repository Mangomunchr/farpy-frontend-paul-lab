import type { Metadata } from "next";
import InfoPage, { type InfoSection } from "@/components/InfoPage";

const UPDATED = "June 23, 2026";

export const metadata: Metadata = {
  title: "Files",
  description: "Farpy public alpha file support, output ZIPs, frame PNGs, and retention notes.",
  alternates: { canonical: "/files" },
};

const SECTIONS: InfoSection[] = [
  {
    heading: "Supported uploads",
    body: "Farpy accepts Blender .blend files and Octane .orbx files. Blender supports stills and animations. Octane public alpha supports still renders only.",
  },
  {
    heading: "ZIP output",
    body: "Completed jobs produce a ZIP download. The ZIP contains rendered output files and metadata used for the receipt.",
  },
  {
    heading: "Frame PNG output",
    body: "Blender frame output is packaged as rendered frame files, commonly PNG files under the output folder in the ZIP. Octane still output is also delivered in the job ZIP.",
  },
  {
    heading: "Temporary file retention",
    body: "Farpy retains uploaded files and rendered outputs according to operational policies for rendering, delivery, support, storage management, abuse prevention, and maintenance.",
  },
  {
    heading: "Privacy",
    body: "Download and receipt access uses private job tokens. Do not share workspace, download, or receipt links unless you want the recipient to access that job.",
  },
];

export default function FilesPage() {
  return (
    <InfoPage
      eyebrow="Docs"
      title="Files"
      updated={UPDATED}
      lede="Plain-language notes about upload formats, outputs, and retention."
      sections={SECTIONS}
    />
  );
}
