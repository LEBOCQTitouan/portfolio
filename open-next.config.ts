import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

export default defineCloudflareConfig({
  // The blog is fully prerendered (SSG, no revalidation), so serve cached
  // pages from Workers static assets. Without an incremental cache override
  // OpenNext uses a no-op cache that is never populated, which makes
  // prerendered dynamic routes (/blog/[slug], /blog/tags/[tag]) 404 at runtime.
  incrementalCache: staticAssetsIncrementalCache,
});
