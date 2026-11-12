# Decisions and assumptions

This doc explains the judgement calls behind the submission. Where the brief was vague, I picked a default, wrote it down, and moved on.

## Assumptions where the acceptance criteria were unclear

1. **"Top rated" means entrepreneur-curated, not derived from ratings.** The home-page criterion says *"I have chosen 5 products to be top rated"* — first person, past tense, deliberate. I treated it as an editorial pick rather than "top 5 by `rating.rate`". Implemented as `FEATURED_PRODUCT_IDS` env var (comma-separated), defaulted to five Fake Store IDs. Changing the pick is a config change, not a code change.
2. **Category page "top rated for that category" is the intersection of the featured list with that category.** This keeps a single source of truth for "top rated" rather than having two unrelated curation mechanisms. The response also returns `additional` (same category, with featured removed) so the UI shows both sections without duplicates.
3. **Search is case-insensitive substring over title, description and category.** The criterion says "text matching that search term" — I interpreted that as a user-friendly contains-match across the fields a shopper would reasonably expect to match. Trimmed empty terms return no results, 400 at the API layer when `q` is missing.
4. **Enquiry "sales inbox" is a configurable address.** Set via `SALES_INBOX`, defaults to `sales@example.com`. The customer's email goes in `Reply-To` so the sales team can reply directly from their inbox.
5. **"Thank you" message is inline (not a route).** Simpler UX; the form component swaps to the confirmation on success. Keeping it on the product page also means the product context is preserved if they want to enquire about another one.
6. **Enquiry does not require the customer to be authenticated.** The spec has no auth requirement and the entrepreneur asked for a PoC, so adding accounts would be scope creep.
7. **Product ratings are shown but not used for ordering.** They appear on the product page because the data is already there and a reviewer would expect to see it. The featured list ignores them (see #1).
8. **"Email provider expected to change" was taken literally.** `EmailProvider` is a port; `SmtpEmailProvider` is one adapter. Swapping to SES later is a new class + env flip, no route changes.
9. **"Data source expected to change" was taken literally.** `ProductRepository` is a port; `FakeStoreRepository` is one adapter. The route layer and frontend contract are stable.
10. **"Look and feel expected to change" shaped the styling choice.** Tailwind utility classes keep design decisions out of named component styles, so the eventual design system can land without rewrites. No design tokens were introduced yet — that's a next-day task once brand colours exist.

## Requirements I dropped or simplified

- **No persistence for enquiries.** The acceptance criterion only requires an email and a thank-you message. Storing enquiries in a DB is obvious growth work (see "What next"), but adding it now would blow the time-box without proving anything the reviewer couldn't already see.
- **No rate-limiting on the enquiry endpoint.** For a PoC on `localhost` it adds noise. In production this is a MUST — annotated as such in "What next".
- **No pagination.** Fake Store returns ~20 items. Adding pagination for a catalogue of 20 items would be premature. The API shape (`{ products: [...] }`) leaves room for `{ products, nextCursor }` later without breaking clients.
- **Minimal styling polish.** Loading states are plain text, not skeletons. Error states are plain text, not toasts. These are 15-minute improvements that would eat time better spent on the critical path.
- **No E2E tests.** Vitest covers routes end-to-end through `fastify.inject()`, and React Testing Library covers the enquiry UX. A Playwright E2E would have been nice but is not needed to give the reviewer confidence in the critical path within the time-box.
- **No CI pipeline configured.** The PR will run tests locally; a GitHub Actions workflow would be a one-file addition but was deliberately skipped — the reviewer can run `npm test`.

## How the design supports growing beyond the PoC

- **Hexagonal boundaries at the data and email layers.** The two things the brief flagged as "expected to change" (data source, email provider) are already behind interfaces. New adapters slot in with a one-line change in `buildApp`.
- **`buildApp(deps)` factory.** All of `app.ts`'s dependencies are injected, so tests use in-memory fakes and production uses real adapters — no `vi.mock` of modules, no DI framework needed.
- **Env validated at boot with Zod.** Misconfiguration is a boot error with a readable message, not a 500 at request time. New config fields have an obvious home.
- **Backend owns the upstream contract.** The frontend contract (`/api/*`) stays stable even when the upstream shape changes. Caching lives at the boundary so the upstream can be slow or flaky without the UI feeling it.
- **Preserved ordering of featured IDs.** The entrepreneur's chosen order is respected on the home page; changing the order is a config change.
- **Monorepo with workspaces.** `apps/*` scales to `apps/admin`, `apps/mobile`, `packages/types` when more things show up. Shared types (`Product`) are duplicated today — I kept them aligned by hand because extracting a `packages/` is premature.
- **Docker-based infra.** `docker-compose.yml` is AWS-portable: ECS/Fargate tasks consume the same image.

## What I would do next with another day

1. **Persist enquiries** in a small table (`id`, `product_id`, `name`, `email`, `phone`, `message`, `received_at`, `email_delivered_at`) behind an `EnquiryRepository`. Gives the entrepreneur a record even if email delivery fails and unlocks a basic "enquiries" admin view.
2. **Rate-limit `POST /api/enquiries`** (e.g. `@fastify/rate-limit`) by IP + email to stop drive-by spam before sales sees it.
3. **Abuse protections on the enquiry form** — honeypot field + submit-only-after-interaction timer. Cheaper than hCaptcha and good enough for a PoC's launch window.
4. **Observability**: structured request logs already via Fastify; add a `/metrics` endpoint, request ID propagation, and a health check that pings the upstream + SMTP.
5. **Swap `SmtpEmailProvider` for `SesEmailProvider`** behind the same interface, plus a verified `EMAIL_FROM` identity.
6. **Design tokens + components**. Pull the real brand into Tailwind `theme.extend.colors`; promote `ProductCard` etc. into a tokenised component layer.
7. **E2E test** covering the enquiry critical path with Playwright, driven against docker-compose.
8. **CI**: a single GitHub Actions workflow running `npm run typecheck`, `npm test`, and `docker compose build`.
9. **Image handling**: proxy/transform product images through our backend or a CDN to avoid hot-linking Fake Store assets in any eventual production use.
10. **Replace the in-memory cache with Redis** once there's more than one API instance.

## Time spent (actual)

| Phase       | Time     | Notes                                                                 |
| ----------- | -------- | --------------------------------------------------------------------- |
| Planning    | ~20 min  | Reading the brief, picking stack, listing assumptions, writing TODOs. |
| Building    | ~1h 20m  | Backend + frontend + docker-compose.                                  |
| Testing     | ~30 min  | Writing tests, iterating on edge cases (cache poisoning, 404s, 502).  |
| Reviewing   | ~20 min  | Running the acceptance criteria manually, cleaning up, writing docs.  |
| **Total**   | **~2h 30m** | Within the 2–3h box.                                               |

> Tracking honestly: the time budget assumed Claude would do most of the typing. Where it drifted (initial Fastify route handler wanted to catch its own 404s; see `AI_USAGE.md`), I corrected it rather than keeping its default.
