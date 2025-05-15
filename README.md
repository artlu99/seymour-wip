# Feed Me, Seymour 🪴

## a state-of-the-artlu Mini Apps full-stack starter

This amended Cloudflare template provides a batteries-included setup for building a Singe Page Application (SPA) using Preact, TypeScript, and Vite, designed to run on Cloudflare Workers with a serverless backend. It features hot module replacement, fast Biome linting, and the flexibility of Workers deployments.

<!-- dash-content-start -->

🚀 Supercharge your web development with this powerful stack:

* [**Preact**](https://preactjs.com/) - Fast 3kB alternative to React
* [**Vite**](https://vite.dev/) - Lightning-fast build tooling and development server
* [**Hono**](https://hono.dev/) - Ultralight, modern backend framework
* [**Cloudflare Workers**](https://developers.cloudflare.com/workers/) - Edge computing platform for global deployment

### ✨ Key Features

* 🎯 a modern and stable DX on Tailwind, JSX, Frames SDK, caching solution
* 🛠️ Rust-based Biome formatting and linting
* ⚡ Hot Module Replacement (HMR) for rapid development
* 📦 end-to-end type safety with no-codegen autocomplete
* 🔥 API routes with Hono's elegant routing
* 🔄 Zero-config deployment to Cloudflare

Get started in minutes with local development or deploy directly via the Cloudflare dashboard. Perfect for building modern, performant mini apps at the edge.

<!-- dash-content-end -->

## Development

Install dependencies:

```bash
pnpm install
```

Update variables in `wrangler.jsonc` and `.dev.vars`:

```bash
vi wrangler.jsonc
pnpm run types
```

Start the development server with:

```bash
pnpm dev
```

Your application will be available at [http://localhost:5173](http://localhost:5173).

### Mini App Preparation

This starter repository hands off aspects of Mini App wrapping to the evolving dev tooling. Anything I put in the starter today around Mini App packaging will be outdated every few weeks.

#### Steps

* apply your own graphic elements: favicon, icon, splash image

* global search-and-replace hard-coded URLs: `https://spa-mini-app-starter.artlu.workers.dev` with your prod domain.

* update `.well-known/farcaster.json` via dev tools.

* update meta tags in `index.html` via dev tools.

The developer experience for Mini Apps continues to evolve. Watch `/fc-devs` and `/miniapps` channels for discussion; follow `Gabe Ayuso` and `Linda Xie` for updates.

## Production

Build your project for production:

```bash
bun run build
```

Deploy your project to Cloudflare Workers:

```bash
bun run deploy
```

or via Cloudflare Workers dashboard (copy and paste contents of `.dev.vars`)
