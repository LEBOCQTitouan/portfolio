# Titouan Lebocq — Portfolio & Blog

Personal portfolio and technical blog. Engineering with the craft of design.

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS v4 · next-themes · Vitest · Cloudflare (OpenNext)

## Development

```bash
npm install      # install dependencies
npm run dev      # start the dev server
npm test         # run the test suite
npm run build    # production build (next build)
npm run preview  # build + run the Cloudflare worker locally
npm run deploy   # build + deploy to Cloudflare (needs `wrangler login`)
```

## Project structure

- `src/app` — routes and layouts (App Router)
- `src/components` — UI components
- `content/` — MDX posts and projects (added in Phase 2)
- `docs/superpowers/` — design spec and implementation plans

## Environment variables

Copy `.env.example` to `.env.local` and fill in what you have. Everything degrades gracefully when unset — the newsletter form returns a friendly message, comments and analytics simply don't render.

- `BUTTONDOWN_API_KEY` — newsletter (server-only). In production set it as a Cloudflare secret: `npx wrangler secret put BUTTONDOWN_API_KEY`.
- `NEXT_PUBLIC_GISCUS_*` — comments config from https://giscus.app (enable GitHub Discussions on the repo first).
- `NEXT_PUBLIC_CF_BEACON_TOKEN` — Cloudflare Web Analytics beacon token (Cloudflare dashboard → Web Analytics → your site → JS snippet).
