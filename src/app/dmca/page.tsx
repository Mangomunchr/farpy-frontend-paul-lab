import type { Metadata } from "next";
import InfoPage, { type InfoSection } from "@/components/InfoPage";

const UPDATED = "June 23, 2026";

export const metadata: Metadata = {
  title: "DMCA",
  description: "Farpy copyright removal and counter-notice information.",
  alternates: { canonical: "/dmca" },
};

const SECTIONS: InfoSection[] = [
  {
    heading: "Copyright removal contact",
    body: "Send copyright removal notices to dmca@farpy.com. Use this route only for copyright claims about files, outputs, or public receipt/proof material connected to Farpy.",
  },
  {
    heading: "Notice fields",
    items: [
      "Your legal name and contact email.",
      "A description of the copyrighted work you claim was infringed.",
      "The Farpy URL, job_id, receipt_id, or other location of the material.",
      "A statement that you have a good-faith belief the use is not authorized.",
      "A statement that the information is accurate and that you are authorized to act.",
      "Your physical or electronic signature.",
    ],
  },
  {
    heading: "Counter-notice basics",
    body: "If material was removed by mistake, send a counter-notice with your contact information, the removed material, a statement under penalty of perjury that it was removed by mistake or misidentification, consent to the proper legal jurisdiction, and your signature.",
  },
  {
    heading: "Repeat infringer policy",
    body: "Farpy may suspend or terminate access for users who repeatedly misuse the service to infringe copyrights or repeatedly submit abusive copyright notices.",
  },
];

export default function DmcaPage() {
  return (
    <InfoPage
      eyebrow="Legal"
      title="DMCA"
      updated={UPDATED}
      lede="Copyright removal and counter-notice basics for Farpy public alpha."
      sections={SECTIONS}
    />
  );
}
