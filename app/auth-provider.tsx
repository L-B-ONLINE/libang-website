"use client";
import { createClient, type Session, type SupabaseClient } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

type AuthState = { client: SupabaseClient | null; session: Session | null; loading: boolean; configured: boolean; error: string | null };
const AuthContext = createContext<AuthState>({ client: null, session: null, loading: true, configured: false, error: null });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ client: null, session: null, loading: true, configured: false, error: null });
  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;
    void fetch("/api/auth/config").then(async (response) => {
      const body = await response.json() as { url?: string; anonKey?: string; error?: string };
      if (!response.ok || !body.url || !body.anonKey) throw new Error(body.error || "로그인을 준비하지 못했습니다.");
      const client = createClient(body.url, body.anonKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
      const { data } = await client.auth.getSession();
      if (!active) return;
      setState({ client, session: data.session, loading: false, configured: true, error: null });
      const listener = client.auth.onAuthStateChange((_event, session) => setState({ client, session, loading: false, configured: true, error: null }));
      unsubscribe = () => listener.data.subscription.unsubscribe();
    }).catch((cause) => active && setState({ client: null, session: null, loading: false, configured: false, error: cause instanceof Error ? cause.message : "로그인을 준비하지 못했습니다." }));
    return () => { active = false; unsubscribe?.(); };
  }, []);
  const value = useMemo(() => state, [state]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() { return useContext(AuthContext); }
