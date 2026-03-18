"use client";
import { useState } from "react";

const WALLET = "0x18d8c908c073f2eacfba91f05335e874d20ec1ed";

export default function TokenSense() {
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");

  const pay = () => {
    const val = parseFloat(amount);
    if (!val || val < 1) return;
    const url = `https://transak.com/buy?cryptoCurrencyCode=USDT&network=polygon&walletAddress=${WALLET}&fiatAmount=${val}&fiatCurrency=${currency}&defaultPaymentMethod=apple_pay`;
    window.open(url, "_blank");
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#080d18",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
    }}>
      <div style={{
        background: "#111c2e",
        border: "1px solid #1e3a5f",
        borderRadius: 20,
        padding: "40px 32px",
        width: "100%",
        maxWidth: 340,
        textAlign: "center",
      }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🪙</div>
        <div style={{ fontSize: 26, fontWeight: 800, color: "#f0f6ff", fontFamily: "system-ui,sans-serif", marginBottom: 6 }}>
          TokenSense
        </div>
        <div style={{ fontSize: 14, color: "#8ba3bc", fontFamily: "system-ui,sans-serif", marginBottom: 28 }}>
          Claude Code token optimizer
        </div>

        {/* Currency selector */}
        <div style={{ display: "flex", gap: 8, marginBottom: 14, justifyContent: "center" }}>
          {["USD", "EUR", "GBP"].map(c => (
            <button key={c} onClick={() => setCurrency(c)} style={{
              flex: 1,
              padding: "9px 0",
              borderRadius: 9,
              border: `2px solid ${currency === c ? "#38bdf8" : "#1e3a5f"}`,
              background: currency === c ? "#0c1e2e" : "transparent",
              color: currency === c ? "#38bdf8" : "#8ba3bc",
              fontSize: 13, fontWeight: 700,
              cursor: "pointer",
              fontFamily: "system-ui,sans-serif",
            }}>{c}</button>
          ))}
        </div>

        {/* Amount input */}
        <div style={{ position: "relative", marginBottom: 14 }}>
          <span style={{
            position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)",
            fontSize: 20, fontWeight: 700, color: "#f0f6ff", fontFamily: "system-ui,sans-serif",
          }}>
            {currency === "USD" ? "$" : currency === "EUR" ? "€" : "£"}
          </span>
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="0"
            min="1"
            style={{
              width: "100%", boxSizing: "border-box",
              padding: "16px 16px 16px 36px",
              background: "#0d1525",
              border: "2px solid #1e3a5f",
              borderRadius: 12,
              fontSize: 28, fontWeight: 700, color: "#f0f6ff",
              outline: "none", textAlign: "center",
              fontFamily: "system-ui,sans-serif",
            }}
            onFocus={e => e.target.style.borderColor = "#38bdf8"}
            onBlur={e  => e.target.style.borderColor = "#1e3a5f"}
          />
        </div>

        {/* Quick amounts */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {[19, 49, 79, 99].map(v => (
            <button key={v} onClick={() => setAmount(String(v))} style={{
              flex: 1, padding: "8px 0", borderRadius: 8,
              border: `1.5px solid ${Number(amount) === v ? "#38bdf8" : "#1e3a5f"}`,
              background: Number(amount) === v ? "#0c1e2e" : "transparent",
              color: Number(amount) === v ? "#38bdf8" : "#8ba3bc",
              fontSize: 13, fontWeight: 700, cursor: "pointer",
              fontFamily: "system-ui,sans-serif",
            }}>{v}</button>
          ))}
        </div>

        {/* Pay button */}
        <button
          onClick={pay}
          disabled={!amount || parseFloat(amount) < 1}
          style={{
            width: "100%", padding: "15px 0", borderRadius: 12, border: "none",
            background: !amount || parseFloat(amount) < 1
              ? "#1e3a5f"
              : "linear-gradient(135deg,#0369a1,#6366f1)",
            color: !amount || parseFloat(amount) < 1 ? "#3d5068" : "#fff",
            fontSize: 16, fontWeight: 800, cursor: !amount || parseFloat(amount) < 1 ? "not-allowed" : "pointer",
            fontFamily: "system-ui,sans-serif",
            transition: "all 0.15s",
            boxShadow: !amount || parseFloat(amount) < 1 ? "none" : "0 4px 24px rgba(3,105,161,0.4)",
          }}
        >
          {amount && parseFloat(amount) >= 1
            ? `Pay ${currency === "USD" ? "$" : currency === "EUR" ? "€" : "£"}${amount}`
            : "Enter amount"}
        </button>

        <div style={{ marginTop: 14, fontSize: 12, color: "#3d5068", fontFamily: "system-ui,sans-serif" }}>
          🍎 Apple Pay · 💳 Card · 🏦 Bank · ₿ Crypto
        </div>
      </div>
    </div>
  );
}
