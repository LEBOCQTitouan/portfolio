import Script from "next/script";

// Cloudflare Web Analytics — privacy-friendly, cookieless. The token comes from
// the Cloudflare dashboard (Web Analytics → your site → JS snippet).
const token = process.env.NEXT_PUBLIC_CF_BEACON_TOKEN;

export function Analytics() {
  if (!token) return null;
  return (
    <Script
      defer
      src="https://static.cloudflareinsights.com/beacon.min.js"
      data-cf-beacon={JSON.stringify({ token })}
      strategy="afterInteractive"
    />
  );
}
