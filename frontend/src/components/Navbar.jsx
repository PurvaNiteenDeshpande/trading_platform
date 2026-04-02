import { useNavigate, useLocation } from "react-router-dom";

export default function Navbar({ setUser, user }) {
  const navigate = useNavigate();
  const location = useLocation();

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
      borderBottom: "1px solid #222"
    }}>
      <span style={{ color: "#00b36b", fontWeight: 600, fontSize: 18, marginRight: 16 }}>
        📈 TradePlatform
      </span>

      <button style={navStyle("/")} onClick={() => navigate("/")}>Dashboard</button>
      <button style={navStyle("/orders")} onClick={() => navigate("/orders")}>Orders</button>
      <button style={navStyle("/portfolio")} onClick={() => navigate("/portfolio")}>Portfolio</button>

      <span style={{ color: "#7ef5bc", marginLeft: 6, fontSize: 13, fontWeight: 600 }}>
        Wallet: ₹{Number(user?.account_balance || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
      </span>

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
