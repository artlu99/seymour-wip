# Feed Me, Seymour 🪴

## a state-of-the-artlu June 2025 Mini App

This is a very different kind of Mini App. It has no auth, and the back end is really just a reverse proxy server. All work happens in the browser, using signer private keys provied by the user.

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
