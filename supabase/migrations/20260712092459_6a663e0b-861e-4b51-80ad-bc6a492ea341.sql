
-- 1. orders.payment_verified_at
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_verified_at TIMESTAMPTZ;

-- 2. seller_requests
DO $$ BEGIN
  CREATE TYPE public.seller_request_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.seller_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_name TEXT NOT NULL,
  pitch TEXT,
  status public.seller_request_status NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS seller_requests_one_pending_per_user
  ON public.seller_requests(user_id) WHERE status = 'pending';

GRANT SELECT, INSERT, UPDATE ON public.seller_requests TO authenticated;
GRANT ALL ON public.seller_requests TO service_role;

ALTER TABLE public.seller_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own requests" ON public.seller_requests
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users create own requests" ON public.seller_requests
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admins update requests" ON public.seller_requests
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER seller_requests_set_updated_at
  BEFORE UPDATE ON public.seller_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3. Approve seller request (admin only)
CREATE OR REPLACE FUNCTION public.approve_seller_request(_request_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r public.seller_requests%ROWTYPE;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  SELECT * INTO r FROM public.seller_requests WHERE id = _request_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'request not found'; END IF;
  IF r.status <> 'pending' THEN RAISE EXCEPTION 'request already processed'; END IF;

  UPDATE public.seller_requests
    SET status = 'approved', reviewed_by = auth.uid(), reviewed_at = now()
    WHERE id = _request_id;

  INSERT INTO public.user_roles(user_id, role)
    VALUES (r.user_id, 'seller')
    ON CONFLICT (user_id, role) DO NOTHING;

  INSERT INTO public.vendors(user_id, store_name, description, is_active)
    VALUES (r.user_id, r.store_name, r.pitch, true)
    ON CONFLICT DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_seller_request(_request_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  UPDATE public.seller_requests
    SET status = 'rejected', reviewed_by = auth.uid(), reviewed_at = now()
    WHERE id = _request_id AND status = 'pending';
END;
$$;

-- 4. Admin user lookup (email <-> id)
CREATE OR REPLACE FUNCTION public.admin_lookup_user_by_email(_email TEXT)
RETURNS TABLE(user_id UUID, email TEXT, created_at TIMESTAMPTZ)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  RETURN QUERY
    SELECT u.id, u.email::text, u.created_at
    FROM auth.users u
    WHERE lower(u.email) = lower(_email)
    LIMIT 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_get_user_emails(_user_ids UUID[])
RETURNS TABLE(user_id UUID, email TEXT)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  RETURN QUERY
    SELECT u.id, u.email::text FROM auth.users u WHERE u.id = ANY(_user_ids);
END;
$$;
