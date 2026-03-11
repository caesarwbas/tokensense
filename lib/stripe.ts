// lib/stripe.ts
// Client-side helper to start a Stripe Checkout session.
// Calls your backend, then redirects to Stripe's hosted checkout page.

export type BillingPlan = "pro" | "team";

/**
 * Start Stripe Checkout for the given plan.
 * Redirects the browser to Stripe's hosted payment page.
 * On success, Stripe redirects to /dashboard?upgraded=pro (or team).
 * Your webhook at /api/stripe/webhook then updates the user's plan in DB.
 */
export async function startCheckout(plan: BillingPlan): Promise<void> {
  const res = await fetch("/api/stripe/checkout", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ plan }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to start checkout");
  }

  const { url } = await res.json();

  if (!url) throw new Error("No checkout URL returned");

  // Redirect to Stripe-hosted payment page
  window.location.href = url;
}

/**
 * Submit waitlist form via your API (which uses Resend).
 */
export async function submitWaitlist(data: {
  name:     string;
  email:    string;
  company:  string;
  teamSize: string;
  useCase:  string;
}): Promise<void> {
  const res = await fetch("/api/waitlist", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to submit waitlist");
  }
}
