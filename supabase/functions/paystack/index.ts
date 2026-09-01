// Paystack edge function: returns public key and verifies transactions.
// Deployed with verify_jwt = false (donations are public), so it is protected by
// origin-restricted CORS, per-IP rate limiting, and generic error responses.
// It also exposes a webhook endpoint with HMAC-SHA512 signature verification.
import {
  corsHeadersFor,
  isAllowedOrigin,
  allowRequest,
  trustedClientIp,
  logAndGenericError,
  serviceClient,
} from '../_shared/security.ts';

const PAYSTACK_PUBLIC_KEY = Deno.env.get('PAYSTACK_PUBLIC_KEY') ?? '';
const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY') ?? '';

const supabase = serviceClient();

const RATE_LIMITS: Record<string, [number, number]> = {
  config: [60, 3600],
  verify: [20, 3600],
};

async function hmacSha512Hex(key: string, message: string): Promise<string> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(key),
    { name: 'HMAC', hash: 'SHA-512' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function timingSafe(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

Deno.serve(async (req) => {
  const cors = corsHeadersFor(req);
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });

  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  const url = new URL(req.url);
  const action = url.searchParams.get('action') ?? '';
  const ip = trustedClientIp(req);

  try {
    // --- Paystack server-to-server webhook (no browser origin, HMAC verified) ---
    if (action === 'webhook') {
      const signature = req.headers.get('x-paystack-signature') ?? '';
      const raw = await req.text();
      if (!PAYSTACK_SECRET_KEY || !signature) return json({ error: 'Unauthorized' }, 401);
      const expected = await hmacSha512Hex(PAYSTACK_SECRET_KEY, raw);
      if (!timingSafe(signature.toLowerCase(), expected)) {
        return json({ error: 'Unauthorized' }, 401);
      }
      let event: any = {};
      try { event = JSON.parse(raw); } catch { /* ignore */ }
      console.log('[paystack-webhook]', event?.event, event?.data?.reference, event?.data?.amount);
      return json({ received: true });
    }

    // Browser-facing actions must come from a known origin.
    const origin = req.headers.get('origin');
    if (origin && !isAllowedOrigin(origin)) return json({ error: 'Forbidden' }, 403);

    if (!(action in RATE_LIMITS)) return json({ error: 'Unknown action' }, 400);
    const [limit, windowSeconds] = RATE_LIMITS[action];
    const allowed = await allowRequest(supabase, { key: `ps:${action}:${ip}`, limit, windowSeconds });
    if (!allowed) return json({ error: 'Too many requests. Please try again later.' }, 429);

    if (action === 'config') {
      if (!PAYSTACK_PUBLIC_KEY) return json({ error: 'Donations are unavailable right now.' }, 503);
      return json({ publicKey: PAYSTACK_PUBLIC_KEY });
    }

    if (action === 'verify') {
      if (!PAYSTACK_SECRET_KEY) return json({ error: 'Donations are unavailable right now.' }, 503);
      const body = await req.json().catch(() => ({}));
      const reference = String(body?.reference ?? '').trim();
      if (!reference || reference.length > 200 || !/^[A-Za-z0-9._-]+$/.test(reference)) {
        return json({ error: 'Invalid reference' }, 400);
      }
      const r = await fetch(
        `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
        { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` } },
      );
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        // Never echo the upstream payload back to the caller.
        console.error('[paystack-verify]', r.status, JSON.stringify(data));
        return json({ error: 'We could not verify that payment.' }, 502);
      }
      const status = data?.data?.status;
      return json({
        success: status === 'success',
        status,
        amount: data?.data?.amount,
        currency: data?.data?.currency,
        channel: data?.data?.channel,
        reference: data?.data?.reference,
      });
    }

    return json({ error: 'Unknown action' }, 400);
  } catch (e) {
    return json({ error: logAndGenericError('paystack', e) }, 500);
  }
});
