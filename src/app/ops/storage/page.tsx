import type { Metadata } from "next";

import { OpsStorageDashboard } from "@/components/OpsStorageDashboard";

export const metadata: Metadata = {
  title: "Storage | Farpy Ops",
  description: "Internal production storage operations.",
  robots: { index: false, follow: false },
};

export default function OpsStoragePage() {
  return <OpsStorageDashboard />;
}
