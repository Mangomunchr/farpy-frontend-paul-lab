"use client";

import type { AnchorHTMLAttributes } from "react";
import { trackAnalyticsEvent } from "@/lib/analytics";

type TrackedDownloadLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  fileType: string;
};

export default function TrackedDownloadLink({ fileType, onClick, ...props }: TrackedDownloadLinkProps) {
  return (
    <a
      {...props}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) {
          trackAnalyticsEvent("addon_downloaded", { file_type: fileType, status: "started" });
        }
      }}
    />
  );
}
