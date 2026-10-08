CREATE TABLE public.feed_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  summary text NOT NULL DEFAULT '',
  body text NOT NULL,
  area text NOT NULL DEFAULT 'General',
  image_url text NOT NULL,
  links jsonb NOT NULL DEFAULT '[]'::jsonb,
  likes integer NOT NULL DEFAULT 0,
  dislikes integer NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.feed_posts TO anon, authenticated;
GRANT ALL ON public.feed_posts TO service_role;
ALTER TABLE public.feed_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read published posts" ON public.feed_posts FOR SELECT TO anon, authenticated USING (published = true);
CREATE INDEX feed_posts_created_idx ON public.feed_posts (created_at DESC);

CREATE TABLE public.feed_reactions (
  post_id uuid NOT NULL REFERENCES public.feed_posts(id) ON DELETE CASCADE,
  device_id text NOT NULL,
  value smallint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, device_id)
);
GRANT ALL ON public.feed_reactions TO service_role;
ALTER TABLE public.feed_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Deny all direct access" ON public.feed_reactions AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

CREATE OR REPLACE FUNCTION public.feed_react(p_post uuid, p_device text, p_value smallint)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE l int; d int;
BEGIN
  IF p_value = 0 THEN
    DELETE FROM public.feed_reactions WHERE post_id = p_post AND device_id = p_device;
  ELSE
    INSERT INTO public.feed_reactions (post_id, device_id, value) VALUES (p_post, p_device, p_value)
    ON CONFLICT (post_id, device_id) DO UPDATE SET value = EXCLUDED.value, created_at = now();
  END IF;
  SELECT count(*) FILTER (WHERE value = 1), count(*) FILTER (WHERE value = -1) INTO l, d
    FROM public.feed_reactions WHERE post_id = p_post;
  UPDATE public.feed_posts SET likes = l, dislikes = d WHERE id = p_post;
  RETURN jsonb_build_object('likes', l, 'dislikes', d);
END; $$;
REVOKE EXECUTE ON FUNCTION public.feed_react(uuid, text, smallint) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.feed_react(uuid, text, smallint) TO service_role;