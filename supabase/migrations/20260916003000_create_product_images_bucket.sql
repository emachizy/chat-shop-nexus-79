-- The storage policies in 20260704001705 reference the 'product-images' bucket,
-- but nothing ever created it. Uploads fail with "Bucket not found" until this runs.
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', false)
ON CONFLICT (id) DO NOTHING;
