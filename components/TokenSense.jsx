"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

// ─── Real Supabase client ─────────────────────────────────────────────────────
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  { auth: { flowType: 'implicit', detectSessionInUrl: true, persistSession: true } }
);

const Fonts = () => (
  <link href="https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=Epilogue:wght@500;600;700&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet" />
);

// ─── Themes ───────────────────────────────────────────────────────────────────
const LIGHT = {
  ink: "#0a0f1a", mid: "#1e2a3b", muted: "#3d5068",
  surface: "#eef2f7", cardBg: "#ffffff", pageBg: "#eef2f7",
  navBg: "#ffffff", border: "#c8d5e3", inputBg: "#ffffff", inputText: "#0a0f1a",
  sky: "#0369a1", green: "#15803d", amber: "#92400e",
  red: "#b91c1c", purple: "#5b21b6", label: "#1e2a3b",
};
const DARK = {
  ink: "#f0f6ff", mid: "#cbd5e1", muted: "#8ba3bc",
  surface: "#0d1525", cardBg: "#111c2e", pageBg: "#080d18",
  navBg: "#0d1525", border: "#1e3a5f", inputBg: "#0d1525", inputText: "#f0f6ff",
  sky: "#38bdf8", green: "#4ade80", amber: "#fbbf24",
  red: "#f87171", purple: "#a78bfa", label: "#cbd5e1",
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
];

// ─── Shared UI ────────────────────────────────────────────────────────────────
const Btn = ({ children, onClick, variant = "primary", disabled, style, small, C }) => {
  const [h, setH] = useState(false);
  const vs = {
    primary: { bg: h ? "#1e3a5f" : C.ink,    color: "#fff" },
    sky:     { bg: h ? "#0284c7" : C.sky,    color: "#fff" },
    green:   { bg: h ? "#166534" : C.green,  color: "#fff" },
    outline: { bg: h ? C.surface : C.cardBg, color: C.ink, border: `2px solid ${C.border}` },
    ghost:   { bg: "transparent",            color: h ? C.ink : C.muted },
    danger:  { bg: h ? "#991b1b" : C.red,    color: "#fff" },
  };
  const v = vs[variant] || vs.primary;
  return (
    <button onClick={disabled ? undefined : onClick}
      onMouseOver={() => setH(true)} onMouseOut={() => setH(false)}
      style={{ padding: small ? "8px 18px" : "11px 24px", borderRadius: 9,
        border: v.border || "none", background: v.bg, color: v.color,
        cursor: disabled ? "not-allowed" : "pointer",
        fontSize: small ? 13 : 14, fontWeight: 700, fontFamily: "'Syne',sans-serif",
        letterSpacing: "0.02em", transition: "all 0.15s", opacity: disabled ? 0.5 : 1, ...style }}>
      {children}
    </button>
  );
};

const Field = ({ label, type = "text", value, onChange, placeholder, icon, hint, error, rows, C }) => (
  <div style={{ marginBottom: 16 }}>
    {label && <div style={{ fontSize: 13, fontWeight: 700, color: C.label, fontFamily: "'Epilogue',sans-serif", marginBottom: 6 }}>{label}</div>}
    <div style={{ position: "relative" }}>
      {icon && <span style={{ position: "absolute", left: 12, top: rows ? 12 : "50%", transform: rows ? "none" : "translateY(-50%)", fontSize: 14, pointerEvents: "none" }}>{icon}</span>}
      {rows ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
          style={{ width: "100%", boxSizing: "border-box", padding: "11px 12px", borderRadius: 9,
            border: `2px solid ${error ? C.red : C.border}`, fontSize: 14, background: C.inputBg,
            fontFamily: "'Epilogue',sans-serif", color: C.inputText, fontWeight: 500, resize: "vertical", outline: "none" }} />
      ) : (
        <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          style={{ width: "100%", boxSizing: "border-box", padding: icon ? "11px 12px 11px 38px" : "11px 14px",
            borderRadius: 9, border: `2px solid ${error ? C.red : C.border}`, fontSize: 14,
            fontFamily: "'Epilogue',sans-serif", color: C.inputText, fontWeight: 500, background: C.inputBg, outline: "none" }}
          onFocus={e => e.target.style.borderColor = C.sky}
          onBlur={e  => e.target.style.borderColor = error ? C.red : C.border} />
      )}
    </div>
    {error && <div style={{ fontSize: 13, color: C.red, marginTop: 5, fontFamily: "'Epilogue',sans-serif", fontWeight: 600 }}>{error}</div>}
    {hint && !error && <div style={{ fontSize: 13, color: C.muted, marginTop: 5, fontFamily: "'Epilogue',sans-serif", fontWeight: 500 }}>{hint}</div>}
  </div>
);

const Toast = ({ msg, type = "success", onClose }) => (
  <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999,
    background: type === "error" ? "#fef2f2" : "#f0fdf4",
    border: `2px solid ${type === "error" ? "#fca5a5" : "#86efac"}`,
    borderRadius: 12, padding: "14px 20px", display: "flex", alignItems: "center", gap: 10,
    boxShadow: "0 8px 28px rgba(0,0,0,0.2)", animation: "slideUp 0.3s ease", maxWidth: 400 }}>
    <span>{type === "error" ? "❌" : "✅"}</span>
    <span style={{ fontSize: 14, color: type === "error" ? "#b91c1c" : "#15803d", fontFamily: "'Epilogue',sans-serif", flex: 1, fontWeight: 600 }}>{msg}</span>
    <span onClick={onClose} style={{ cursor: "pointer", color: "#64748b", fontSize: 20, lineHeight: 1 }}>×</span>
  </div>
);

const LabelTag = ({ children, style, C }) => (
  <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: "0.14em", fontFamily: "'Syne',sans-serif", marginBottom: 14, ...style }}>
    {children}
  </div>
);

const Pill = ({ children, color, bg, C }) => (
  <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
    background: bg || C.surface, color: color || C.muted, fontFamily: "'Syne',sans-serif",
    letterSpacing: "0.06em", border: `1.5px solid ${color ? color + "44" : C.border}` }}>
    {children}
  </span>
);

function Gauge({ pct, label, sub, color, C, dark }) {
  const r = 52, circ = 2 * Math.PI * r;
  const col = pct > 80 ? C.red : pct > 50 ? C.amber : color;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <div style={{ position: "relative", width: 126, height: 126 }}>
        <svg width={126} height={126} viewBox="0 0 126 126">
          <circle cx={63} cy={63} r={r} fill="none" stroke={dark ? "#1e3a5f" : "#dde6f0"} strokeWidth={9} />
          <circle cx={63} cy={63} r={r} fill="none" stroke={col} strokeWidth={9}
            strokeDasharray={`${circ * Math.min(pct/100,1)} ${circ}`} strokeLinecap="round"
            transform="rotate(-90 63 63)"
            style={{ transition: "stroke-dasharray 0.7s cubic-bezier(.34,1.56,.64,1)", filter: `drop-shadow(0 0 7px ${col}99)` }} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 22, fontWeight: 800, fontFamily: "'JetBrains Mono',monospace", color: C.ink, lineHeight: 1 }}>{Math.round(pct)}%</span>
          <span style={{ fontSize: 9, color: C.muted, fontFamily: "'Epilogue',sans-serif", fontWeight: 600, marginTop: 3, textAlign: "center", maxWidth: 70 }}>{sub}</span>
        </div>
      </div>
      <span style={{ fontSize: 12, color: C.mid, fontFamily: "'Epilogue',sans-serif", fontWeight: 700 }}>{label}</span>
    </div>
  );
}

function Overlay({ children, onClose, C, wide }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(10px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={e => e.target === e.currentTarget && onClose?.()}>
      <div style={{ background: C.cardBg, borderRadius: 22, width: "100%", maxWidth: wide ? 600 : 440, padding: 32,
        boxShadow: "0 32px 80px rgba(0,0,0,0.4)", maxHeight: "92vh", overflowY: "auto",
        border: `1px solid ${C.border}` }}>
        {children}
      </div>
    </div>
  );
}

// ─── REAL Auth Modal ──────────────────────────────────────────────────────────
function AuthModal({ mode: init, onClose, onAuth, C }) {
  const [mode, setMode]     = useState(init);
  const [name, setName]     = useState("");
  const [email, setEmail]   = useState("");
  const [pw, setPw]         = useState("");
  const [pw2, setPw2]       = useState("");
  const [loading, setLoading]       = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [emailSent, setEmailSent]   = useState(false);

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
        // REAL Supabase signup — sends confirmation email automatically
        const { data, error } = await supabase.auth.signUp({
          email, password: pw,
          options: {
            data: { name },
            emailRedirectTo: `${window.location.origin}/api/auth/callback`,
          },
        });
        if (error) throw error;
        // Show "check your email" screen — no bypass
        setEmailSent(true);
      } else {
        // REAL Supabase sign in
        const { data, error } = await supabase.auth.signInWithPassword({ email, password: pw });
        if (error) throw error;
        // Fetch profile from DB
        const { data: profile } = await supabase
          .from("profiles").select("*").eq("id", data.user.id).single();
        onAuth({ id: data.user.id, email: data.user.email, name: profile?.name || email.split("@")[0], plan: profile?.plan || "free", org_id: profile?.org_id || null });
      }
    } catch (err) {
      setErrors({ form: err.message });
    } finally { setLoading(false); }
  };

  // REAL Google OAuth — redirects to Google, comes back via /api/auth/callback
  const googleSignIn = async () => {
    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}` },
    });
    if (error) { setErrors({ form: error.message }); setGoogleLoading(false); }
    // On success, browser redirects to Google — nothing else needed here
  };

  // Email sent screen — no bypass button
  if (emailSent) return (
    <Overlay onClose={onClose} C={C}>
      <div style={{ textAlign: "center", padding: "24px 0" }}>
        <div style={{ width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(135deg,#0369a1,#6366f1)",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, margin: "0 auto 22px",
          boxShadow: "0 8px 32px rgba(99,102,241,0.4)" }}>📧</div>
        <div style={{ fontSize: 24, fontWeight: 800, fontFamily: "'Syne',sans-serif", color: C.ink, marginBottom: 12 }}>
          Check your inbox
        </div>
        <div style={{ fontSize: 14, color: C.mid, fontFamily: "'Epilogue',sans-serif", lineHeight: 1.8, marginBottom: 10, fontWeight: 500 }}>
          We sent a verification link to<br />
          <strong style={{ color: C.sky, fontSize: 15 }}>{email}</strong>
        </div>
        <div style={{ fontSize: 13, color: C.muted, fontFamily: "'Epilogue',sans-serif", lineHeight: 1.7, marginBottom: 26, fontWeight: 500 }}>
          Click the link in the email to activate your account.<br />
          You won't be able to sign in until you verify.
        </div>
        <Btn C={C} onClick={onClose} variant="outline" style={{ width: "100%" }}>Close</Btn>
      </div>
    </Overlay>
  );

  return (
    <Overlay onClose={onClose} C={C}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 26 }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 800, fontFamily: "'Syne',sans-serif", color: C.ink }}>
            {mode === "login" ? "Welcome back 👋" : "Create your account"}
          </div>
          <div style={{ fontSize: 14, color: C.muted, fontFamily: "'Epilogue',sans-serif", marginTop: 4, fontWeight: 600 }}>
            {mode === "login" ? "Sign in to TokenSense" : "Free forever · no credit card needed"}
          </div>
        </div>
        <span onClick={onClose} style={{ cursor: "pointer", fontSize: 24, color: C.muted, lineHeight: 1 }}>×</span>
      </div>

      {/* Real Google OAuth */}
      <button onClick={googleSignIn} disabled={googleLoading || loading}
        style={{ width: "100%", padding: "12px 0", borderRadius: 10, border: `2px solid ${C.border}`,
          background: C.cardBg, color: C.ink, fontSize: 14, fontWeight: 700,
          fontFamily: "'Epilogue',sans-serif", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          marginBottom: 20, transition: "all 0.15s", opacity: googleLoading ? 0.7 : 1 }}>
        {googleLoading ? "Redirecting to Google…" : (
          <>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908C16.658 14.013 17.64 11.705 17.64 9.2z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </>
        )}
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <div style={{ flex: 1, height: 1, background: C.border }} />
        <span style={{ fontSize: 13, color: C.muted, fontFamily: "'Epilogue',sans-serif", fontWeight: 600 }}>or with email</span>
        <div style={{ flex: 1, height: 1, background: C.border }} />
      </div>

      {mode === "signup" && <Field C={C} label="Full name" value={name} onChange={setName} placeholder="Your name" icon="👤" error={errors.name} />}
      <Field C={C} label="Email address" type="email" value={email} onChange={setEmail} placeholder="you@company.com" icon="✉️" error={errors.email} />
      <Field C={C} label="Password" type="password" value={pw} onChange={setPw} placeholder="Min. 8 characters" icon="🔒"
        error={errors.pw} hint={mode === "signup" ? "At least 8 characters" : null} />
      {mode === "signup" && (
        <Field C={C} label="Confirm password" type="password" value={pw2} onChange={setPw2} placeholder="Repeat your password" icon="🔒" error={errors.pw2} />
      )}

      {errors.form && (
        <div style={{ color: C.red, fontSize: 13, marginBottom: 14, fontFamily: "'Epilogue',sans-serif", fontWeight: 600, padding: "10px 14px", background: C.red+"11", borderRadius: 8 }}>
          {errors.form}
        </div>
      )}

      <Btn C={C} onClick={submit} disabled={loading || googleLoading} style={{ width: "100%", padding: "13px 0", marginBottom: 18 }}>
        {loading ? (mode === "login" ? "Signing in…" : "Creating account…")
                 : (mode === "login" ? "Sign In" : "Create Free Account")}
      </Btn>

      <div style={{ textAlign: "center", fontSize: 14, color: C.muted, fontFamily: "'Epilogue',sans-serif", fontWeight: 600 }}>
        {mode === "login" ? "No account? " : "Already registered? "}
        <span onClick={() => { setMode(mode === "login" ? "signup" : "login"); setErrors({}); setPw(""); setPw2(""); }}
          style={{ color: C.sky, cursor: "pointer", fontWeight: 700 }}>
          {mode === "login" ? "Sign up free" : "Sign in"}
        </span>
      </div>
    </Overlay>
  );
}

// ─── API Key Modal ────────────────────────────────────────────────────────────
function ApiKeyModal({ existing, onClose, onSave, userId, C }) {
  const [key, setKey] = useState(existing || "");
  const [saving, setSaving] = useState(false);
  const masked = existing ? `sk-ant-…${existing.slice(-6)}` : null;
  const validFormat = key.startsWith("sk-ant-") && key.length > 20;

  const save = async () => {
    setSaving(true);
    if (userId) {
      await supabase.from("profiles").update({ anthropic_api_key: key }).eq("id", userId);
    }
    localStorage.setItem("ts_key", key);
    onSave(key);
    onClose();
  };

  return (
    <Overlay onClose={onClose} C={C}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, fontFamily: "'Syne',sans-serif", color: C.ink }}>Connect Anthropic API</div>
          <div style={{ fontSize: 13, color: C.muted, marginTop: 4, fontFamily: "'Epilogue',sans-serif", fontWeight: 600 }}>Enables live token tracking in your dashboard</div>
        </div>
        <span onClick={onClose} style={{ cursor: "pointer", fontSize: 22, color: C.muted }}>×</span>
      </div>
      <div style={{ background: C.surface, border: `1px solid ${C.sky}44`, borderRadius: 12, padding: "16px", marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, fontFamily: "'Syne',sans-serif", marginBottom: 10 }}>How to get your key:</div>
        {["Go to console.anthropic.com","Click API Keys in the sidebar","Create a new key and copy it","Paste it below — stored securely in your account"].map((s,i)=>(
          <div key={i} style={{ display:"flex",gap:10,marginBottom:7,alignItems:"flex-start" }}>
            <div style={{ width:20,height:20,borderRadius:"50%",background:C.sky,color:"#fff",fontSize:11,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>{i+1}</div>
            <span style={{ fontSize:13,color:C.mid,fontFamily:"'Epilogue',sans-serif",lineHeight:1.5,fontWeight:600 }}>{s}</span>
          </div>
        ))}
      </div>
      {existing && (
        <div style={{ marginBottom:14,padding:"10px 14px",background:C.surface,border:`1px solid ${C.green}44`,borderRadius:10,fontSize:13,fontFamily:"'JetBrains Mono',monospace",color:C.green,fontWeight:700 }}>
          Currently active: {masked} ● Live
        </div>
      )}
      <Field C={C} label="Your Anthropic API Key" value={key} onChange={setKey}
        placeholder="sk-ant-api03-…" icon="🔑"
        hint={validFormat ? "✓ Format looks correct — click Save to connect." : "Your key starts with sk-ant-"} />
      <Btn C={C} onClick={save} disabled={!validFormat || saving} style={{ width:"100%", padding:"13px 0" }}>
        {saving ? "Saving…" : "Save & Connect"}
      </Btn>
    </Overlay>
  );
}

// ─── Checkout Modal ───────────────────────────────────────────────────────────
function CheckoutModal({ plan, onClose, onSuccess, C }) {
  const isPro = plan === "pro";
  const price = isPro ? 19 : 79;
  const gradient = isPro ? "linear-gradient(135deg,#0369a1,#6366f1)" : "linear-gradient(135deg,#5b21b6,#db2777)";
  const glow     = isPro ? "rgba(3,105,161,0.4)" : "rgba(91,33,182,0.4)";
  const features = isPro
    ? ["All 3 Claude models","Usage report dashboard","Session checkpoints","Compact watchdog alerts","Export reports"]
    : ["Everything in Pro","Team admin panel","25 developers","Per-dev cost dashboard","Slack + GitHub alerts","SSO"];

  // Open Transak — works in Turkey, accepts Apple Pay, cards, crypto
  const checkout = () => {
    const WALLET = "0x18d8c908c073f2eacfba91f05335e874d20ec1ed";
    const TRANSAK_KEY = "cf42971a-6379-4623-9f37-293678096237";
    const params = new URLSearchParams({
      apiKey: TRANSAK_KEY,
      cryptoCurrencyCode: "USDT",
      networks: "polygon",
      walletAddress: WALLET,
      fiatAmount: String(price),
      fiatCurrency: "USD",
      defaultPaymentMethod: "apple_pay",
      themeColor: "000000",
      redirectURL: window.location.origin,
    });
    window.open("https://global.transak.com/?" + params.toString(), "_blank", "width=450,height=700");
    // After payment, user comes back and we upgrade their plan manually
    // TODO: wire Transak webhook to auto-upgrade plan
    onSuccess(plan);
  };

  return (
    <Overlay onClose={onClose} C={C}>
      <div style={{ background:gradient,borderRadius:16,padding:"22px 22px 20px",marginBottom:22,position:"relative",overflow:"hidden" }}>
        <div style={{ position:"absolute",top:-20,right:-20,width:110,height:110,borderRadius:"50%",background:"rgba(255,255,255,0.07)" }} />
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",position:"relative" }}>
          <div>
            <div style={{ fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.7)",letterSpacing:"0.12em",fontFamily:"'Syne',sans-serif",marginBottom:6 }}>TOKENSENSE {isPro?"PRO":"TEAM"}</div>
            <div style={{ display:"flex",alignItems:"flex-end",gap:4 }}>
              <span style={{ fontSize:44,fontWeight:800,fontFamily:"'Syne',sans-serif",color:"#fff",lineHeight:1 }}>${price}</span>
              <span style={{ fontSize:15,color:"rgba(255,255,255,0.7)",marginBottom:7 }}>/month</span>
            </div>
            <div style={{ fontSize:13,color:"rgba(255,255,255,0.7)",marginTop:4,fontWeight:600 }}>One-time · No subscription yet</div>
          </div>
          <span onClick={onClose} style={{ cursor:"pointer",fontSize:24,color:"rgba(255,255,255,0.7)" }}>×</span>
        </div>
      </div>
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:11,fontWeight:700,color:C.muted,letterSpacing:"0.1em",fontFamily:"'Syne',sans-serif",marginBottom:12 }}>WHAT'S INCLUDED</div>
        {features.map(f=>(
          <div key={f} style={{ display:"flex",gap:10,marginBottom:10,alignItems:"center" }}>
            <div style={{ width:20,height:20,borderRadius:"50%",background:isPro?"#dbeafe":"#ede9fe",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center" }}>
              <span style={{ fontSize:10,color:isPro?"#0369a1":"#5b21b6",fontWeight:800 }}>✓</span>
            </div>
            <span style={{ fontSize:14,color:C.mid,fontFamily:"'Epilogue',sans-serif",fontWeight:600 }}>{f}</span>
          </div>
        ))}
      </div>

      {/* Payment methods */}
      <div style={{ display:"flex",gap:8,marginBottom:16 }}>
        {["🍎 Apple Pay","💳 Card","🏦 Bank Transfer","₿ Crypto"].map(m=>(
          <div key={m} style={{ flex:1,padding:"8px 4px",background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,textAlign:"center",fontSize:11,color:C.mid,fontFamily:"'Epilogue',sans-serif",fontWeight:600 }}>{m}</div>
        ))}
      </div>

      <div style={{ background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:"12px 16px",marginBottom:20,fontSize:13,color:C.mid,display:"flex",gap:8,alignItems:"center",fontWeight:600 }}>
        <span>🔒</span><span>Powered by <strong style={{ color:C.ink }}>Transak</strong> — works in 160+ countries including Turkey. No crypto wallet needed.</span>
      </div>

      <button onClick={checkout} style={{ width:"100%",padding:"14px 0",borderRadius:12,border:"none",background:gradient,color:"#fff",fontSize:15,fontWeight:800,fontFamily:"'Syne',sans-serif",cursor:"pointer",boxShadow:`0 4px 22px ${glow}`,transition:"transform 0.15s" }}
        onMouseOver={e=>e.currentTarget.style.transform="translateY(-2px)"}
        onMouseOut={e=>e.currentTarget.style.transform=""}>
        Pay ${price} with Apple Pay / Card →
      </button>
      <div style={{ marginTop:10,textAlign:"center",fontSize:12,color:C.muted,fontFamily:"'Epilogue',sans-serif",fontWeight:600 }}>
        Accepts Apple Pay · Credit card · Bank transfer · Crypto
      </div>
    </Overlay>
  );
}

// ─── Waitlist Modal ───────────────────────────────────────────────────────────
function WaitlistModal({ onClose, C }) {
  const [step, setStep] = useState("form");
  const [f, setF]       = useState({ name:"",email:"",company:"",size:"",useCase:"" });
  const [errors, setErrors] = useState({});
  const upd = (k,v) => { setF(p=>({...p,[k]:v})); setErrors(p=>({...p,[k]:null})); };

  const submit = async () => {
    const e = {};
    if (!f.name.trim()) e.name="Required";
    if (!f.email.includes("@")) e.email="Valid email required";
    if (!f.company.trim()) e.company="Required";
    if (Object.keys(e).length) { setErrors(e); return; }
    setStep("submitting");
    try {
      await fetch("/api/waitlist", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(f) });
      setStep("done");
    } catch { setStep("form"); }
  };

  if (step==="done") return (
    <Overlay onClose={onClose} C={C}>
      <div style={{ textAlign:"center",padding:"20px 0" }}>
        <div style={{ width:76,height:76,borderRadius:"50%",background:"linear-gradient(135deg,#5b21b6,#db2777)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:34,margin:"0 auto 18px",boxShadow:"0 8px 32px rgba(91,33,182,0.4)" }}>🚀</div>
        <div style={{ fontSize:22,fontWeight:800,fontFamily:"'Syne',sans-serif",color:C.ink,marginBottom:8 }}>You're on the list!</div>
        <div style={{ fontSize:14,color:C.mid,fontFamily:"'Epilogue',sans-serif",lineHeight:1.8,marginBottom:20,fontWeight:600 }}>
          We'll email <strong style={{ color:C.sky }}>{f.email}</strong> when Team plan opens.<br />Early access pricing guaranteed.
        </div>
        <Btn C={C} onClick={onClose} variant="outline">Back to Dashboard</Btn>
      </div>
    </Overlay>
  );

  return (
    <Overlay onClose={step==="submitting"?null:onClose} C={C}>
      <div style={{ background:"linear-gradient(135deg,#5b21b6,#db2777)",borderRadius:16,padding:"20px 22px",marginBottom:22,position:"relative",overflow:"hidden" }}>
        <div style={{ position:"absolute",top:-15,right:-15,width:80,height:80,borderRadius:"50%",background:"rgba(255,255,255,0.07)" }} />
        <div style={{ display:"flex",justifyContent:"space-between",position:"relative" }}>
          <div>
            <div style={{ fontSize:10,color:"rgba(255,255,255,0.7)",letterSpacing:"0.12em",fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:5 }}>TEAM PLAN WAITLIST</div>
            <div style={{ fontSize:22,fontWeight:800,fontFamily:"'Syne',sans-serif",color:"#fff" }}>Be first in line</div>
            <div style={{ fontSize:13,color:"rgba(255,255,255,0.7)",marginTop:3,fontWeight:600 }}>47 ahead of you · Early access pricing locked</div>
          </div>
          <span onClick={onClose} style={{ cursor:"pointer",fontSize:22,color:"rgba(255,255,255,0.7)" }}>×</span>
        </div>
      </div>
      <Field C={C} label="Your name" value={f.name} onChange={v=>upd("name",v)} placeholder="Jane Smith" icon="👤" error={errors.name} />
      <Field C={C} label="Work email" type="email" value={f.email} onChange={v=>upd("email",v)} placeholder="jane@company.com" icon="✉️" error={errors.email} />
      <Field C={C} label="Company" value={f.company} onChange={v=>upd("company",v)} placeholder="Acme Corp" icon="🏢" error={errors.company} />
      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:13,fontWeight:700,color:C.label,marginBottom:8,fontFamily:"'Epilogue',sans-serif" }}>Team size</div>
        <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
          {["1–5","6–15","16–25","25+"].map(s=>(
            <button key={s} onClick={()=>upd("size",s)} style={{ padding:"8px 18px",borderRadius:8,cursor:"pointer",fontSize:13,fontFamily:"'Epilogue',sans-serif",fontWeight:700,transition:"all 0.15s",border:`2px solid ${f.size===s?"#5b21b6":C.border}`,background:f.size===s?"#ede9fe":C.cardBg,color:f.size===s?"#5b21b6":C.mid }}>{s} devs</button>
          ))}
        </div>
      </div>
      <Field C={C} label="Use case (optional)" value={f.useCase} onChange={v=>upd("useCase",v)} placeholder="e.g. tracking Claude Code spend per engineer…" rows={3} />
      <button onClick={submit} disabled={step==="submitting"} style={{ width:"100%",padding:"14px 0",borderRadius:12,border:"none",background:"linear-gradient(135deg,#5b21b6,#db2777)",color:"#fff",fontSize:15,fontWeight:800,fontFamily:"'Syne',sans-serif",cursor:"pointer",boxShadow:"0 4px 22px rgba(91,33,182,0.4)",opacity:step==="submitting"?0.7:1 }}>
        {step==="submitting"?"Submitting…":"Join Waitlist →"}
      </button>
    </Overlay>
  );
}

// ─── Settings Panel ───────────────────────────────────────────────────────────
function SettingsPanel({ user, apiKey, onLogout, onUpgrade, onShowApiModal, C }) {
  const card = { background:C.cardBg,borderRadius:14,border:`1px solid ${C.border}`,padding:"22px 24px" };
  return (
    <div style={{ maxWidth:560,display:"flex",flexDirection:"column",gap:16 }}>
      <div style={card}>
        <LabelTag C={C}>ACCOUNT</LabelTag>
        <div style={{ display:"flex",alignItems:"center",gap:14,marginBottom:18 }}>
          <div style={{ width:46,height:46,borderRadius:"50%",background:"linear-gradient(135deg,#0369a1,#6366f1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,color:"#fff",fontWeight:800,fontFamily:"'Syne',sans-serif" }}>
            {user.name[0].toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight:800,fontSize:16,fontFamily:"'Syne',sans-serif",color:C.ink }}>{user.name}</div>
            <div style={{ fontSize:13,color:C.muted,fontFamily:"'Epilogue',sans-serif",fontWeight:600,marginTop:2 }}>{user.email}</div>
          </div>
          <Pill C={C} color={user.plan==="pro"?"#fff":user.plan==="team"?C.sky:C.muted} bg={user.plan==="pro"?C.ink:user.plan==="team"?C.sky+"22":C.surface}>
            {user.plan.toUpperCase()}
          </Pill>
        </div>
        <div style={{ display:"flex",gap:8 }}>
          {user.plan==="free" && <Btn C={C} onClick={()=>onUpgrade("pro")} variant="sky" small>Upgrade to Pro →</Btn>}
          <Btn C={C} onClick={onLogout} variant="ghost" small>Sign out</Btn>
        </div>
      </div>

      <div style={{ ...card,opacity:user.plan==="free"?0.65:1 }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12 }}>
          <LabelTag C={C} style={{ marginBottom:0 }}>ANTHROPIC API KEY</LabelTag>
          {user.plan==="free" && <Pill C={C} color={C.amber} bg={C.amber+"18"}>PRO FEATURE</Pill>}
        </div>
        {user.plan!=="free" ? (
          <>
            <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:14 }}>
              <div style={{ flex:1,padding:"10px 14px",background:C.surface,borderRadius:9,fontFamily:"'JetBrains Mono',monospace",fontSize:13,color:apiKey?C.ink:C.muted,border:`1px solid ${C.border}`,fontWeight:600 }}>
                {apiKey?`sk-ant-…${apiKey.slice(-6)}`:"No key connected"}
              </div>
              {apiKey && <Pill C={C} color={C.green} bg={C.green+"18"}>● Live</Pill>}
            </div>
            <Btn C={C} onClick={onShowApiModal} variant={apiKey?"outline":"primary"} small>{apiKey?"Update Key":"Connect API Key →"}</Btn>
          </>
        ) : (
          <div style={{ fontSize:14,color:C.mid,lineHeight:1.6,fontFamily:"'Epilogue',sans-serif",fontWeight:600 }}>Upgrade to Pro to connect your Anthropic key and see live token usage.</div>
        )}
      </div>

      <div style={card}>
        <LabelTag C={C}>BILLING</LabelTag>
        {user.plan==="free" ? (
          <>
            <div style={{ fontSize:14,color:C.mid,marginBottom:16,lineHeight:1.6,fontFamily:"'Epilogue',sans-serif",fontWeight:600 }}>Free plan — upgrade to Pro ($19/mo) for live API data, all models and reports.</div>
            <div style={{ display:"flex",gap:8 }}>
              <Btn C={C} onClick={()=>onUpgrade("pro")} variant="sky" small>Upgrade to Pro</Btn>
              <Btn C={C} onClick={()=>onUpgrade("team")} variant="outline" small>Team Plan →</Btn>
            </div>
          </>
        ) : (
          <>
            {[["Current plan",user.plan==="pro"?"Pro — $19/mo":"Team — $79/mo"],["Next billing","Apr 11, 2026"],["Status","Active ✓"]].map(([k,v])=>(
              <div key={k} style={{ display:"flex",justifyContent:"space-between",marginBottom:12 }}>
                <span style={{ fontSize:14,color:C.muted,fontFamily:"'Epilogue',sans-serif",fontWeight:600 }}>{k}</span>
                <span style={{ fontSize:14,fontWeight:800,fontFamily:"'Syne',sans-serif",color:C.ink }}>{v}</span>
              </div>
            ))}
            <Btn C={C} variant="outline" small>Manage billing →</Btn>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function TokenSense() {
  const [dark, setDark]   = useState(false);
  const C = dark ? DARK : LIGHT;
  const card = { background:C.cardBg,borderRadius:14,border:`1px solid ${C.border}`,padding:"22px 24px",boxShadow:dark?"0 1px 8px rgba(0,0,0,0.3)":"0 1px 4px rgba(0,0,0,0.06)" };

  const [user, setUser]     = useState(null);
  const [apiKey, setApiKey] = useState(()=>{ try{ return localStorage.getItem("ts_key")||""; }catch{ return ""; } });
  const [modal, setModal]   = useState(null);
  const [tab, setTab]       = useState("dashboard");
  const [toast, setToast]   = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [model, setModel]           = useState("claude-sonnet-4-6");
  const [critical, setCritical]     = useState(12000);
  const [active, setActive]         = useState(35000);
  const [background, setBackground] = useState(53000);
  const [devs, setDevs]             = useState(3);
  const [sessions, setSessions]     = useState(8);
  const [compacted, setCompacted]   = useState(false);
  const [tipIdx, setTipIdx]         = useState(0);

  // ── REAL auth state listener ──────────────────────────────────────────────
  useEffect(() => {
    // Check existing session on mount
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const { data: profile } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
        setUser({ id: session.user.id, email: session.user.email, name: profile?.name || session.user.email.split("@")[0], plan: profile?.plan || "free", org_id: profile?.org_id || null });
        if (profile?.anthropic_api_key) setApiKey(profile.anthropic_api_key);
      }
      setAuthLoading(false);
    });

    // Listen to auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session) {
        const { data: profile } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
        const u = { id: session.user.id, email: session.user.email, name: profile?.name || session.user.email.split("@")[0], plan: profile?.plan || "free", org_id: profile?.org_id || null };
        setUser(u);
        setModal(null);
        toast_(`Welcome, ${u.name}! 👋`);
        if (profile?.anthropic_api_key) setApiKey(profile.anthropic_api_key);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setApiKey("");
        setTab("dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => { const t = setInterval(() => setTipIdx(i => (i+1)%TIPS.length), 5000); return () => clearInterval(t); }, []);

  const toast_ = (msg, type="success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 4500); };
  const isPro  = user?.plan === "pro" || user?.plan === "team";
  const isTeam = user?.plan === "team";

  const handleAuth = useCallback((u) => { setUser(u); setModal(null); toast_(`Welcome, ${u.name}! 👋`); }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null); setApiKey(""); localStorage.removeItem("ts_key");
    setTab("dashboard"); toast_("Signed out successfully.");
  };

  const handleUpgrade = (plan) => {
    if (!user) { setModal("auth-signup"); return; }
    setModal(`stripe-${plan}`);
  };

  const handleStripeSuccess = (plan) => {
    setUser(u => ({ ...u, plan }));
    setModal(null);
    toast_(`🎉 You're now on the ${plan==="pro"?"Pro":"Team"} plan!`);
  };

  const m       = MODEL_DATA[model];
  const used    = critical + active + background;
  const usedPct = (used / m.ctx) * 100;
  const prunable  = background * 0.4;
  const afterCpt  = used - prunable;
  const daily   = (used / 1e6) * m.input * sessions * devs;
  const saved   = (prunable / 1e6) * m.input * sessions * devs;

  const handleCompact = () => {
    if (compacted) return;
    setBackground(b => Math.round(b * 0.6));
    setCompacted(true);
    setTimeout(() => setCompacted(false), 2500);
  };

  if (authLoading) return (
    <div style={{ minHeight:"100vh",background:C.pageBg,display:"flex",alignItems:"center",justifyContent:"center" }}>
      <div style={{ fontSize:16,fontFamily:"'Syne',sans-serif",fontWeight:700,color:C.muted }}>Loading…</div>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh",background:C.pageBg,transition:"background 0.3s" }}>
      <Fonts />
      <style>{`
        @keyframes slideUp{from{transform:translateY(18px);opacity:0}to{transform:translateY(0);opacity:1}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        *{box-sizing:border-box}
        input[type=range]{-webkit-appearance:none;appearance:none;height:5px;border-radius:3px;outline:none;cursor:pointer}
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:16px;height:16px;border-radius:50%;background:currentColor;cursor:pointer;box-shadow:0 1px 4px rgba(0,0,0,0.25)}
        textarea{outline:none}
      `}</style>

      {modal==="auth-login"  && <AuthModal mode="login"  onClose={()=>setModal(null)} onAuth={handleAuth} C={C} />}
      {modal==="auth-signup" && <AuthModal mode="signup" onClose={()=>setModal(null)} onAuth={handleAuth} C={C} />}
      {modal==="stripe-pro"  && <CheckoutModal plan="pro"  onClose={()=>setModal(null)} onSuccess={handleStripeSuccess} C={C} />}
      {modal==="stripe-team" && <CheckoutModal plan="team" onClose={()=>setModal(null)} onSuccess={handleStripeSuccess} C={C} />}
      {modal==="waitlist"    && <WaitlistModal onClose={()=>setModal(null)} C={C} />}
      {modal==="api-key"     && <ApiKeyModal existing={apiKey} userId={user?.id} onClose={()=>setModal(null)} onSave={k=>{setApiKey(k);toast_("API key saved — live data enabled! 🔌");}} C={C} />}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={()=>setToast(null)} />}

      {/* Nav */}
      <nav style={{ background:C.navBg,borderBottom:`1px solid ${C.border}`,padding:"0 26px",height:58,display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100 }}>
        <div style={{ display:"flex",alignItems:"center",gap:10 }}>
          <span style={{ fontSize:22 }}>🪙</span>
          <span style={{ fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:18,color:C.ink }}>TokenSense</span>
          {user && <Pill C={C} color={user.plan==="pro"?"#fff":user.plan==="team"?C.sky:C.muted} bg={user.plan==="pro"?C.ink:user.plan==="team"?C.sky+"22":C.surface}>{user.plan.toUpperCase()}</Pill>}
        </div>
        <div style={{ display:"flex",alignItems:"center",gap:6 }}>
          {user && ["dashboard","settings"].map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{ padding:"7px 16px",borderRadius:8,border:"none",cursor:"pointer",background:tab===t?C.surface:"transparent",color:tab===t?C.ink:C.muted,fontWeight:tab===t?700:600,fontSize:13,fontFamily:"'Epilogue',sans-serif",transition:"all 0.15s" }}>
              {t.charAt(0).toUpperCase()+t.slice(1)}
            </button>
          ))}
          <button onClick={()=>setDark(d=>!d)} style={{ width:36,height:36,borderRadius:9,border:`2px solid ${C.border}`,background:C.surface,cursor:"pointer",fontSize:15,display:"flex",alignItems:"center",justifyContent:"center",marginLeft:2 }}>
            {dark?"☀️":"🌙"}
          </button>
          {!user ? (
            <div style={{ display:"flex",gap:8,marginLeft:4 }}>
              <Btn C={C} onClick={()=>setModal("auth-login")}  variant="outline" small>Sign in</Btn>
              <Btn C={C} onClick={()=>setModal("auth-signup")} small>Sign up free</Btn>
            </div>
          ) : (
            <div style={{ display:"flex",alignItems:"center",gap:8,marginLeft:4 }}>
              {!isPro && <Btn C={C} onClick={()=>handleUpgrade("pro")} variant="sky" small>Upgrade →</Btn>}
              {isPro && !apiKey && <Btn C={C} onClick={()=>setModal("api-key")} variant="outline" small>🔑 Connect API</Btn>}
              {apiKey && isPro && <Pill C={C} color={C.green} bg={C.green+"18"}>● Live</Pill>}
              <div onClick={()=>setTab("settings")} style={{ width:34,height:34,borderRadius:"50%",background:"linear-gradient(135deg,#0369a1,#6366f1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,color:"#fff",fontWeight:800,fontFamily:"'Syne',sans-serif",cursor:"pointer" }}>
                {user.name[0].toUpperCase()}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Content */}
      <div style={{ maxWidth:980,margin:"0 auto",padding:"28px 22px",animation:"fadeIn 0.3s ease" }}>
        {user && tab==="settings" ? (
          <SettingsPanel user={user} apiKey={apiKey} onLogout={handleLogout} onUpgrade={handleUpgrade} onShowApiModal={()=>setModal("api-key")} C={C} />
        ) : (
          <>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:22,flexWrap:"wrap",gap:10 }}>
              <div>
                <h1 style={{ margin:0,fontSize:28,fontWeight:800,fontFamily:"'Syne',sans-serif",letterSpacing:"-0.02em",color:C.ink }}>Context Governor</h1>
                <p style={{ margin:"6px 0 0",fontSize:14,color:C.muted,fontFamily:"'Epilogue',sans-serif",fontWeight:600 }}>
                  {apiKey && isPro ? "🟢 Live Anthropic data" : "Estimates mode — "}
                  {isPro && !apiKey && <span onClick={()=>setModal("api-key")} style={{ color:C.sky,cursor:"pointer",fontWeight:700 }}>connect API key for live data →</span>}
                  {!user && <span onClick={()=>setModal("auth-signup")} style={{ color:C.sky,cursor:"pointer",fontWeight:700 }}>sign up to save your sessions →</span>}
                </p>
              </div>
              {!user && <div style={{ display:"flex",gap:8 }}>
                <Btn C={C} onClick={()=>setModal("auth-signup")} small>Create free account</Btn>
                <Btn C={C} onClick={()=>setModal("auth-login")} variant="outline" small>Sign in</Btn>
              </div>}
            </div>

            {usedPct > 50 && (
              <div style={{ background:dark?"#1a0f00":"#fffbeb",border:`2px solid ${C.amber}55`,borderRadius:12,padding:"13px 18px",marginBottom:16,display:"flex",alignItems:"center",gap:10 }}>
                <span style={{ fontSize:18 }}>⚠️</span>
                <span style={{ fontSize:14,color:C.amber,fontFamily:"'Epilogue',sans-serif",flex:1,fontWeight:700 }}>
                  <strong>Compact Watchdog:</strong> Context at {Math.round(usedPct)}% — run <code>/compact</code> now.
                  {!isPro && <span onClick={()=>handleUpgrade("pro")} style={{ color:C.sky,cursor:"pointer",marginLeft:8,fontWeight:700 }}>Get automated alerts on Pro →</span>}
                </span>
              </div>
            )}

            <div style={{ ...card,marginBottom:16 }}>
              <LabelTag C={C}>MODEL</LabelTag>
              <div style={{ display:"flex",gap:8,flexWrap:"wrap",alignItems:"center" }}>
                {Object.entries(MODEL_DATA).map(([id,info])=>{
                  const locked=!isPro&&info.pro;
                  return (
                    <button key={id} onClick={()=>!locked&&setModel(id)} style={{ padding:"9px 20px",borderRadius:9,cursor:locked?"not-allowed":"pointer",border:`2px solid ${model===id?C.sky:C.border}`,background:model===id?(dark?"#0c1e2e":"#dbeafe"):C.cardBg,color:model===id?C.sky:locked?C.muted:C.mid,fontSize:13,fontFamily:"'JetBrains Mono',monospace",fontWeight:700,transition:"all 0.15s",boxShadow:model===id?`0 0 0 1px ${C.sky}44`:"none" }}>{info.label}{locked?" 🔒":""}</button>
                  );
                })}
                {!isPro && <span style={{ fontSize:13,color:C.muted,fontFamily:"'Epilogue',sans-serif",fontWeight:600 }}><span onClick={()=>handleUpgrade("pro")} style={{ color:C.sky,cursor:"pointer",fontWeight:700 }}>Pro</span> unlocks all models</span>}
              </div>
            </div>

            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16 }}>
              <div style={card}>
                <LabelTag C={C}>CONTEXT USAGE</LabelTag>
                <div style={{ display:"flex",justifyContent:"space-around",marginBottom:20 }}>
                  <Gauge pct={usedPct} label="Used" sub={`${Math.round(used/1000)}k tkns`} color={C.sky} C={C} dark={dark} />
                  <Gauge pct={(prunable/Math.max(used,1))*100} label="Prunable" sub={`${Math.round(prunable/1000)}k free`} color={C.purple} C={C} dark={dark} />
                  <Gauge pct={(afterCpt/m.ctx)*100} label="Post-Compact" sub={`${Math.round(afterCpt/1000)}k`} color={C.green} C={C} dark={dark} />
                </div>
                <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:16 }}>
                  {[
                    {label:"TOTAL TOKENS",val:`${Math.round(used/1000)}k`,color:C.ink},
                    {label:"% USED",val:`${Math.round(usedPct)}%`,color:usedPct>80?C.red:usedPct>50?C.amber:C.green},
                    {label:"REMAINING",val:`${Math.round((m.ctx-used)/1000)}k`,color:C.sky},
                  ].map(({label,val,color})=>(
                    <div key={label} style={{ background:C.surface,borderRadius:10,padding:"13px 8px",textAlign:"center",border:`1px solid ${C.border}` }}>
                      <div style={{ fontSize:24,fontWeight:800,fontFamily:"'JetBrains Mono',monospace",color,lineHeight:1 }}>{val}</div>
                      <div style={{ fontSize:9,color:C.muted,marginTop:5,letterSpacing:"0.08em",fontFamily:"'Syne',sans-serif",fontWeight:700 }}>{label}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display:"flex",gap:2,borderRadius:6,overflow:"hidden",height:8,marginBottom:10 }}>
                  {[[critical,C.red],[active,C.amber],[background,C.sky]].map(([v,c],i)=>(
                    <div key={i} style={{ flex:(v/m.ctx)*100,background:c,transition:"flex 0.5s ease",boxShadow:`0 0 5px ${c}88` }} />
                  ))}
                  <div style={{ flex:100-(used/m.ctx)*100,background:C.border }} />
                </div>
                <div style={{ display:"flex",gap:14,marginBottom:16 }}>
                  {[["Critical",C.red],["Active",C.amber],["Background",C.sky]].map(([l,c])=>(
                    <div key={l} style={{ display:"flex",alignItems:"center",gap:5 }}>
                      <div style={{ width:7,height:7,borderRadius:"50%",background:c,boxShadow:`0 0 4px ${c}` }} />
                      <span style={{ fontSize:11,color:C.mid,fontFamily:"'Epilogue',sans-serif",fontWeight:700 }}>{l}</span>
                    </div>
                  ))}
                </div>
                <Btn C={C} onClick={handleCompact} variant={compacted?"green":"primary"} style={{ width:"100%",padding:"11px 0" }}>
                  {compacted?"✓ Compacted — context freed!":"⚡ Simulate /compact"}
                </Btn>
              </div>

              <div style={card}>
                <LabelTag C={C}>CONTEXT TIERS</LabelTag>
                {[
                  {label:"Critical (never prune)",v:critical,set:setCritical,max:80000,color:C.red},
                  {label:"Active (prune sparingly)",v:active,set:setActive,max:120000,color:C.amber},
                  {label:"Background (up to 40%)",v:background,set:setBackground,max:160000,color:C.sky},
                ].map(({label,v,set,max,color})=>(
                  <div key={label} style={{ marginBottom:18 }}>
                    <div style={{ display:"flex",justifyContent:"space-between",marginBottom:6 }}>
                      <span style={{ fontSize:13,color:C.mid,fontFamily:"'Epilogue',sans-serif",fontWeight:700 }}>{label}</span>
                      <span style={{ fontSize:13,fontFamily:"'JetBrains Mono',monospace",fontWeight:700,color }}>{(v/1000).toFixed(1)}k</span>
                    </div>
                    <input type="range" min={0} max={max} value={v} onChange={e=>set(Number(e.target.value))} style={{ width:"100%",accentColor:color }} />
                    <div style={{ height:3,background:C.border,borderRadius:2,marginTop:5,overflow:"hidden" }}>
                      <div style={{ width:`${(v/max)*100}%`,height:"100%",background:color,borderRadius:2,transition:"width 0.2s",boxShadow:`0 0 5px ${color}88` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16 }}>
              <div style={card}>
                <LabelTag C={C}>COST CALCULATOR</LabelTag>
                <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:18 }}>
                  <div>
                    {[
                      {label:`Developers (max ${isTeam?25:isPro?5:1})`,v:devs,set:setDevs,max:isTeam?25:isPro?5:1,color:C.purple},
                      {label:"Sessions / day",v:sessions,set:setSessions,max:30,color:C.purple},
                    ].map(({label,v,set,max,color})=>(
                      <div key={label} style={{ marginBottom:16 }}>
                        <div style={{ display:"flex",justifyContent:"space-between",marginBottom:6 }}>
                          <span style={{ fontSize:12,color:C.mid,fontFamily:"'Epilogue',sans-serif",fontWeight:700 }}>{label}</span>
                          <span style={{ fontSize:13,fontFamily:"'JetBrains Mono',monospace",fontWeight:700,color }}>{v}</span>
                        </div>
                        <input type="range" min={1} max={max} value={v} onChange={e=>set(Number(e.target.value))} style={{ width:"100%",accentColor:color }} />
                      </div>
                    ))}
                  </div>
                  <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                    {[
                      {label:"Daily cost",val:`$${daily.toFixed(2)}`,big:false},
                      {label:"Daily savings",val:`$${saved.toFixed(2)}`,accent:true},
                      {label:"Annual savings",val:`$${(saved*250).toFixed(0)}`,big:true},
                    ].map(({label,val,big,accent})=>(
                      <div key={label} style={{ padding:"11px 12px",borderRadius:10,background:C.surface,border:`1px solid ${big?C.green+"44":C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                        <span style={{ fontSize:12,color:C.muted,fontFamily:"'Epilogue',sans-serif",fontWeight:700 }}>{label}</span>
                        <span style={{ fontFamily:"'JetBrains Mono',monospace",fontWeight:800,fontSize:big?22:14,color:big?C.green:accent?C.sky:C.ink }}>{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ ...card,background:C.surface,border:`2px dashed ${C.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12 }}>
                <div>
                  <div style={{ fontSize:15,fontWeight:800,fontFamily:"'Syne',sans-serif",marginBottom:5,color:C.ink }}>🔒 Team Dashboard</div>
                  <div style={{ fontSize:13,color:C.mid,fontFamily:"'Epilogue',sans-serif",fontWeight:600 }}>Track every dev's usage and costs in one view.</div>
                </div>
                <Btn C={C} onClick={()=>setModal("waitlist")} variant="outline" small>Join Waitlist →</Btn>
              </div>
            </div>

            <div style={{ ...card,background:dark?"#0a1929":"#eff8ff",border:`1px solid ${dark?"#1e3a5f":"#bae6fd"}`,display:"flex",alignItems:"flex-start",gap:14 }}>
              <span style={{ fontSize:22,flexShrink:0,marginTop:2 }}>{TIPS[tipIdx].icon}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14,fontWeight:800,color:C.sky,fontFamily:"'Syne',sans-serif",marginBottom:4 }}>{TIPS[tipIdx].title}</div>
                <div style={{ fontSize:13,color:dark?"#93c5fd":"#0c4a6e",fontFamily:"'Epilogue',sans-serif",lineHeight:1.6,fontWeight:600 }}>{TIPS[tipIdx].body}</div>
              </div>
              <div style={{ display:"flex",gap:5,flexShrink:0,paddingTop:4 }}>
                {TIPS.map((_,i)=>(
                  <div key={i} onClick={()=>setTipIdx(i)} style={{ width:6,height:6,borderRadius:"50%",cursor:"pointer",background:i===tipIdx?C.sky:C.border,transition:"background 0.3s" }} />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
