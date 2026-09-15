-- Add structured attributes so the shopping assistant can match on brand, model,
-- color, size, and dimensions instead of only free-text name/description search.
ALTER TABLE public.products
  ADD COLUMN brand TEXT,
  ADD COLUMN model TEXT,
  ADD COLUMN color TEXT,
  ADD COLUMN size TEXT,
  ADD COLUMN dimensions TEXT;
