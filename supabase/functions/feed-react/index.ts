// Records a reader's like / dislike on a feed post (one reaction per device).
import {
  corsHeadersFor, isAllowedOrigin, serviceClient, trustedClientIp, allowRequest, logAndGenericError,
} from '../_shared/security.ts';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
  const cors = corsHeadersFor(req);
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  if (!isAllowedOrigin(req.headers.get('origin'))) return json({ error: 'Origin not allowed' }, 403);

  let body: { postId?: unknown; deviceId?: unknown; value?: unknown };
  try { body = await req.json(); } catch { return json({ error: 'Invalid request' }, 400); }
  const postId = typeof body.postId === 'string' ? body.postId : '';
  const deviceId = typeof body.deviceId === 'string' ? body.deviceId : '';
  const value = Number(body.value);
  if (!UUID.test(postId) || !UUID.test(deviceId) || ![1, -1, 0].includes(value)) {
    return json({ error: 'Invalid request' }, 400);
  }

  const db = serviceClient();
  if (!(await allowRequest(db, { key: `feed-react:${trustedClientIp(req)}`, limit: 60, windowSeconds: 600 }))) {
    return json({ error: 'Too many reactions. Please wait a moment.' }, 429);
  }

  try {
    const { data, error } = await db.rpc('feed_react', { p_post: postId, p_device: deviceId, p_value: value });
    if (error) throw error;
    return json(data);
  } catch (err) {
    return json({ error: logAndGenericError('feed-react', err) }, 500);
  }
});
