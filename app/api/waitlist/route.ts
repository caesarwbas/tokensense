// app/api/waitlist/route.ts
// Saves waitlist entry to Supabase and sends notification email via Resend.

import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const resend = new Resend(process.env.RESEND_API_KEY!);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const schema = z.object({
  name:     z.string().min(1),
  email:    z.string().email(),
  company:  z.string().min(1),
  teamSize: z.string().optional(),
  useCase:  z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = schema.parse(body);

    // ── 1. Save to Supabase waitlist table ────────────────────────────────────
    const { error: dbError } = await supabaseAdmin.from("waitlist").insert({
      name:      data.name,
      email:     data.email,
      company:   data.company,
      team_size: data.teamSize,
      use_case:  data.useCase,
    });

    // If duplicate email, still treat as success (idempotent)
    if (dbError && !dbError.message.includes("unique")) {
      console.error("[waitlist] DB error:", dbError);
      return NextResponse.json({ error: "Failed to save" }, { status: 500 });
    }

    // ── 2. Send notification email to you ─────────────────────────────────────
    await resend.emails.send({
      from:    process.env.RESEND_FROM_EMAIL!,
      to:      process.env.RESEND_WAITLIST_TO!,
      subject: `🚀 New waitlist signup: ${data.company}`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
          <h2 style="color:#0f172a;">New Team Waitlist Signup</h2>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:8px 0;color:#64748b;font-size:13px;">Name</td><td style="font-weight:600;">${data.name}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b;font-size:13px;">Email</td><td>${data.email}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b;font-size:13px;">Company</td><td style="font-weight:600;">${data.company}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b;font-size:13px;">Team size</td><td>${data.teamSize || "—"}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b;font-size:13px;vertical-align:top;">Use case</td><td style="font-size:13px;">${data.useCase || "—"}</td></tr>
          </table>
        </div>
      `,
    });

    // ── 3. Send confirmation email to the user ────────────────────────────────
    await resend.emails.send({
      from:    process.env.RESEND_FROM_EMAIL!,
      to:      data.email,
      subject: "You're on the TokenSense Team waitlist 🎉",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;">
          <div style="font-size:32px;margin-bottom:16px;">🪙</div>
          <h2 style="color:#0f172a;margin:0 0 8px;">You're on the list, ${data.name}!</h2>
          <p style="color:#475569;font-size:14px;line-height:1.7;">
            Thanks for your interest in TokenSense Team. We'll email you as soon as spots open — 
            and you'll get early access pricing as a waitlist member.
          </p>
          <p style="color:#475569;font-size:14px;line-height:1.7;">
            In the meantime, you can use the <a href="${process.env.NEXT_PUBLIC_APP_URL}" style="color:#0ea5e9;">free dashboard</a> 
            to start tracking your context usage.
          </p>
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" />
          <p style="color:#94a3b8;font-size:12px;">TokenSense · Unsubscribe</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });

  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid form data", details: err.errors }, { status: 400 });
    }
    console.error("[waitlist]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
