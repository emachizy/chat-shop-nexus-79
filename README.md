# Chat Shop Nexus

An e-commerce storefront with a conversational AI shopping assistant. Instead of hunting through category pages and filters, shoppers describe what they want — product name, brand, model, color, size, dimensions — in a chat sidebar, and the assistant searches the catalog, ranks the best matches, and lets you add items to cart, check out, and pay, all without leaving the conversation.

## Features

- **AI shopping assistant (chat sidebar)** — describe a product in natural language and get ranked recommendations. Understands intent for greetings, product search, "specs of X", "add X to cart", "remove X from cart", "show cart", "checkout", and "pay now".
- **Relevance-ranked product search** — matches and scores products across name, brand, model, color, size, dimensions, category (with synonyms like "phone" → `phones`), and description, so more specific queries surface better results instead of any-keyword-matches-anything noise.
- **Cart & checkout** — persistent cart, quantity management, and a checkout flow that collects delivery details.
- **Payments** — Paystack integration for processing orders (Nigerian Naira).
- **Auth** — email/password sign-up, sign-in, and password reset via Supabase Auth.
- **Vendor-backed catalog** — products and vendors are modeled in Postgres (via Supabase) with row-level security so listings are publicly readable.

## Tech stack

- **Frontend:** React 18 + TypeScript, Vite, React Router
- **UI:** shadcn/ui (Radix primitives) + Tailwind CSS
- **Data/Auth:** Supabase (Postgres, Auth, Edge Functions)
- **AI:** OpenAI (`gpt-3.5-turbo`) called from a Supabase Edge Function — never from the browser
- **Payments:** Paystack
- **Forms/validation:** React Hook Form + Zod

## Project structure

```
src/
  components/       UI components (ChatBot, Cart, ProductGrid, Auth, Checkout, etc.)
  components/ui/    shadcn/ui primitives
  contexts/         React contexts (AuthContext)
  data/             Mock product/vendor data used for the storefront demo
  hooks/            Data hooks (useProducts, useCreateOrder, etc.)
  integrations/
    supabase/       Supabase client + generated DB types
  pages/            Route-level pages (Index, NotFound)
  services/         External service wrappers (Paystack)
  types/            Shared TypeScript types (Product, Vendor, CartItem, ChatMessage)
supabase/
  functions/
    chat-assistant/ Edge Function that proxies chat requests to OpenAI
  migrations/       SQL schema migrations
sql/                Supplementary SQL
```

## Architecture notes

**Chat assistant flow:** the browser sends the conversation to the `chat-assistant` Supabase Edge Function, which holds the OpenAI API key as a server-side secret and forwards the request to OpenAI. The client never sees or stores the key. Product search/ranking itself runs entirely client-side against the in-memory product list — the AI call is only used to generate the conversational reply, not to decide which products match.

**Product data:** the storefront currently renders from `src/data/mockData.ts`. A `useProducts` hook (`src/hooks/useDatabase.ts`) that reads live data from the Supabase `products` table also exists for wiring up real inventory. The `products` table includes optional `brand`, `model`, `color`, `size`, and `dimensions` columns (added in `supabase/migrations/20260915221109_add_product_attributes.sql`) that the search ranking will use as a bonus signal when populated, falling back to free-text matching against name/description otherwise.

## Getting started

### Prerequisites

- Node.js 18+ and npm (or bun — a `bun.lockb` is included)
- A Supabase project
- An OpenAI API key
- (Optional, for payments) A Paystack account and public key

### 1. Install dependencies

```sh
npm install
```

### 2. Configure Supabase

The Supabase project URL and anon/publishable key are already set in `src/integrations/supabase/client.ts` (the anon key is safe to expose client-side by design). If you're pointing this at your own Supabase project, update those two values.

Apply the database migrations in `supabase/migrations/` to your project (via the Supabase dashboard SQL editor or the Supabase CLI):

```sh
supabase db push
```

### 3. Deploy the chat assistant Edge Function

The OpenAI key must live on the server, not in the frontend. Set it as a Supabase secret and deploy the function:

```sh
supabase secrets set OPENAI_API_KEY=sk-...
supabase functions deploy chat-assistant
```

### 4. Configure Paystack (optional)

`src/components/PaystackCheckout.tsx` currently uses a placeholder Paystack public key. Replace `PAYSTACK_PUBLIC_KEY` with your own public key (public keys are safe to expose client-side) before testing real payments.

### 5. Run the dev server

```sh
npm run dev
```

The app is served locally with hot reload.

## Available scripts

| Script             | Description                          |
| ------------------ | ------------------------------------ |
| `npm run dev`       | Start the Vite dev server            |
| `npm run build`     | Production build                     |
| `npm run build:dev` | Development-mode build               |
| `npm run preview`   | Preview a production build locally   |
| `npm run lint`      | Run ESLint                           |

## Security

- The OpenAI API key is a server-side secret (Supabase Edge Function env var) and must never be committed or embedded in frontend code.
- Row-level security is enabled on all Supabase tables; products and vendors are publicly readable, while orders are scoped to the user who created them.
- If you're forking a version of this repo that predates the `chat-assistant` Edge Function, check git history for a hardcoded OpenAI key and revoke it on platform.openai.com before deploying.
