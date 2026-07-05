import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Loader2, Shield, Users, Cloud, Database, Share2, LogOut, UserPlus, Trash2, RefreshCw, Crown, KeyRound, Smartphone } from 'lucide-react';
import { getDeviceId } from '@/lib/adminDevice';

interface Stats {
  counts: { identities: number; backups: number; projects: number; records: number; shares: number };
  recentBackups: { created_at: string; project_count: number; record_count: number; cloud_id: string }[];
  activeShares: { share_code: string; project_count: number; record_count: number; created_at: string; expires_at: string; claim_count: number }[];
}

interface AdminRow {
  id: string;
  user_id: string;
  role: 'master' | 'admin';
  email: string;
  created_at: string;
}

interface Identity {
  id: string;
  created_at: string;
  last_seen_at: string;
  backup_count: number;
  last_backup_at: string | null;
}

interface DeviceRow {
  id: string;
  device_id: string;
  label: string | null;
  user_agent: string | null;
  ip: string | null;
  first_seen_at: string;
  last_seen_at: string;
}

interface ActiveSession {
  device_id: string;
  ip: string | null;
  user_agent: string | null;
  claimed_at: string;
  last_seen_at: string;
}

export default function Admin() {
  const navigate = useNavigate();
  const auth = useAdminAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [identities, setIdentities] = useState<Identity[]>([]);
  const [loading, setLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [devices, setDevices] = useState<DeviceRow[]>([]);
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const currentDeviceId = getDeviceId();

  const callAdmin = useCallback(async (action: string, body: Record<string, unknown> = {}) => {
    const { data, error } = await supabase.functions.invoke('admin', { body: { action, ...body } });
    if (error) throw new Error(error.message);
    if (data?.error) throw new Error(data.error);
    return data;
  }, []);

  const loadDevices = useCallback(async () => {
    if (!auth.user) return;
    const [{ data: devs }, { data: act }] = await Promise.all([
      supabase.from('admin_devices').select('*').eq('user_id', auth.user.id).order('last_seen_at', { ascending: false }),
      supabase.from('admin_active_session').select('device_id, ip, user_agent, claimed_at, last_seen_at').eq('user_id', auth.user.id).maybeSingle(),
    ]);
    setDevices((devs as DeviceRow[]) || []);
    setActiveSession((act as ActiveSession) || null);
  }, [auth.user]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [s, a, i] = await Promise.all([
        callAdmin('stats'),
        callAdmin('list-admins'),
        callAdmin('list-identities'),
      ]);
      setStats(s);
      setAdmins(a.admins || []);
      setIdentities(i.identities || []);
      await loadDevices();
    } catch (e) {
      toast({ title: 'Failed to load', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [callAdmin, loadDevices]);

  async function handleRevokeDevice(deviceId: string) {
    if (!confirm('Forget this device? You will need to sign in again from it.')) return;
    const { error } = await supabase.rpc('revoke_admin_device', { p_device_id: deviceId });
    if (error) return toast({ title: 'Could not revoke', description: error.message, variant: 'destructive' });
    toast({ title: 'Device removed' });
    await loadDevices();
  }

  useEffect(() => {
    if (auth.loading) return;
    if (!auth.session) {
      navigate('/admin-auth', { replace: true });
      return;
    }
    if (!auth.isAdmin) return;
    refresh();
  }, [auth.loading, auth.session, auth.isAdmin, navigate, refresh]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    try {
      await callAdmin('invite-admin', { email: inviteEmail });
      toast({ title: 'Admin invited', description: inviteEmail });
      setInviteEmail('');
      await refresh();
    } catch (e) {
      toast({ title: 'Invite failed', description: (e as Error).message, variant: 'destructive' });
    }
  }

  async function handleRemove(userId: string) {
    if (!confirm('Remove this admin?')) return;
    try {
      await callAdmin('remove-admin', { user_id: userId });
      toast({ title: 'Admin removed' });
      await refresh();
    } catch (e) {
      toast({ title: 'Remove failed', description: (e as Error).message, variant: 'destructive' });
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate('/admin-auth', { replace: true });
  }

  if (auth.loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-12 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
      </div>
    );
  }

  if (!auth.isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container max-w-md py-12 px-4">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-2">
                <Shield className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle>Access denied</CardTitle>
              <CardDescription>
                Your account ({auth.user?.email}) does not have admin access. Ask the master admin to invite you.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" /> Sign out
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const c = stats?.counts;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8 px-4 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <Shield className="h-6 w-6" /> Admin Panel
            </h1>
            <p className="text-sm text-muted-foreground">
              Signed in as {auth.user?.email}{' '}
              {auth.isMaster ? (
                <Badge variant="default" className="ml-1"><Crown className="h-3 w-3 mr-1" />Master</Badge>
              ) : (
                <Badge variant="secondary" className="ml-1">Admin</Badge>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" /> Sign out
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatCard icon={Users} label="Users" value={c?.identities ?? '—'} />
          <StatCard icon={Cloud} label="Backups" value={c?.backups ?? '—'} />
          <StatCard icon={Database} label="Projects" value={c?.projects ?? '—'} />
          <StatCard icon={Database} label="Records" value={c?.records ?? '—'} />
          <StatCard icon={Share2} label="Sync Shares" value={c?.shares ?? '—'} />
        </div>

        <Tabs defaultValue="backups">
          <TabsList>
            <TabsTrigger value="backups">Backups</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="shares">Active Shares</TabsTrigger>
            <TabsTrigger value="admins">Admins</TabsTrigger>
            <TabsTrigger value="devices">My Devices</TabsTrigger>
          </TabsList>

          <TabsContent value="backups">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Backups</CardTitle>
                <CardDescription>Latest 10 backup events across all users.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>When</TableHead>
                      <TableHead>User (Cloud ID)</TableHead>
                      <TableHead className="text-right">Projects</TableHead>
                      <TableHead className="text-right">Records</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(stats?.recentBackups || []).map((b, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{new Date(b.created_at).toLocaleString()}</TableCell>
                        <TableCell className="font-mono text-xs">{b.cloud_id.slice(0, 8)}…</TableCell>
                        <TableCell className="text-right">{b.project_count}</TableCell>
                        <TableCell className="text-right">{b.record_count}</TableCell>
                      </TableRow>
                    ))}
                    {!stats?.recentBackups?.length && (
                      <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No backups yet</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Cloud Identities</CardTitle>
                <CardDescription>All users with cloud accounts. Use Cloud ID for recovery support.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cloud ID</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Last seen</TableHead>
                      <TableHead className="text-right">Backups</TableHead>
                      <TableHead>Last backup</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {identities.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-mono text-xs">
                          <button
                            className="hover:underline"
                            onClick={() => {
                              navigator.clipboard.writeText(u.id);
                              toast({ title: 'Cloud ID copied' });
                            }}
                            title="Copy full ID"
                          >
                            {u.id.slice(0, 12)}…
                          </button>
                        </TableCell>
                        <TableCell>{new Date(u.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>{new Date(u.last_seen_at).toLocaleString()}</TableCell>
                        <TableCell className="text-right">{u.backup_count}</TableCell>
                        <TableCell>{u.last_backup_at ? new Date(u.last_backup_at).toLocaleString() : '—'}</TableCell>
                      </TableRow>
                    ))}
                    {!identities.length && (
                      <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No users yet</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
                <p className="text-xs text-muted-foreground mt-3 flex items-start gap-1">
                  <KeyRound className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  Recovery codes are stored as one-way hashes and cannot be retrieved. To assist a user, guide them through the Cloud Backup page using their saved code.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="shares">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Active Sync Shares</CardTitle>
                <CardDescription>Recently created sync codes (7-day expiry).</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead className="text-right">Projects</TableHead>
                      <TableHead className="text-right">Records</TableHead>
                      <TableHead className="text-right">Claims</TableHead>
                      <TableHead>Expires</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(stats?.activeShares || []).map((s) => (
                      <TableRow key={s.share_code}>
                        <TableCell className="font-mono">{s.share_code}</TableCell>
                        <TableCell className="text-right">{s.project_count}</TableCell>
                        <TableCell className="text-right">{s.record_count}</TableCell>
                        <TableCell className="text-right">{s.claim_count}</TableCell>
                        <TableCell>{new Date(s.expires_at).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                    {!stats?.activeShares?.length && (
                      <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No active shares</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="admins">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Admin Accounts</CardTitle>
                <CardDescription>Strictly limited to one master and one invited admin.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Added</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {admins.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell>{a.email}</TableCell>
                        <TableCell>
                          {a.role === 'master' ? (
                            <Badge><Crown className="h-3 w-3 mr-1" />Master</Badge>
                          ) : (
                            <Badge variant="secondary">Admin</Badge>
                          )}
                        </TableCell>
                        <TableCell>{new Date(a.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          {a.role === 'admin' && auth.isMaster && (
                            <Button variant="ghost" size="sm" onClick={() => handleRemove(a.user_id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {auth.isMaster && (
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <UserPlus className="h-4 w-4" /> Invite the second admin
                    </h4>
                    {admins.some((a) => a.role === 'admin') ? (
                      <p className="text-sm text-muted-foreground">The invited admin slot is filled. Remove the current admin to invite someone else.</p>
                    ) : (
                      <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-2">
                        <div className="flex-1">
                          <Label htmlFor="invite-email" className="sr-only">Email</Label>
                          <Input
                            id="invite-email"
                            type="email"
                            placeholder="admin@example.com"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            required
                          />
                        </div>
                        <Button type="submit">Invite</Button>
                      </form>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      The person must first create an account on the admin sign-in page using this email, then you can grant them access here.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="devices">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><Smartphone className="h-5 w-5" /> My Devices</CardTitle>
                <CardDescription>
                  Devices that have signed into your admin account. Only one device/IP can hold the active session at a time — signing in elsewhere automatically signs out the previous device.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {activeSession && (
                  <div className="rounded-md border bg-muted/40 p-3 text-sm">
                    <div className="font-medium mb-1">Active session</div>
                    <div className="text-muted-foreground text-xs">
                      Device <span className="font-mono">{activeSession.device_id.slice(0, 8)}…</span>
                      {activeSession.ip ? ` · IP ${activeSession.ip}` : ''} · since {new Date(activeSession.claimed_at).toLocaleString()}
                    </div>
                  </div>
                )}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Device</TableHead>
                      <TableHead>Browser</TableHead>
                      <TableHead>Last IP</TableHead>
                      <TableHead>Last seen</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {devices.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell className="font-mono text-xs">
                          {d.device_id.slice(0, 8)}…
                          {d.device_id === currentDeviceId && <Badge variant="secondary" className="ml-2">This device</Badge>}
                          {activeSession?.device_id === d.device_id && <Badge className="ml-2">Active</Badge>}
                        </TableCell>
                        <TableCell className="text-xs max-w-[260px] truncate" title={d.user_agent || ''}>{d.user_agent || '—'}</TableCell>
                        <TableCell className="text-xs">{d.ip || '—'}</TableCell>
                        <TableCell className="text-xs">{new Date(d.last_seen_at).toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => handleRevokeDevice(d.device_id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!devices.length && (
                      <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No devices recorded yet</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number | string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wide">
          <Icon className="h-3.5 w-3.5" /> {label}
        </div>
        <div className="text-2xl font-semibold mt-1">{value}</div>
      </CardContent>
    </Card>
  );
}
