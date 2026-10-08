CREATE TABLE public.feed_job_tokens (
  id smallint PRIMARY KEY DEFAULT 1,
  token text NOT NULL DEFAULT encode(extensions.gen_random_bytes(32), 'hex'),
  CONSTRAINT single_row CHECK (id = 1)
);
GRANT ALL ON public.feed_job_tokens TO service_role;
ALTER TABLE public.feed_job_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Deny all direct access" ON public.feed_job_tokens AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
INSERT INTO public.feed_job_tokens (id) VALUES (1) ON CONFLICT DO NOTHING;
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;