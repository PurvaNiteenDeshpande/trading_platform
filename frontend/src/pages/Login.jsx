import { useState } from "react";
import { api, login } from "../api/client";

export default function Login({ setUser }) {
  const [mode, setMode] = useState("login");
  const [investorId, setInvestorId] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const completeLogin = (payload) => {
    const user = payload?.investor || payload?.user;
    const token = payload?.token || (user ? `investor-${user.investor_id}` : null);

    if (!user) return false;

    if (token) localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    setUser(user);
    return true;
  };

  const handleLogin = async () => {
    if (!investorId) return setError("Please enter your Investor ID");

    setLoading(true);
    setError("");
    setSuccess("");

    const res = await login(Number(investorId));

    if (!completeLogin(res)) {
      setError(res.error || "Login failed. Check your Investor ID.");
    }

    setLoading(false);
  };

  const handleCreateAccount = async () => {
    if (!name.trim() || !email.trim()) {
      return setError("Name and email are required");
    }

    setLoading(true);
    setError("");
    setSuccess("");

    const res = await api.createInvestor({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || null,
    });

    if (res?.error) {
      setError(res.error || "Account creation failed");
    } else {
      const autoLoggedIn = completeLogin(res);
      if (!autoLoggedIn) {
        setSuccess(`Account created! Your Investor ID is ${res.investor_id}. Initial wallet cash is ₹100000.`);
        setMode("login");
        setInvestorId(String(res.investor_id || ""));
      }
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
        width: 360, border: "1px solid #333"
      }}>
        <h2 style={{ color: "white", marginBottom: 8 }}>Trading Platform</h2>
        <p style={{ color: "#888", marginBottom: 24, fontSize: 14 }}>
          {mode === "login" ? "Enter your Investor ID to continue" : "Create an account with ₹100000 starting wallet"}
        </p>

        <div style={styles.modeWrap}>
          <button
            onClick={() => {
              setMode("login");
              setError("");
              setSuccess("");
            }}
            style={{ ...styles.modeBtn, background: mode === "login" ? "#00b36b" : "#2a2a2a" }}
          >
            Login
          </button>
          <button
            onClick={() => {
              setMode("register");
              setError("");
              setSuccess("");
            }}
            style={{ ...styles.modeBtn, background: mode === "register" ? "#00b36b" : "#2a2a2a" }}
          >
            Create Account
          </button>
        </div>

        {mode === "login" ? (
          <input
            type="number"
            placeholder="Investor ID (e.g. 1)"
            value={investorId}
            onChange={(e) => setInvestorId(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            style={styles.input}
          />
        ) : (
          <>
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={styles.input}
            />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
            />
            <input
              type="text"
              placeholder="Phone (optional)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={styles.input}
            />
          </>
        )}

        {success && (
          <p style={{ color: "#00b36b", fontSize: 13, marginTop: 8 }}>{success}</p>
        )}

        {error && (
          <p style={{ color: "#ff4d4d", fontSize: 13, marginTop: 8 }}>{error}</p>
        )}

        <button
          onClick={mode === "login" ? handleLogin : handleCreateAccount}
          disabled={loading}
          style={{
            width: "100%", padding: "10px 0", marginTop: 16,
            background: loading ? "#444" : "#00b36b",
            color: "white", border: "none", borderRadius: 8,
            fontSize: 15, cursor: loading ? "not-allowed" : "pointer"
          }}
        >
          {loading
            ? (mode === "login" ? "Logging in..." : "Creating account...")
            : (mode === "login" ? "Login" : "Create Account")}
        </button>
      </div>
    </div>
  );
}

const styles = {
  modeWrap: {
    display: "flex",
    gap: 8,
    marginBottom: 12,
  },
  modeBtn: {
    flex: 1,
    border: "none",
    borderRadius: 6,
    padding: "8px 10px",
    color: "white",
    fontWeight: 600,
    cursor: "pointer",
    fontSize: 13,
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #444",
    background: "#111",
    color: "white",
    fontSize: 15,
    boxSizing: "border-box",
    marginBottom: 8,
  },
};
