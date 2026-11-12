# AGENTS.md

Guidance for any AI coding agent working in this repo. Keep it short, honour the boundaries.

## Golden rules

1. **The client never calls the upstream product API directly.** All product reads go through `apps/api`. If you find yourself importing `fetch('https://fakestoreapi.com...')` from `apps/web`, stop.
2. **"Things that change" live behind interfaces.** `ProductRepository` and `EmailProvider` are ports. Add adapters; don't bury switch-statements in routes. New adapter = new file + one line in `buildApp`.
3. **Config is validated at boot.** New env var? Add it to `apps/api/src/config.ts` (Zod schema) **and** `.env.example`. No `process.env.FOO` reads outside `config.ts`.
4. **Dependencies are injected.** `buildApp({ config, repository?, emailProvider? })` is how tests plug in fakes. Don't `vi.mock` modules.
5. **Types shared by hand.** `Product` lives in two places (api + web) deliberately — the HTTP contract is the real boundary. If more shared types appear, extract `packages/shared` rather than importing across apps.
6. **Featured list is editorial, not computed.** `FEATURED_PRODUCT_IDS` is a config knob, not a ratings query.
7. **Validate request bodies with Zod.** Return `400` with issue details. Don't trust shapes.

## Running

- `docker compose up -d --build` → API + MailHog
- `npm install && npm run dev:web` → frontend at http://localhost:5173
- `npm test` → all workspace tests

## Tests

- Backend route tests use `fastify.inject()` so they don't bind a port.
- Frontend tests use RTL + jsdom. Stub `fetch` via `vi.stubGlobal`.
- Prefer behaviour-level assertions ("renders a thank-you after submit") over implementation details.
