CREATE TABLE public.donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text NOT NULL UNIQUE,
  email text,
  donor_name text,
  message text,
  amount_minor bigint NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'KES',
  channel text,
  status text NOT NULL DEFAULT 'success',
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.donations TO service_role;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Deny all direct access" ON public.donations AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);