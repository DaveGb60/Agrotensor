// Cloud Backup edge function
// Routes: create-identity, status, backup, restore, create-share, claim-share
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function randomHex(bytes = 24): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr).map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Unambiguous alphabet (no 0/O/1/I/L)
const SHARE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
function randomShareCode(): string {
  const arr = new Uint8Array(8);
  crypto.getRandomValues(arr);
  let raw = '';
  for (let i = 0; i < 8; i++) raw += SHARE_ALPHABET[arr[i] % SHARE_ALPHABET.length];
  return `${raw.slice(0, 4)}-${raw.slice(4)}`;
}

async function verifyIdentity(cloudId: string, recoveryCode: string) {
  const { data, error } = await supabase
    .from('cloud_identities')
    .select('id, recovery_hash')
    .eq('id', cloudId)
    .maybeSingle();
  if (error || !data) return null;
  const hash = await sha256(recoveryCode);
  if (hash !== data.recovery_hash) return null;
  await supabase.from('cloud_identities').update({ last_seen_at: new Date().toISOString() }).eq('id', cloudId);
  return data;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action as string;

    if (action === 'create-identity') {
      const recoveryCode = randomHex(24);
      const recovery_hash = await sha256(recoveryCode);
      const { data, error } = await supabase
        .from('cloud_identities')
        .insert({ recovery_hash })
        .select('id, created_at')
        .single();
      if (error) return json({ error: error.message }, 500);
      return json({ cloud_id: data.id, recovery_code: recoveryCode, created_at: data.created_at });
    }

    // --- Share/claim flow (no identity required; the code is the secret) ---
    if (action === 'create-share') {
      const { projects = [], records = [] } = body;
      if (!Array.isArray(projects) || !Array.isArray(records)) {
        return json({ error: 'projects and records must be arrays' }, 400);
      }
      if (projects.length === 0) return json({ error: 'No projects selected' }, 400);

      // Try up to 5 times to find a unique code
      let share_code = '';
      let inserted = null;
      let lastErr: string | null = null;
      for (let attempt = 0; attempt < 5; attempt++) {
        share_code = randomShareCode();
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
        lastErr = error.message;
      }
      if (!inserted) return json({ error: lastErr || 'Failed to create share' }, 500);
      return json({ share_code: inserted.share_code, expires_at: inserted.expires_at });
    }

    if (action === 'claim-share') {
      const raw = (body.share_code as string | undefined)?.trim().toUpperCase();
      if (!raw) return json({ error: 'share_code required' }, 400);
      // Accept with or without dash
      const normalized = raw.includes('-') ? raw : `${raw.slice(0, 4)}-${raw.slice(4)}`;

      const { data, error } = await supabase
        .from('sync_shares')
        .select('projects, records, expires_at, claim_count')
        .eq('share_code', normalized)
        .maybeSingle();
      if (error) return json({ error: error.message }, 500);
      if (!data) return json({ error: 'Invalid share code' }, 404);
      if (new Date(data.expires_at) < new Date()) return json({ error: 'Share code expired' }, 410);

      await supabase
        .from('sync_shares')
        .update({ claim_count: (data.claim_count ?? 0) + 1 })
        .eq('share_code', normalized);

      return json({ projects: data.projects, records: data.records });
    }

    // --- Identity-gated routes below ---
    const { cloud_id, recovery_code } = body;
    if (!cloud_id || !recovery_code) return json({ error: 'cloud_id and recovery_code required' }, 400);

    const identity = await verifyIdentity(cloud_id, recovery_code);
    if (!identity) return json({ error: 'Invalid Cloud ID or recovery code' }, 401);

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
      const { projects = [], records = [] } = body;
      if (!Array.isArray(projects) || !Array.isArray(records)) {
        return json({ error: 'projects and records must be arrays' }, 400);
      }

      const projectRows = projects.map((p: any) => ({
        cloud_id,
        project_id: p.id,
        payload: p,
        updated_at: new Date().toISOString(),
      }));
      const recordRows = records.map((r: any) => ({
        cloud_id,
        record_id: r.id,
        project_id: r.projectId,
        fingerprint: r.fingerprint || '',
        payload: r,
        updated_at: new Date().toISOString(),
      }));

      if (projectRows.length) {
        const { error } = await supabase.from('cloud_projects').upsert(projectRows, { onConflict: 'cloud_id,project_id' });
        if (error) return json({ error: error.message }, 500);
      }
      if (recordRows.length) {
        const { error } = await supabase.from('cloud_records').upsert(recordRows, { onConflict: 'cloud_id,record_id' });
        if (error) return json({ error: error.message }, 500);
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
        .from('cloud_projects')
        .select('payload')
        .eq('cloud_id', cloud_id);
      if (pErr) return json({ error: pErr.message }, 500);
      const { data: records, error: rErr } = await supabase
        .from('cloud_records')
        .select('payload')
        .eq('cloud_id', cloud_id);
      if (rErr) return json({ error: rErr.message }, 500);
      return json({
        projects: (projects ?? []).map((p) => p.payload),
        records: (records ?? []).map((r) => r.payload),
      });
    }

    return json({ error: 'Unknown action' }, 400);
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
