
-- Helper: check the first path segment matches a vendor the user owns
CREATE OR REPLACE FUNCTION public.owns_vendor_folder(_folder TEXT, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.vendors v
    WHERE v.user_id = _user_id AND v.id::text = _folder
  )
$$;

CREATE POLICY "Sellers upload to own vendor folder"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'product-images'
    AND public.owns_vendor_folder((storage.foldername(name))[1], auth.uid())
  );

CREATE POLICY "Sellers update own vendor files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'product-images'
    AND public.owns_vendor_folder((storage.foldername(name))[1], auth.uid())
  );

CREATE POLICY "Sellers delete own vendor files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'product-images'
    AND public.owns_vendor_folder((storage.foldername(name))[1], auth.uid())
  );

CREATE POLICY "Authenticated read product images"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'product-images');
