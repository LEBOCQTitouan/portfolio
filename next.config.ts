import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  experimental: {
    viewTransition: true,
  },
};

export default nextConfig;

// Enable Cloudflare bindings during `next dev` (OpenNext adapter)
initOpenNextCloudflareForDev();
