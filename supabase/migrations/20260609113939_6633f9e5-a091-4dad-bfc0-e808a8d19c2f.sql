-- Admin roles system
CREATE TYPE public.app_role AS ENUM ('master', 'admin');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  email text NOT NULL,
  invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check role without RLS recursion
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_any_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id)
$$;

-- RLS: authenticated users can read their own role; admins/master can read all
CREATE POLICY "Users can view own role" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_any_admin(auth.uid()));

-- Enforce: max 1 master, max 1 non-master admin (total 2 admin accounts)
CREATE OR REPLACE FUNCTION public.enforce_admin_limits()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  master_count int;
  admin_count int;
BEGIN
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

CREATE TRIGGER enforce_admin_limits_trigger
  BEFORE INSERT ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.enforce_admin_limits();

-- Auto-assign master role to the designated master email on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_master()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF lower(NEW.email) = 'gfibiongenesis@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role, email)
    VALUES (NEW.id, 'master', NEW.email)
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_master
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_master();
