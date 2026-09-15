## Pre-launch hardening plan

Goal: take the app from "works" to "safe to accept real orders from real customers."

### 1. Payments hardening (Paystack)

Right now the client sets `payment_status='paid'` as soon as Paystack's popup callback fires. That can be faked from devtools. Fix:

- New edge function `verify-paystack-payment` (verify_jwt=false, CORS enabled):
  - Input: `{ reference, order_id }`.
  - Calls Paystack `GET /transaction/verify/{reference}` with `PAYSTACK_SECRET_KEY`.
  - Confirms `status=success`, `amount` matches the order's `total_amount * 100`, `currency` matches, and reference isn't already used.
  - Uses service role to update `orders.payment_status='paid'`, `paystack_reference`, `payment_verified_at`.
  - Returns `{ verified: true }` or a clear error.
- Add `PAYSTACK_SECRET_KEY` via `add_secret` (user pastes their live secret key).
- `useCreateOrder` change: insert order with `payment_status='pending'`, then after Paystack popup success, invoke `verify-paystack-payment`. Only show OrderSuccess when verification returns true; otherwise show a "we couldn't confirm payment" state.
- Cash-on-delivery flow unchanged.
- Migration: add `payment_verified_at timestamptz` on `orders`; RLS unchanged (verification happens as service role).

### 2. Seller onboarding UX

Replace raw-UUID admin with an email + request flow.

- Migration:
  - `seller_requests` table (`user_id`, `store_name`, `pitch`, `status` enum `pending|approved|rejected`, `reviewed_by`, `reviewed_at`).
  - GRANT + RLS: user can insert/select their own; admin can select all + update status.
  - Security-definer function `approve_seller_request(request_id)` — flips status, inserts `user_roles(seller)`, creates a `vendors` row from the request. Admin-only via `has_role` check inside the function.
  - View `admin_users_directory` (SECURITY DEFINER function) that returns `{user_id, email, created_at}` from `auth.users` — admin-only. Lets `/admin` look users up by email without exposing `auth.users`.
- Frontend:
  - New "Become a seller" page/modal on `/` for signed-in non-sellers: store name + short pitch → inserts into `seller_requests`.
  - `/admin` gets two tabs: "Requests" (approve/reject) and "Sellers" (list + revoke). Add user lookup by email using the new function; keep UUID grant as a fallback.
  - `UserMenu` shows "Become a seller" when the user has no seller role and no pending request; "Request pending" when one exists.

### 3. Order fulfillment emails (Lovable Email)

Prerequisites will be handled automatically: check email domain → if missing, show the setup dialog and stop until the user finishes; then set up email infra and scaffold app emails.

Templates (React Email in `supabase/functions/_shared/transactional-email-templates/`):
- `order-confirmation-buyer` — order number, items (name/qty/price), total, shipping address, payment status.
- `new-order-seller` — per-seller: items in that seller's vendor, buyer name, shipping address, link to `/seller/orders`.
- `order-status-update-buyer` — sent when seller changes fulfillment status (confirmed/shipped/delivered).

Triggers:
- After successful payment verification (card) or order insert (COD): edge function `send-order-emails` fans out — one buyer email + one email per distinct vendor in the order. Idempotency key: `order-confirm-{order_id}` / `new-order-{order_id}-{vendor_id}`.
- On `orders.status` update from `SellerOrders`, invoke `send-transactional-email` with `order-status-update-buyer` (idempotency key includes status).

Registry updated; `send-transactional-email` and `send-order-emails` deployed.

### 4. Legal + storefront polish

- Static pages under `/legal`:
  - `/legal/terms`, `/legal/privacy`, `/legal/refund`, `/legal/shipping`.
  - App-owned content, matching site design system (Space Grotesk / DM Sans, existing tokens). Reuses `Footer`. Placeholders for company name / contact email that the user can fill in on the page directly — I'll ask for those values in the next turn if needed, otherwise ship with `[Your Business Name]` placeholders and a note in chat.
- Footer: replace whatever legal links exist today with links to the four pages above + `mailto:` contact.
- SEO metadata in `index.html`: real `<title>`, `<meta name="description">`, matching `og:title` / `og:description` / `og:type` / `twitter:card` for the storefront.
- Storefront empty/low-catalog state: when < 4 products, show a "Featured stores" strip built from `vendors.is_active=true` instead of an empty grid, plus a "Become a seller" CTA for signed-in non-sellers.

### Order of implementation

1. Migration (payment_verified_at, seller_requests, admin_users_directory, approve_seller_request).
2. Edge functions: `verify-paystack-payment`, later `send-order-emails`.
3. Wire client: `useCreateOrder` + Paystack flow + "Become a seller" + `/admin` requests tab.
4. Email domain check → setup infra → scaffold app emails → three templates → deploy → wire triggers.
5. Legal pages + footer + SEO + storefront empty state.

### What I need from you before building

- `PAYSTACK_SECRET_KEY` — I'll open the secret form when it's time.
- Business/legal contact email + business name for legal pages (or say "use placeholders and I'll edit later").
- Do you already own an email sending domain (e.g. `notify.yourshop.com`) or should I open the email setup dialog when we get there?