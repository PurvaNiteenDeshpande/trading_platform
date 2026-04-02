import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { api } from "../api/client";

export default function Navbar({ setUser, user }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showAccount, setShowAccount] = useState(false);
  const [account, setAccount] = useState(user);

  const refreshAccount = async () => {
    if (!user?.investor_id) return;

    const data = await api.getInvestor(user.investor_id);
    if (!data?.investor_id) return;

    setAccount(data);
    setUser(data);
    localStorage.setItem("user", JSON.stringify(data));
  };

  useEffect(() => {
    setAccount(user);
  }, [user]);

  useEffect(() => {
    if (!user?.investor_id) return;

    refreshAccount();
    const interval = setInterval(refreshAccount, 15000);
    return () => clearInterval(interval);
  }, [user?.investor_id]);

  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
  };

  const navStyle = (path) => ({
    background: location.pathname === path ? "#00b36b" : "transparent",
    color: "white",
    border: "1px solid #333",
    padding: "8px 18px",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 14,
  });

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "12px 20px", background: "#111",
      borderBottom: "1px solid #222", position: "relative"
    }}>
      <span style={{ color: "#00b36b", fontWeight: 600, fontSize: 18, marginRight: 16 }}>
        📈 TradePlatform
      </span>

      <div style={styles.accountWrap}>
        <button
          onClick={() => setShowAccount((prev) => !prev)}
          style={{
            background: showAccount ? "#00b36b" : "transparent",
            color: "white",
            border: "1px solid #333",
            padding: "8px 14px",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 14,
          }}
        >
          Account
        </button>

        {showAccount && (
          <div style={styles.panel}>
            <div style={styles.title}>Account Details</div>
            <div style={styles.row}><span>Investor ID</span><strong>{account?.investor_id ?? "-"}</strong></div>
            <div style={styles.row}><span>Name</span><strong>{account?.name || "-"}</strong></div>
            <div style={styles.row}><span>Email</span><strong>{account?.email || "-"}</strong></div>
            <div style={styles.row}><span>Wallet Cash</span><strong>₹{Number(account?.account_balance || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong></div>
            <button onClick={refreshAccount} style={styles.refreshBtn}>Refresh Details</button>
          </div>
        )}
      </div>

      <button style={navStyle("/")} onClick={() => navigate("/")}>Dashboard</button>
      <button style={navStyle("/orders")} onClick={() => navigate("/orders")}>Orders</button>
      <button style={navStyle("/portfolio")} onClick={() => navigate("/portfolio")}>Portfolio</button>

      <span style={{ color: "#7ef5bc", marginLeft: 6, fontSize: 13, fontWeight: 600 }}>
        Wallet: ₹{Number(account?.account_balance || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
      </span>

      <button
        onClick={() => setShowAccount((prev) => !prev)}
        style={{
          background: showAccount ? "#00b36b" : "transparent",
          color: "white",
          border: "1px solid #333",
          padding: "8px 14px",
          borderRadius: 6,
          cursor: "pointer",
          fontSize: 14,
        }}
      >
        Account
      </button>

      <button
        onClick={logout}
        style={{
          marginLeft: "auto", background: "transparent", color: "#ff4d4d",
          border: "1px solid #ff4d4d", padding: "8px 18px",
          borderRadius: 6, cursor: "pointer", fontSize: 14
        }}
      >
        Logout
      </button>
    </div>
  );
}

const styles = {
  accountWrap: {
    position: "relative",
  },
  panel: {
    position: "absolute",
    left: 0,
    top: 42,
    width: 300,
    background: "#1a1a1a",
    border: "1px solid #2a2a2a",
    borderRadius: 10,
    padding: 14,
    zIndex: 20,
    boxShadow: "0 10px 26px rgba(0, 0, 0, 0.4)",
  },
  title: {
    color: "#fff",
    fontSize: 14,
    fontWeight: 700,
    marginBottom: 10,
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    color: "#bbb",
    borderBottom: "1px solid #2a2a2a",
    padding: "8px 0",
    fontSize: 13,
    gap: 10,
  },
  refreshBtn: {
    marginTop: 10,
    width: "100%",
    border: "1px solid #2e5d49",
    borderRadius: 6,
    background: "#173b2c",
    color: "#7ef5bc",
    fontWeight: 600,
    padding: "8px 10px",
    cursor: "pointer",
  },
};
