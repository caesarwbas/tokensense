// lib/supabase.ts
// Two clients: browser (anon key) and server (service role for admin ops)

import { createBrowserClient } from "@supabase/ssr";

// ── Browser client — use in React components ──────────────────────────────────
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ── Types ─────────────────────────────────────────────────────────────────────
export type UserPlan = "free" | "pro" | "team";

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  plan: UserPlan;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  created_at: string;
}

// ── Auth helpers ──────────────────────────────────────────────────────────────

/** Sign up with email + password. Sends confirmation email via Supabase. */
export async function signUp(email: string, password: string, name: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },                                 // stored in auth.users.raw_user_meta_data
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });
  if (error) throw error;
  return data;
}

/** Sign in with email + password. */
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

/** Sign out current user. */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/** Get current session (null if not logged in). */
export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

/** Fetch user profile from public.profiles table. */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (error) return null;
  return data as UserProfile;
}

/** Update user plan locally (Stripe webhook updates DB server-side). */
export async function updateUserPlan(userId: string, plan: UserPlan) {
  const { error } = await supabase
    .from("profiles")
    .update({ plan })
    .eq("id", userId);
  if (error) throw error;
}
