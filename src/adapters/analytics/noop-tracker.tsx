import type { AnalyticsTracker } from "@/core/ports/analytics-tracker";

export const NoopTracker: AnalyticsTracker = { Beacon: () => null };
