import { CloudflareTracker } from "@/adapters/analytics/cloudflare-tracker";
import { NoopTracker } from "@/adapters/analytics/noop-tracker";
import { GiscusRenderer } from "@/adapters/comments/giscus-renderer";
import { NoopRenderer } from "@/adapters/comments/noop-renderer";
import type { AnalyticsTracker } from "@/core/ports/analytics-tracker";
import type { CommentsRenderer } from "@/core/ports/comments-renderer";

const hasGiscus =
  !!process.env.NEXT_PUBLIC_GISCUS_REPO &&
  !!process.env.NEXT_PUBLIC_GISCUS_REPO_ID &&
  !!process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID;

export const analytics: AnalyticsTracker = process.env.NEXT_PUBLIC_CF_BEACON_TOKEN
  ? CloudflareTracker
  : NoopTracker;
export const comments: CommentsRenderer = hasGiscus ? GiscusRenderer : NoopRenderer;
