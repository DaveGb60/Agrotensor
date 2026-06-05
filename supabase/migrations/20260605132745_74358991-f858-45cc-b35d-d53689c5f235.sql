CREATE TABLE public.sync_shares (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  share_code text NOT NULL UNIQUE,
  project_count integer NOT NULL DEFAULT 0,
  record_count integer NOT NULL DEFAULT 0,
  projects jsonb NOT NULL DEFAULT '[]'::jsonb,
  records jsonb NOT NULL DEFAULT '[]'::jsonb,
  claim_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '7 days')
);

CREATE INDEX idx_sync_shares_code ON public.sync_shares(share_code);
CREATE INDEX idx_sync_shares_expires ON public.sync_shares(expires_at);

GRANT ALL ON public.sync_shares TO service_role;

ALTER TABLE public.sync_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deny all direct access"
ON public.sync_shares
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);