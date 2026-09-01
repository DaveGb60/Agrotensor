// Shared security helpers for AgroTensor edge functions.
// - Origin-restricted CORS
// - Per-IP / per-identity rate limiting backed by public.check_rate_limit
// - Generic client-facing errors (details stay in the server logs)

import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';

const ALLOWED_ORIGINS = [
  'https://agrotensor.vercel.app',
  'https://www.agrotensor.vercel.app',
  'https://farmdeck.lovable.app',
  'http://localhost:8080',
  'http://localhost:5173',
];

const ALLOWED_ORIGIN_PATTERNS = [
  /^https:\/\/[a-z0-9-]+\.lovable\.app$/i,
  /^https:\/\/[a-z0-9-]+\.lovableproject\.com$/i,
  /^https:\/\/[a-z0-9-]+\.vercel\.app$/i,
];

export function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  return ALLOWED_ORIGIN_PATTERNS.some((re) => re.test(origin));
}

export function corsHeadersFor(req: Request): Record<string, string> {
  const origin = req.headers.get('origin');
  return {
    'Access-Control-Allow-Origin': isAllowedOrigin(origin) ? origin! : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

/**
 * The platform-provided client IP. Supabase edge runtime terminates TLS at its
 * own proxy, so the LAST entry of x-forwarded-for is the one it appended and is
 * therefore the only value a caller cannot spoof.
 */
export function trustedClientIp(req: Request): string {
  const xf = req.headers.get('x-forwarded-for');
  if (xf) {
    const parts = xf.split(',').map((p) => p.trim()).filter(Boolean);
    if (parts.length) return parts[parts.length - 1];
  }
  return req.headers.get('cf-connecting-ip') || req.headers.get('x-real-ip') || 'unknown';
}

/** Constant-time comparison of two equal-length hex digests. */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export interface RateLimitOptions {
  key: string;
  limit: number;
  windowSeconds: number;
}

/** Returns true when the request is allowed to proceed. Fails open on infra errors. */
export async function allowRequest(
  client: SupabaseClient,
  { key, limit, windowSeconds }: RateLimitOptions,
): Promise<boolean> {
  try {
    const { data, error } = await client.rpc('check_rate_limit', {
      p_key: key,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    });
    if (error) return true;
    return data !== false;
  } catch {
    return true;
  }
}

/** Log the real error server-side, return an opaque message to the caller. */
export function logAndGenericError(context: string, err: unknown): string {
  console.error(`[${context}]`, err instanceof Error ? err.stack || err.message : err);
  return 'Request failed. Please try again.';
}

export function serviceClient(): SupabaseClient {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
}

/** Rough serialized-size guard for JSON bodies. */
export function withinSizeLimit(value: unknown, maxBytes: number): boolean {
  try {
    return new TextEncoder().encode(JSON.stringify(value ?? null)).length <= maxBytes;
  } catch {
    return false;
  }
}
