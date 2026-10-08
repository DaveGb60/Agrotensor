// Feed generator — runs on a schedule (Mon/Wed/Fri). Gemini drafts two short
// agricultural articles, AgroTensor AI (the farm advisor agent) fact-checks and
// improves each one, an illustration is generated, and the post is published.
// Every post must have an image; a post whose image fails is not published.
import { streamText } from 'npm:ai';
import { createLovableAiGatewayProvider } from '../_shared/gateway-helpers.ts';
import { serviceClient, timingSafeEqual, logAndGenericError } from '../_shared/security.ts';

const GATEWAY = 'https://ai.gateway.lovable.dev/v1';
const TEXT_MODEL = 'google/gemini-3.8-flash';
const IMAGE_MODEL = 'google/gemini-3.1-flash-image';
const GOOEY_ENDPOINT = 'https://api.gooey.ai/v2/agent';
const BUCKET = 'feed-images';
const SIGNED_TTL = 60 * 60 * 24 * 365 * 10; // 10 years
const BRAND = 'AgroTensor AI';

interface Draft {
  title: string;
  area: string;
  summary: string;
  body: string;
  image_prompt: string;
  links: { label: string; url: string }[];
}

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { 'Content-Type': 'application/json' } });

function clean(text: string): string {
  let t = (text ?? '').replace(/<think>[\s\S]*?<\/think>/gi, '');
  t = t.replace(/\s*\[\d+\](\s*\[\d+\])*/g, '');
  t = t.replace(/<button[^>]*>[\s\S]*?<\/button>/gi, '').replace(/<\/?[a-z-]+[^>]*>/gi, '');
  t = t.replace(/^#+\s.*$/gm, '').replace(/\*\*/g, '');
  t = t.replace(/[^.!?\n]*\b(supplied|provided|given|retrieved)\s+(search\s+)?(results?|documents?|context|information|sources?)\b[^.!?\n]*[.!?]?/gi, '');
  for (const re of [/farmer\s*\.?\s*chat/gi, /digital\s*green/gi, /gooey(\s*\.?\s*ai)?/gi, /\bgemini\b/gi, /open\s*ai/gi, /chat\s*gpt/gi]) {
    t = t.replace(re, BRAND);
  }
  return t.replace(/\n{3,}/g, '\n\n').trim();
}

function sentenceCount(t: string) {
  return (t.match(/[.!?](\s|$)/g) || []).length;
}

function safeLinks(v: unknown): { label: string; url: string }[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((l) => l && typeof l.url === 'string' && /^https:\/\/[^\s]+$/i.test(l.url))
    .slice(0, 3)
    .map((l) => ({ label: String(l.label || l.url).slice(0, 80), url: String(l.url).slice(0, 500) }));
}

async function draftTopics(key: string, recentTitles: string[]): Promise<Draft[]> {
  const gateway = createLovableAiGatewayProvider(key, undefined, { baseURL: GATEWAY });
  const result = streamText({
    model: gateway(TEXT_MODEL),
    system:
      'You are an agricultural editor writing for smallholder and commercial farmers, mostly in East Africa but readable worldwide. ' +
      'Pick two DIFFERENT, timely, practical topics from any area of agriculture (crops, livestock, soil, water, pests, markets, agri-finance, agritech, climate, post-harvest, policy). ' +
      'Each article is 5 sentences up to 2 short paragraphs, plain text, no headings, no bullet lists. ' +
      'Only include links to well-known, real, stable https pages (FAO, CGIAR, government agriculture ministries, universities); use an empty list if unsure. ' +
      'Reply with ONLY a JSON array, no code fences.',
    prompt:
      `Avoid repeating these recent titles: ${JSON.stringify(recentTitles)}.\n` +
      'Return: [{"title":"...","area":"Crops|Livestock|Soil & Water|Pests & Disease|Markets|Finance|Technology|Climate","summary":"one sentence teaser","body":"article text","image_prompt":"a photorealistic scene description for an editorial photo, no text in the image","links":[{"label":"...","url":"https://..."}]}] with exactly 2 items.',
  });
  const raw = (await result.text).replace(/```(json)?/g, '').trim();
  const start = raw.indexOf('[');
  const end = raw.lastIndexOf(']');
  const parsed = JSON.parse(raw.slice(start, end + 1));
  if (!Array.isArray(parsed)) throw new Error('Draft is not an array');
  return parsed.slice(0, 2).map((d: Record<string, unknown>) => ({
    title: String(d.title || '').slice(0, 140),
    area: String(d.area || 'General').slice(0, 40),
    summary: String(d.summary || '').slice(0, 280),
    body: String(d.body || ''),
    image_prompt: String(d.image_prompt || d.title || ''),
    links: safeLinks(d.links),
  })).filter((d) => d.title && d.body);
}

/** Send the draft to the farm advisor agent to validate facts and improve it. */
async function refineWithAdvisor(d: Draft): Promise<string> {
  const apiKey = Deno.env.get('GOOEY_API_KEY');
  const exampleId = Deno.env.get('GOOEY_AGENT_EXAMPLE_ID') || 'nuwsqmzp';
  if (!apiKey) return d.body;
  const prompt =
    `You are reviewing a short article for a farming news feed. Check the topic and every claim for agronomic accuracy, ` +
    `correct anything wrong or misleading, strengthen the practical advice, and rewrite it as a better article.\n` +
    `Rules: plain text only, no headings, no lists, no buttons, between 5 sentences and 2 short paragraphs. ` +
    `Return ONLY the final article text.\n\nTITLE: ${d.title}\n\nDRAFT:\n${d.body}`;
  try {
    const res = await fetch(`${GOOEY_ENDPOINT}?example_id=${encodeURIComponent(exampleId)}`, {
      method: 'POST',
      headers: { Authorization: `bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ input_prompt: prompt, messages: [] }),
    });
    if (!res.ok) throw new Error(`Advisor ${res.status}`);
    const data = await res.json();
    const out = data?.output?.output_text;
    const text = clean(Array.isArray(out) ? String(out[0] ?? '') : '');
    const n = sentenceCount(text);
    return text && n >= 4 && text.length <= 2200 ? text : d.body;
  } catch (err) {
    console.error('feed-generate:advisor', err);
    return d.body;
  }
}

async function makeImage(key: string, prompt: string): Promise<Uint8Array> {
  const res = await fetch(`${GATEWAY}/images/generations`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: IMAGE_MODEL,
      messages: [{ role: 'user', content: `Editorial agriculture photograph: ${prompt}. Natural light, realistic, no text, no logos, no watermarks.` }],
      modalities: ['image', 'text'],
      image_config: { aspect_ratio: '16:9' },
    }),
  });
  if (!res.ok) throw new Error(`Image ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  const b64 = data?.data?.[0]?.b64_json;
  if (!b64) throw new Error('No image returned');
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const db = serviceClient();

  const { data: tok } = await db.from('feed_job_tokens').select('token').eq('id', 1).maybeSingle();
  const given = req.headers.get('x-feed-token') || '';
  if (!tok?.token || !timingSafeEqual(given, tok.token)) return json({ error: 'Unauthorized' }, 401);

  let force = false;
  try { force = Boolean((await req.json())?.force); } catch { /* empty body */ }

  // Idempotency: never publish more than one batch per ~20 hours.
  if (!force) {
    const since = new Date(Date.now() - 20 * 3600 * 1000).toISOString();
    const { count } = await db.from('feed_posts').select('id', { count: 'exact', head: true }).gte('created_at', since);
    if ((count ?? 0) > 0) return json({ skipped: true, reason: 'Batch already published recently' });
  }

  const key = Deno.env.get('LOVABLE_API_KEY');
  if (!key) return json({ error: 'Not configured' }, 500);

  try {
    const { data: recent } = await db.from('feed_posts').select('title').order('created_at', { ascending: false }).limit(30);
    const drafts = await draftTopics(key, (recent ?? []).map((r) => r.title));
    const published: string[] = [];

    for (const d of drafts) {
      const body = await refineWithAdvisor(d);
      let bytes: Uint8Array | null = null;
      for (let attempt = 0; attempt < 2 && !bytes; attempt++) {
        try { bytes = await makeImage(key, d.image_prompt); }
        catch (err) {
          console.error('feed-generate:image', err);
          if (attempt === 0) await new Promise((r) => setTimeout(r, 3000));
        }
      }
      if (!bytes) continue; // image is mandatory

      const path = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.png`;
      const up = await db.storage.from(BUCKET).upload(path, bytes, { contentType: 'image/png' });
      if (up.error) { console.error('feed-generate:upload', up.error); continue; }
      const signed = await db.storage.from(BUCKET).createSignedUrl(path, SIGNED_TTL);
      if (signed.error || !signed.data?.signedUrl) continue;

      const summary = d.summary || body.split(/(?<=[.!?])\s/)[0];
      const { error } = await db.from('feed_posts').insert({
        title: clean(d.title), area: d.area, summary: clean(summary), body,
        image_url: signed.data.signedUrl, links: d.links,
      });
      if (error) console.error('feed-generate:insert', error);
      else published.push(d.title);
    }

    return json({ published });
  } catch (err) {
    return json({ error: logAndGenericError('feed-generate', err) }, 500);
  }
});
