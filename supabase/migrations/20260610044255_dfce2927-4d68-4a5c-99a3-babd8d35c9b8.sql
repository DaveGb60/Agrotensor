
-- Devices known to each admin
CREATE TABLE public.admin_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id text NOT NULL,
  label text,
  user_agent text,
  ip text,
  trusted boolean NOT NULL DEFAULT true,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, device_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_devices TO authenticated;
GRANT ALL ON public.admin_devices TO service_role;

ALTER TABLE public.admin_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view own devices"
ON public.admin_devices FOR SELECT TO authenticated
USING (user_id = auth.uid() AND public.is_any_admin(auth.uid()));

CREATE POLICY "Admins manage own devices"
ON public.admin_devices FOR DELETE TO authenticated
USING (user_id = auth.uid() AND public.is_any_admin(auth.uid()));

-- Single active session per admin
CREATE TABLE public.admin_active_session (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id uuid NOT NULL,
  device_id text NOT NULL,
  ip text,
  user_agent text,
  claimed_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.admin_active_session TO authenticated;
GRANT ALL ON public.admin_active_session TO service_role;

ALTER TABLE public.admin_active_session ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view own active session"
ON public.admin_active_session FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Claim the single session slot (run as caller via SECURITY DEFINER for atomic upsert)
CREATE OR REPLACE FUNCTION public.claim_admin_session(
  p_session_id uuid,
  p_device_id text,
  p_ip text,
  p_user_agent text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF NOT public.is_any_admin(uid) THEN
    RAISE EXCEPTION 'Not an admin';
  END IF;

  -- Register / refresh the device record
  INSERT INTO public.admin_devices (user_id, device_id, user_agent, ip)
  VALUES (uid, p_device_id, p_user_agent, p_ip)
  ON CONFLICT (user_id, device_id)
  DO UPDATE SET last_seen_at = now(), user_agent = EXCLUDED.user_agent, ip = EXCLUDED.ip;

  -- Replace the active session (this invalidates any previous device/IP)
  INSERT INTO public.admin_active_session (user_id, session_id, device_id, ip, user_agent)
  VALUES (uid, p_session_id, p_device_id, p_ip, p_user_agent)
  ON CONFLICT (user_id)
  DO UPDATE SET
    session_id = EXCLUDED.session_id,
    device_id = EXCLUDED.device_id,
    ip = EXCLUDED.ip,
    user_agent = EXCLUDED.user_agent,
    claimed_at = now(),
    last_seen_at = now();

  RETURN p_session_id;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_admin_session(uuid, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_admin_session(uuid, text, text, text) TO authenticated, service_role;

-- Validate that the supplied session is still the active one (and bump heartbeat)
CREATE OR REPLACE FUNCTION public.validate_admin_session(p_session_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  ok boolean;
BEGIN
  IF uid IS NULL THEN RETURN false; END IF;
  IF NOT public.is_any_admin(uid) THEN RETURN false; END IF;

  UPDATE public.admin_active_session
     SET last_seen_at = now()
   WHERE user_id = uid AND session_id = p_session_id
  RETURNING true INTO ok;

  RETURN COALESCE(ok, false);
END;
$$;

REVOKE ALL ON FUNCTION public.validate_admin_session(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.validate_admin_session(uuid) TO authenticated, service_role;

-- Quick "is this device known for me?" check used to gate the Admin link in the header
CREATE OR REPLACE FUNCTION public.is_device_trusted(p_device_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_devices
    WHERE user_id = auth.uid() AND device_id = p_device_id AND trusted = true
  );
$$;

REVOKE ALL ON FUNCTION public.is_device_trusted(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_device_trusted(text) TO authenticated, service_role;

-- Convenience: list/revoke
CREATE OR REPLACE FUNCTION public.revoke_admin_device(p_device_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  DELETE FROM public.admin_devices WHERE user_id = auth.uid() AND device_id = p_device_id;
  DELETE FROM public.admin_active_session
   WHERE user_id = auth.uid() AND device_id = p_device_id;
END;
$$;

REVOKE ALL ON FUNCTION public.revoke_admin_device(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.revoke_admin_device(text) TO authenticated, service_role;
