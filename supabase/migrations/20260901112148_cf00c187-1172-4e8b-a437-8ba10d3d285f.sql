-- 1. Rate limiting infrastructure
CREATE TABLE IF NOT EXISTS public.rate_limits (
  bucket_key text NOT NULL,
  window_start timestamptz NOT NULL,
  hits integer NOT NULL DEFAULT 0,
  PRIMARY KEY (bucket_key, window_start)
);

GRANT ALL ON public.rate_limits TO service_role;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Deny all direct access" ON public.rate_limits
  AS PERMISSIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_key text, p_limit integer, p_window_seconds integer
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  w timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  n integer;
BEGIN
  INSERT INTO public.rate_limits (bucket_key, window_start, hits)
  VALUES (p_key, w, 1)
  ON CONFLICT (bucket_key, window_start)
  DO UPDATE SET hits = public.rate_limits.hits + 1
  RETURNING hits INTO n;

  DELETE FROM public.rate_limits WHERE window_start < now() - interval '1 day';

  RETURN n <= p_limit;
END;
$$;

-- 2. Atomic share claim counter with a hard cap
CREATE OR REPLACE FUNCTION public.increment_share_claim(p_code text, p_max integer DEFAULT 10)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  n integer;
BEGIN
  UPDATE public.sync_shares
     SET claim_count = claim_count + 1
   WHERE share_code = p_code
     AND claim_count < p_max
     AND expires_at > now()
  RETURNING claim_count INTO n;
  RETURN n; -- NULL when missing, expired, or over the cap
END;
$$;

-- 3. AT-02: remove the hardcoded-email master trigger (master role already provisioned)
DROP TRIGGER IF EXISTS on_auth_user_created_master ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user_master();

-- 4. AT-09: race-safe admin limits
CREATE OR REPLACE FUNCTION public.enforce_admin_limits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  master_count int;
  admin_count int;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('user_roles_admin_limits'));
  SELECT count(*) INTO master_count FROM public.user_roles WHERE role = 'master';
  SELECT count(*) INTO admin_count FROM public.user_roles WHERE role = 'admin';

  IF NEW.role = 'master' AND master_count >= 1 THEN
    RAISE EXCEPTION 'Only one master admin is allowed';
  END IF;
  IF NEW.role = 'admin' AND admin_count >= 1 THEN
    RAISE EXCEPTION 'Only one invited admin is allowed';
  END IF;
  RETURN NEW;
END;
$$;

CREATE UNIQUE INDEX IF NOT EXISTS user_roles_one_per_role_idx
  ON public.user_roles (role) WHERE role IN ('master'::app_role, 'admin'::app_role);

-- 5. AT-04: make admin device/session logs append-only-ish (no client writes at all)
REVOKE INSERT, UPDATE, DELETE ON public.admin_active_session FROM anon, authenticated;
REVOKE INSERT, UPDATE ON public.admin_devices FROM anon, authenticated;
