// Farm Insights — answers questions about one farm project's records using
// Lovable AI Gateway (Gemini). The client sends a compact project summary; the
// key and prompts stay server-side.
import { streamText } from 'npm:ai';
import { createLovableAiGatewayProvider, getLovableAiGatewayResponseHeaders } from '../_shared/gateway-helpers.ts';
import {
  corsHeadersFor, isAllowedOrigin, serviceClient, trustedClientIp, allowRequest, logAndGenericError, withinSizeLimit,
} from '../_shared/security.ts';

const MODEL = 'google/gemini-3.8-flash';
const GATEWAY = 'https://ai.gateway.lovable.dev/v1';

const SYSTEM = `You are AgroTensor AI, a farm business analyst. You receive one farm project's recorded data as JSON and a question.
Answer using ONLY that data plus sound agronomy/business knowledge. Be concrete: cite numbers, dates, months and totals from the data.
Give clear, practical, context-aware recommendations. Never mention models, providers or "the provided data/search results" — just answer.
If the data is too thin to answer, say what to record next.

FORMAT (GitHub-flavoured Markdown):
- Use short headings, bullet points and **bold** key figures.
- Use Markdown tables for tabular comparisons.
- When a visual helps, add a chart as a fenced code block with language "chart" containing ONE strict JSON object (no comments, no trailing commas):
  {"type":"bar"|"line"|"area"|"pie"|"histogram","title":"...","xKey":"month","series":[{"key":"revenue","label":"Revenue"}],"data":[{"month":"2026-01","revenue":1200}]}
  - bar/line/area: xKey is the category field; each series key is a numeric field in data. Up to 4 series.
  - pie: use one series; data items are slices.
  - histogram: data items are bins, xKey is the bin label (e.g. "0-50"), one series with the count.
  - Keep data under 40 points. Numbers must be plain numbers.
- Put each chart right after the text it supports. Do not wrap tables in code blocks.`;

Deno.serve(async (req) => {
  const cors = { ...corsHeadersFor(req), 'Access-Control-Expose-Headers': 'X-Lovable-AIG-Run-ID' };
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  const json = (b: unknown, s: number) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  if (!isAllowedOrigin(req.headers.get('origin'))) return json({ error: 'Origin not allowed' }, 403);

  let body: { question?: unknown; project?: unknown; history?: unknown };
  try { body = await req.json(); } catch { return json({ error: 'Invalid request' }, 400); }
  if (!withinSizeLimit(body, 400 * 1024)) return json({ error: 'This project is too large to analyse at once.' }, 413);

  const question = typeof body.question === 'string' ? body.question.trim().slice(0, 2000) : '';
  if (!question || !body.project) return json({ error: 'Please choose a project and type a question.' }, 400);

  const allowed = await allowRequest(serviceClient(), { key: `insights:${trustedClientIp(req)}`, limit: 30, windowSeconds: 600 });
  if (!allowed) return json({ error: 'Too many questions. Please wait a few minutes.' }, 429);

  const key = Deno.env.get('LOVABLE_API_KEY');
  if (!key) return json({ error: 'AI analysis is not configured.' }, 500);

  const history = (Array.isArray(body.history) ? body.history : [])
    .filter((m): m is { role: 'user' | 'assistant'; content: string } =>
      !!m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-8)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 6000) }));

  try {
    const gateway = createLovableAiGatewayProvider(key, undefined, { baseURL: GATEWAY });
    const result = streamText({
      model: gateway(MODEL),
      system: SYSTEM,
      messages: [
        { role: 'user', content: `PROJECT DATA (JSON):\n${JSON.stringify(body.project)}` },
        { role: 'assistant', content: 'I have the project data. What would you like to know?' },
        ...history,
        { role: 'user', content: question },
      ],
      abortSignal: req.signal,
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const part of result.fullStream) {
            if (part.type === 'text-delta') controller.enqueue(encoder.encode(part.text));
            else if (part.type === 'error') throw part.error;
          }
        } catch (err) {
          const status = (err as { statusCode?: number })?.statusCode;
          logAndGenericError('farm-insights:stream', err);
          const msg = status === 402 ? 'AI credits are used up for now. Please try again later.'
            : status === 429 ? 'AI is busy right now. Please try again in a minute.'
            : 'The analysis stopped unexpectedly. Please try again.';
          controller.enqueue(encoder.encode(`\n\n[[ERROR:${msg}]]`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: getLovableAiGatewayResponseHeaders(undefined, { ...cors, 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache' }),
    });
  } catch (err) {
    return json({ error: logAndGenericError('farm-insights', err) }, 500);
  }
});
