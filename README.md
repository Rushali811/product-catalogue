# Product Catalogue (PoC)

A small product catalogue the entrepreneur can click through: home page, category pages, search, product details and an enquiry form that emails the sales inbox.

Products are sourced from the [Fake Store API](https://fakestoreapi.com/) **via our own backend** — the client never calls it directly, so the data source can be swapped later without touching the frontend.

## Stack

| Layer        | Choice                                         | Why                                                                                    |
| ------------ | ---------------------------------------------- | -------------------------------------------------------------------------------------- |
| Client       | React 18 + Vite + TypeScript + Tailwind        | Spec allows "TypeScript preferred"; fastest to boot; Tailwind keeps styling decisions out of the critical path until the real design arrives. |
| Backend      | Node.js 20 + Fastify + TypeScript + Zod        | Same TS preference; Fastify is small and schema-friendly; Zod validates both config and request bodies. |
| Email (dev)  | MailHog (SMTP + web UI) via `docker-compose`   | Free, no account, reviewer just opens `http://localhost:8025` to verify. Production can swap to SES (or anything SMTP) with env changes only. |
| Infra        | `docker-compose.yml` for API + MailHog         | Spec asks for AWS-compatible infra; Docker images are the common denominator (ECS/Fargate, App Runner, EKS). |

See [`DECISIONS.md`](./DECISIONS.md) for assumptions and trade-offs, and [`AI_USAGE.md`](./AI_USAGE.md) for how AI was used.

## Project structure

```
product-catalogue/
├── apps/
│   ├── api/                        # Fastify backend (the only thing that talks to Fake Store)
│   │   ├── src/
│   │   │   ├── app.ts              # buildApp() — dependencies injected for testability
│   │   │   ├── server.ts           # real entry point
│   │   │   ├── config.ts           # Zod-validated env config, fail-fast at boot
│   │   │   ├── repositories/
│   │   │   │   ├── ProductRepository.ts   # port
│   │   │   │   └── FakeStoreRepository.ts # adapter with in-memory TTL cache
│   │   │   ├── email/
│   │   │   │   ├── EmailProvider.ts       # port
│   │   │   │   └── SmtpEmailProvider.ts   # adapter (nodemailer SMTP)
│   │   │   └── routes/
│   │   │       ├── products.ts
│   │   │       └── enquiries.ts
│   │   └── test/                   # vitest + fastify.inject()
│   └── web/                        # React app
│       ├── src/
│       │   ├── api/client.ts       # typed wrapper — only talks to our backend
│       │   ├── components/         # ProductCard, ProductGrid, SearchBar, EnquiryForm, Layout
│       │   └── pages/              # Home, Category, Search, Product
│       └── test/                   # vitest + React Testing Library
├── docker-compose.yml              # api + mailhog
├── DECISIONS.md
├── AI_USAGE.md
└── README.md
```

## Prerequisites

- **Node.js ≥ 20**
- **Docker** (for MailHog; and optional containerised API)
- A free TCP port on **5173** (web), **3001** (api), **1025** (SMTP) and **8025** (MailHog UI)

## Run it locally (two commands, ~2 minutes)

```bash
# 1. Start API + MailHog (background)
docker compose up -d --build

# 2. Install deps and start the web app
npm install
npm run dev:web
```

Then open **http://localhost:5173**.

Checks:

- **Home** — 5 top-rated products
- **Category** (click any category in the top nav) — top rated + additional in that category
- **Search** — type and press Search; only matching products appear
- **Product** — click any card
- **Enquire** — fill the form and submit → you see a "Thank you" message, and the email appears in MailHog at **http://localhost:8025**

### Prefer not to use Docker for the API?

```bash
docker compose up -d mailhog         # just MailHog
cp apps/api/.env.example apps/api/.env
npm install
npm run dev:api                      # one terminal
npm run dev:web                      # another terminal
```

### Stopping

```bash
docker compose down
```

## Environment

Every service has an `.env.example`; copy to `.env` only if you want to override defaults.

- `apps/api/.env.example` — server port, upstream API URL, cache TTL, curated featured IDs, SMTP settings, sales inbox
- `apps/web/.env.example` — optional backend URL override

No secrets are committed. `docker-compose.yml` sets the dev values inline so new contributors don't need to copy anything.

## Tests

```bash
npm test            # runs all workspace tests
```

What's covered (the critical path):

**Backend** (`apps/api/test`)
- `products.test.ts` — featured curation + order, category listing, featured/additional split with no duplicates, search match rules, 404s for unknowns, 400s for bad input
- `enquiries.test.ts` — happy path (email sent, correct subject/reply-to), 400 on invalid payload, 404 for unknown product, 502 when the email provider fails
- `repository.test.ts` — mapping from upstream shape, TTL caching + request coalescing, cache invalidation on upstream failure, case-insensitive search

**Frontend** (`apps/web/test`)
- `EnquiryForm.test.tsx` — successful submit → "Thank you"; failing submit → visible error
- `ProductCard.test.tsx` — featured badge + link URL

## API

Base URL: `http://localhost:3001`

| Method | Path                                           | Purpose                                    |
| ------ | ---------------------------------------------- | ------------------------------------------ |
| GET    | `/health`                                      | Health check                               |
| GET    | `/api/products/featured`                       | 5 curated top-rated products, in order     |
| GET    | `/api/categories`                              | List of category names                     |
| GET    | `/api/categories/:category/products`           | `{ featured, additional }` for a category  |
| GET    | `/api/products/search?q=...`                   | Text search                                |
| GET    | `/api/products/:id`                            | Single product                             |
| POST   | `/api/enquiries`                               | Submit enquiry (validates, emails sales)   |

Payload for `POST /api/enquiries`:

```json
{
  "productId": 1,
  "name": "Alex Example",
  "email": "alex@example.com",
  "phone": "optional",
  "message": "Is it still in stock?"
}
```

## Deployment sketch (not implemented)

- API image → ECR → ECS Fargate (or App Runner); env comes from SSM/Secrets Manager.
- Swap `SmtpEmailProvider` for an `SesEmailProvider` (same interface) once a real sender identity exists.
- Swap `FakeStoreRepository` for a `PostgresProductRepository` (same interface) once real product metadata lands.
- Frontend → S3 + CloudFront; `VITE_API_URL` baked at build time.

## Time spent

See `DECISIONS.md` for a time breakdown.
