-- Feed tables had no Data API grants, so the app could not read the feed.
GRANT SELECT ON public.feed_posts TO anon, authenticated;
GRANT ALL ON public.feed_posts TO service_role;
GRANT ALL ON public.feed_reactions TO service_role;
GRANT ALL ON public.feed_job_tokens TO service_role;