// app/api/stripe/webhook/route.ts
// Handles Stripe webhook events to keep user plans in sync.
// Register this URL at: stripe.com/dashboard → Webhooks → Add endpoint
// URL: https://yourdomain.com/api/stripe/webhook
// Events to listen for: customer.subscription.created, updated, deleted

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

// Use service role key for admin DB writes (bypasses RLS)
// IMPORTANT: This key must NEVER be exposed to the client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!   // add this to .env.local
);

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig  = req.headers.get("stripe-signature")!;

  // ── 1. Verify webhook signature ───────────────────────────────────────────
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error("[webhook] Invalid signature:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // ── 2. Handle relevant events ─────────────────────────────────────────────
  try {
    switch (event.type) {

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.supabase_user_id;
        const plan   = sub.metadata?.plan as "pro" | "team";

        if (!userId || !plan) break;

        const isActive = ["active", "trialing"].includes(sub.status);

        await supabaseAdmin.from("profiles").update({
          plan: isActive ? plan : "free",
          stripe_subscription_id: sub.id,
        }).eq("id", userId);

        console.log(`[webhook] Updated ${userId} → ${isActive ? plan : "free"}`);
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.supabase_user_id;
        if (!userId) break;

        await supabaseAdmin.from("profiles").update({
          plan: "free",
          stripe_subscription_id: null,
        }).eq("id", userId);

        console.log(`[webhook] Downgraded ${userId} → free (subscription canceled)`);
        break;
      }

      // Add more events as needed:
      // case "invoice.payment_failed": notify user by email via Resend
      // case "customer.subscription.trial_will_end": send reminder email

      default:
        // Unhandled event type — safe to ignore
        break;
    }
  } catch (err) {
    console.error("[webhook] Handler error:", err);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

// Stripe needs raw body — disable Next.js body parsing for this route
export const config = { api: { bodyParser: false } };
