// Admin edge function
// Routes: stats, list-identities, invite-admin, remove-admin, list-admins
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

const admin = createClient(SUPABASE_URL, SERVICE_KEY);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function getCaller(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return null;
  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data, error } = await userClient.auth.getUser();
  if (error || !data.user) return null;
  // fetch role
  const { data: roles } = await admin
    .from('user_roles')
    .select('role')
    .eq('user_id', data.user.id);
  const roleSet = new Set((roles || []).map((r: { role: string }) => r.role));
  if (roleSet.size === 0) return null;
  return {
    id: data.user.id,
    email: data.user.email,
    isMaster: roleSet.has('master'),
    isAdmin: roleSet.has('master') || roleSet.has('admin'),
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const caller = await getCaller(req);
    if (!caller || !caller.isAdmin) return json({ error: 'Forbidden' }, 403);

    const { action, ...payload } = await req.json();

    if (action === 'stats') {
      const [identities, backups, projects, records, shares] = await Promise.all([
        admin.from('cloud_identities').select('*', { count: 'exact', head: true }),
        admin.from('cloud_backups').select('*', { count: 'exact', head: true }),
        admin.from('cloud_projects').select('*', { count: 'exact', head: true }),
        admin.from('cloud_records').select('*', { count: 'exact', head: true }),
        admin.from('sync_shares').select('*', { count: 'exact', head: true }),
      ]);
      const { data: recentBackups } = await admin
        .from('cloud_backups')
        .select('created_at, project_count, record_count, cloud_id')
        .order('created_at', { ascending: false })
        .limit(10);
      const { data: activeShares } = await admin
        .from('sync_shares')
        .select('share_code, project_count, record_count, created_at, expires_at, claim_count')
        .order('created_at', { ascending: false })
        .limit(10);
      return json({
        counts: {
          identities: identities.count || 0,
          backups: backups.count || 0,
          projects: projects.count || 0,
          records: records.count || 0,
          shares: shares.count || 0,
        },
        recentBackups: recentBackups || [],
        activeShares: activeShares || [],
      });
    }

    if (action === 'list-identities') {
      const { data, error } = await admin
        .from('cloud_identities')
        .select('id, created_at, last_seen_at')
        .order('last_seen_at', { ascending: false })
        .limit(200);
      if (error) return json({ error: error.message }, 500);

      // attach backup counts per identity
      const ids = (data || []).map((d) => d.id);
      const backupsByCloud: Record<string, { count: number; last: string | null }> = {};
      if (ids.length) {
        const { data: bks } = await admin
          .from('cloud_backups')
          .select('cloud_id, created_at')
          .in('cloud_id', ids);
        for (const b of bks || []) {
          const entry = backupsByCloud[b.cloud_id] || { count: 0, last: null };
          entry.count += 1;
          if (!entry.last || b.created_at > entry.last) entry.last = b.created_at;
          backupsByCloud[b.cloud_id] = entry;
        }
      }
      return json({
        identities: (data || []).map((d) => ({
          ...d,
          backup_count: backupsByCloud[d.id]?.count || 0,
          last_backup_at: backupsByCloud[d.id]?.last || null,
        })),
      });
    }

    if (action === 'list-admins') {
      const { data, error } = await admin
        .from('user_roles')
        .select('id, user_id, role, email, invited_by, created_at')
        .order('created_at', { ascending: true });
      if (error) return json({ error: error.message }, 500);
      return json({ admins: data || [] });
    }

    if (action === 'invite-admin') {
      if (!caller.isMaster) return json({ error: 'Only the master admin can invite' }, 403);
      const email = String(payload.email || '').trim().toLowerCase();
      if (!email || !email.includes('@')) return json({ error: 'Valid email required' }, 400);

      // Ensure no existing invited admin
      const { count: existingAdmins } = await admin
        .from('user_roles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'admin');
      if ((existingAdmins || 0) >= 1) {
        return json({ error: 'An invited admin already exists. Remove them first.' }, 400);
      }

      // Look up the user by email (must already have signed up)
      const { data: list, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (listErr) return json({ error: listErr.message }, 500);
      const user = list.users.find((u) => (u.email || '').toLowerCase() === email);
      if (!user) {
        return json({ error: 'No account with that email exists yet. Ask them to sign up first.' }, 404);
      }

      const { error: insErr } = await admin.from('user_roles').insert({
        user_id: user.id,
        role: 'admin',
        email,
        invited_by: caller.id,
      });
      if (insErr) return json({ error: insErr.message }, 400);
      return json({ ok: true });
    }

    if (action === 'remove-admin') {
      if (!caller.isMaster) return json({ error: 'Only the master admin can remove' }, 403);
      const userId = String(payload.user_id || '');
      if (!userId) return json({ error: 'user_id required' }, 400);
      const { error } = await admin
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', 'admin');
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    return json({ error: 'Unknown action' }, 400);
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
