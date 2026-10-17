# Threaded

A fashion-discovery application with a searchable product grid, product detail views, recommendations, a local shopping cart, and an AI chat interface.

## Overview

Threaded uses Next.js and Supabase for its application and account flows. The main product grid loads database records through a server API; the notification feed uses mock data.

## Features

- Sign up and sign in with Supabase email/password authentication.
- Load products from Supabase and display category filters and product details.
- Show related products using client-side category/style matching.
- Maintain a shopping cart in browser storage.
- Ask an OpenAI-backed chat interface questions with product/database context.
- Preview a notification feed built from mock data.

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
- `components/` — fashion grid, product details, sidebar, chat, and shared UI components.
- `lib/penn-products.ts` — database-to-product mapping.
- `lib/cart-context.tsx` — local cart state.
- `lib/` and `hooks/` — authentication, data access, and supporting utilities.

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

The app needs `products` and `users` tables, plus `chat_history` for saved chats. Product mapping reads fields including `id`, `product_url`, `image_url`, `name`, `price`, `domain`, `created_at`, `brand_name`, `category`, `description`, and `currency`. The signup handler creates an Auth user and then inserts a profile record, including handle, email, metadata, and timestamps.

Inspect `/api/auth/signup`, `/api/products`, and the Supabase queries for the exact schema and permissions.

Keep the service-role key server-side. Configure access policies and production redirects in your own Supabase project.

## Usage

Sign in, browse the loaded catalog, inspect a product, and add items to the cart. Use chat for product exploration. The cart is local state: checkout, payment processing, and retailer order fulfillment are not implemented.

The notification page uses mock fashion-product data.

## Validation

```bash
npm run lint
npm run build
```

No dedicated automated fashion test suite is included. Manually verify signup/profile creation, login, catalog loading, filtering, details, chat, and cart persistence against a configured Supabase project.

## Deployment

Deploy as a Next.js application with the same environment variables and database setup.

## Limitations

- Authentication gating is implemented in the client; server endpoints require their own authorization review.
- The catalog depends on separately provisioned data.
- Several product attributes and surrounding interactions are defaults or mocks.

## Attribution and license

No license file is included.
