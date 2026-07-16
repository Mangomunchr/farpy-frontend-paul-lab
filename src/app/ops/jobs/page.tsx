import type { Metadata } from "next";

import { OpsJobsDashboard } from "@/components/OpsJobsDashboard";

export const metadata: Metadata = {
  title: "Jobs | Farpy Ops",
  description: "Internal production render job operations.",
  robots: { index: false, follow: false },
};

export default function OpsJobsPage() {
  return <OpsJobsDashboard />;
}
