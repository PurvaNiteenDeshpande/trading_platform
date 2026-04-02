import { useState } from "react";
import { login } from "../api/client";

export default function Login({ setUser }) {
  const [investorId, setInvestorId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!investorId) return setError("Please enter your Investor ID");

    setLoading(true);
    setError("");

    const res = await login(Number(investorId));

    if (res?.investor) {
      const user = res.investor;
      localStorage.setItem("token", `investor-${user.investor_id}`);
      localStorage.setItem("user", JSON.stringify(user));
      setUser(user);
    } else if (res?.token && res?.user) {
      localStorage.setItem("token", res.token);
      localStorage.setItem("user", JSON.stringify(res.user));
      setUser(res.user);
    } else {
      setError(res.error || "Login failed. Check your Investor ID.");
    }

    setLoading(false);
  };

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", height: "100vh", background: "#0d0d0d"
    }}>
      <div style={{
        background: "#1a1a1a", padding: 40, borderRadius: 12,
        width: 340, border: "1px solid #333"
      }}>
        <h2 style={{ color: "white", marginBottom: 8 }}>Trading Platform</h2>
        <p style={{ color: "#888", marginBottom: 24, fontSize: 14 }}>
          Enter your Investor ID to continue
        </p>

        <input
          type="number"
          placeholder="Investor ID (e.g. 1)"
          value={investorId}
          onChange={(e) => setInvestorId(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          style={{
            width: "100%", padding: "10px 12px", borderRadius: 8,
            border: "1px solid #444", background: "#111",
            color: "white", fontSize: 15, boxSizing: "border-box"
          }}
        />

        {error && (
          <p style={{ color: "#ff4d4d", fontSize: 13, marginTop: 8 }}>{error}</p>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: "100%", padding: "10px 0", marginTop: 16,
            background: loading ? "#444" : "#00b36b",
            color: "white", border: "none", borderRadius: 8,
            fontSize: 15, cursor: loading ? "not-allowed" : "pointer"
          }}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </div>
    </div>
  );
}
