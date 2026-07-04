
-- 1. Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'seller');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed first admin (idempotent). If the user doesn't exist yet, does nothing.
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM auth.users
WHERE lower(email) = lower('emachi2011@gmail.com')
ON CONFLICT (user_id, role) DO NOTHING;

-- 2. Vendors
CREATE TABLE public.vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  store_name TEXT NOT NULL DEFAULT 'My Store',
  description TEXT,
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.vendors TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendors TO authenticated;
GRANT ALL ON public.vendors TO service_role;

ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone views active vendors"
  ON public.vendors FOR SELECT
  USING (is_active = true OR user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Sellers create own vendor"
  ON public.vendors FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.has_role(auth.uid(), 'seller'));

CREATE POLICY "Sellers update own vendor"
  ON public.vendors FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete vendors"
  ON public.vendors FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER vendors_set_updated_at
  BEFORE UPDATE ON public.vendors
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3. Products
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(12,2) NOT NULL CHECK (price >= 0),
  category TEXT,
  images TEXT[] NOT NULL DEFAULT '{}',
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX products_vendor_id_idx ON public.products(vendor_id);
CREATE INDEX products_active_idx ON public.products(is_active);

GRANT SELECT ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone views active products"
  ON public.products FOR SELECT
  USING (
    is_active = true
    OR EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = products.vendor_id AND v.user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Sellers insert own products"
  ON public.products FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = products.vendor_id AND v.user_id = auth.uid())
    AND public.has_role(auth.uid(), 'seller')
  );

CREATE POLICY "Sellers update own products"
  ON public.products FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = products.vendor_id AND v.user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = products.vendor_id AND v.user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Sellers delete own products"
  ON public.products FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = products.vendor_id AND v.user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE TRIGGER products_set_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4. Extend order_items with vendor snapshot
ALTER TABLE public.order_items ADD COLUMN vendor_id UUID REFERENCES public.vendors(id) ON DELETE SET NULL;
CREATE INDEX order_items_vendor_id_idx ON public.order_items(vendor_id);

-- Sellers can see items that belong to their vendor
CREATE POLICY "Sellers view own order items"
  ON public.order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = order_items.vendor_id AND v.user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

-- Sellers can view orders that contain their items
CREATE OR REPLACE FUNCTION public.order_belongs_to_seller(_order_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.order_items oi
    JOIN public.vendors v ON v.id = oi.vendor_id
    WHERE oi.order_id = _order_id AND v.user_id = _user_id
  )
$$;

CREATE POLICY "Sellers view orders with own items"
  ON public.orders FOR SELECT
  TO authenticated
  USING (
    public.order_belongs_to_seller(id, auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );
