## Seller Dashboard — Build Plan

### 1. Roles & access control (DB)
- Create `app_role` enum: `admin`, `seller`.
- Create `user_roles` table (`user_id`, `role`, unique together) + `has_role(user_id, role)` security-definer function.
- Bootstrap: first admin is assigned via a one-off migration for the current signed-in user (I'll ask which email after the plan is approved). After that, only admins assign the `seller` role.
- Simple `/admin` page (visible to admins only) to grant/revoke the seller role by user email.

### 2. Storefront data model (DB)
- `vendors` — one row per seller: `user_id` (FK auth.users), `store_name`, `description`, `avatar_url`, `is_active`. Row is auto-created the first time a seller opens their dashboard.
- `products` — `vendor_id`, `name`, `description`, `price`, `category`, `images` (text[]), `stock`, `is_active`.
- Add `vendor_id` (nullable snapshot) to existing `order_items` so seller order queries are cheap.

RLS:
- `products`: anyone can read active rows; owner seller can CRUD their own; admin full.
- `vendors`: anyone can read active; owner + admin can update.
- `order_items`: existing user policies remain; add "seller can view items for their vendor".
- `orders`: add "seller can view orders that contain their items" (via security-definer helper to avoid recursion).

### 3. Image storage
- Create public `product-images` bucket.
- RLS on `storage.objects`: sellers can upload/update/delete inside `{vendor_id}/…`; public read.
- Seller product form uploads via `supabase.storage`; stores resulting public URLs in `products.images`.

### 4. Frontend — seller area
Routes under `/seller` guarded by `has_role(auth.uid(),'seller')`:

```text
/seller                 → dashboard home (analytics)
/seller/products        → list + search + toggle active + delete
/seller/products/new    → create form (multi-image upload)
/seller/products/:id    → edit form
/seller/profile         → edit store name / description / avatar
/seller/orders          → orders containing this seller's items, with fulfillment status update
```

Layout: shadcn `Sidebar` (Dashboard, Products, Orders, Store profile, Sign out), collapsible, active-route highlight, header with `SidebarTrigger`.

Analytics on `/seller`: total revenue, order count, units sold, top 5 products (aggregated from `order_items` where `vendor_id = me`, `orders.payment_status = 'paid'` or all — I'll include both totals).

### 5. Storefront + AI chat wiring
- Replace `mockProducts` usage in `Index.tsx` and `ChatBot.tsx` with the live `useProducts()` hook (already backed by the `products` table).
- `useCreateOrder` snapshots `vendor_id` into each `order_items` row.
- Empty state on the homepage when no products exist yet (guides admin to grant seller role → seller adds products).

### 6. Admin page
- `/admin` route (admin only): search users by email, grant/revoke `seller` role, see current sellers list.

### Technical notes
- All `public` tables ship with `GRANT` + RLS + policies in one migration.
- `has_role` is `SECURITY DEFINER` to avoid RLS recursion on cross-table policies.
- Storage bucket created via `supabase--storage_create_bucket` (not raw SQL).
- Sidebar uses shadcn `Sidebar` per project convention; no new deps.
- Nothing is deleted from the current cart/checkout flow — only extended.

### Deliverables
- One DB migration (roles, vendors, products, order_items.vendor_id, RLS, policies, grants).
- Storage bucket + object-level RLS migration.
- New pages: `SellerLayout`, `SellerDashboard`, `SellerProducts`, `SellerProductForm`, `SellerOrders`, `SellerProfile`, `AdminUsers`.
- New hooks: `useRole`, `useMyVendor`, `useMyProducts`, `useMyOrders`, `useSellerStats`.
- Storefront + ChatBot switched to live products.
- Route guards + nav entry in navbar (shows "Seller Dashboard" when the user has the role, "Admin" for admins).

### What I need from you before building
Which email address should be the first admin? (I'll seed it in the migration; you'll be able to grant seller access to others from the `/admin` page after that.)
