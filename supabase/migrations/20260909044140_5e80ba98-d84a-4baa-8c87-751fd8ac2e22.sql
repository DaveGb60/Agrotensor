
CREATE TABLE public.ai_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  title text,
  preview text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ai_conversations_user_idx ON public.ai_conversations (user_id, updated_at DESC);

CREATE TABLE public.ai_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  role text NOT NULL CHECK (role IN ('user','assistant')),
  text text NOT NULL DEFAULT '',
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'sent' CHECK (status IN ('sending','sent','failed')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ai_messages_conversation_idx ON public.ai_messages (conversation_id, created_at);
CREATE INDEX ai_messages_user_idx ON public.ai_messages (user_id);

CREATE TABLE public.ai_daily_usage (
  user_id text NOT NULL,
  day date NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  message_count integer NOT NULL DEFAULT 0,
  image_count integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, day)
);

GRANT ALL ON public.ai_conversations TO service_role;
GRANT ALL ON public.ai_messages TO service_role;
GRANT ALL ON public.ai_daily_usage TO service_role;

ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_daily_usage ENABLE ROW LEVEL SECURITY;

-- No policies on purpose: all access goes through the AgroTensor AI edge
-- function using the service role, which scopes every query to the caller's
-- device id.

CREATE OR REPLACE FUNCTION public.ai_consume_quota(
  _user_id text,
  _messages integer DEFAULT 0,
  _images integer DEFAULT 0,
  _message_limit integer DEFAULT 20,
  _image_limit integer DEFAULT 5
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _today date := (now() AT TIME ZONE 'utc')::date;
  _msgs integer;
  _imgs integer;
BEGIN
  INSERT INTO public.ai_daily_usage (user_id, day)
  VALUES (_user_id, _today)
  ON CONFLICT (user_id, day) DO NOTHING;

  SELECT message_count, image_count INTO _msgs, _imgs
  FROM public.ai_daily_usage
  WHERE user_id = _user_id AND day = _today
  FOR UPDATE;

  IF _msgs + _messages > _message_limit THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'messages',
      'messages_used', _msgs, 'images_used', _imgs,
      'message_limit', _message_limit, 'image_limit', _image_limit);
  END IF;

  IF _imgs + _images > _image_limit THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'images',
      'messages_used', _msgs, 'images_used', _imgs,
      'message_limit', _message_limit, 'image_limit', _image_limit);
  END IF;

  UPDATE public.ai_daily_usage
  SET message_count = message_count + _messages,
      image_count = image_count + _images,
      updated_at = now()
  WHERE user_id = _user_id AND day = _today
  RETURNING message_count, image_count INTO _msgs, _imgs;

  RETURN jsonb_build_object('allowed', true, 'messages_used', _msgs, 'images_used', _imgs,
    'message_limit', _message_limit, 'image_limit', _image_limit);
END;
$$;

REVOKE ALL ON FUNCTION public.ai_consume_quota(text, integer, integer, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ai_consume_quota(text, integer, integer, integer, integer) TO service_role;
