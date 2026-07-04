import type { Metadata } from "next";

import { OpsCommandCenter } from "@/components/OpsCommandCenter";

export const metadata: Metadata = {
  title: "Farpy Ops",
  description: "Internal Farpy operations command center.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function OpsPage() {
  return <OpsCommandCenter />;
}
