import { useState, useEffect, useCallback } from "react";

const Fonts = () => (
  <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Epilogue:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet" />
);

// ─── Theme tokens ─────────────────────────────────────────────────────────────
const LIGHT = {
  ink: "#0f172a", mid: "#475569", muted: "#94a3b8",
  subtle: "#e2e8f0", surface: "#f8fafc", white: "#ffffff",
  sky: "#0ea5e9", green: "#22c55e", amber: "#f59e0b",
  red: "#ef4444", purple: "#7c3aed",
  navBg: "#ffffff", cardBg: "#ffffff", pageBg: "#f8fafc",
  border: "#e2e8f0", inputBg: "#ffffff", inputText: "#0f172a",
};
const DARK = {
  ink: "#f1f5f9", mid: "#94a3b8", muted: "#64748b",
  subtle: "#1e293b", surface: "#0f172a", white: "#1e293b",
  sky: "#38bdf8", green: "#4ade80", amber: "#fbbf24",
  red: "#f87171", purple: "#a78bfa",
  navBg: "#0f172a", cardBg: "#1e293b", pageBg: "#080d18",
  border: "#1e293b", inputBg: "#0f172a", inputText: "#f1f5f9",
};

// ─── Simulated API ────────────────────────────────────────────────────────────
const delay = ms => new Promise(r => setTimeout(r, ms));
const API = {
  signIn: async (email, password) => {
    await delay(1100);
    if (password.length < 8) throw new Error("Invalid email or password.");
    return { id: `usr_${Date.now()}`, email, name: email.split("@")[0], plan: "free" };
  },
  signUp: async (email, password, name) => {
    await delay(1300);
    if (password.length < 8) throw new Error("Password must be at least 8 characters.");
    return { id: `usr_${Date.now()}`, email, name, plan: "free", needsConfirmation: true };
  },
  signInWithGoogle: async () => {
    await delay(800);
    // In production: supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + '/api/auth/callback' } })
    return { id: `usr_${Date.now()}`, email: "user@gmail.com", name: "Google User", plan: "free" };
  },
  startCheckout: async (plan) => { await delay(1800); return { success: true, plan }; },
  submitWaitlist: async () => { await delay(1400); return { success: true }; },
};

const MODEL_DATA = {
  "claude-sonnet-4-6": { label: "Sonnet 4.6", input: 3.0,  ctx: 200000, pro: false },
  "claude-opus-4-6":   { label: "Opus 4.6",   input: 15.0, ctx: 200000, pro: true  },
  "claude-haiku-4-5":  { label: "Haiku 4.5",  input: 0.8,  ctx: 200000, pro: true  },
};

const TIPS = [
  { icon: "⚡", title: "Compact at 50%", body: "Run /compact when context hits ~50%. Don't wait for hard limits." },
  { icon: "📋", title: "Checkpoint first", body: "Save next steps + touched files before any /compact or /clear." },
  { icon: "🎯", title: "One session per task", body: "New task = new session. Don't let context bleed between tasks." },
  { icon: "🤫", title: "Shorter updates", body: "Summarize phase results — don't narrate every file write." },
  { icon: "📚", title: "Tiered docs", body: "Keep CLAUDE.md lean. Move deep details to docs/*.md files." },
  { icon: "🔗", title: "Batch edits", body: "Group file changes before reporting — fewer update cycles." },
];

// ─── Shared components ────────────────────────────────────────────────────────
const Btn = ({ children, onClick, variant = "primary", disabled, style, small, C }) => {
  const [h, setH] = useState(false);
  const variants = {
    primary: { bg: h ? "#1e293b" : C.ink,   color: C.pageBg  },
    sky:     { bg: h ? "#0284c7" : C.sky,   color: "#fff"    },
    green:   { bg: h ? "#16a34a" : C.green, color: "#fff"    },
    outline: { bg: h ? C.surface : C.cardBg, color: C.ink,   border: `1.5px solid ${C.border}` },
    ghost:   { bg: "transparent",           color: h ? C.ink : C.mid },
    danger:  { bg: h ? "#dc2626" : C.red,   color: "#fff"    },
  };
  const v = variants[variant] || variants.primary;
  return (
    <button onClick={disabled ? undefined : onClick}
      onMouseOver={() => setH(true)} onMouseOut={() => setH(false)}
      style={{ padding: small ? "7px 16px" : "10px 22px", borderRadius: 9, border: v.border || "none",
        background: v.bg, color: v.color, cursor: disabled ? "not-allowed" : "pointer",
        fontSize: small ? 12 : 13, fontWeight: 700, fontFamily: "'Syne',sans-serif",
        letterSpacing: "0.03em", transition: "all 0.15s", opacity: disabled ? 0.5 : 1, ...style }}>
      {children}
    </button>
  );
};

const Field = ({ label, type = "text", value, onChange, placeholder, icon, hint, error, rows, C }) => (
  <div style={{ marginBottom: 14 }}>
    {label && <div style={{ fontSize: 12, fontWeight: 600, color: C.mid, fontFamily: "'Epilogue',sans-serif", marginBottom: 5 }}>{label}</div>}
    <div style={{ position: "relative" }}>
      {icon && <span style={{ position: "absolute", left: 11, top: rows ? 11 : "50%", transform: rows ? "none" : "translateY(-50%)", fontSize: 13, pointerEvents: "none" }}>{icon}</span>}
      {rows ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
          style={{ width: "100%", boxSizing: "border-box", padding: "9px 12px", borderRadius: 9,
            border: `1.5px solid ${error ? C.red : C.border}`, fontSize: 13, background: C.inputBg,
            fontFamily: "'Epilogue',sans-serif", color: C.inputText, resize: "vertical", outline: "none" }} />
      ) : (
        <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          style={{ width: "100%", boxSizing: "border-box", padding: icon ? "10px 12px 10px 34px" : "10px 12px",
            borderRadius: 9, border: `1.5px solid ${error ? C.red : C.border}`, fontSize: 13,
            fontFamily: "'Epilogue',sans-serif", color: C.inputText, background: C.inputBg, outline: "none" }}
          onFocus={e => e.target.style.borderColor = error ? C.red : C.sky}
          onBlur={e  => e.target.style.borderColor = error ? C.red : C.border} />
      )}
    </div>
    {error && <div style={{ fontSize: 11, color: C.red, marginTop: 3 }}>{error}</div>}
    {hint && !error && <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>{hint}</div>}
  </div>
);

const Toast = ({ msg, type = "success", onClose }) => (
  <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999,
    background: type === "error" ? "#fef2f2" : "#f0fdf4",
    border: `1px solid ${type === "error" ? "#fca5a5" : "#86efac"}`,
    borderRadius: 12, padding: "13px 18px", display: "flex", alignItems: "center", gap: 10,
    boxShadow: "0 8px 28px rgba(0,0,0,0.18)", animation: "slideUp 0.3s ease", maxWidth: 360 }}>
    <span style={{ fontSize: 15 }}>{type === "error" ? "❌" : "✅"}</span>
    <span style={{ fontSize: 13, color: type === "error" ? "#dc2626" : "#16a34a", fontFamily: "'Epilogue',sans-serif", flex: 1 }}>{msg}</span>
    <span onClick={onClose} style={{ cursor: "pointer", color: "#94a3b8", fontSize: 18, lineHeight: 1 }}>×</span>
  </div>
);

const LabelTag = ({ children, style, C }) => (
  <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: "0.12em", fontFamily: "'Syne',sans-serif", marginBottom: 12, ...style }}>
    {children}
  </div>
);

const Pill = ({ children, color, bg, C }) => (
  <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 20,
    background: bg || C.surface, color: color || C.muted, fontFamily: "'Syne',sans-serif",
    letterSpacing: "0.07em", border: `1px solid ${color ? color + "33" : C.border}` }}>
    {children}
  </span>
);

// ─── Gauge — bigger, glowing ──────────────────────────────────────────────────
function Gauge({ pct, label, sub, color, C, dark }) {
  const r = 52, circ = 2 * Math.PI * r;
  const col = pct > 80 ? C.red : pct > 50 ? C.amber : color;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <div style={{ position: "relative", width: 126, height: 126 }}>
        <svg width={126} height={126} viewBox="0 0 126 126">
          <circle cx={63} cy={63} r={r} fill="none" stroke={dark ? "#1e293b" : "#e2e8f0"} strokeWidth={9} />
          <circle cx={63} cy={63} r={r} fill="none" stroke={col} strokeWidth={9}
            strokeDasharray={`${circ * Math.min(pct / 100, 1)} ${circ}`} strokeLinecap="round"
            transform="rotate(-90 63 63)"
            style={{ transition: "stroke-dasharray 0.7s cubic-bezier(.34,1.56,.64,1)", filter: `drop-shadow(0 0 7px ${col}99)` }} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 22, fontWeight: 800, fontFamily: "'JetBrains Mono',monospace", color: C.ink, lineHeight: 1 }}>{Math.round(pct)}%</span>
          <span style={{ fontSize: 9, color: C.muted, fontFamily: "'Epilogue',sans-serif", marginTop: 3, textAlign: "center", maxWidth: 70 }}>{sub}</span>
        </div>
      </div>
      <span style={{ fontSize: 11, color: C.mid, fontFamily: "'Epilogue',sans-serif", fontWeight: 600, letterSpacing: "0.04em" }}>{label}</span>
    </div>
  );
}

// ─── Overlay ──────────────────────────────────────────────────────────────────
function Overlay({ children, onClose, C }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.72)", backdropFilter: "blur(10px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={e => e.target === e.currentTarget && onClose?.()}>
      <div style={{ background: C.cardBg, borderRadius: 22, width: "100%", maxWidth: 440, padding: 32,
        boxShadow: "0 32px 80px rgba(0,0,0,0.4)", maxHeight: "92vh", overflowY: "auto",
        border: `1px solid ${C.border}` }}>
        {children}
      </div>
    </div>
  );
}

// ─── Auth Modal — confirm password + Google sign-in ───────────────────────────
function AuthModal({ mode: init, onClose, onAuth, C }) {
  const [mode, setMode]       = useState(init);
  const [name, setName]       = useState("");
  const [email, setEmail]     = useState("");
  const [pw, setPw]           = useState("");
  const [pw2, setPw2]         = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors]   = useState({});
  const [confirmed, setConfirmed] = useState(false);

  const validate = () => {
    const e = {};
    if (mode === "signup" && !name.trim()) e.name = "Name is required";
    if (!email.includes("@")) e.email = "Enter a valid email";
    if (pw.length < 8) e.pw = "Minimum 8 characters";
    if (mode === "signup" && pw !== pw2) e.pw2 = "Passwords do not match";
    return e;
  };

  const submit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({}); setLoading(true);
    try {
      if (mode === "signup") {
        const result = await API.signUp(email, pw, name);
        if (result.needsConfirmation) { setConfirmed(true); return; }
        onAuth(result);
      } else {
        const user = await API.signIn(email, pw);
        onAuth(user);
      }
    } catch (err) { setErrors({ form: err.message }); }
    finally { setLoading(false); }
  };

  const googleSignIn = async () => {
    setLoading(true);
    try {
      // In production: supabase.auth.signInWithOAuth({ provider: 'google' })
      const user = await API.signInWithGoogle();
      onAuth(user);
    } catch (err) { setErrors({ form: err.message }); }
    finally { setLoading(false); }
  };

  if (confirmed) return (
    <Overlay onClose={onClose} C={C}>
      <div style={{ textAlign: "center", padding: "28px 0" }}>
        <div style={{ width: 76, height: 76, borderRadius: "50%", background: "linear-gradient(135deg,#0ea5e9,#6366f1)",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34, margin: "0 auto 20px",
          boxShadow: "0 8px 32px rgba(99,102,241,0.45)" }}>📧</div>
        <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "'Syne',sans-serif", color: C.ink, marginBottom: 10 }}>Check your inbox</div>
        <div style={{ fontSize: 14, color: C.mid, fontFamily: "'Epilogue',sans-serif", lineHeight: 1.75, marginBottom: 22 }}>
          We sent a verification link to<br />
          <strong style={{ color: C.sky }}>{email}</strong><br />
          Click it to activate your account.
        </div>
        <div style={{ background: C.surface, border: `1px solid ${C.amber}44`, borderRadius: 10, padding: "10px 14px", marginBottom: 20, fontSize: 12, color: C.amber }}>
          Demo mode — click below to skip confirmation
        </div>
        <Btn C={C} onClick={() => onAuth({ id: `usr_${Date.now()}`, email, name, plan: "free" })} style={{ width: "100%", padding: "12px 0", fontSize: 14 }}>
          Continue to Dashboard →
        </Btn>
      </div>
    </Overlay>
  );

  return (
    <Overlay onClose={onClose} C={C}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "'Syne',sans-serif", color: C.ink }}>
            {mode === "login" ? "Welcome back 👋" : "Create your account"}
          </div>
          <div style={{ fontSize: 13, color: C.muted, fontFamily: "'Epilogue',sans-serif", marginTop: 3 }}>
            {mode === "login" ? "Sign in to TokenSense" : "Free forever · no credit card needed"}
          </div>
        </div>
        <span onClick={onClose} style={{ cursor: "pointer", fontSize: 22, color: C.muted, lineHeight: 1 }}>×</span>
      </div>

      {/* Google Button */}
      <button onClick={googleSignIn} disabled={loading}
        style={{ width: "100%", padding: "11px 0", borderRadius: 10, border: `1.5px solid ${C.border}`,
          background: C.cardBg, color: C.ink, fontSize: 14, fontWeight: 600,
          fontFamily: "'Epilogue',sans-serif", cursor: loading ? "not-allowed" : "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          marginBottom: 18, transition: "all 0.15s", opacity: loading ? 0.6 : 1 }}>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908C16.658 14.013 17.64 11.705 17.64 9.2z" fill="#4285F4"/>
          <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
          <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
          <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
        </svg>
        Continue with Google
      </button>

      {/* Divider */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
        <div style={{ flex: 1, height: 1, background: C.border }} />
        <span style={{ fontSize: 11, color: C.muted, fontFamily: "'Epilogue',sans-serif" }}>or with email</span>
        <div style={{ flex: 1, height: 1, background: C.border }} />
      </div>

      {/* Fields */}
      {mode === "signup" && <Field C={C} label="Full name" value={name} onChange={setName} placeholder="Your name" icon="👤" error={errors.name} />}
      <Field C={C} label="Email" type="email" value={email} onChange={setEmail} placeholder="you@company.com" icon="✉️" error={errors.email} />
      <Field C={C} label="Password" type="password" value={pw} onChange={setPw} placeholder="Min. 8 characters" icon="🔒"
        error={errors.pw} hint={mode === "signup" ? "At least 8 characters" : null} />
      {mode === "signup" && (
        <Field C={C} label="Confirm password" type="password" value={pw2} onChange={setPw2}
          placeholder="Repeat your password" icon="🔒" error={errors.pw2} />
      )}

      {errors.form && <div style={{ color: C.red, fontSize: 12, marginBottom: 12 }}>{errors.form}</div>}

      <Btn C={C} onClick={submit} disabled={loading} style={{ width: "100%", padding: "13px 0", marginBottom: 16, fontSize: 14 }}>
        {loading
          ? (mode === "login" ? "Signing in…" : "Creating account…")
          : (mode === "login" ? "Sign In" : "Create Free Account")}
      </Btn>

      <div style={{ textAlign: "center", fontSize: 13, color: C.muted, fontFamily: "'Epilogue',sans-serif" }}>
        {mode === "login" ? "No account? " : "Already registered? "}
        <span onClick={() => { setMode(mode === "login" ? "signup" : "login"); setErrors({}); setPw(""); setPw2(""); }}
          style={{ color: C.sky, cursor: "pointer", fontWeight: 600 }}>
          {mode === "login" ? "Sign up free" : "Sign in"}
        </span>
      </div>

      <div style={{ marginTop: 18, fontSize: 11, color: C.muted, background: C.surface, borderRadius: 9, padding: "10px 13px", lineHeight: 1.6 }}>
        🔐 Passwords hashed by Supabase Auth. API key stored in <code>localStorage</code> only — never sent to our servers.
      </div>
    </Overlay>
  );
}

// ─── Checkout Modal — eye-catching gradient design ────────────────────────────
function CheckoutModal({ plan, onClose, onSuccess, C }) {
  const [step, setStep] = useState("confirm");
  const isPro = plan === "pro";
  const price = isPro ? "$19" : "$79";
  const gradient = isPro
    ? "linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)"
    : "linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)";
  const glowColor = isPro ? "rgba(14,165,233,0.45)" : "rgba(124,58,237,0.45)";
  const features = isPro
    ? ["All 3 Claude models", "Real API integration", "Session checkpoints", "Compact watchdog alerts", "Export reports"]
    : ["Everything in Pro", "25 developers", "Team usage dashboard", "Slack + GitHub alerts", "SSO + dedicated onboarding"];

  const checkout = async () => {
    setStep("processing");
    try {
      await API.startCheckout(plan);
      setStep("done");
      setTimeout(() => onSuccess(plan), 1000);
    } catch { setStep("confirm"); }
  };

  if (step === "done") return (
    <Overlay onClose={onClose} C={C}>
      <div style={{ textAlign: "center", padding: "28px 0" }}>
        <div style={{ width: 80, height: 80, borderRadius: "50%", background: gradient,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36,
          margin: "0 auto 18px", boxShadow: `0 8px 32px ${glowColor}` }}>🎉</div>
        <div style={{ fontSize: 24, fontWeight: 800, fontFamily: "'Syne',sans-serif", color: C.ink, marginBottom: 8 }}>
          You're on {isPro ? "Pro" : "Team"}!
        </div>
        <div style={{ fontSize: 14, color: C.muted, fontFamily: "'Epilogue',sans-serif" }}>All features unlocked. Redirecting…</div>
      </div>
    </Overlay>
  );

  if (step === "processing") return (
    <Overlay onClose={null} C={C}>
      <div style={{ textAlign: "center", padding: "40px 0" }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: gradient,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28,
          margin: "0 auto 18px", animation: "spin 1.2s linear infinite" }}>⚙️</div>
        <div style={{ fontSize: 17, fontWeight: 700, fontFamily: "'Syne',sans-serif", color: C.ink, marginBottom: 6 }}>Redirecting to Stripe…</div>
        <div style={{ fontSize: 13, color: C.muted }}>You'll be taken to secure checkout</div>
      </div>
    </Overlay>
  );

  return (
    <Overlay onClose={onClose} C={C}>
      {/* Gradient hero banner */}
      <div style={{ background: gradient, borderRadius: 16, padding: "22px 22px 20px", marginBottom: 22, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -20, right: -20, width: 110, height: 110, borderRadius: "50%", background: "rgba(255,255,255,0.07)" }} />
        <div style={{ position: "absolute", bottom: -25, left: -5, width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative" }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.65)", letterSpacing: "0.12em", fontFamily: "'Syne',sans-serif", marginBottom: 6 }}>
              TOKENSENSE {isPro ? "PRO" : "TEAM"}
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 4 }}>
              <span style={{ fontSize: 42, fontWeight: 800, fontFamily: "'Syne',sans-serif", color: "#fff", lineHeight: 1 }}>{price}</span>
              <span style={{ fontSize: 15, color: "rgba(255,255,255,0.7)", marginBottom: 6 }}>/month</span>
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", marginTop: 4 }}>Cancel anytime · No hidden fees</div>
          </div>
          <span onClick={onClose} style={{ cursor: "pointer", fontSize: 22, color: "rgba(255,255,255,0.7)", lineHeight: 1 }}>×</span>
        </div>
      </div>

      {/* Features list */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: "0.1em", fontFamily: "'Syne',sans-serif", marginBottom: 12 }}>WHAT'S INCLUDED</div>
        {features.map(f => (
          <div key={f} style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "center" }}>
            <div style={{ width: 20, height: 20, borderRadius: "50%", background: isPro ? "#eff6ff" : "#f5f3ff", flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 10, color: isPro ? "#0ea5e9" : "#7c3aed", fontWeight: 700 }}>✓</span>
            </div>
            <span style={{ fontSize: 13, color: C.mid, fontFamily: "'Epilogue',sans-serif" }}>{f}</span>
          </div>
        ))}
      </div>

      {/* Security note */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "11px 14px", marginBottom: 20,
        fontSize: 12, color: C.muted, display: "flex", gap: 8, alignItems: "center" }}>
        <span>🔒</span>
        <span>Redirected to <strong style={{ color: C.ink }}>Stripe's secure checkout</strong> — we never store card details.</span>
      </div>

      {/* CTA button */}
      <button onClick={checkout}
        style={{ width: "100%", padding: "14px 0", borderRadius: 12, border: "none", background: gradient,
          color: "#fff", fontSize: 15, fontWeight: 700, fontFamily: "'Syne',sans-serif", cursor: "pointer",
          boxShadow: `0 4px 22px ${glowColor}`, transition: "transform 0.15s, box-shadow 0.15s" }}
        onMouseOver={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 8px 30px ${glowColor}`; }}
        onMouseOut={e  => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = `0 4px 22px ${glowColor}`; }}>
        Continue to Checkout →
      </button>
      <div style={{ marginTop: 10, textAlign: "center", fontSize: 11, color: C.muted, fontFamily: "'Epilogue',sans-serif" }}>
        💳 Powered by Stripe · 256-bit SSL · Cancel anytime
      </div>
    </Overlay>
  );
}

// ─── Waitlist Modal ───────────────────────────────────────────────────────────
function WaitlistModal({ onClose, C }) {
  const [step, setStep] = useState("form");
  const [f, setF]       = useState({ name: "", email: "", company: "", size: "", useCase: "" });
  const [errors, setErrors] = useState({});
  const upd = (k, v) => { setF(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: null })); };

  const validate = () => {
    const e = {};
    if (!f.name.trim()) e.name = "Required";
    if (!f.email.includes("@")) e.email = "Valid email required";
    if (!f.company.trim()) e.company = "Required";
    return e;
  };

  const submit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setStep("submitting");
    try {
      await API.submitWaitlist({ name: f.name, email: f.email, company: f.company, teamSize: f.size, useCase: f.useCase });
      setStep("done");
    } catch { setStep("form"); }
  };

  if (step === "done") return (
    <Overlay onClose={onClose} C={C}>
      <div style={{ textAlign: "center", padding: "20px 0" }}>
        <div style={{ width: 76, height: 76, borderRadius: "50%", background: "linear-gradient(135deg,#7c3aed,#ec4899)",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34,
          margin: "0 auto 18px", boxShadow: "0 8px 32px rgba(124,58,237,0.45)" }}>🚀</div>
        <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "'Syne',sans-serif", color: C.ink, marginBottom: 8 }}>You're on the list!</div>
        <div style={{ fontSize: 13, color: C.muted, fontFamily: "'Epilogue',sans-serif", lineHeight: 1.7, marginBottom: 20 }}>
          We'll email <strong style={{ color: C.sky }}>{f.email}</strong> when Team plan opens.<br />
          Early access pricing guaranteed for waitlist members.
        </div>
        <Btn C={C} onClick={onClose} variant="outline">Back to Dashboard</Btn>
      </div>
    </Overlay>
  );

  return (
    <Overlay onClose={step === "submitting" ? null : onClose} C={C}>
      {/* Purple gradient header */}
      <div style={{ background: "linear-gradient(135deg,#7c3aed,#ec4899)", borderRadius: 16, padding: "20px 22px", marginBottom: 22, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -15, right: -15, width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.07)" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative" }}>
          <div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.65)", letterSpacing: "0.12em", fontFamily: "'Syne',sans-serif", fontWeight: 700, marginBottom: 5 }}>TEAM PLAN WAITLIST</div>
            <div style={{ fontSize: 20, fontWeight: 800, fontFamily: "'Syne',sans-serif", color: "#fff" }}>Be first in line</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", marginTop: 3 }}>47 ahead of you · Early access pricing locked in</div>
          </div>
          <span onClick={onClose} style={{ cursor: "pointer", fontSize: 22, color: "rgba(255,255,255,0.7)" }}>×</span>
        </div>
      </div>

      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "11px 14px", marginBottom: 16, fontSize: 12, color: C.purple, lineHeight: 1.6 }}>
        👥 25 devs · per-dev cost tracking · Slack/GitHub alerts · SSO
      </div>

      <Field C={C} label="Your name" value={f.name} onChange={v => upd("name", v)} placeholder="Jane Smith" icon="👤" error={errors.name} />
      <Field C={C} label="Work email" type="email" value={f.email} onChange={v => upd("email", v)} placeholder="jane@company.com" icon="✉️" error={errors.email} />
      <Field C={C} label="Company" value={f.company} onChange={v => upd("company", v)} placeholder="Acme Corp" icon="🏢" error={errors.company} />

      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: C.mid, fontFamily: "'Epilogue',sans-serif", marginBottom: 6 }}>Team size</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["1–5", "6–15", "16–25", "25+"].map(s => (
            <button key={s} onClick={() => upd("size", s)} style={{
              padding: "7px 16px", borderRadius: 8, cursor: "pointer", fontSize: 12,
              fontFamily: "'Epilogue',sans-serif", fontWeight: 600, transition: "all 0.15s",
              border: `1.5px solid ${f.size === s ? "#7c3aed" : C.border}`,
              background: f.size === s ? "#f5f3ff" : C.cardBg,
              color: f.size === s ? "#7c3aed" : C.mid,
            }}>{s} devs</button>
          ))}
        </div>
      </div>

      <Field C={C} label="Use case (optional)" value={f.useCase} onChange={v => upd("useCase", v)}
        placeholder="e.g. tracking Claude Code spend per engineer…" rows={3} />

      <button onClick={submit} disabled={step === "submitting"}
        style={{ width: "100%", padding: "13px 0", borderRadius: 12, border: "none",
          background: "linear-gradient(135deg,#7c3aed,#ec4899)", color: "#fff", fontSize: 14,
          fontWeight: 700, fontFamily: "'Syne',sans-serif", cursor: step === "submitting" ? "not-allowed" : "pointer",
          boxShadow: "0 4px 22px rgba(124,58,237,0.4)", opacity: step === "submitting" ? 0.7 : 1 }}>
        {step === "submitting" ? "Submitting…" : "Join Waitlist →"}
      </button>
      <div style={{ marginTop: 10, textAlign: "center", fontSize: 11, color: C.muted, fontFamily: "'Epilogue',sans-serif" }}>
        No spam · Early access pricing for waitlist members · Confirmation sent via Resend
      </div>
    </Overlay>
  );
}

// ─── API Key Modal ────────────────────────────────────────────────────────────
function ApiKeyModal({ existing, onClose, onSave, C }) {
  const [key, setKey]     = useState(existing || "");
  const [status, setStatus] = useState(null);
  const masked = existing ? `sk-ant-…${existing.slice(-6)}` : null;

  const test = async () => {
    if (!key.startsWith("sk-ant-")) { setStatus("error"); return; }
    setStatus("testing");
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 10, messages: [{ role: "user", content: "hi" }] }),
      });
      setStatus(res.ok ? "ok" : "error");
    } catch { setStatus("error"); }
  };

  return (
    <Overlay onClose={onClose} C={C}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, fontFamily: "'Syne',sans-serif", color: C.ink }}>Connect Anthropic API</div>
          <div style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>Pro feature — live token data</div>
        </div>
        <span onClick={onClose} style={{ cursor: "pointer", fontSize: 20, color: C.muted }}>×</span>
      </div>
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "11px 13px", marginBottom: 16, fontSize: 12, color: C.sky, lineHeight: 1.6 }}>
        🔑 Get your key at <strong>console.anthropic.com</strong> → API Keys.<br />
        Stored in <code>localStorage</code> only — never sent to our servers.
      </div>
      {existing && (
        <div style={{ marginBottom: 12, padding: "9px 13px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 9, fontSize: 13, fontFamily: "'JetBrains Mono',monospace", color: C.green }}>
          Currently: {masked} <span>● Active</span>
        </div>
      )}
      <Field C={C} label="New API Key" value={key} onChange={v => { setKey(v); setStatus(null); }}
        placeholder="sk-ant-api03-…" icon="🔑"
        error={status === "error" ? "Key invalid or unreachable — check and retry" : null}
        hint={status === "ok" ? "✓ Connection verified!" : null} />
      {status === "ok" && (
        <div style={{ background: C.surface, border: `1px solid ${C.green}33`, borderRadius: 9, padding: "9px 13px", marginBottom: 14, fontSize: 12, color: C.green }}>
          ✅ API key verified — live usage data enabled.
        </div>
      )}
      <div style={{ display: "flex", gap: 10 }}>
        <Btn C={C} onClick={test} variant="outline" disabled={!key || status === "testing"} style={{ flex: 1 }}>
          {status === "testing" ? "Testing…" : "Test Key"}
        </Btn>
        <Btn C={C} onClick={() => { localStorage.setItem("ts_key", key); onSave(key); onClose(); }} disabled={!key} style={{ flex: 1 }}>
          Save & Connect
        </Btn>
      </div>
    </Overlay>
  );
}

// ─── Settings Panel ───────────────────────────────────────────────────────────
function Settings({ user, apiKey, onLogout, onUpgrade, onShowApiModal, C }) {
  const card = { background: C.cardBg, borderRadius: 14, border: `1px solid ${C.border}`, padding: "20px 22px" };
  return (
    <div style={{ maxWidth: 560, display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={card}>
        <LabelTag C={C}>ACCOUNT</LabelTag>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg,#0ea5e9,#6366f1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, color: "#fff", fontWeight: 700, fontFamily: "'Syne',sans-serif" }}>
            {user.name[0].toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, fontFamily: "'Syne',sans-serif", color: C.ink }}>{user.name}</div>
            <div style={{ fontSize: 12, color: C.muted }}>{user.email}</div>
          </div>
          <Pill C={C} color={user.plan === "pro" ? C.pageBg : user.plan === "team" ? C.sky : C.muted}
            bg={user.plan === "pro" ? C.ink : user.plan === "team" ? C.sky + "22" : C.surface}>
            {user.plan.toUpperCase()}
          </Pill>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {user.plan === "free" && <Btn C={C} onClick={() => onUpgrade("pro")} variant="sky" small>Upgrade to Pro →</Btn>}
          <Btn C={C} onClick={onLogout} variant="ghost" small>Sign out</Btn>
        </div>
      </div>

      <div style={{ ...card, opacity: user.plan === "free" ? 0.65 : 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <LabelTag C={C} style={{ marginBottom: 0 }}>ANTHROPIC API KEY</LabelTag>
          {user.plan === "free" && <Pill C={C} color={C.amber} bg={C.amber + "18"}>PRO FEATURE</Pill>}
        </div>
        {user.plan !== "free" ? (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{ flex: 1, padding: "9px 12px", background: C.surface, borderRadius: 9, fontFamily: "'JetBrains Mono',monospace", fontSize: 13, color: apiKey ? C.ink : C.muted, border: `1px solid ${C.border}` }}>
                {apiKey ? `sk-ant-…${apiKey.slice(-6)}` : "No key connected"}
              </div>
              {apiKey && <Pill C={C} color={C.green} bg={C.green + "18"}>● Live</Pill>}
            </div>
            <Btn C={C} onClick={onShowApiModal} variant={apiKey ? "outline" : "primary"} small>
              {apiKey ? "Update Key" : "Connect API Key →"}
            </Btn>
          </>
        ) : (
          <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6 }}>Upgrade to Pro to connect your Anthropic key and see live token usage data.</div>
        )}
      </div>

      <div style={card}>
        <LabelTag C={C}>BILLING</LabelTag>
        {user.plan === "free" ? (
          <>
            <div style={{ fontSize: 13, color: C.mid, marginBottom: 14, lineHeight: 1.6 }}>Free plan — upgrade to Pro ($19/mo) for all models, real API data, checkpoints and reports.</div>
            <div style={{ display: "flex", gap: 8 }}>
              <Btn C={C} onClick={() => onUpgrade("pro")} variant="sky" small>Upgrade to Pro</Btn>
              <Btn C={C} onClick={() => onUpgrade("team")} variant="outline" small>Team Plan →</Btn>
            </div>
          </>
        ) : (
          <>
            {[["Current plan", user.plan === "pro" ? "Pro — $19/mo" : "Team — $79/mo"], ["Next billing", "Apr 11, 2026"], ["Status", "Active ✓"]].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ fontSize: 13, color: C.muted }}>{k}</span>
                <span style={{ fontSize: 13, fontWeight: 600, fontFamily: "'Syne',sans-serif", color: C.ink }}>{v}</span>
              </div>
            ))}
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              <Btn C={C} variant="outline" small>Manage billing →</Btn>
              {user.plan === "pro" && <Btn C={C} onClick={() => onUpgrade("team")} variant="ghost" small>Upgrade to Team</Btn>}
            </div>
          </>
        )}
      </div>

      <div style={card}>
        <LabelTag C={C}>INTEGRATIONS</LabelTag>
        {[
          { icon: "🔐", name: "Supabase Auth",  status: "Connected", color: C.green },
          { icon: "💳", name: "Stripe Billing", status: user.plan !== "free" ? "Active" : "Free plan", color: user.plan !== "free" ? C.green : C.muted },
          { icon: "📧", name: "Resend Email",   status: "Configured", color: C.green },
          { icon: "🔑", name: "Anthropic API",  status: apiKey ? "Connected" : "Not set", color: apiKey ? C.green : C.amber },
        ].map(({ icon, name, status, color }) => (
          <div key={name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <span style={{ fontSize: 16 }}>{icon}</span>
              <span style={{ fontSize: 13, fontWeight: 500, color: C.ink }}>{name}</span>
            </div>
            <Pill C={C} color={color} bg={color + "18"}>{status}</Pill>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function TokenSense() {
  const [dark, setDark] = useState(false);
  const C = dark ? DARK : LIGHT;
  const card = { background: C.cardBg, borderRadius: 14, border: `1px solid ${C.border}`, padding: "20px 22px", boxShadow: dark ? "0 1px 8px rgba(0,0,0,0.3)" : "0 1px 3px rgba(0,0,0,0.04)" };

  const [user, setUser]     = useState(null);
  const [apiKey, setApiKey] = useState(() => { try { return localStorage.getItem("ts_key") || ""; } catch { return ""; } });
  const [modal, setModal]   = useState(null);
  const [tab, setTab]       = useState("dashboard");
  const [toast, setToast]   = useState(null);

  const [model, setModel]           = useState("claude-sonnet-4-6");
  const [critical, setCritical]     = useState(12000);
  const [active, setActive]         = useState(35000);
  const [background, setBackground] = useState(53000);
  const [devs, setDevs]             = useState(3);
  const [sessions, setSessions]     = useState(8);
  const [compacted, setCompacted]   = useState(false);
  const [tipIdx, setTipIdx]         = useState(0);

  useEffect(() => { const t = setInterval(() => setTipIdx(i => (i + 1) % TIPS.length), 5000); return () => clearInterval(t); }, []);

  const toast_ = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 4200); };
  const isPro  = user?.plan === "pro" || user?.plan === "team";
  const isTeam = user?.plan === "team";

  const handleAuth = useCallback((u) => { setUser(u); setModal(null); toast_(`Welcome, ${u.name}! 👋`); }, []);
  const handleLogout = () => { setUser(null); setTab("dashboard"); toast_("Signed out successfully."); };
  const handleUpgrade = (plan) => {
    if (!user) { setModal("auth-signup"); return; }
    setModal(plan === "team" ? "waitlist" : `stripe-${plan}`);
  };
  const handleStripeSuccess = (plan) => {
    setUser(u => ({ ...u, plan }));
    setModal(null);
    toast_(`🎉 You're now on the ${plan === "pro" ? "Pro" : "Team"} plan! All features unlocked.`);
  };

  const m = MODEL_DATA[model];
  const used         = critical + active + background;
  const usedPct      = (used / m.ctx) * 100;
  const prunable     = background * 0.4;
  const afterCompact = used - prunable;
  const daily        = (used / 1e6) * m.input * sessions * devs;
  const saved        = (prunable / 1e6) * m.input * sessions * devs;

  const handleCompact = () => {
    if (compacted) return;
    setBackground(b => Math.round(b * 0.6));
    setCompacted(true);
    setTimeout(() => setCompacted(false), 2500);
  };

  return (
    <div style={{ minHeight: "100vh", background: C.pageBg, transition: "background 0.3s, color 0.3s" }}>
      <Fonts />
      <style>{`
        @keyframes slideUp { from { transform:translateY(18px);opacity:0 } to { transform:translateY(0);opacity:1 } }
        @keyframes spin    { to { transform:rotate(360deg) } }
        @keyframes fadeIn  { from { opacity:0;transform:translateY(6px) } to { opacity:1;transform:translateY(0) } }
        * { box-sizing:border-box }
        input[type=range] { -webkit-appearance:none;appearance:none;height:5px;border-radius:3px;outline:none;cursor:pointer }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance:none;width:16px;height:16px;border-radius:50%;background:currentColor;cursor:pointer;box-shadow:0 1px 4px rgba(0,0,0,0.25) }
        textarea { outline:none }
      `}</style>

      {/* Modals */}
      {modal === "auth-login"  && <AuthModal mode="login"  onClose={() => setModal(null)} onAuth={handleAuth} C={C} />}
      {modal === "auth-signup" && <AuthModal mode="signup" onClose={() => setModal(null)} onAuth={handleAuth} C={C} />}
      {modal === "stripe-pro"  && <CheckoutModal plan="pro"  onClose={() => setModal(null)} onSuccess={handleStripeSuccess} C={C} />}
      {modal === "stripe-team" && <CheckoutModal plan="team" onClose={() => setModal(null)} onSuccess={handleStripeSuccess} C={C} />}
      {modal === "waitlist"    && <WaitlistModal onClose={() => setModal(null)} C={C} />}
      {modal === "api-key"     && <ApiKeyModal existing={apiKey} onClose={() => setModal(null)} onSave={k => { setApiKey(k); toast_("API key saved — live data enabled! 🔌"); }} C={C} />}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* ── Nav ─────────────────────────────────────────────────────────────── */}
      <nav style={{ background: C.navBg, borderBottom: `1px solid ${C.border}`, padding: "0 26px", height: 56,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20 }}>🪙</span>
          <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 16, color: C.ink }}>TokenSense</span>
          {user && <Pill C={C} color={user.plan === "pro" ? C.pageBg : user.plan === "team" ? C.sky : C.muted}
            bg={user.plan === "pro" ? C.ink : user.plan === "team" ? C.sky + "22" : C.surface}>
            {user.plan.toUpperCase()}
          </Pill>}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {user && ["dashboard", "settings"].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: "6px 14px", borderRadius: 8, border: "none", cursor: "pointer",
              background: tab === t ? C.surface : "transparent",
              color: tab === t ? C.ink : C.muted, fontWeight: tab === t ? 600 : 400,
              fontSize: 13, fontFamily: "'Epilogue',sans-serif",
            }}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
          ))}

          {/* Dark mode toggle */}
          <button onClick={() => setDark(d => !d)} title={dark ? "Light mode" : "Dark mode"}
            style={{ width: 34, height: 34, borderRadius: 9, border: `1px solid ${C.border}`,
              background: C.surface, cursor: "pointer", fontSize: 15,
              display: "flex", alignItems: "center", justifyContent: "center" }}>
            {dark ? "☀️" : "🌙"}
          </button>

          {!user ? (
            <div style={{ display: "flex", gap: 8 }}>
              <Btn C={C} onClick={() => setModal("auth-login")}  variant="outline" small>Sign in</Btn>
              <Btn C={C} onClick={() => setModal("auth-signup")} small>Sign up free</Btn>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {!isPro && <Btn C={C} onClick={() => handleUpgrade("pro")} variant="sky" small>Upgrade →</Btn>}
              {isPro && !apiKey && <Btn C={C} onClick={() => setModal("api-key")} variant="outline" small>🔑 Connect API</Btn>}
              {apiKey && isPro && <Pill C={C} color={C.green} bg={C.green + "18"}>● Live Data</Pill>}
              <div onClick={() => setTab("settings")} style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#0ea5e9,#6366f1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: "#fff", fontWeight: 700, fontFamily: "'Syne',sans-serif", cursor: "pointer" }}>
                {user.name[0].toUpperCase()}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* ── Content ──────────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 980, margin: "0 auto", padding: "28px 22px", animation: "fadeIn 0.35s ease" }}>
        {user && tab === "settings" ? (
          <Settings user={user} apiKey={apiKey} onLogout={handleLogout} onUpgrade={handleUpgrade} onShowApiModal={() => setModal("api-key")} C={C} />
        ) : (
          <>
            {/* Page header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22, flexWrap: "wrap", gap: 10 }}>
              <div>
                <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, fontFamily: "'Syne',sans-serif", letterSpacing: "-0.02em", color: C.ink }}>Context Governor</h1>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: C.muted, fontFamily: "'Epilogue',sans-serif" }}>
                  {apiKey && isPro ? "🟢 Live Anthropic data" : "Estimates mode — "}
                  {isPro && !apiKey && <span onClick={() => setModal("api-key")} style={{ color: C.sky, cursor: "pointer" }}>connect API key →</span>}
                  {!user && <span onClick={() => setModal("auth-signup")} style={{ color: C.sky, cursor: "pointer" }}>sign up to save sessions →</span>}
                </p>
              </div>
              {!user && <div style={{ display: "flex", gap: 8 }}>
                <Btn C={C} onClick={() => setModal("auth-signup")} small>Create free account</Btn>
                <Btn C={C} onClick={() => setModal("auth-login")} variant="outline" small>Sign in</Btn>
              </div>}
            </div>

            {/* Watchdog banner */}
            {usedPct > 50 && (
              <div style={{ background: dark ? "#1a0f00" : "#fffbeb", border: `1px solid ${C.amber}55`, borderRadius: 12, padding: "12px 18px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 18 }}>⚠️</span>
                <span style={{ fontSize: 13, color: C.amber, fontFamily: "'Epilogue',sans-serif", flex: 1 }}>
                  <strong>Compact Watchdog:</strong> Context at {Math.round(usedPct)}% — consider running <code>/compact</code> now.
                  {!isPro && <span onClick={() => handleUpgrade("pro")} style={{ color: C.sky, cursor: "pointer", marginLeft: 8 }}>Get automated alerts on Pro →</span>}
                </span>
              </div>
            )}

            {/* Model selector */}
            <div style={{ ...card, marginBottom: 16 }}>
              <LabelTag C={C}>MODEL</LabelTag>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                {Object.entries(MODEL_DATA).map(([id, info]) => {
                  const locked = !isPro && info.pro;
                  return (
                    <button key={id} onClick={() => !locked && setModel(id)} style={{
                      padding: "8px 18px", borderRadius: 9, cursor: locked ? "not-allowed" : "pointer",
                      border: `1.5px solid ${model === id ? C.sky : C.border}`,
                      background: model === id ? (dark ? "#0c1e2e" : "#eff6ff") : C.cardBg,
                      color: model === id ? C.sky : locked ? C.muted : C.mid,
                      fontSize: 12, fontFamily: "'JetBrains Mono',monospace", fontWeight: 600, transition: "all 0.15s",
                      boxShadow: model === id ? `0 0 0 1px ${C.sky}44` : "none",
                    }}>{info.label} {locked ? "🔒" : ""}</button>
                  );
                })}
                {!isPro && <span style={{ fontSize: 11, color: C.muted }}>
                  <span onClick={() => handleUpgrade("pro")} style={{ color: C.sky, cursor: "pointer" }}>Pro</span> unlocks all models
                </span>}
              </div>
            </div>

            {/* Gauges + Tiers */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              {/* Context usage — bigger gauges + stat blocks */}
              <div style={card}>
                <LabelTag C={C}>CONTEXT USAGE</LabelTag>

                {/* Three big gauges */}
                <div style={{ display: "flex", justifyContent: "space-around", marginBottom: 20 }}>
                  <Gauge pct={usedPct} label="Used" sub={`${Math.round(used/1000)}k tkns`} color={C.sky} C={C} dark={dark} />
                  <Gauge pct={(prunable/Math.max(used,1))*100} label="Prunable" sub={`${Math.round(prunable/1000)}k free`} color={C.purple} C={C} dark={dark} />
                  <Gauge pct={(afterCompact/m.ctx)*100} label="Post-Compact" sub={`${Math.round(afterCompact/1000)}k`} color={C.green} C={C} dark={dark} />
                </div>

                {/* Big stat numbers */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
                  {[
                    { label: "TOTAL TOKENS", val: `${Math.round(used/1000)}k`,             color: C.ink  },
                    { label: "% USED",        val: `${Math.round(usedPct)}%`,               color: usedPct > 80 ? C.red : usedPct > 50 ? C.amber : C.green },
                    { label: "REMAINING",     val: `${Math.round((m.ctx-used)/1000)}k`,     color: C.sky  },
                  ].map(({ label, val, color }) => (
                    <div key={label} style={{ background: C.surface, borderRadius: 10, padding: "12px 8px", textAlign: "center", border: `1px solid ${C.border}` }}>
                      <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "'JetBrains Mono',monospace", color, lineHeight: 1 }}>{val}</div>
                      <div style={{ fontSize: 9, color: C.muted, marginTop: 5, letterSpacing: "0.07em", fontFamily: "'Syne',sans-serif" }}>{label}</div>
                    </div>
                  ))}
                </div>

                {/* Tier bar */}
                <div style={{ display: "flex", gap: 2, borderRadius: 6, overflow: "hidden", height: 8, marginBottom: 10 }}>
                  {[[critical, C.red], [active, C.amber], [background, C.sky]].map(([v, c], i) => (
                    <div key={i} style={{ flex: (v / m.ctx) * 100, background: c, transition: "flex 0.5s ease", boxShadow: `0 0 5px ${c}88` }} />
                  ))}
                  <div style={{ flex: 100 - (used / m.ctx) * 100, background: C.border }} />
                </div>
                <div style={{ display: "flex", gap: 14, marginBottom: 16 }}>
                  {[["Critical", C.red], ["Active", C.amber], ["Background", C.sky]].map(([l, c]) => (
                    <div key={l} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <div style={{ width: 7, height: 7, borderRadius: "50%", background: c, boxShadow: `0 0 4px ${c}` }} />
                      <span style={{ fontSize: 10, color: C.muted, fontFamily: "'Epilogue',sans-serif" }}>{l}</span>
                    </div>
                  ))}
                </div>

                <Btn C={C} onClick={handleCompact} variant={compacted ? "green" : "primary"} style={{ width: "100%", padding: "10px 0" }}>
                  {compacted ? "✓ Compacted — context freed!" : "⚡ Simulate /compact"}
                </Btn>
              </div>

              {/* Context tiers */}
              <div style={card}>
                <LabelTag C={C}>CONTEXT TIERS</LabelTag>
                {[
                  { label: "Critical (never prune)",   v: critical,   set: setCritical,   max: 80000,  color: C.red   },
                  { label: "Active (prune sparingly)",  v: active,     set: setActive,     max: 120000, color: C.amber },
                  { label: "Background (up to 40%)",    v: background, set: setBackground, max: 160000, color: C.sky   },
                ].map(({ label, v, set, max, color }) => (
                  <div key={label} style={{ marginBottom: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <span style={{ fontSize: 11, color: C.muted, fontFamily: "'Epilogue',sans-serif" }}>{label}</span>
                      <span style={{ fontSize: 12, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, color }}>{(v/1000).toFixed(1)}k</span>
                    </div>
                    <input type="range" min={0} max={max} value={v} onChange={e => set(Number(e.target.value))} style={{ width: "100%", accentColor: color }} />
                    <div style={{ height: 3, background: C.border, borderRadius: 2, marginTop: 5, overflow: "hidden" }}>
                      <div style={{ width: `${(v/max)*100}%`, height: "100%", background: color, borderRadius: 2, transition: "width 0.2s", boxShadow: `0 0 5px ${color}88` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cost + Team */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div style={card}>
                <LabelTag C={C}>COST CALCULATOR</LabelTag>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
                  <div>
                    {[
                      { label: `Developers (max ${isTeam?25:isPro?5:1})`, v: devs,     set: setDevs,     max: isTeam?25:isPro?5:1, color: C.purple },
                      { label: "Sessions / day",                           v: sessions, set: setSessions, max: 30,                  color: C.purple },
                    ].map(({ label, v, set, max, color }) => (
                      <div key={label} style={{ marginBottom: 16 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                          <span style={{ fontSize: 11, color: C.muted, fontFamily: "'Epilogue',sans-serif" }}>{label}</span>
                          <span style={{ fontSize: 12, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, color }}>{v}</span>
                        </div>
                        <input type="range" min={1} max={max} value={v} onChange={e => set(Number(e.target.value))} style={{ width: "100%", accentColor: color }} />
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {[
                      { label: "Daily cost",     val: `$${daily.toFixed(2)}`,       big: false },
                      { label: "Daily savings",  val: `$${saved.toFixed(2)}`,       accent: true },
                      { label: "Annual savings", val: `$${(saved*250).toFixed(0)}`, big: true },
                    ].map(({ label, val, big, accent }) => (
                      <div key={label} style={{ padding: "10px 12px", borderRadius: 10, background: C.surface,
                        border: `1px solid ${big ? C.green + "44" : C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 11, color: C.muted, fontFamily: "'Epilogue',sans-serif" }}>{label}</span>
                        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 800, fontSize: big ? 20 : 13,
                          color: big ? C.green : accent ? C.sky : C.ink }}>{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {isTeam ? (
                <div style={card}>
                  <LabelTag C={C}>TEAM USAGE</LabelTag>
                  {[
                    { name: "Alex K.", tokens: 148000, cost: 0.44, sessions: 12 },
                    { name: "Sara M.", tokens: 92000,  cost: 0.28, sessions: 7  },
                    { name: "Raj P.",  tokens: 201000, cost: 0.60, sessions: 15 },
                  ].map(u => {
                    const p = (u.tokens / 200000) * 100;
                    return (
                      <div key={u.name} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12, padding: "9px 12px", background: C.surface, borderRadius: 10, border: `1px solid ${C.border}` }}>
                        <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg,#0ea5e9,#6366f1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#fff", fontWeight: 700, fontFamily: "'Syne',sans-serif", flexShrink: 0 }}>
                          {u.name[0]}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                            <span style={{ fontSize: 12, fontWeight: 600, fontFamily: "'Syne',sans-serif", color: C.ink }}>{u.name}</span>
                            <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono',monospace", color: C.muted }}>${u.cost.toFixed(2)}</span>
                          </div>
                          <div style={{ height: 4, background: C.border, borderRadius: 2, overflow: "hidden" }}>
                            <div style={{ width: `${p}%`, height: "100%", background: p>80?C.red:p>50?C.amber:C.green, borderRadius: 2, transition: "width 0.5s" }} />
                          </div>
                        </div>
                        <Pill C={C} color={p>80?C.red:C.green} bg={(p>80?C.red:C.green)+"18"}>{p>80?"Compact":"OK"}</Pill>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ ...card, background: C.surface, border: `1.5px dashed ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "'Syne',sans-serif", marginBottom: 4, color: C.ink }}>🔒 Team Dashboard</div>
                    <div style={{ fontSize: 13, color: C.muted, fontFamily: "'Epilogue',sans-serif" }}>Track every dev's usage and costs in one view.</div>
                  </div>
                  <Btn C={C} onClick={() => setModal("waitlist")} variant="outline" small>Join Waitlist →</Btn>
                </div>
              )}
            </div>

            {/* Tip rotator */}
            <div style={{ ...card, background: dark ? "#0a1929" : "#f0f9ff", border: `1px solid ${dark ? "#1e3a5f" : "#bae6fd"}`, display: "flex", alignItems: "flex-start", gap: 14 }}>
              <span style={{ fontSize: 22, flexShrink: 0, marginTop: 2 }}>{TIPS[tipIdx].icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.sky, fontFamily: "'Syne',sans-serif", marginBottom: 3 }}>{TIPS[tipIdx].title}</div>
                <div style={{ fontSize: 13, color: dark ? "#93c5fd" : "#0c4a6e", fontFamily: "'Epilogue',sans-serif", lineHeight: 1.6 }}>{TIPS[tipIdx].body}</div>
              </div>
              <div style={{ display: "flex", gap: 5, flexShrink: 0, paddingTop: 4 }}>
                {TIPS.map((_, i) => (
                  <div key={i} onClick={() => setTipIdx(i)} style={{ width: 6, height: 6, borderRadius: "50%", cursor: "pointer", background: i === tipIdx ? C.sky : C.border, transition: "background 0.3s" }} />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
 
