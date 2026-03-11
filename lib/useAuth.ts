// lib/useAuth.ts
// React hook for auth state — use this in any component that needs the current user.

import { useState, useEffect, useCallback } from "react";
import { supabase, signUp, signIn, signOut, getUserProfile, UserProfile } from "./supabase";
import type { Session } from "@supabase/supabase-js";

interface AuthState {
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
}

interface AuthActions {
  login:   (email: string, password: string) => Promise<void>;
  signup:  (email: string, password: string, name: string) => Promise<{ needsConfirmation: boolean }>;
  logout:  () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useAuth(): AuthState & AuthActions {
  const [session, setSession]   = useState<Session | null>(null);
  const [profile, setProfile]   = useState<UserProfile | null>(null);
  const [loading, setLoading]   = useState(true);

  const loadProfile = useCallback(async (userId: string) => {
    const p = await getUserProfile(userId);
    setProfile(p);
  }, []);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) loadProfile(data.session.user.id).finally(() => setLoading(false));
      else setLoading(false);
    });

    // Listen for auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);
        if (newSession) {
          await loadProfile(newSession.user.id);
        } else {
          setProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [loadProfile]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      await signIn(email, password);
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    setLoading(true);
    try {
      const data = await signUp(email, password, name);
      // If email confirmation is required, user is not logged in yet
      const needsConfirmation = !data.session;
      return { needsConfirmation };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await signOut();
    setSession(null);
    setProfile(null);
  };

  const refresh = async () => {
    if (session) await loadProfile(session.user.id);
  };

  return { session, profile, loading, login, signup, logout, refresh };
}
