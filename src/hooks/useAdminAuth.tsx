import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Session, User } from '@supabase/supabase-js';
import {
  getDeviceId,
  newSessionId,
  getSessionId,
  clearSessionId,
  describeDevice,
} from '@/lib/adminDevice';
import { toast } from '@/hooks/use-toast';

export interface AdminAuthState {
  loading: boolean;
  session: Session | null;
  user: User | null;
  isMaster: boolean;
  isAdmin: boolean;
  deviceTrusted: boolean;
  sessionValid: boolean;
}

const HEARTBEAT_MS = 30_000;

export function useAdminAuth(): AdminAuthState & { refresh: () => Promise<void> } {
  const [state, setState] = useState<AdminAuthState>({
    loading: true,
    session: null,
    user: null,
    isMaster: false,
    isAdmin: false,
    deviceTrusted: false,
    sessionValid: false,
  });
  const claimingRef = useRef(false);

  async function loadRoles(session: Session | null) {
    if (!session?.user) {
      clearSessionId();
      setState({
        loading: false, session: null, user: null,
        isMaster: false, isAdmin: false, deviceTrusted: false, sessionValid: false,
      });
      return;
    }

    const { data: roleRows } = await supabase
      .from('user_roles').select('role').eq('user_id', session.user.id);
    const roles = new Set((roleRows || []).map((r) => r.role));
    const isAdmin = roles.has('master') || roles.has('admin');
    const isMaster = roles.has('master');

    if (!isAdmin) {
      clearSessionId();
      setState({
        loading: false, session, user: session.user,
        isMaster: false, isAdmin: false, deviceTrusted: false, sessionValid: false,
      });
      return;
    }

    const deviceId = getDeviceId();
    let sessionId = getSessionId();
    let sessionValid = false;

    if (sessionId) {
      const { data } = await supabase.rpc('validate_admin_session', { p_session_id: sessionId });
      sessionValid = !!data;
    }

    // Claim the active slot if we don't currently hold it.
    if (!sessionValid && !claimingRef.current) {
      claimingRef.current = true;
      try {
        sessionId = newSessionId();
        const { error } = await supabase.rpc('claim_admin_session', {
          p_session_id: sessionId,
          p_device_id: deviceId,
          p_ip: null, // recorded server-side via heartbeat below if needed
          p_user_agent: describeDevice(),
        });
        if (!error) sessionValid = true;
      } finally {
        claimingRef.current = false;
      }
    }

    const { data: trusted } = await supabase.rpc('is_device_trusted', { p_device_id: deviceId });

    setState({
      loading: false,
      session,
      user: session.user,
      isMaster,
      isAdmin,
      deviceTrusted: !!trusted,
      sessionValid,
    });
  }

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setTimeout(() => loadRoles(session), 0);
    });
    supabase.auth.getSession().then(({ data }) => loadRoles(data.session));
    return () => sub.subscription.unsubscribe();
  }, []);

  // Heartbeat: detect when another device takes over our slot
  useEffect(() => {
    if (!state.isAdmin || !state.sessionValid) return;
    const t = setInterval(async () => {
      const sid = getSessionId();
      if (!sid) return;
      const { data } = await supabase.rpc('validate_admin_session', { p_session_id: sid });
      if (!data) {
        clearSessionId();
        toast({
          title: 'Signed out',
          description: 'Your admin session ended because the account signed in elsewhere.',
          variant: 'destructive',
        });
        await supabase.auth.signOut();
      }
    }, HEARTBEAT_MS);
    return () => clearInterval(t);
  }, [state.isAdmin, state.sessionValid]);

  return {
    ...state,
    refresh: async () => {
      const { data } = await supabase.auth.getSession();
      await loadRoles(data.session);
    },
  };
}
