
-- Cloud Backup tables. Accessed only via edge functions using service role.
CREATE TABLE public.cloud_identities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recovery_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.cloud_identities TO service_role;
ALTER TABLE public.cloud_identities ENABLE ROW LEVEL SECURITY;
-- No policies: deny all to anon/authenticated. Edge functions use service role.

CREATE TABLE public.cloud_projects (
  cloud_id UUID NOT NULL REFERENCES public.cloud_identities(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL,
  payload JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (cloud_id, project_id)
);
GRANT ALL ON public.cloud_projects TO service_role;
ALTER TABLE public.cloud_projects ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.cloud_records (
  cloud_id UUID NOT NULL REFERENCES public.cloud_identities(id) ON DELETE CASCADE,
  record_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  fingerprint TEXT NOT NULL,
  payload JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (cloud_id, record_id)
);
CREATE INDEX cloud_records_by_project ON public.cloud_records(cloud_id, project_id);
CREATE INDEX cloud_records_by_fingerprint ON public.cloud_records(cloud_id, fingerprint);
GRANT ALL ON public.cloud_records TO service_role;
ALTER TABLE public.cloud_records ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.cloud_backups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cloud_id UUID NOT NULL REFERENCES public.cloud_identities(id) ON DELETE CASCADE,
  project_count INT NOT NULL DEFAULT 0,
  record_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX cloud_backups_by_cloud ON public.cloud_backups(cloud_id, created_at DESC);
GRANT ALL ON public.cloud_backups TO service_role;
ALTER TABLE public.cloud_backups ENABLE ROW LEVEL SECURITY;
