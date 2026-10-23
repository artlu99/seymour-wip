# Feed Me, Seymour 🪴

## a state-of-the-artlu June 2025 Mini App

This is a very different kind of Mini App. It has no auth, and the back end is really just a reverse proxy server. All work happens in the browser, using signer private keys provied by the user.

## What is this?

A Farcaster (social network) feed reader that runs entirely in your browser.

- **The app** (seymour.artlu.xyz): shows you a custom timeline of casts from people you pick, lets you like posts and reply
- **The twist**: there's no login system. You paste your own private key into the browser, and it signs your likes/replies locally. The server never sees it
- **The server** (Cloudflare Worker) is tiny — basically just a webhook catcher and a "what's this app's name" endpoint. It doesn't store data or handle keys
- The actual feed data comes from a separate external API (`shim.artlu.xyz`) that isn't in this repo

Think of it like: a thin webpage + a do-almost-nothing server, where your browser does all the real work.

## Development

Install dependencies:

```bash
bun install
```

Update variables in `wrangler.jsonc` and `.dev.vars`:

```bash
vi wrangler.jsonc
bun run types
```

Start the development server with:

```bash
bun dev
```

Your application will be available at [http://localhost:5173](http://localhost:5173).
