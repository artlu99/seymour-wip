# Preact SPA + Vite + Hono + Cloudflare Workers

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

## Rants and Credits

s/o **Borodutch** (aka `backmeupplz` aka `warpcastadmin.eth`) for his [front-end starter](https://github.com/Borodutch/frontend-starter), which makes a compelling case for no-fuss server-lite web app development. Only three dependencies: Preact, Tailwind, and Jotai!!!

 No router! No data fetching libraries! Every byte of code carries its own weight, and much more. I love how `DaisyUI` just gets out of the way, with very thoughtful abstractions. I swapped `jotai` for `zustand` 🐻 (don't like `Redux` patterns; easier for me to grok `useState` ++). I lean on `itty-fetcher` and `wouter` and `@tanstack/react-query`, all of which justify to me their nice abstractions.

My starter is full-stack and strictly type safe at runtime via `zod`. It provides the best DX I have found with end-to-end type-safety, across tRPC, TanStack Start, and kinda fake/unstrict type approaches like React Router v7 (née Remix). There is no codegen or boilerplate, not even magic that updates some type declaration files for you as you save files. `Hono`🔥 's approach is the shit.

FWIW the autocomplete and live type checking is magical, especially if you're typing manually like some white-haired wizard. For vibe coding, you kinda miss out on the benefits. But it does catch early the hallucinations/errors.

### ⏱ a short essay on seamless Sign In using Farcaster Connect (née SIWF)

Next is a heavier framework than I prefer. It loosely assumes a long-running server, and also ***middleware doing magic*** across everyone's deployments. Furthermore, NextAuth hides complexity under old assumptions and misnamed interfaces. The organization has a second-order security stance, as the market demands them to deliver fast and cheap. Two huge vulnerabilities across a few months in late 2024~early 2025 make it scary af to trust these guardians.

s/o **limone.eth** for a super clean, easy, batteries-included NextJs-based starter, which doesn't use NextAuth. His SIWF implementation, data storage, and notifications handling highlighted useful and transparent patterns, particularly in a low-maintenance build.

s/o **Dynamic** and **Privy** for incredible auth solutions within and around the FC ecosystem. These are teams whose reason for existence is to secure the onchain web experience, for tremendous amounts of value tested natively by trench monsters and via the dark forest. They use the best of web2 + web3 to provide robust, multi-layered security.

s/o **stephancill** for his FOSS examples in the FC ecosystem, leveraging common patterns like OAuth2 via Lucia. I find it somewhat important (at this stage) to roll-your-own-auth, absorbing the learnings of web2, but also questioning the requirements. Common auth frameworks often assume, or at least need to harmonize across, and appropriately lean on, centralized sources of authority and identity. This leads to a larger surface area than what is strictly needed in a purely trustless environment.

s/o to **deodad** for extremely useful discussion with first-principles thinking. SIWF is an evolving landscape for pushing forward the standard for UX and security around private keys. The next development will be sign in via web, which will be fascinating.

Note that my starter does not store JWT tokens in ephemeral `sessionStorage`, much less in persisted `localStorage`. JWT are generally exposed to snoopers and sniffers in web2, and used as one layer in a stack of secure connections, cookies, and expensive calls to huge databases (which need to be optimized). They cannot really be used as standalone bearer credentials, because they travel across untrusted networks to untrusted clients running in untrusted browser environments. And yet, each individual auth artifact expands the attack surface.

Follow the ongoing developments on Farcaster, including in the GH discussions.
