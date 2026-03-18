"use client";

const WALLET = "0x18d8c908c073f2eacfba91f05335e874d20ec1ed";
const TRANSAK_KEY = "cf42971a-6379-4623-9f37-293678096237";

const plans = [
  {
    name: "Pro",
    price: 19,
    features: ["All 3 Claude models", "Usage dashboard", "Session checkpoints", "Compact alerts", "Export reports"],
    gradient: "linear-gradient(135deg,#0369a1,#6366f1)",
    glow: "rgba(3,105,161,0.35)",
  },
  {
    name: "Team",
    price: 79,
    features: ["Everything in Pro", "25 developers", "Team admin panel", "Per-dev cost tracking", "Slack alerts"],
    gradient: "linear-gradient(135deg,#5b21b6,#db2777)",
    glow: "rgba(91,33,182,0.35)",
  },
];

function pay(price) {
  const params = new URLSearchParams({
    apiKey: TRANSAK_KEY,
    cryptoCurrencyCode: "USDT",
    networks: "polygon",
    walletAddress: WALLET,
    fiatAmount: String(price),
    fiatCurrency: "USD",
    defaultPaymentMethod: "apple_pay",
    themeColor: "000000",
  });
  window.open("https://global.transak.com/?" + params.toString(), "_blank", "width=450,height=700");
}

export default function TokenSense() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#080d18",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 20px",
      fontFamily: "system-ui, sans-serif",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Epilogue:wght@500;600&display=swap" rel="stylesheet" />

      {/* Logo */}
      <div style={{ textAlign: "center", marginBottom: 48 }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>🪙</div>
        <div style={{ fontSize: 32, fontWeight: 800, fontFamily: "'Syne',sans-serif", color: "#f0f6ff", marginBottom: 8 }}>
          TokenSense
        </div>
        <div style={{ fontSize: 15, color: "#8ba3bc", fontFamily: "'Epilogue',sans-serif", fontWeight: 500 }}>
          Claude Code token optimizer · Pay once, use forever
        </div>
      </div>

      {/* Plans */}
      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", justifyContent: "center", maxWidth: 760, width: "100%" }}>
        {plans.map(plan => (
          <div key={plan.name} style={{
            flex: "1 1 320px",
            maxWidth: 360,
            background: "#111c2e",
            borderRadius: 20,
            border: "1px solid #1e3a5f",
            overflow: "hidden",
          }}>
            {/* Header */}
            <div style={{ background: plan.gradient, padding: "28px 28px 24px", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: -20, right: -20, width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
              <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.65)", letterSpacing: "0.14em", fontFamily: "'Syne',sans-serif", marginBottom: 6 }}>
                TOKENSENSE {plan.name.toUpperCase()}
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 4 }}>
                <span style={{ fontSize: 52, fontWeight: 800, fontFamily: "'Syne',sans-serif", color: "#fff", lineHeight: 1 }}>${plan.price}</span>
                <span style={{ fontSize: 16, color: "rgba(255,255,255,0.65)", marginBottom: 8 }}>/month</span>
              </div>
            </div>

            {/* Features */}
            <div style={{ padding: "22px 28px 24px" }}>
              {plan.features.map(f => (
                <div key={f} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#1e3a5f", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontSize: 9, color: "#38bdf8", fontWeight: 800 }}>✓</span>
                  </div>
                  <span style={{ fontSize: 14, color: "#cbd5e1", fontFamily: "'Epilogue',sans-serif", fontWeight: 500 }}>{f}</span>
                </div>
              ))}

              {/* Payment methods */}
              <div style={{ display: "flex", gap: 6, marginTop: 18, marginBottom: 18, flexWrap: "wrap" }}>
                {["🍎 Apple Pay", "💳 Card", "🏦 Bank", "₿ Crypto"].map(m => (
                  <div key={m} style={{ padding: "5px 10px", background: "#0d1525", border: "1px solid #1e3a5f", borderRadius: 7, fontSize: 11, color: "#8ba3bc", fontFamily: "'Epilogue',sans-serif", fontWeight: 600 }}>{m}</div>
                ))}
              </div>

              {/* Pay button */}
              <button
                onClick={() => pay(plan.price)}
                style={{
                  width: "100%",
                  padding: "14px 0",
                  borderRadius: 12,
                  border: "none",
                  background: plan.gradient,
                  color: "#fff",
                  fontSize: 15,
                  fontWeight: 800,
                  fontFamily: "'Syne',sans-serif",
                  cursor: "pointer",
                  boxShadow: `0 4px 24px ${plan.glow}`,
                  transition: "transform 0.15s, box-shadow 0.15s",
                }}
                onMouseOver={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 8px 32px ${plan.glow}`; }}
                onMouseOut={e  => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = `0 4px 24px ${plan.glow}`; }}
              >
                Pay ${plan.price} with Apple Pay / Card →
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Trust line */}
      <div style={{ marginTop: 36, fontSize: 13, color: "#3d5068", fontFamily: "'Epilogue',sans-serif", fontWeight: 500, textAlign: "center" }}>
        🔒 Powered by Transak · Works in 160+ countries · No account needed
      </div>
    </div>
  );
}
