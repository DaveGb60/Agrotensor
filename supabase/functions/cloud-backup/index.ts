// Cloud Backup edge function
// Routes: create-identity, status, backup, restore, create-share, claim-share
//
// Hardening:
// - Origin-restricted CORS (no wildcard)
// - Per-IP and per-identity rate limiting on every action
// - Payload size / array-length limits
// - High-entropy share codes, capped claims, atomic claim counter
// - Constant-time recovery-code comparison
// - Generic client-facing errors; details logged server-side
import {
  corsHeadersFor,
  allowRequest,
  trustedClientIp,
  timingSafeEqual,
  logAndGenericError,
  serviceClient,
  withinSizeLimit,
} from '../_shared/security.ts';

const supabase = serviceClient();

// Limits
const MAX_PAYLOAD_BYTES = 5 * 1024 * 1024; // 5 MB per request
const MAX_PROJECTS = 500;
const MAX_RECORDS = 20_000;
const MAX_SHARE_CLAIMS = 10;

// Per-IP rate limits: [requests, window seconds]
const RATE_LIMITS: Record<string, [number, number]> = {
  'create-identity': [3, 3600],
  'create-share': [10, 3600],
  'claim-share': [10, 600],
  backup: [30, 3600],
  restore: [30, 3600],
  status: [60, 3600],
};

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function randomHex(bytes = 24): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr).map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Unambiguous alphabet (no 0/O/1/I/L). 25 chars ~ 123 bits of entropy.
const SHARE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const SHARE_LENGTH = 25;

function randomShareCode(): string {
  let raw = '';
  // Rejection sampling keeps the distribution uniform over the 31-symbol alphabet.
  while (raw.length < SHARE_LENGTH) {
    const arr = new Uint8Array(SHARE_LENGTH);
    crypto.getRandomValues(arr);
    for (const b of arr) {
      if (b >= 248) continue; // 248 = 8 * 31
      raw += SHARE_ALPHABET[b % SHARE_ALPHABET.length];
      if (raw.length === SHARE_LENGTH) break;
    }
  }
  return raw.match(/.{1,5}/g)!.join('-');
}

/** Accepts codes with or without separators, plus 8-char legacy codes. */
function normalizeShareCode(input: string): string | null {
  const raw = input.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!raw) return null;
  if (raw.length === SHARE_LENGTH) return raw.match(/.{1,5}/g)!.join('-');
  if (raw.length === 8) return `${raw.slice(0, 4)}-${raw.slice(4)}`; // legacy
  return null;
}

async function verifyIdentity(cloudId: string, recoveryCode: string) {
  const { data, error } = await supabase
    .from('cloud_identities')
    .select('id, recovery_hash')
    .eq('id', cloudId)
    .maybeSingle();
  if (error || !data) return null;
  const hash = await sha256(recoveryCode);
  if (!timingSafeEqual(hash, data.recovery_hash)) return null;
  await supabase.from('cloud_identities')
    .update({ last_seen_at: new Date().toISOString() })
    .eq('id', cloudId);
  return data;
}

function isUuid(v: unknown): v is string {
  return typeof v === 'string'
    && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}

Deno.serve(async (req) => {
  const cors = corsHeadersFor(req);
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });

  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const rawBody = await req.text();
    if (rawBody.length > MAX_PAYLOAD_BYTES) {
      return json({ error: 'Payload too large' }, 413);
    }
    let body: Record<string, unknown> = {};
    try { body = JSON.parse(rawBody || '{}'); } catch { body = {}; }

    const action = String(body.action ?? '');
    if (!(action in RATE_LIMITS)) return json({ error: 'Unknown action' }, 400);

    const ip = trustedClientIp(req);
    const [limit, windowSeconds] = RATE_LIMITS[action];
    const ok = await allowRequest(supabase, { key: `cb:${action}:${ip}`, limit, windowSeconds });
    if (!ok) return json({ error: 'Too many requests. Please try again later.' }, 429);

    if (action === 'create-identity') {
      const recoveryCode = randomHex(24);
      const recovery_hash = await sha256(recoveryCode);
      const { data, error } = await supabase
        .from('cloud_identities')
        .insert({ recovery_hash })
        .select('id, created_at')
        .single();
      if (error) return json({ error: logAndGenericError('create-identity', error) }, 500);
      return json({ cloud_id: data.id, recovery_code: recoveryCode, created_at: data.created_at });
    }

    // --- Share/claim flow (no identity required; the code is the secret) ---
    if (action === 'create-share') {
      const projects = body.projects ?? [];
      const records = body.records ?? [];
      if (!Array.isArray(projects) || !Array.isArray(records)) {
        return json({ error: 'projects and records must be arrays' }, 400);
      }
      if (projects.length === 0) return json({ error: 'No projects selected' }, 400);
      if (projects.length > MAX_PROJECTS || records.length > MAX_RECORDS) {
        return json({ error: 'Too much data in one share' }, 413);
      }
      if (!withinSizeLimit({ projects, records }, MAX_PAYLOAD_BYTES)) {
        return json({ error: 'Payload too large' }, 413);
      }

      let inserted: { share_code: string; expires_at: string } | null = null;
      let lastErr: unknown = null;
      for (let attempt = 0; attempt < 5; attempt++) {
        const share_code = randomShareCode();
        const { data, error } = await supabase
          .from('sync_shares')
          .insert({
            share_code,
            project_count: projects.length,
            record_count: records.length,
            projects,
            records,
          })
          .select('share_code, expires_at')
          .single();
        if (!error) { inserted = data; break; }
        lastErr = error;
      }
      if (!inserted) return json({ error: logAndGenericError('create-share', lastErr) }, 500);
      return json({ share_code: inserted.share_code, expires_at: inserted.expires_at });
    }

    if (action === 'claim-share') {
      const normalized = normalizeShareCode(String(body.share_code ?? ''));
      if (!normalized) return json({ error: 'Invalid share code' }, 400);

      // Atomic: increments only when the share exists, is unexpired and under the cap.
      const { data: newCount, error: incErr } = await supabase.rpc('increment_share_claim', {
        p_code: normalized,
        p_max: MAX_SHARE_CLAIMS,
      });
      if (incErr) return json({ error: logAndGenericError('claim-share', incErr) }, 500);
      if (newCount === null || newCount === undefined) {
        return json({ error: 'This share code is invalid, expired, or already used up.' }, 404);
      }

      const { data, error } = await supabase
        .from('sync_shares')
        .select('projects, records')
        .eq('share_code', normalized)
        .maybeSingle();
      if (error || !data) return json({ error: 'Invalid share code' }, 404);

      return json({ projects: data.projects, records: data.records });
    }

    // --- Identity-gated routes below ---
    const cloud_id = body.cloud_id;
    const recovery_code = body.recovery_code;
    if (!isUuid(cloud_id) || typeof recovery_code !== 'string' || recovery_code.length > 256) {
      return json({ error: 'cloud_id and recovery_code required' }, 400);
    }

    // Second, tighter bucket per identity to blunt credential stuffing.
    const idOk = await allowRequest(supabase, {
      key: `cb:id:${cloud_id}`, limit: 60, windowSeconds: 3600,
    });
    if (!idOk) return json({ error: 'Too many requests. Please try again later.' }, 429);

    const identity = await verifyIdentity(cloud_id, recovery_code);
    if (!identity) {
      await allowRequest(supabase, { key: `cb:fail:${ip}`, limit: 5, windowSeconds: 900 });
      return json({ error: 'Invalid Cloud ID or recovery code' }, 401);
    }

    if (action === 'status') {
      const [{ count: projectCount }, { count: recordCount }, { data: lastBackup }] = await Promise.all([
        supabase.from('cloud_projects').select('*', { count: 'exact', head: true }).eq('cloud_id', cloud_id),
        supabase.from('cloud_records').select('*', { count: 'exact', head: true }).eq('cloud_id', cloud_id),
        supabase.from('cloud_backups').select('created_at, project_count, record_count').eq('cloud_id', cloud_id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      ]);
      return json({
        project_count: projectCount ?? 0,
        record_count: recordCount ?? 0,
        last_backup: lastBackup ?? null,
      });
    }

    if (action === 'backup') {
      const projects = body.projects ?? [];
      const records = body.records ?? [];
      if (!Array.isArray(projects) || !Array.isArray(records)) {
        return json({ error: 'projects and records must be arrays' }, 400);
      }
      if (projects.length > MAX_PROJECTS || records.length > MAX_RECORDS) {
        return json({ error: 'Too much data in one backup' }, 413);
      }

      const projectRows = projects
        .filter((p: any) => p && typeof p.id === 'string')
        .map((p: any) => ({
          cloud_id,
          project_id: String(p.id).slice(0, 128),
          payload: p,
          updated_at: new Date().toISOString(),
        }));
      const recordRows = records
        .filter((r: any) => r && typeof r.id === 'string')
        .map((r: any) => ({
          cloud_id,
          record_id: String(r.id).slice(0, 128),
          project_id: String(r.projectId ?? '').slice(0, 128),
          fingerprint: String(r.fingerprint ?? '').slice(0, 256),
          payload: r,
          updated_at: new Date().toISOString(),
        }));

      if (projectRows.length) {
        const { error } = await supabase.from('cloud_projects').upsert(projectRows, { onConflict: 'cloud_id,project_id' });
        if (error) return json({ error: logAndGenericError('backup-projects', error) }, 500);
      }
      if (recordRows.length) {
        const { error } = await supabase.from('cloud_records').upsert(recordRows, { onConflict: 'cloud_id,record_id' });
        if (error) return json({ error: logAndGenericError('backup-records', error) }, 500);
      }

      await supabase.from('cloud_backups').insert({
        cloud_id,
        project_count: projectRows.length,
        record_count: recordRows.length,
      });

      return json({ success: true, project_count: projectRows.length, record_count: recordRows.length });
    }

    if (action === 'restore') {
      const { data: projects, error: pErr } = await supabase
        .from('cloud_projects').select('payload').eq('cloud_id', cloud_id);
      if (pErr) return json({ error: logAndGenericError('restore-projects', pErr) }, 500);
      const { data: records, error: rErr } = await supabase
        .from('cloud_records').select('payload').eq('cloud_id', cloud_id);
      if (rErr) return json({ error: logAndGenericError('restore-records', rErr) }, 500);
      return json({
        projects: (projects ?? []).map((p) => p.payload),
        records: (records ?? []).map((r) => r.payload),
      });
    }

    return json({ error: 'Unknown action' }, 400);
  } catch (e) {
    return json({ error: logAndGenericError('cloud-backup', e) }, 500);
  }
});
