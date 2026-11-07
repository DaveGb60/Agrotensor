CREATE TABLE public.farm_insight_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text NOT NULL,
  project_id text NOT NULL,
  project_title text NOT NULL DEFAULT '',
  question text NOT NULL,
  answer text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.farm_insight_history TO service_role;
ALTER TABLE public.farm_insight_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Deny direct access" ON public.farm_insight_history AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
CREATE INDEX farm_insight_history_device_created_idx ON public.farm_insight_history (device_id, created_at DESC);