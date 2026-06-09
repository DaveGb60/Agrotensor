import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Session, User } from '@supabase/supabase-js';

export interface AdminAuthState {
  loading: boolean;
  session: Session | null;
  user: User | null;
  isMaster: boolean;
  isAdmin: boolean;
}

export function useAdminAuth(): AdminAuthState & { refresh: () => Promise<void> } {
  const [state, setState] = useState<AdminAuthState>({
    loading: true,
    session: null,
    user: null,
    isMaster: false,
    isAdmin: false,
  });

  async function loadRoles(session: Session | null) {
    if (!session?.user) {
      setState({ loading: false, session: null, user: null, isMaster: false, isAdmin: false });
      return;
    }
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id);
    const roles = new Set((data || []).map((r) => r.role));
    setState({
      loading: false,
      session,
      user: session.user,
      isMaster: roles.has('master'),
      isAdmin: roles.has('master') || roles.has('admin'),
    });
  }

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      // defer fetch to avoid deadlock
      setTimeout(() => loadRoles(session), 0);
    });
    supabase.auth.getSession().then(({ data }) => loadRoles(data.session));
    return () => sub.subscription.unsubscribe();
  }, []);

  return {
    ...state,
    refresh: async () => {
      const { data } = await supabase.auth.getSession();
      await loadRoles(data.session);
    },
  };
}
