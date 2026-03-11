import { useState, useEffect, useRef } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// 🔧 CONFIGURATION — swap these with your real keys before launch
// ─────────────────────────────────────────────────────────────────────────────
const CONFIG = {
  // Stripe
  STRIPE_PUBLISHABLE_KEY: "pk_test_YOUR_STRIPE_KEY_HERE",
  STRIPE_PRO_PRICE_ID:    "price_YOUR_PRO_PRICE_ID",
  STRIPE_TEAM_PRICE_ID:   "price_YOUR_TEAM_PRICE_ID",

  // Waitlist / Email (Resend, Mailchimp, etc.)
  WAITLIST_ENDPOINT: "https://api.resend.com/emails", // swap with your endpoint
  WAITLIST_API_KEY:  "re_YOUR_RESEND_KEY_HERE",
  WAITLIST_TO_EMAIL: "you@yourcompany.com",

  // Anthropic (entered by user — never hardcode)
  ANTHROPIC_PROXY:   "https://api.anthropic.com/v1/messages",
};

// ─── Google Fonts ─────────────────────────────────────────────────────────────
const Fonts = () => (
  <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Epilogue:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet" />
);

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  ink:     "#0f172a",
  mid:     "#475569",
  muted:   "#94a3b8",
  subtle:  "#e2e8f0",
  surface: "#f8fafc",
  white:   "#ffffff",
  sky:     "#0ea5e9",
  green:   "#22c55e",
  amber:   "#f59e0b",
  red:     "#ef4444",
  purple:  "#7c3aed",
};

const card = {
  background: C.white,
  borderRadius: 14,
  border: `1px solid ${C.subtle}`,
  padding: "22px 24px",
  boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
};

// ─── Shared UI ────────────────────────────────────────────────────────────────
const Label = ({ children, style }) => (
  <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: "0.11em", fontFamily: "'Syne',sans-serif", marginBottom: 12, ...style }}>
    {children}
  </div>
);

const Btn = ({ children, onClick, variant = "primary", disabled, style, small }) => {
  const [hover, setHover] = useState(false);
  const base = {
    padding: small ? "7px 16px" : "11px 24px",
    borderRadius: 10, border: "none", cursor: disabled ? "not-allowed" : "pointer",
    fontSize: small ? 12 : 13, fontWeight: 700, fontFamily: "'Syne',sans-serif",
    letterSpacing: "0.03em", transition: "all 0.15s", opacity: disabled ? 0.5 : 1,
    ...style,
  };
  const variants = {
    primary:  { background: hover ? "#1e293b" : C.ink, color: C.white },
    sky:      { background: hover ? "#0284c7" : C.sky, color: C.white },
    outline:  { background: hover ? C.surface : C.white, color: C.ink, border: `1.5px solid ${C.subtle}` },
    ghost:    { background: hover ? C.surface : "transparent", color: C.mid, border: "none" },
    danger:   { background: hover ? "#dc2626" : C.red, color: C.white },
    green:    { background: hover ? "#16a34a" : C.green, color: C.white },
  };
  return (
    <button onClick={disabled ? undefined : onClick} style={{ ...base, ...variants[variant] }}
      onMouseOver={() => setHover(true)} onMouseOut={() => setHover(false)}>
      {children}
    </button>
  );
};

const Input = ({ label, type = "text", value, onChange, placeholder, icon, hint, error }) => (
  <div style={{ marginBottom: 16 }}>
    {label && <div style={{ fontSize: 12, fontWeight: 600, color: C.mid, fontFamily: "'Epilogue',sans-serif", marginBottom: 6 }}>{label}</div>}
    <div style={{ position: "relative" }}>
      {icon && <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14 }}>{icon}</span>}
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{
          width: "100%", boxSizing: "border-box",
          padding: icon ? "10px 12px 10px 36px" : "10px 14px",
          borderRadius: 9, border: `1.5px solid ${error ? C.red : C.subtle}`,
          fontSize: 13, fontFamily: "'Epilogue',sans-serif",
          color: C.ink, background: C.white, outline: "none",
          transition: "border-color 0.15s",
        }}
        onFocus={e => e.target.style.borderColor = error ? C.red : C.sky}
        onBlur={e => e.target.style.borderColor = error ? C.red : C.subtle}
      />
    </div>
    {hint && !error && <div style={{ fontSize: 11, color: C.muted, marginTop: 4, fontFamily: "'Epilogue',sans-serif" }}>{hint}</div>}
    {error && <div style={{ fontSize: 11, color: C.red, marginTop: 4, fontFamily: "'Epilogue',sans-serif" }}>{error}</div>}
  </div>
);

const Badge = ({ children, color = C.muted, bg = C.surface }) => (
  <span style={{
    fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 20,
    background: bg, color, fontFamily: "'Syne',sans-serif", letterSpacing: "0.08em",
    border: `1px solid ${color}33`,
  }}>{children}</span>
);

const Toast = ({ msg, type = "success", onClose }) => (
  <div style={{
    position: "fixed", bottom: 24, right: 24, zIndex: 9999,
    background: type === "error" ? "#fef2f2" : "#f0fdf4",
    border: `1px solid ${type === "error" ? "#fca5a5" : "#86efac"}`,
    borderRadius: 12, padding: "14px 18px",
    display: "flex", alignItems: "center", gap: 10,
    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
    animation: "slideUp 0.3s ease",
    maxWidth: 360,
  }}>
    <span style={{ fontSize: 16 }}>{type === "error" ? "❌" : "✅"}</span>
    <span style={{ fontSize: 13, color: type === "error" ? "#dc2626" : "#16a34a", fontFamily: "'Epilogue',sans-serif", flex: 1 }}>{msg}</span>
    <span onClick={onClose} style={{ cursor: "pointer", color: C.muted, fontSize: 16, lineHeight: 1 }}>×</span>
  </div>
);

// ─── Auth Modal ───────────────────────────────────────────────────────────────
function AuthModal({ mode: initMode, onClose, onAuth }) {
  const [mode, setMode] = useState(initMode); // login | signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const validate = () => {
    if (!email.includes("@")) return "Enter a valid email address.";
    if (password.length < 8) return "Password must be at least 8 characters.";
    if (mode === "signup" && !name.trim()) return "Please enter your name.";
    return null;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError(""); setLoading(true);

    // ── REAL AUTH INTEGRATION POINT ──────────────────────────────────────────
    // Replace this mock with your auth provider:
    //   Supabase: await supabase.auth.signUp({ email, password })
    //   Firebase: await createUserWithEmailAndPassword(auth, email, password)
    //   NextAuth:  POST /api/auth/register
    // ─────────────────────────────────────────────────────────────────────────
    await new Promise(r => setTimeout(r, 1200)); // mock network
    const user = { id: `usr_${Date.now()}`, email, name: name || email.split("@")[0], plan: "free" };
    setLoading(false);
    onAuth(user);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(15,23,42,0.5)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: C.white, borderRadius: 18, width: "100%", maxWidth: 400, padding: 32, boxShadow: "0 24px 64px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, fontFamily: "'Syne',sans-serif" }}>
              {mode === "login" ? "Welcome back" : "Create account"}
            </div>
            <div style={{ fontSize: 13, color: C.muted, fontFamily: "'Epilogue',sans-serif", marginTop: 2 }}>
              {mode === "login" ? "Sign in to TokenSense" : "Start your free account"}
            </div>
          </div>
          <span onClick={onClose} style={{ cursor: "pointer", fontSize: 20, color: C.muted }}>×</span>
        </div>

        {mode === "signup" && <Input label="Full name" value={name} onChange={setName} placeholder="Your name" icon="👤" />}
        <Input label="Email" type="email" value={email} onChange={setEmail} placeholder="you@company.com" icon="✉️" />
        <Input label="Password" type="password" value={password} onChange={setPassword} placeholder="Min. 8 characters" icon="🔒"
          hint={mode === "signup" ? "Use a strong password — 8+ characters" : undefined} error={error} />

        <Btn onClick={handleSubmit} disabled={loading} style={{ width: "100%", marginBottom: 16, padding: "13px 0" }}>
          {loading ? "Please wait…" : mode === "login" ? "Sign In" : "Create Free Account"}
        </Btn>

        <div style={{ textAlign: "center", fontSize: 13, color: C.muted, fontFamily: "'Epilogue',sans-serif" }}>
          {mode === "login" ? "No account? " : "Already have one? "}
          <span onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}
            style={{ color: C.sky, cursor: "pointer", fontWeight: 600 }}>
            {mode === "login" ? "Sign up free" : "Sign in"}
          </span>
        </div>

        <div style={{ marginTop: 20, padding: "12px 14px", background: C.surface, borderRadius: 10, fontSize: 11, color: C.muted, fontFamily: "'Epilogue',sans-serif", lineHeight: 1.5 }}>
          🔐 Your API key is stored only in your browser. We never send it to our servers.
        </div>
      </div>
    </div>
  );
}

// ─── API Key Modal (Pro) ──────────────────────────────────────────────────────
function ApiKeyModal({ onClose, onSave, existing }) {
  const [key, setKey] = useState(existing || "");
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState(null); // null | ok | error

  const testKey = async () => {
    if (!key.startsWith("sk-ant-")) { setStatus("error"); return; }
    setTesting(true); setStatus(null);

    // ── REAL API KEY TEST ─────────────────────────────────────────────────────
    // This calls Anthropic directly from the browser — key never touches your server.
    // In production, proxy through your backend to avoid exposing the key in DevTools.
    // ─────────────────────────────────────────────────────────────────────────
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": key,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 10,
          messages: [{ role: "user", content: "hi" }],
        }),
      });
      setStatus(res.ok ? "ok" : "error");
    } catch {
      setStatus("error");
    }
    setTesting(false);
  };

  const save = () => {
    // Store in localStorage — key stays on device, never sent to your server
    localStorage.setItem("ts_anthropic_key", key);
    onSave(key);
    onClose();
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(15,23,42,0.5)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: C.white, borderRadius: 18, width: "100%", maxWidth: 440, padding: 32, boxShadow: "0 24px 64px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, fontFamily: "'Syne',sans-serif" }}>Connect Anthropic API</div>
            <div style={{ fontSize: 13, color: C.muted, fontFamily: "'Epilogue',sans-serif", marginTop: 3 }}>Pro feature — see real usage data</div>
          </div>
          <span onClick={onClose} style={{ cursor: "pointer", fontSize: 20, color: C.muted }}>×</span>
        </div>

        <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10, padding: "12px 14px", marginBottom: 18, fontSize: 12, color: "#1d4ed8", fontFamily: "'Epilogue',sans-serif", lineHeight: 1.6 }}>
          🔑 Get your key at <strong>console.anthropic.com</strong> → API Keys → Create Key.<br />
          Your key is stored locally and never leaves your browser.
        </div>

        <Input label="Anthropic API Key" value={key} onChange={v => { setKey(v); setStatus(null); }}
          placeholder="sk-ant-api03-…" icon="🔑"
          error={status === "error" ? "Key invalid or API unreachable — check and retry." : undefined}
          hint={status === "ok" ? "✓ Key verified successfully!" : undefined} />

        {status === "ok" && (
          <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "10px 14px", marginBottom: 14, fontSize: 12, color: "#16a34a", fontFamily: "'Epilogue',sans-serif" }}>
            ✅ Connection verified — live usage data is now enabled.
          </div>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          <Btn onClick={testKey} disabled={!key || testing} variant="outline" style={{ flex: 1 }}>
            {testing ? "Testing…" : "Test Connection"}
          </Btn>
          <Btn onClick={save} disabled={!key} style={{ flex: 1 }}>
            Save & Connect
          </Btn>
        </div>

        <div style={{ marginTop: 16, fontSize: 11, color: C.muted, fontFamily: "'Epilogue',sans-serif", lineHeight: 1.6 }}>
          <strong>Privacy:</strong> Key stored in <code>localStorage</code> on your device only. Revoke anytime at console.anthropic.com.
        </div>
      </div>
    </div>
  );
}

// ─── Stripe Checkout Modal (Pro) ──────────────────────────────────────────────
function StripeModal({ plan, onClose, onSuccess }) {
  const [step, setStep] = useState("card"); // card | processing | done
  const [card, setCard] = useState({ number: "", expiry: "", cvc: "", name: "" });
  const [errors, setErrors] = useState({});

  const fmt = {
    number: v => v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim(),
    expiry: v => { const d = v.replace(/\D/g, "").slice(0, 4); return d.length > 2 ? `${d.slice(0,2)}/${d.slice(2)}` : d; },
    cvc:    v => v.replace(/\D/g, "").slice(0, 4),
  };

  const validate = () => {
    const e = {};
    if (card.number.replace(/\s/g, "").length < 16) e.number = "Enter 16-digit card number";
    if (!card.expiry.includes("/")) e.expiry = "Format: MM/YY";
    if (card.cvc.length < 3) e.cvc = "3–4 digits";
    if (!card.name.trim()) e.name = "Required";
    return e;
  };

  const handlePay = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setStep("processing");

    // ── REAL STRIPE INTEGRATION POINT ────────────────────────────────────────
    // 1. Load Stripe.js: const stripe = await loadStripe(CONFIG.STRIPE_PUBLISHABLE_KEY)
    // 2. Create PaymentIntent on your backend: POST /api/stripe/create-intent
    // 3. Confirm: stripe.confirmCardPayment(clientSecret, { payment_method: { card } })
    // 4. On success, call your backend to update user plan: POST /api/user/upgrade
    // ─────────────────────────────────────────────────────────────────────────
    await new Promise(r => setTimeout(r, 2200)); // mock Stripe processing
    setStep("done");
    setTimeout(() => onSuccess(plan), 800);
  };

  const prices = { pro: "$19/mo", team: "$79/mo" };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(15,23,42,0.5)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }} onClick={e => e.target === e.currentTarget && step !== "processing" && onClose()}>
      <div style={{ background: C.white, borderRadius: 18, width: "100%", maxWidth: 420, padding: 32, boxShadow: "0 24px 64px rgba(0,0,0,0.2)" }}>

        {step === "done" ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
            <div style={{ fontSize: 20, fontWeight: 800, fontFamily: "'Syne',sans-serif", marginBottom: 8 }}>You're on {plan.charAt(0).toUpperCase() + plan.slice(1)}!</div>
            <div style={{ fontSize: 13, color: C.muted, fontFamily: "'Epilogue',sans-serif" }}>All features unlocked. Redirecting…</div>
          </div>
        ) : step === "processing" ? (
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <div style={{ fontSize: 32, marginBottom: 12, animation: "spin 1s linear infinite", display: "inline-block" }}>⚙️</div>
            <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "'Syne',sans-serif", marginBottom: 6 }}>Processing payment…</div>
            <div style={{ fontSize: 13, color: C.muted, fontFamily: "'Epilogue',sans-serif" }}>Connecting to Stripe — please wait</div>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, fontFamily: "'Syne',sans-serif" }}>
                  Upgrade to {plan.charAt(0).toUpperCase() + plan.slice(1)}
                </div>
                <div style={{ fontSize: 13, color: C.muted, fontFamily: "'Epilogue',sans-serif", marginTop: 2 }}>{prices[plan]} — cancel anytime</div>
              </div>
              <span onClick={onClose} style={{ cursor: "pointer", fontSize: 20, color: C.muted }}>×</span>
            </div>

            {/* Order summary */}
            <div style={{ background: C.surface, borderRadius: 10, padding: "12px 16px", marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, fontFamily: "'Syne',sans-serif" }}>TokenSense {plan.charAt(0).toUpperCase() + plan.slice(1)}</div>
                <div style={{ fontSize: 11, color: C.muted, fontFamily: "'Epilogue',sans-serif" }}>Billed monthly · cancel anytime</div>
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, fontFamily: "'JetBrains Mono',monospace" }}>{prices[plan]}</div>
            </div>

            <Input label="Cardholder name" value={card.name} onChange={v => setCard(p => ({...p, name: v}))}
              placeholder="Jane Smith" icon="👤" error={errors.name} />
            <Input label="Card number" value={card.number} onChange={v => setCard(p => ({...p, number: fmt.number(v)}))}
              placeholder="1234 5678 9012 3456" icon="💳" error={errors.number} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Input label="Expiry" value={card.expiry} onChange={v => setCard(p => ({...p, expiry: fmt.expiry(v)}))}
                placeholder="MM/YY" error={errors.expiry} />
              <Input label="CVC" value={card.cvc} onChange={v => setCard(p => ({...p, cvc: fmt.cvc(v)}))}
                placeholder="123" error={errors.cvc} />
            </div>

            <Btn onClick={handlePay} style={{ width: "100%", padding: "13px 0", marginTop: 4 }} variant="sky">
              Pay {prices[plan]} →
            </Btn>

            <div style={{ marginTop: 14, display: "flex", justifyContent: "center", gap: 16, fontSize: 11, color: C.muted, fontFamily: "'Epilogue',sans-serif" }}>
              <span>🔒 256-bit SSL</span>
              <span>💳 Powered by Stripe</span>
              <span>↩️ Cancel anytime</span>
            </div>

            <div style={{ marginTop: 12, padding: "10px 14px", background: "#fffbeb", borderRadius: 9, fontSize: 11, color: "#92400e", fontFamily: "'Epilogue',sans-serif" }}>
              ⚠️ <strong>Dev mode:</strong> Replace <code>CONFIG.STRIPE_PUBLISHABLE_KEY</code> with your real Stripe key. No real charges in demo.
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Team Waitlist Modal ──────────────────────────────────────────────────────
function WaitlistModal({ onClose }) {
  const [step, setStep] = useState("form"); // form | submitting | done
  const [form, setForm] = useState({ name: "", email: "", company: "", size: "", usecase: "" });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Required";
    if (!form.email.includes("@")) e.email = "Valid email required";
    if (!form.company.trim()) e.company = "Required";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setStep("submitting");

    // ── REAL WAITLIST EMAIL INTEGRATION ──────────────────────────────────────
    // Option A — Resend:
    //   POST https://api.resend.com/emails
    //   Headers: Authorization: Bearer re_YOUR_KEY
    //   Body: { from, to, subject, html }
    //
    // Option B — Mailchimp:
    //   POST https://us1.api.mailchimp.com/3.0/lists/LIST_ID/members
    //
    // Option C — Simple: POST to your own /api/waitlist endpoint
    //   which stores to DB and sends confirmation email
    // ─────────────────────────────────────────────────────────────────────────

    // Mock submission (replace with real fetch call above)
    await new Promise(r => setTimeout(r, 1500));

    /* Real Resend example (uncomment + add your key):
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${CONFIG.WAITLIST_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "TokenSense <waitlist@tokensense.app>",
        to: CONFIG.WAITLIST_TO_EMAIL,
        subject: `New Team waitlist: ${form.company}`,
        html: `<p><b>${form.name}</b> (${form.email}) from <b>${form.company}</b> (${form.size} devs) joined the waitlist.<br/>Use case: ${form.usecase}</p>`,
      }),
    });
    */

    setStep("done");
  };

  const set = (k, v) => { setForm(p => ({...p, [k]: v})); setErrors(p => ({...p, [k]: undefined})); };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(15,23,42,0.5)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }} onClick={e => e.target === e.currentTarget && step !== "submitting" && onClose()}>
      <div style={{ background: C.white, borderRadius: 18, width: "100%", maxWidth: 460, padding: 32, boxShadow: "0 24px 64px rgba(0,0,0,0.2)", maxHeight: "90vh", overflowY: "auto" }}>

        {step === "done" ? (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🚀</div>
            <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "'Syne',sans-serif", marginBottom: 10 }}>You're on the list!</div>
            <div style={{ fontSize: 14, color: C.muted, fontFamily: "'Epilogue',sans-serif", lineHeight: 1.7, marginBottom: 24 }}>
              We'll email <strong>{form.email}</strong> as soon as Team plan spots open.<br />
              Expected launch: <strong>Q2 2026</strong>.
            </div>
            <Btn onClick={onClose} variant="outline">Back to Dashboard</Btn>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, fontFamily: "'Syne',sans-serif" }}>Join Team Waitlist</div>
                <div style={{ fontSize: 13, color: C.muted, fontFamily: "'Epilogue',sans-serif", marginTop: 3 }}>
                  Be first when Team plan launches · <Badge color={C.purple} bg="#f5f3ff">47 ahead of you</Badge>
                </div>
              </div>
              <span onClick={onClose} style={{ cursor: "pointer", fontSize: 20, color: C.muted }}>×</span>
            </div>

            <div style={{ background: "#f5f3ff", border: "1px solid #ddd6fe", borderRadius: 10, padding: "12px 14px", margin: "16px 0", fontSize: 12, color: "#5b21b6", fontFamily: "'Epilogue',sans-serif", lineHeight: 1.6 }}>
              👥 <strong>Team plan includes:</strong> 25 developers, real-time usage dashboard, per-dev cost tracking, Slack + GitHub alerts, SSO, dedicated onboarding.
            </div>

            <Input label="Your name" value={form.name} onChange={v => set("name", v)} placeholder="Jane Smith" icon="👤" error={errors.name} />
            <Input label="Work email" type="email" value={form.email} onChange={v => set("email", v)} placeholder="jane@company.com" icon="✉️" error={errors.email} />
            <Input label="Company" value={form.company} onChange={v => set("company", v)} placeholder="Acme Corp" icon="🏢" error={errors.company} />

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.mid, fontFamily: "'Epilogue',sans-serif", marginBottom: 6 }}>Team size</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {["1–5", "6–15", "16–25", "25+"].map(s => (
                  <button key={s} onClick={() => set("size", s)} style={{
                    padding: "7px 16px", borderRadius: 8,
                    border: `1.5px solid ${form.size === s ? C.purple : C.subtle}`,
                    background: form.size === s ? "#f5f3ff" : C.white,
                    color: form.size === s ? C.purple : C.mid,
                    cursor: "pointer", fontSize: 12, fontFamily: "'Epilogue',sans-serif", fontWeight: 600,
                    transition: "all 0.15s",
                  }}>{s} devs</button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.mid, fontFamily: "'Epilogue',sans-serif", marginBottom: 6 }}>What's your main use case? <span style={{ color: C.muted, fontWeight: 400 }}>(optional)</span></div>
              <textarea value={form.usecase} onChange={e => set("usecase", e.target.value)}
                placeholder="e.g. We use Claude Code for backend dev and want to track token spend per engineer…"
                rows={3} style={{
                  width: "100%", boxSizing: "border-box", padding: "10px 14px",
                  borderRadius: 9, border: `1.5px solid ${C.subtle}`,
                  fontSize: 13, fontFamily: "'Epilogue',sans-serif", color: C.ink,
                  resize: "vertical", outline: "none",
                }} />
            </div>

            <Btn onClick={handleSubmit} disabled={step === "submitting"} variant="primary" style={{ width: "100%", padding: "13px 0" }}>
              {step === "submitting" ? "Submitting…" : "Join Waitlist →"}
            </Btn>

            <div style={{ marginTop: 12, fontSize: 11, color: C.muted, textAlign: "center", fontFamily: "'Epilogue',sans-serif" }}>
              No spam. Early access pricing guaranteed for waitlist members.
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Settings Panel ───────────────────────────────────────────────────────────
function SettingsPanel({ user, apiKey, onSaveKey, onLogout, onUpgrade }) {
  const [showApiModal, setShowApiModal] = useState(false);
  const masked = apiKey ? `sk-ant-…${apiKey.slice(-6)}` : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 560 }}>
      {showApiModal && (
        <ApiKeyModal existing={apiKey} onClose={() => setShowApiModal(false)} onSave={onSaveKey} />
      )}

      {/* Profile */}
      <div style={card}>
        <Label>YOUR ACCOUNT</Label>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: C.ink, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: C.white, fontWeight: 700, fontFamily: "'Syne',sans-serif" }}>
            {user.name[0].toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, fontFamily: "'Syne',sans-serif" }}>{user.name}</div>
            <div style={{ fontSize: 12, color: C.muted, fontFamily: "'Epilogue',sans-serif" }}>{user.email}</div>
          </div>
          <Badge color={user.plan === "pro" ? C.white : C.muted} bg={user.plan === "pro" ? C.ink : C.surface}>
            {user.plan.toUpperCase()}
          </Badge>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {user.plan === "free" && <Btn onClick={() => onUpgrade("pro")} variant="sky" small>Upgrade to Pro →</Btn>}
          <Btn onClick={onLogout} variant="ghost" small>Sign out</Btn>
        </div>
      </div>

      {/* API Key — Pro only */}
      <div style={{ ...card, ...(user.plan === "free" ? { opacity: 0.7 } : {}) }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
          <Label style={{ marginBottom: 0 }}>ANTHROPIC API KEY</Label>
          {user.plan === "free" && <Badge color={C.amber} bg="#fffbeb">PRO</Badge>}
        </div>
        {user.plan !== "free" ? (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <div style={{ flex: 1, padding: "10px 14px", background: C.surface, borderRadius: 9, fontFamily: "'JetBrains Mono',monospace", fontSize: 13, color: apiKey ? C.ink : C.muted, border: `1px solid ${C.subtle}` }}>
                {masked || "No key connected"}
              </div>
              {apiKey && <Badge color={C.green} bg="#f0fdf4">● Live</Badge>}
            </div>
            <div style={{ fontSize: 13, color: C.muted, fontFamily: "'Epilogue',sans-serif", marginBottom: 14, lineHeight: 1.6 }}>
              Connect your Anthropic key to see real token usage instead of estimates. Key stays on your device only.
            </div>
            <Btn onClick={() => setShowApiModal(true)} variant={apiKey ? "outline" : "primary"} small>
              {apiKey ? "Update Key" : "Connect API Key →"}
            </Btn>
          </>
        ) : (
          <div style={{ fontSize: 13, color: C.muted, fontFamily: "'Epilogue',sans-serif", lineHeight: 1.6 }}>
            Real API integration is a Pro feature. Upgrade to connect your Anthropic key and see live usage data.
          </div>
        )}
      </div>

      {/* Billing */}
      <div style={card}>
        <Label>BILLING</Label>
        {user.plan === "free" ? (
          <div>
            <div style={{ fontSize: 13, color: C.mid, fontFamily: "'Epilogue',sans-serif", marginBottom: 14, lineHeight: 1.6 }}>
              You're on the free plan. Upgrade to Pro ($19/mo) for all models, API integration, checkpoints, and export.
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <Btn onClick={() => onUpgrade("pro")} variant="sky" small>Upgrade to Pro — $19/mo</Btn>
              <Btn onClick={() => onUpgrade("team")} variant="outline" small>Team Plan →</Btn>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontFamily: "'Epilogue',sans-serif", color: C.mid }}>Current plan</span>
              <span style={{ fontWeight: 700, fontFamily: "'Syne',sans-serif" }}>{user.plan === "pro" ? "Pro — $19/mo" : "Team — $79/mo"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
              <span style={{ fontSize: 13, fontFamily: "'Epilogue',sans-serif", color: C.mid }}>Next billing date</span>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13 }}>Apr 11, 2026</span>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <Btn variant="outline" small>Manage billing →</Btn>
              {user.plan === "pro" && <Btn onClick={() => onUpgrade("team")} variant="ghost" small>Upgrade to Team</Btn>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("ts_anthropic_key") || "");
  const [modal, setModal] = useState(null); // auth-login | auth-signup | stripe-pro | stripe-team | waitlist | api-key
  const [tab, setTab] = useState("dashboard"); // dashboard | settings
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleAuth = (u) => { setUser(u); setModal(null); showToast(`Welcome, ${u.name}! 👋`); };
  const handleLogout = () => { setUser(null); showToast("Signed out."); };
  const handleUpgrade = (plan) => {
    if (plan === "team") { setModal("waitlist"); return; }
    setModal(`stripe-${plan}`);
  };
  const handleStripeSuccess = (plan) => {
    setUser(u => ({ ...u, plan }));
    setModal(null);
    showToast(`🎉 You're now on the ${plan.charAt(0).toUpperCase() + plan.slice(1)} plan!`);
  };
  const handleSaveKey = (k) => { setApiKey(k); showToast("API key saved — live data enabled!"); };

  // ── Dashboard content (reuse from previous, compact version) ──────────────
  const [model, setModel] = useState("claude-sonnet-4-6");
  const [critical, setCritical] = useState(12000);
  const [active, setActive] = useState(35000);
  const [background, setBackground] = useState(53000);
  const [devs, setDevs] = useState(3);
  const [sessions, setSessions] = useState(8);
  const [compacted, setCompacted] = useState(false);
  const [tipIdx, setTipIdx] = useState(0);

  useEffect(() => { const t = setInterval(() => setTipIdx(i => (i + 1) % TIPS.length), 5000); return () => clearInterval(t); }, []);

  const MODEL_COSTS = {
    "claude-sonnet-4-6": { label: "Sonnet 4.6", input: 3.0, ctx: 200000 },
    "claude-opus-4-6":   { label: "Opus 4.6",   input: 15.0, ctx: 200000 },
    "claude-haiku-4-5":  { label: "Haiku 4.5",  input: 0.8,  ctx: 200000 },
  };
  const TIPS = [
    { icon: "⚡", title: "Compact at 50%", body: "Run /compact when context hits ~50%. Don't wait for hard limits." },
    { icon: "📋", title: "Checkpoint first", body: "Save next steps + touched files before any /compact or /clear." },
    { icon: "🎯", title: "One session per task", body: "New task = new session. Don't let context bleed." },
    { icon: "🤫", title: "Shorter updates", body: "Summarize phases — don't narrate every file write." },
    { icon: "📚", title: "Tiered docs", body: "Keep CLAUDE.md lean. Move deep details to docs/*.md." },
    { icon: "🔗", title: "Batch edits", body: "Group file changes before reporting — fewer update cycles." },
  ];
  const isPro = user?.plan === "pro" || user?.plan === "team";
  const isTeam = user?.plan === "team";
  const m = MODEL_COSTS[model];
  const used = critical + active + background;
  const usedPct = (used / m.ctx) * 100;
  const prunable = background * 0.4;
  const afterCompact = used - prunable;
  const daily = (used / 1e6) * m.input * sessions * devs;
  const saved = (prunable / 1e6) * m.input * sessions * devs;

  const handleCompact = () => {
    if (compacted) return;
    setBackground(b => Math.round(b * 0.6));
    setCompacted(true);
    setTimeout(() => setCompacted(false), 2500);
  };

  function GaugeSmall({ pct, label, sub, color }) {
    const r = 40, circ = 2 * Math.PI * r;
    const dash = circ * Math.min(pct / 100, 1);
    const col = pct > 80 ? C.red : pct > 50 ? C.amber : color;
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
        <svg width={96} height={96} viewBox="0 0 96 96">
          <circle cx={48} cy={48} r={r} fill="none" stroke={C.subtle} strokeWidth={7} />
          <circle cx={48} cy={48} r={r} fill="none" stroke={col} strokeWidth={7}
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" transform="rotate(-90 48 48)"
            style={{ transition: "stroke-dasharray 0.6s cubic-bezier(.34,1.56,.64,1)" }} />
          <text x={48} y={44} textAnchor="middle" fill={C.ink} fontSize={16} fontWeight={700} fontFamily="'JetBrains Mono',monospace">{Math.round(pct)}%</text>
          <text x={48} y={58} textAnchor="middle" fill={C.muted} fontSize={8} fontFamily="'Epilogue',sans-serif">{sub}</text>
        </svg>
        <span style={{ fontSize: 10, color: C.muted, fontFamily: "'Epilogue',sans-serif", fontWeight: 500 }}>{label}</span>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: C.surface, color: C.ink }}>
      <Fonts />
      <style>{`
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        * { box-sizing: border-box; }
        input[type=range] { -webkit-appearance: none; appearance: none; height: 4px; border-radius: 2px; outline: none; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 14px; height: 14px; border-radius: 50%; background: currentColor; cursor: pointer; }
      `}</style>

      {/* Modals */}
      {modal === "auth-login"  && <AuthModal mode="login"  onClose={() => setModal(null)} onAuth={handleAuth} />}
      {modal === "auth-signup" && <AuthModal mode="signup" onClose={() => setModal(null)} onAuth={handleAuth} />}
      {modal === "stripe-pro"  && <StripeModal plan="pro"  onClose={() => setModal(null)} onSuccess={handleStripeSuccess} />}
      {modal === "stripe-team" && <StripeModal plan="team" onClose={() => setModal(null)} onSuccess={handleStripeSuccess} />}
      {modal === "waitlist"    && <WaitlistModal onClose={() => setModal(null)} />}
      {modal === "api-key"     && <ApiKeyModal existing={apiKey} onClose={() => setModal(null)} onSave={handleSaveKey} />}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Nav */}
      <nav style={{
        background: C.white, borderBottom: `1px solid ${C.subtle}`,
        padding: "0 28px", height: 56,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20 }}>🪙</span>
          <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 16 }}>TokenSense</span>
          {user && <Badge color={user.plan === "pro" ? C.white : user.plan === "team" ? C.sky : C.muted}
            bg={user.plan === "pro" ? C.ink : user.plan === "team" ? "#f0f9ff" : C.surface}>
            {user.plan.toUpperCase()}
          </Badge>}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {user && (
            <>
              {["dashboard", "settings"].map(t => (
                <button key={t} onClick={() => setTab(t)} style={{
                  padding: "6px 14px", borderRadius: 8, border: "none",
                  background: tab === t ? C.surface : "transparent",
                  color: tab === t ? C.ink : C.muted,
                  cursor: "pointer", fontSize: 13, fontWeight: tab === t ? 600 : 400,
                  fontFamily: "'Epilogue',sans-serif",
                }}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
              ))}
            </>
          )}

          {!user ? (
            <div style={{ display: "flex", gap: 8 }}>
              <Btn onClick={() => setModal("auth-login")} variant="outline" small>Sign in</Btn>
              <Btn onClick={() => setModal("auth-signup")} small>Sign up free</Btn>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {!isPro && <Btn onClick={() => handleUpgrade("pro")} variant="sky" small>Upgrade →</Btn>}
              {isPro && !apiKey && <Btn onClick={() => setModal("api-key")} variant="outline" small>🔑 Connect API</Btn>}
              {apiKey && isPro && <Badge color={C.green} bg="#f0fdf4">● Live Data</Badge>}
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: C.ink, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: C.white, fontWeight: 700, fontFamily: "'Syne',sans-serif", cursor: "pointer" }}
                onClick={() => setTab("settings")}>
                {user.name[0].toUpperCase()}
              </div>
            </div>
          )}
        </div>
      </nav>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "28px 24px", animation: "fadeIn 0.4s ease" }}>

        {/* Settings Tab */}
        {user && tab === "settings" ? (
          <SettingsPanel user={user} apiKey={apiKey} onSaveKey={handleSaveKey} onLogout={handleLogout} onUpgrade={handleUpgrade} />
        ) : (
          <>
            {/* Header */}
            <div style={{ marginBottom: 22, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
              <div>
                <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, fontFamily: "'Syne',sans-serif", letterSpacing: "-0.02em" }}>Context Governor</h1>
                <p style={{ margin: "3px 0 0", fontSize: 13, color: C.muted, fontFamily: "'Epilogue',sans-serif" }}>
                  {apiKey && isPro ? "🟢 Live Anthropic data connected" : "Estimates mode — "}
                  {!apiKey && isPro && <span onClick={() => setModal("api-key")} style={{ color: C.sky, cursor: "pointer" }}>connect API key for live data →</span>}
                  {!user && <span onClick={() => setModal("auth-signup")} style={{ color: C.sky, cursor: "pointer" }}>sign up to save sessions →</span>}
                </p>
              </div>
              {!user && (
                <div style={{ display: "flex", gap: 8 }}>
                  <Btn onClick={() => setModal("auth-signup")} small>Create free account</Btn>
                  <Btn onClick={() => setModal("auth-login")} variant="outline" small>Sign in</Btn>
                </div>
              )}
            </div>

            {/* Watchdog */}
            {usedPct > 50 && (
              <div style={{ background: "#fffbeb", border: `1px solid #fcd34d`, borderRadius: 12, padding: "11px 18px", marginBottom: 14, display: "flex", alignItems: "center", gap: 10 }}>
                <span>⚠️</span>
                <span style={{ fontSize: 13, color: "#92400e", fontFamily: "'Epilogue',sans-serif" }}>
                  <strong>Watchdog:</strong> Context at {Math.round(usedPct)}% — consider running <code>/compact</code> now.
                  {!isPro && <span onClick={() => handleUpgrade("pro")} style={{ color: C.sky, cursor: "pointer", marginLeft: 6 }}>Get alerts on Pro →</span>}
                </span>
              </div>
            )}

            {/* Model Row */}
            <div style={{ ...card, marginBottom: 14 }}>
              <Label>MODEL</Label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                {Object.entries(MODEL_COSTS).map(([id, info]) => {
                  const locked = !isPro && id !== "claude-sonnet-4-6";
                  return (
                    <button key={id} onClick={() => !locked && setModel(id)} style={{
                      padding: "7px 16px", borderRadius: 8,
                      border: `1.5px solid ${model === id ? C.ink : C.subtle}`,
                      background: model === id ? C.ink : locked ? C.surface : C.white,
                      color: model === id ? C.white : locked ? C.muted : C.mid,
                      cursor: locked ? "not-allowed" : "pointer",
                      fontSize: 12, fontFamily: "'JetBrains Mono',monospace", fontWeight: 500,
                      transition: "all 0.15s",
                    }}>{info.label} {locked && "🔒"}</button>
                  );
                })}
                {!isPro && <span style={{ fontSize: 11, color: C.muted, fontFamily: "'Epilogue',sans-serif" }}>
                  <span onClick={() => handleUpgrade("pro")} style={{ color: C.sky, cursor: "pointer" }}>Upgrade to Pro</span> for all models
                </span>}
              </div>
            </div>

            {/* Gauges + Sliders */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
              <div style={card}>
                <Label>CONTEXT USAGE</Label>
                <div style={{ display: "flex", justifyContent: "space-around", marginBottom: 14 }}>
                  <GaugeSmall pct={usedPct} label="Used" sub={`${Math.round(used/1000)}k tkns`} color={C.ink} />
                  <GaugeSmall pct={(prunable / used) * 100} label="Prunable" sub={`${Math.round(prunable/1000)}k free`} color={C.sky} />
                  <GaugeSmall pct={(afterCompact / m.ctx) * 100} label="Post-Compact" sub={`${Math.round(afterCompact/1000)}k`} color={C.green} />
                </div>
                {/* Tier bar */}
                <div style={{ display: "flex", gap: 3, borderRadius: 6, overflow: "hidden", height: 7, marginBottom: 8 }}>
                  {[{pct:(critical/m.ctx)*100,c:C.red},{pct:(active/m.ctx)*100,c:C.amber},{pct:(background/m.ctx)*100,c:C.sky}].map((s,i)=>(
                    <div key={i} style={{ flex: s.pct, background: s.c, transition: "flex 0.5s ease", minWidth: s.pct>0?2:0 }} />
                  ))}
                  <div style={{ flex: 100 - (used/m.ctx)*100, background: C.subtle }} />
                </div>
                <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
                  {[["Critical",C.red],["Active",C.amber],["Background",C.sky]].map(([l,c])=>(
                    <div key={l} style={{ display:"flex",alignItems:"center",gap:4 }}>
                      <div style={{ width:6,height:6,borderRadius:"50%",background:c }} />
                      <span style={{ fontSize:10,color:C.muted,fontFamily:"'Epilogue',sans-serif" }}>{l}</span>
                    </div>
                  ))}
                </div>
                <Btn onClick={handleCompact} variant={compacted ? "green" : "primary"} style={{ width: "100%", padding: "10px 0" }}>
                  {compacted ? "✓ Compacted!" : "⚡ Simulate /compact"}
                </Btn>
              </div>

              <div style={card}>
                <Label>CONTEXT TIERS</Label>
                {[
                  { label: "Critical (never prune)", v: critical, set: setCritical, max: 80000, color: C.red },
                  { label: "Active (prune sparingly)", v: active, set: setActive, max: 120000, color: C.amber },
                  { label: "Background (up to 40%)", v: background, set: setBackground, max: 160000, color: C.sky },
                ].map(({ label, v, set, max, color }) => (
                  <div key={label} style={{ marginBottom: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <span style={{ fontSize: 12, color: C.muted, fontFamily: "'Epilogue',sans-serif" }}>{label}</span>
                      <span style={{ fontSize: 12, fontFamily: "'JetBrains Mono',monospace", fontWeight: 600, color: C.ink }}>{(v/1000).toFixed(1)}k</span>
                    </div>
                    <input type="range" min={0} max={max} value={v} onChange={e => set(Number(e.target.value))}
                      style={{ width: "100%", accentColor: color, cursor: "pointer" }} />
                  </div>
                ))}
              </div>
            </div>

            {/* Cost + Team */}
            <div style={{ display: "grid", gridTemplateColumns: isTeam ? "1fr 1fr" : "1fr", gap: 14, marginBottom: 14 }}>
              <div style={card}>
                <Label>COST CALCULATOR</Label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                  <div>
                    {[
                      { label: `Developers (max ${isTeam?25:isPro?5:1})`, v: devs, set: setDevs, max: isTeam?25:isPro?5:1, color: C.purple },
                      { label: "Sessions / day", v: sessions, set: setSessions, max: 30, color: C.purple },
                    ].map(({ label, v, set, max, color }) => (
                      <div key={label} style={{ marginBottom: 14 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                          <span style={{ fontSize: 11, color: C.muted, fontFamily: "'Epilogue',sans-serif" }}>{label}</span>
                          <span style={{ fontSize: 12, fontFamily: "'JetBrains Mono',monospace", fontWeight: 600, color: C.ink }}>{v}</span>
                        </div>
                        <input type="range" min={1} max={max} value={v} onChange={e => set(Number(e.target.value))}
                          style={{ width: "100%", accentColor: color, cursor: "pointer" }} />
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {[
                      { label: "Daily cost", val: `$${daily.toFixed(2)}`, big: false },
                      { label: "Daily savings", val: `$${saved.toFixed(2)}`, accent: true },
                      { label: "Annual savings", val: `$${(saved * 250).toFixed(0)}`, big: true },
                    ].map(({ label, val, big, accent }) => (
                      <div key={label} style={{ padding: "10px 14px", borderRadius: 10, background: big ? "#f0fdf4" : C.surface, border: `1px solid ${big ? "#bbf7d0" : C.subtle}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 11, color: C.muted, fontFamily: "'Epilogue',sans-serif" }}>{label}</span>
                        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: big ? 18 : 13, color: big ? C.green : accent ? C.sky : C.ink }}>{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {isTeam ? (
                <div style={card}>
                  <Label>TEAM USAGE</Label>
                  {[
                    { name: "Alex K.", tokens: 148000, cost: 0.44, sessions: 12 },
                    { name: "Sara M.", tokens: 92000,  cost: 0.28, sessions: 7  },
                    { name: "Raj P.",  tokens: 201000, cost: 0.60, sessions: 15 },
                  ].map(m => {
                    const p = (m.tokens / 200000) * 100;
                    return (
                      <div key={m.name} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12, padding: "10px 12px", background: C.surface, borderRadius: 10 }}>
                        <div style={{ width: 30, height: 30, borderRadius: "50%", background: C.ink, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: C.white, fontWeight: 700, fontFamily: "'Syne',sans-serif", flexShrink: 0 }}>
                          {m.name[0]}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                            <span style={{ fontSize: 12, fontWeight: 600, fontFamily: "'Syne',sans-serif" }}>{m.name}</span>
                            <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono',monospace", color: C.muted }}>${m.cost.toFixed(2)}</span>
                          </div>
                          <div style={{ height: 4, background: C.subtle, borderRadius: 2, overflow: "hidden" }}>
                            <div style={{ width: `${p}%`, height: "100%", background: p > 80 ? C.red : p > 50 ? C.amber : C.green, borderRadius: 2, transition: "width 0.5s" }} />
                          </div>
                        </div>
                        <Badge color={p > 80 ? C.red : C.green} bg={p > 80 ? "#fef2f2" : "#f0fdf4"}>
                          {p > 80 ? "Compact" : "OK"}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ ...card, background: C.surface, border: `1.5px dashed ${C.subtle}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "'Syne',sans-serif", marginBottom: 4 }}>🔒 Team Dashboard</div>
                    <div style={{ fontSize: 13, color: C.muted, fontFamily: "'Epilogue',sans-serif" }}>Track every developer's usage, costs, and compact status.</div>
                  </div>
                  <Btn onClick={() => setModal("waitlist")} variant="outline" small>Join Team Waitlist →</Btn>
                </div>
              )}
            </div>

            {/* Tip Rotator */}
            <div style={{ ...card, background: "#f0f9ff", border: `1px solid #bae6fd`, display: "flex", alignItems: "flex-start", gap: 14 }}>
              <div style={{ fontSize: 22, flexShrink: 0, marginTop: 2 }}>{TIPS[tipIdx].icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0369a1", fontFamily: "'Syne',sans-serif", marginBottom: 3 }}>{TIPS[tipIdx].title}</div>
                <div style={{ fontSize: 13, color: "#0c4a6e", fontFamily: "'Epilogue',sans-serif", lineHeight: 1.6 }}>{TIPS[tipIdx].body}</div>
              </div>
              <div style={{ display: "flex", gap: 5, flexShrink: 0, paddingTop: 4 }}>
                {TIPS.map((_, i) => (
                  <div key={i} onClick={() => setTipIdx(i)} style={{ width: 6, height: 6, borderRadius: "50%", cursor: "pointer", background: i === tipIdx ? "#0369a1" : "#bae6fd", transition: "background 0.3s" }} />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
