// lib/supabase.ts
// Full Supabase client: auth (email + Google), profiles, orgs, usage events

import { createBrowserClient } from "@supabase/ssr";

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
  anthropic_api_key: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  org_id: string | null;
  created_at: string;
}

export interface Org {
  id: string;
  name: string;
  owner_id: string;
  invite_code: string;
  created_at: string;
}

export interface OrgMember extends UserProfile {
  // joined from profiles
}

export interface UsageEvent {
  id: string;
  user_id: string;
  org_id: string | null;
  model: string;
  tokens_used: number;
  tokens_saved: number;
  cost_usd: number;
  session_name: string | null;
  recorded_at: string;
}

// ── Auth: Email ───────────────────────────────────────────────────────────────

export async function signUp(email: string, password: string, name: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`,
    },
  });
  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// ── Auth: Google OAuth ────────────────────────────────────────────────────────

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`,
      queryParams: { access_type: "offline", prompt: "consent" },
    },
  });
  if (error) throw error;
  return data; // redirects browser to Google — no return value needed
}

// ── Session ───────────────────────────────────────────────────────────────────

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function getUser() {
  const { data } = await supabase.auth.getUser();
  return data.user;
}

// ── Profiles ──────────────────────────────────────────────────────────────────

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (error) return null;
  return data as UserProfile;
}

export async function updateProfile(userId: string, updates: Partial<UserProfile>) {
  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId);
  if (error) throw error;
}

export async function saveApiKey(userId: string, apiKey: string) {
  // In production consider encrypting before storing
  const { error } = await supabase
    .from("profiles")
    .update({ anthropic_api_key: apiKey })
    .eq("id", userId);
  if (error) throw error;
}

// ── Orgs ──────────────────────────────────────────────────────────────────────

export async function createOrg(name: string, ownerId: string): Promise<Org> {
  const { data, error } = await supabase
    .from("orgs")
    .insert({ name, owner_id: ownerId })
    .select()
    .single();
  if (error) throw error;
  // Link owner's profile to this org + upgrade to team
  await supabase.from("profiles").update({ org_id: data.id, plan: "team" }).eq("id", ownerId);
  return data as Org;
}

export async function joinOrgByInviteCode(inviteCode: string, userId: string): Promise<Org> {
  const { data: org, error } = await supabase
    .from("orgs")
    .select("*")
    .eq("invite_code", inviteCode.toUpperCase())
    .single();
  if (error || !org) throw new Error("Invalid invite code");
  await supabase.from("profiles").update({ org_id: org.id }).eq("id", userId);
  return org as Org;
}

export async function getOrgByOwner(ownerId: string): Promise<Org | null> {
  const { data } = await supabase.from("orgs").select("*").eq("owner_id", ownerId).single();
  return data as Org | null;
}

export async function getOrgMembers(orgId: string): Promise<OrgMember[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("org_id", orgId);
  if (error) return [];
  return data as OrgMember[];
}

export async function removeOrgMember(memberId: string) {
  const { error } = await supabase
    .from("profiles")
    .update({ org_id: null })
    .eq("id", memberId);
  if (error) throw error;
}

// ── Usage events ──────────────────────────────────────────────────────────────

export async function recordUsage(event: Omit<UsageEvent, "id" | "recorded_at">) {
  const { error } = await supabase.from("usage_events").insert(event);
  if (error) throw error;
}

export async function getMyUsage(userId: string, days = 30): Promise<UsageEvent[]> {
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const { data } = await supabase
    .from("usage_events")
    .select("*")
    .eq("user_id", userId)
    .gte("recorded_at", since)
    .order("recorded_at", { ascending: false });
  return (data || []) as UsageEvent[];
}

export async function getOrgUsage(orgId: string, days = 30): Promise<UsageEvent[]> {
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const { data } = await supabase
    .from("usage_events")
    .select("*, profiles(name, email)")
    .eq("org_id", orgId)
    .gte("recorded_at", since)
    .order("recorded_at", { ascending: false });
  return (data || []) as UsageEvent[];
}
