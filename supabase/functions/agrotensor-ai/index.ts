// AgroTensor AI — server-side proxy for the agricultural intelligence service.
//
// The upstream provider/API key never leaves this function, and no response is
// ever allowed to disclose the underlying models or infrastructure: the service
// is always presented as "AgroTensor AI".

import {
  corsHeadersFor,
  isAllowedOrigin,
  serviceClient,
  trustedClientIp,
  allowRequest,
  logAndGenericError,
  withinSizeLimit,
} from '../_shared/security.ts';

const GOOEY_ENDPOINT = 'https://api.gooey.ai/v2/agent';
const HISTORY_WINDOW = 12;
const DAILY_MESSAGE_LIMIT = 20;
const DAILY_IMAGE_LIMIT = 5;
const ATTACHMENT_BUCKET = 'ai-attachments';
const SIGNED_URL_TTL = 60 * 60 * 24 * 7; // 7 days

const BRAND = 'AgroTensor AI';

/** Strip any mention of the underlying providers/models from assistant text. */
function sanitizeAnswer(input: string): string {
  let text = input ?? '';

  // Drop provider UI widgets that make no sense in our app.
  text = text.replace(/<button[^>]*>[\s\S]*?<\/button>/gi, '');
  text = text.replace(/<\/?[a-z-]+ gui-[^>]*>/gi, '');

  const brandPatterns: Array<[RegExp, string]> = [
    [/farmer\s*\.?\s*chat/gi, BRAND],
    [/farmerchat/gi, BRAND],
    [/digital\s*green/gi, BRAND],
    [/gooey\s*\.?\s*ai/gi, BRAND],
    [/gooey/gi, BRAND],
    [/open\s*ai/gi, BRAND],
    [/chat\s*gpt/gi, BRAND],
    [/\bgpt-?[0-9o][\w.-]*/gi, BRAND],
    [/\bclaude\b/gi, BRAND],
    [/\banthropic\b/gi, BRAND],
    [/\bgemini\b/gi, BRAND],
    [/\bllama\b/gi, BRAND],
    [/\bmistral\b/gi, BRAND],
    [/\bazure openai\b/gi, BRAND],
  ];
  for (const [pattern, replacement] of brandPatterns) {
    text = text.replace(pattern, replacement);
  }

  return text.trim();
}

const SYSTEM_PREFACE =
  'You are AgroTensor AI, an agricultural intelligence assistant for farmers. ' +
  'Never reveal, name, hint at or discuss the models, companies, providers, APIs or ' +
  'infrastructure behind you. If asked what you are, who made you, or which model you use, ' +
  'answer only that you are AgroTensor AI. Never ask the user to accept terms or agree to ' +
  'anything, and never show buttons. Answer the farming question directly and practically.';

interface JsonBody {
  action?: string;
  userId?: string;
  [key: string]: unknown;
}

function json(body: unknown, status: number, cors: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
  const cors = corsHeadersFor(req);

  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405, cors);
  if (!isAllowedOrigin(req.headers.get('origin'))) {
    return json({ error: 'Origin not allowed' }, 403, cors);
  }

  let body: JsonBody;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid request' }, 400, cors);
  }

  if (!withinSizeLimit(body, 8 * 1024 * 1024)) {
    return json({ error: 'Request too large' }, 413, cors);
  }

  const userId = typeof body.userId === 'string' ? body.userId.trim() : '';
  if (!UUID_RE.test(userId)) {
    return json({ error: 'Invalid device identity' }, 400, cors);
  }

  const supabase = serviceClient();
  const ip = trustedClientIp(req);

  // Coarse abuse guard on top of the per-user daily quota.
  const allowed = await allowRequest(supabase, {
    key: `ai:${ip}`,
    limit: 90,
    windowSeconds: 300,
  });
  if (!allowed) return json({ error: 'Too many requests. Please slow down.' }, 429, cors);

  try {
    switch (body.action) {
      case 'usage':
        return json(await getUsage(supabase, userId), 200, cors);
      case 'list':
        return json(await listConversations(supabase, userId, body), 200, cors);
      case 'messages':
        return json(await getMessages(supabase, userId, body), 200, cors);
      case 'search':
        return json(await searchConversations(supabase, userId, body), 200, cors);
      case 'delete':
        return json(await deleteConversation(supabase, userId, body), 200, cors);
      case 'upload':
        return json(await uploadImage(supabase, userId, body, cors), 200, cors);
      case 'sign':
        return json(await signPaths(supabase, userId, body), 200, cors);
      case 'chat':
        return await chat(supabase, userId, body, cors);
      default:
        return json({ error: 'Unknown action' }, 400, cors);
    }
  } catch (err) {
    return json({ error: logAndGenericError('agrotensor-ai', err) }, 500, cors);
  }
});

/* ------------------------------------------------------------------ */
/* Usage / quota                                                       */
/* ------------------------------------------------------------------ */

async function getUsage(supabase: ReturnType<typeof serviceClient>, userId: string) {
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await supabase
    .from('ai_daily_usage')
    .select('message_count, image_count')
    .eq('user_id', userId)
    .eq('day', today)
    .maybeSingle();

  return {
    messagesUsed: data?.message_count ?? 0,
    imagesUsed: data?.image_count ?? 0,
    messageLimit: DAILY_MESSAGE_LIMIT,
    imageLimit: DAILY_IMAGE_LIMIT,
  };
}

async function consumeQuota(
  supabase: ReturnType<typeof serviceClient>,
  userId: string,
  messages: number,
  images: number,
) {
  const { data, error } = await supabase.rpc('ai_consume_quota', {
    _user_id: userId,
    _messages: messages,
    _images: images,
    _message_limit: DAILY_MESSAGE_LIMIT,
    _image_limit: DAILY_IMAGE_LIMIT,
  });
  if (error) throw error;
  return data as {
    allowed: boolean;
    reason?: string;
    messages_used: number;
    images_used: number;
  };
}

/* ------------------------------------------------------------------ */
/* Conversation reads                                                  */
/* ------------------------------------------------------------------ */

async function listConversations(
  supabase: ReturnType<typeof serviceClient>,
  userId: string,
  body: JsonBody,
) {
  const limit = Math.min(Number(body.limit) || 20, 50);
  const before = typeof body.before === 'string' ? body.before : null;

  let query = supabase
    .from('ai_conversations')
    .select('id, title, preview, created_at, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (before) query = query.lt('updated_at', before);

  const { data, error } = await query;
  if (error) throw error;
  return { conversations: data ?? [] };
}

async function getMessages(
  supabase: ReturnType<typeof serviceClient>,
  userId: string,
  body: JsonBody,
) {
  const conversationId = String(body.conversationId ?? '');
  if (!UUID_RE.test(conversationId)) return { messages: [] };

  const { data, error } = await supabase
    .from('ai_messages')
    .select('id, role, text, attachments, status, created_at')
    .eq('user_id', userId)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return { messages: data ?? [] };
}

async function searchConversations(
  supabase: ReturnType<typeof serviceClient>,
  userId: string,
  body: JsonBody,
) {
  const term = String(body.query ?? '').trim().slice(0, 120);
  if (!term) return { conversations: [] };
  const pattern = `%${term.replace(/[%_]/g, (m) => `\\${m}`)}%`;

  const { data: byTitle } = await supabase
    .from('ai_conversations')
    .select('id, title, preview, created_at, updated_at')
    .eq('user_id', userId)
    .or(`title.ilike.${pattern},preview.ilike.${pattern}`)
    .order('updated_at', { ascending: false })
    .limit(20);

  const { data: byMessage } = await supabase
    .from('ai_messages')
    .select('conversation_id')
    .eq('user_id', userId)
    .ilike('text', pattern)
    .limit(40);

  const ids = Array.from(new Set((byMessage ?? []).map((m) => m.conversation_id)));
  const known = new Set((byTitle ?? []).map((c) => c.id));
  const missing = ids.filter((id) => !known.has(id));

  let extra: unknown[] = [];
  if (missing.length) {
    const { data } = await supabase
      .from('ai_conversations')
      .select('id, title, preview, created_at, updated_at')
      .eq('user_id', userId)
      .in('id', missing)
      .order('updated_at', { ascending: false })
      .limit(20);
    extra = data ?? [];
  }

  return { conversations: [...(byTitle ?? []), ...extra] };
}

async function deleteConversation(
  supabase: ReturnType<typeof serviceClient>,
  userId: string,
  body: JsonBody,
) {
  const conversationId = String(body.conversationId ?? '');
  if (!UUID_RE.test(conversationId)) return { ok: true };

  // Remove any attachments this conversation owns.
  const { data: msgs } = await supabase
    .from('ai_messages')
    .select('attachments')
    .eq('user_id', userId)
    .eq('conversation_id', conversationId);

  const paths = (msgs ?? [])
    .flatMap((m) => (Array.isArray(m.attachments) ? m.attachments : []))
    .filter((p): p is string => typeof p === 'string' && p.startsWith(`${userId}/`));
  if (paths.length) await supabase.storage.from(ATTACHMENT_BUCKET).remove(paths);

  await supabase
    .from('ai_conversations')
    .delete()
    .eq('user_id', userId)
    .eq('id', conversationId);

  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* Attachments                                                         */
/* ------------------------------------------------------------------ */

async function uploadImage(
  supabase: ReturnType<typeof serviceClient>,
  userId: string,
  body: JsonBody,
  _cors: Record<string, string>,
) {
  const dataUrl = String(body.dataUrl ?? '');
  const match = /^data:(image\/(png|jpeg|jpg|webp));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!match) return { error: 'Unsupported image' };

  const quota = await consumeQuota(supabase, userId, 0, 1);
  if (!quota.allowed) {
    return {
      error: `You've reached today's limit of ${DAILY_IMAGE_LIMIT} photos. Please try again tomorrow.`,
      quota,
    };
  }

  const contentType = match[1];
  const bytes = Uint8Array.from(atob(match[3]), (c) => c.charCodeAt(0));
  if (bytes.byteLength > 5 * 1024 * 1024) return { error: 'Photo is too large (max 5MB).' };

  const ext = contentType === 'image/png' ? 'png' : contentType === 'image/webp' ? 'webp' : 'jpg';
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from(ATTACHMENT_BUCKET)
    .upload(path, bytes, { contentType, upsert: false });
  if (error) throw error;

  const url = await signPath(supabase, path);
  return { path, url, quota };
}

async function signPath(supabase: ReturnType<typeof serviceClient>, path: string) {
  const { data } = await supabase.storage
    .from(ATTACHMENT_BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL);
  return data?.signedUrl ?? null;
}

async function signPaths(
  supabase: ReturnType<typeof serviceClient>,
  userId: string,
  body: JsonBody,
) {
  const paths = Array.isArray(body.paths) ? body.paths : [];
  const owned = paths
    .filter((p): p is string => typeof p === 'string' && p.startsWith(`${userId}/`))
    .slice(0, 20);

  const urls: Record<string, string> = {};
  for (const path of owned) {
    const url = await signPath(supabase, path);
    if (url) urls[path] = url;
  }
  return { urls };
}

/* ------------------------------------------------------------------ */
/* Chat                                                                */
/* ------------------------------------------------------------------ */

interface HistoryTurn {
  role: 'user' | 'assistant';
  content: string;
}

async function chat(
  supabase: ReturnType<typeof serviceClient>,
  userId: string,
  body: JsonBody,
  cors: Record<string, string>,
) {
  const text = String(body.text ?? '').trim().slice(0, 4000);
  const attachments = (Array.isArray(body.attachments) ? body.attachments : [])
    .filter((p): p is string => typeof p === 'string' && p.startsWith(`${userId}/`))
    .slice(0, 3);

  if (!text && attachments.length === 0) {
    return json({ error: 'Please type a question.' }, 400, cors);
  }

  const quota = await consumeQuota(supabase, userId, 1, 0);
  if (!quota.allowed) {
    return json(
      {
        error: `You've used all ${DAILY_MESSAGE_LIMIT} AgroTensor AI questions for today. Please come back tomorrow.`,
        quota,
      },
      429,
      cors,
    );
  }

  // Resolve / create the conversation.
  let conversationId = typeof body.conversationId === 'string' && UUID_RE.test(body.conversationId)
    ? body.conversationId
    : null;

  const title = text ? text.slice(0, 60) : 'Photo question';

  if (conversationId) {
    const { data: existing } = await supabase
      .from('ai_conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('user_id', userId)
      .maybeSingle();
    if (!existing) conversationId = null;
  }

  if (!conversationId) {
    const { data, error } = await supabase
      .from('ai_conversations')
      .insert({ user_id: userId, title, preview: text.slice(0, 140) })
      .select('id')
      .single();
    if (error) throw error;
    conversationId = data.id;
  }

  await supabase.from('ai_messages').insert({
    conversation_id: conversationId,
    user_id: userId,
    role: 'user',
    text,
    attachments,
    status: 'sent',
  });

  // The workflow is stateless, so we resend a trimmed history window.
  const { data: priorRows } = await supabase
    .from('ai_messages')
    .select('role, text, created_at')
    .eq('user_id', userId)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(HISTORY_WINDOW + 1);

  const prior = (priorRows ?? [])
    .reverse()
    .slice(0, -1) // the message we just inserted goes in input_prompt
    .map((m) => ({ role: m.role, content: m.text })) as HistoryTurn[];

  const messages: HistoryTurn[] = [
    { role: 'user', content: SYSTEM_PREFACE },
    { role: 'assistant', content: `Understood. I am ${BRAND}. How can I help with your farm?` },
    ...prior,
  ];

  const imageUrls: string[] = [];
  for (const path of attachments) {
    const url = await signPath(supabase, path);
    if (url) imageUrls.push(url);
  }

  let answer = '';
  let failed = false;

  try {
    answer = await askUpstream(text || 'Please analyse the attached photo.', messages, imageUrls);
  } catch (err) {
    failed = true;
    logAndGenericError('agrotensor-ai:upstream', err);
    answer = 'AgroTensor AI could not answer just now. Please try again in a moment.';
  }

  const clean = sanitizeAnswer(answer) || 'AgroTensor AI had no answer for that. Try rephrasing your question.';

  const { data: saved } = await supabase
    .from('ai_messages')
    .insert({
      conversation_id: conversationId,
      user_id: userId,
      role: 'assistant',
      text: clean,
      attachments: [],
      status: failed ? 'failed' : 'sent',
    })
    .select('id, created_at')
    .single();

  await supabase
    .from('ai_conversations')
    .update({ preview: clean.slice(0, 140), updated_at: new Date().toISOString() })
    .eq('id', conversationId)
    .eq('user_id', userId);

  // Stream the answer back so it types out in the UI.
  const encoder = new TextEncoder();
  const send = (event: string, payload: unknown) =>
    encoder.encode(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`);

  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(
        send('meta', {
          conversationId,
          title,
          messageId: saved?.id ?? crypto.randomUUID(),
          createdAt: saved?.created_at ?? new Date().toISOString(),
          failed,
          quota,
        }),
      );

      const chunks = clean.match(/\S+\s*/g) ?? [clean];
      for (let i = 0; i < chunks.length; i += 3) {
        controller.enqueue(send('token', { t: chunks.slice(i, i + 3).join('') }));
        await new Promise((r) => setTimeout(r, 18));
      }

      controller.enqueue(send('done', { text: clean }));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      ...cors,
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}

async function askUpstream(
  prompt: string,
  messages: HistoryTurn[],
  imageUrls: string[],
): Promise<string> {
  const apiKey = Deno.env.get('GOOEY_API_KEY');
  const exampleId = Deno.env.get('GOOEY_AGENT_EXAMPLE_ID') || 'nuwsqmzp';
  if (!apiKey) throw new Error('AI service is not configured');

  const payload: Record<string, unknown> = { input_prompt: prompt, messages };
  if (imageUrls.length) payload.input_images = imageUrls;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 120_000);

  try {
    const res = await fetch(`${GOOEY_ENDPOINT}?example_id=${encodeURIComponent(exampleId)}`, {
      method: 'POST',
      headers: {
        Authorization: `bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!res.ok) throw new Error(`Upstream ${res.status}`);
    const data = await res.json();
    const output = data?.output ?? {};
    const outputText = Array.isArray(output.output_text) ? output.output_text : [];
    if (outputText.length) return String(outputText[0] ?? '');

    const convo = Array.isArray(output.messages) ? output.messages : [];
    for (let i = convo.length - 1; i >= 0; i--) {
      if (convo[i]?.role === 'assistant') return String(convo[i]?.content ?? '');
    }
    return '';
  } finally {
    clearTimeout(timer);
  }
}
