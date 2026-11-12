# AI usage

This submission was built with AI pair-programming. Every line was reviewed before it landed. This document records what was used, how, where AI was wrong, and how I caught it.

## Tools and models

- **Cursor IDE** with Claude (Opus-class model) as the primary assistant.
- Used in **agent mode**: the assistant was given the brief + my choices, proposed a plan, scaffolded files, ran commands locally with my oversight, and iterated based on test runs and type errors.

No other AI products were used. No paid API keys are required to review this repo.

## Agent instruction files in this repo

- `AGENTS.md` at the repo root — short instruction file that tells any future agent what the architectural rules are (ports/adapters at the data + email boundaries, env validated at boot, no direct Fake Store calls from the client). This is the one thing I want persisted so the codebase doesn't drift.

No `.cursor/rules/` or `CLAUDE.md` is committed; the whole project is small enough that `AGENTS.md` does the job.

## Plan I used

Before any code was written, I agreed a plan with the assistant (and recorded it in [`DECISIONS.md`](./DECISIONS.md)):

1. Pick stack (React + Vite + TS + Fastify + TS) and justify in README.
2. Draw the boundaries the brief told me would move: product data source, email provider. Each becomes an interface with one adapter.
3. Decide "top rated" is editorial curation (env config), not a ratings-derived list — spec says "I have chosen 5 products".
4. One-file-per-concern, injected dependencies, `buildApp(deps)` factory so tests use fakes.
5. Critical-path tests: happy + unhappy routes, cache behaviour, enquiry form UX.
6. Two commands to run locally: `docker compose up -d --build` + `npm run dev:web`.

## Key prompts / moments that shaped the solution

1. **"Treat 'top rated' as curated, not computed."** My first prompt reframing this as entrepreneur-chosen IDs is the single decision that most shaped the design. It moved what could have been business logic into config, which matches the spec's wording *"I have chosen 5 products"* and makes the home page content editorial — the right ownership for a tiny team.

2. **"The two things that will change — data source and email provider — need to be behind interfaces before any routes exist."** Asked the assistant to produce `ProductRepository` and `EmailProvider` first, and only after those were agreed did I let it write routes. This prevented the common AI-generated-code failure where business logic gets baked into a framework handler and is painful to extract later.

3. **"Don't mock modules in tests — inject fakes."** The assistant's first test pass used `vi.mock('nodemailer', ...)`. I pushed back: that tests the mock, not my app. I switched to injected `FakeEmailProvider` / `InMemoryProductRepository` through `buildApp({ repository, emailProvider })`, which both reads better and tests behaviour.

4. **"Cache must coalesce concurrent reads and must invalidate on failure."** I specifically asked for these two properties in `FakeStoreRepository`. The first draft re-fetched on every request (ignoring the TTL comment), and a later draft kept a failed promise in the cache forever, serving stale errors. Both were caught by test cases I asked for by name: *"concurrent reads hit upstream once"* and *"failure does not poison the cache"*.

5. **"Return 502 — not 500 — when SMTP fails, and keep the user's data on the form."** Prompted to think about *which* failures are our fault vs upstream. The result: `502` from the API and a non-destructive error in the form (the user keeps their text and can retry).

## Where the AI got something wrong and how I caught it

- **Caught via tests**: the first `FakeStoreRepository` cached a failed `Promise` and poisoned itself; the dedicated "failure does not poison the cache" test failed loudly on the first run.
- **Caught via code review**: the first `products.ts` had the category route returning 200 with an empty payload for unknown categories. That would have made the acceptance criterion *"I click on a category link"* technically true even when the entrepreneur mistyped a URL. Changed to 404 + explicit 404 test.
- **Caught via code review**: initial Fastify server tried to listen on port `0` and read `host` from a hardcoded string. Moved everything through `loadConfig` and added a Zod schema so bad env fails at boot.
- **Caught via code review**: first `EnquiryForm` didn't preserve form state on a failed submit, so users would re-type everything after a network blip. Kept the state and only switched components on success.
- **Caught via code review**: first README listed `docker compose up` but the Vite dev server lived in the root, not inside compose — misleading. Clarified the two-command flow so a reviewer can actually run it in under 10 minutes.
- **Caught via code review**: initial version made the client call Fake Store directly on cache-miss "for speed". Reverted — the brief is explicit: *"Do not call the Fake Store API directly from the client; all product data must go through your backend."*

## Ownership

I own every line in the repo. I can defend each file in the follow-up interview, including:

- Why the client talks only to our backend (not just because the brief says so — see note on contract stability in `DECISIONS.md`).
- Why `FEATURED_PRODUCT_IDS` is a list of IDs and not a ratings query.
- Why the enquiry endpoint returns `202` instead of `200`/`201`.
- Why there is no `EnquiryRepository` yet but there is a clear place to add one.
- Why we use `fastify.inject()` for route tests rather than booting a port.
