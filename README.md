# Threaded

A fashion-discovery application with a searchable product grid, product detail views, recommendations, a local shopping cart, and an AI chat interface.

[Website](https://threaded-psi.vercel.app) · [Source](https://github.com/anishkganesh/threaded)

## Overview

Threaded uses Next.js and Supabase for its application and account flows. The main product grid loads database records through a server API; some surrounding experiences are demonstrations backed by mock data or timed animations. The repository also retains components and routes from an earlier mining-analysis application.

## Features

- Sign up and sign in with Supabase email/password authentication.
- Load products from Supabase and display category filters and product details.
- Show related products using client-side category/style matching.
- Maintain a shopping cart in browser storage.
- Ask an OpenAI-backed chat interface questions with product/database context.
- Preview a notification feed and an animated fashion-agent interaction.

## Architecture

1. `app/page.tsx` requires a signed-in user through the client authentication hook.
2. `/api/products` reads the Supabase `products` table, ordering records by creation time and applying offset/limit pagination. The main page initially requests 50 products.
3. `lib/penn-products.ts` maps database rows into the UI product shape.
4. Product details, filtering, recommendations, and the cart operate in the browser.
5. Server chat routes call OpenAI and can retrieve database context.

The product mapper supplies several presentation defaults such as style, sizes, material, and stock state. Those defaults are not verified retailer inventory attributes. Related products are a heuristic filter, not a trained recommendation model.

## Tech stack

| Layer | Implementation |
| --- | --- |
| Application | Next.js 15, React 19, TypeScript |
| UI | Tailwind CSS, Radix/shadcn components |
| Identity and data | Supabase Auth and Postgres |
| AI chat | OpenAI |
| Cart persistence | Browser `localStorage` |

## Project structure

- `app/` — pages, login/signup, and server API routes.
- `components/` — fashion grid, product detail panels, agent UI, and retained analysis components.
- `lib/penn-products.ts` — database-to-product mapping.
- `lib/cart-context.tsx` — local cart state.
- `lib/` and `hooks/` — authentication, data access, and supporting utilities.
- `supabase/migrations/` — schema migrations, largely inherited from the mining application.
- `scripts/` — migration runners and data population scripts.

## Run locally

```bash
git clone https://github.com/anishkganesh/threaded-fashion.git
cd threaded-fashion
npm ci
```

Create `.env.local` yourself; no `.env.example` is committed:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-server-only-service-role-key
OPENAI_API_KEY=your-openai-key
```

Configure the database and Supabase Auth before starting:

```bash
npm run dev
```

Open `http://localhost:3000`, create an account, and sign in. For a production server, run `npm run build` and then `npm start`.

## Configuration and data

The fashion flow needs `products` and `users` tables. Product mapping reads fields including `id`, `product_url`, `image_url`, `name`, `price`, `domain`, `created_at`, `brand_name`, `category`, `description`, and `currency`. The signup handler creates an Auth user and then inserts a profile record, including handle, email, metadata, and timestamps.

Inspect `/api/auth/signup`, `/api/products`, and the Supabase queries for the exact schema and permissions. The committed SQL files are largely inherited from the mining application and do not constitute a complete fashion database bootstrap. Mining company/project population scripts do not populate the fashion catalog.

Keep the service-role key server-side. Configure access policies and production redirects in your own Supabase project.

## Usage

Sign in, browse the loaded catalog, inspect a product, and add items to the cart. Use chat for product exploration. The cart is local state: checkout, payment processing, and retailer order fulfillment are not implemented.

The notification page uses mock fashion-product data. The fashion-agent progress animation and its reported item count are simulated; the button does not run a live product crawler. Retained investor-memo and mining routes are separate from the primary fashion flow.

## Validation

```bash
npm run lint
npm run build
```

No dedicated automated fashion test suite is included. Manually verify signup/profile creation, login, catalog loading, filtering, details, chat, and cart persistence against a configured Supabase project. No runtime pass is asserted by this documentation review.

## Deployment

Deploy as a Next.js application with the same environment and database setup. Review `vercel.json` before deployment: it contains a function entry for `app/dashboard/page.tsx`, a path absent from this snapshot. The website link above is provided by the project metadata; availability has not been verified here.

## Limitations

- Authentication gating is implemented in the client; server endpoints require their own authorization review.
- The catalog depends on separately provisioned data.
- Several product attributes and surrounding interactions are defaults or mocks.
- Inherited modules increase the repository scope beyond the fashion application.

## Attribution and license

No standalone license file is included. This README does not grant a new license.
