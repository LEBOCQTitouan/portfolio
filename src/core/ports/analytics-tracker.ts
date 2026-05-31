import type { ReactNode } from "react";

export interface AnalyticsTracker {
  /** Renders the tracking beacon (or nothing). */
  Beacon(): ReactNode;
}
