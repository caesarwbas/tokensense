// app/api/auth/callback/route.ts
// Handles Supabase email confirmation redirect.
// Supabase sends users here after clicking the confirmation link in their email.

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const code  = searchParams.get("code");
  const next  = searchParams.get("next") ?? "/";
  const error = searchParams.get("error");

  // Handle error from Supabase (e.g. expired link)
  if (error) {
    console.error("[auth/callback] Supabase error:", error, searchParams.get("error_description"));
    return NextResponse.redirect(`${origin}/?error=link_expired`);
  }

  if (code) {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get:    (name: string) => cookieStore.get(name)?.value,
          set:    (name: string, value: string, options: Record<string, unknown>) => cookieStore.set({ name, value, ...options }),
          remove: (name: string, options: Record<string, unknown>) => cookieStore.set({ name, value: "", ...options }),
        },
      }
    );

    // Exchange the code for a session
    const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code);

    if (!sessionError) {
      return NextResponse.redirect(`${origin}${next}`);
    }

    console.error("[auth/callback] Session exchange failed:", sessionError);
  }

  return NextResponse.redirect(`${origin}/?error=auth_failed`);
}
