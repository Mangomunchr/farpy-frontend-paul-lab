export type WorldTimelineStepId = "received" | "payment" | "dispatcher" | "factory" | "rendering" | "packaging" | "delivered";
export type WorldJourneyState = "complete" | "active" | "upcoming" | "failed";

export const worldTimelineSteps: Array<{
  id: WorldTimelineStepId;
  icon: string;
  label: string;
  currentSentence: string;
}> = [
  {
    id: "received",
    icon: "📦",
    label: "Package received",
    currentSentence: "Your package arrived safely.",
  },
  {
    id: "payment",
    icon: "$",
    label: "Payment / Start package",
    currentSentence: "Start package to enter dispatch queue.",
  },
  {
    id: "dispatcher",
    icon: "🧭",
    label: "Dispatcher",
    currentSentence: "Finding the best available render partner.",
  },
  {
    id: "factory",
    icon: "🏭",
    label: "Render partner",
    currentSentence: "A render partner accepted your package.",
  },
  {
    id: "rendering",
    icon: "⚡",
    label: "Rendering",
    currentSentence: "Your package is being prepared by a render partner.",
  },
  {
    id: "packaging",
    icon: "📦",
    label: "Packaging",
    currentSentence: "Preparing your download.",
  },
  {
    id: "delivered",
    icon: "📬",
    label: "Package delivered",
    currentSentence: "Your package arrived successfully.",
  },
];

export const worldStatusLabels = {
  created: "Package received",
  uploaded: "Package received",
  queued: "Package received",
  submitted: "Dispatcher",
  running: "Rendering",
  complete: "Package delivered",
  failed: "Package stopped",
  cancelled: "Cancelled",
  expired: "Expired",
} as const;

export function formatRendererName(value?: string | null) {
  if (!value) return null;
  const normalized = String(value).trim().toLowerCase();
  if (normalized === "blender") return "Blender";
  if (normalized === "octane") return "Octane";
  return String(value).trim();
}

export function packageTitleForStatus(status?: string | null) {
  if (status === "complete") return "Package delivered.";
  if (status === "failed") return "Package stopped.";
  if (status === "cancelled") return "Cancelled";
  if (status === "expired") return "Expired";
  if (status === "running") return "Rendering";
  if (status === "submitted") return "Dispatcher";
  if (status === "queued") return "Package received";
  return "Package tracker";
}

export function packageSentenceForStatus(options: {
  status?: string | null;
  paymentWaitingMessage?: string;
  failureMessage?: string | null;
}) {
  const { status, paymentWaitingMessage, failureMessage } = options;
  if (status === "complete") return "Package delivered. Receipt verified.";
  if (status === "running") return "Your package is being prepared by a render partner.";
  if (status === "failed") return failureMessage || "Rendering stopped before completion.";
  if (paymentWaitingMessage) return paymentWaitingMessage;
  return "Looking for an available render partner.";
}

export function nextStepForStatus(status?: string | null) {
  if (status === "complete") return "Download package result and verify the delivery receipt.";
  if (status === "failed") return "Review Verification Details or start a new package.";
  if (status === "running") return "Packaging results after rendering finishes.";
  if (status === "submitted" || status === "queued") return "Dispatcher finds an available render partner.";
  return "Send package to Farpy.";
}

export function journeyProgressValue(state: WorldJourneyState) {
  if (state === "complete") return 100;
  if (state === "active") return 60;
  return 0;
}

export function journeyStateLabel(state: WorldJourneyState) {
  if (state === "complete") return "✓ Complete";
  if (state === "active") return "In progress";
  if (state === "failed") return "Stopped";
  return "Waiting...";
}
