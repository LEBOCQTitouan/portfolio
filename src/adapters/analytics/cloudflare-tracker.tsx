import Script from "next/script";
import type { AnalyticsTracker } from "@/core/ports/analytics-tracker";

const token = process.env.NEXT_PUBLIC_CF_BEACON_TOKEN;

export const CloudflareTracker: AnalyticsTracker = {
  Beacon() {
    if (!token) return null;
    return (
      <Script
        defer
        src="https://static.cloudflareinsights.com/beacon.min.js"
        data-cf-beacon={JSON.stringify({ token })}
        strategy="afterInteractive"
      />
    );
  },
};
