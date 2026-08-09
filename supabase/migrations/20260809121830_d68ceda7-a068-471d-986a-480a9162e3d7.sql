ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS province text,
  ADD COLUMN IF NOT EXISTS postal_code text;