import { useEffect, useState } from "react";
import { api } from "../api/client";

export default function Portfolio({ user }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadSummary = () => {
    setLoading(true);
    api.getPortfolioSummary(user.investor_id).then((data) => {
      if (!data?.error) {
        setSummary(data);

        if (data?.investor) {
          localStorage.setItem("user", JSON.stringify(data.investor));
        }
      }
      setLoading(false);
    });
  };

  useEffect(() => {
    loadSummary();

    const interval = setInterval(loadSummary, 15000);
    return () => clearInterval(interval);
  }, [user.investor_id]);

  const holdings = Array.isArray(summary?.holdings) ? summary.holdings : [];
  const investor = summary?.investor;
  const positiveDaily = Number(summary?.total_daily_pnl || 0) >= 0;
  const positiveUnrealized = Number(summary?.total_unrealized_pnl || 0) >= 0;

  if (loading) return <div style={{ color: "#888" }}>Loading portfolio...</div>;

  return (
    <div style={{ color: "white" }}>
      <div style={styles.headRow}>
        <h2 style={{ marginBottom: 20 }}>Portfolio</h2>
        <button style={styles.refreshBtn} onClick={loadSummary}>Refresh</button>
      </div>

      {/* Summary Cards */}
      <div style={styles.cardRow}>
        <div style={styles.card}>
          <div style={styles.cardLabel}>Wallet Cash</div>
          <div style={styles.cardValue}>
            ₹{Number(investor?.account_balance || 0).toLocaleString("en-IN", {
              minimumFractionDigits: 2,
            })}
          </div>
        </div>
        <div style={styles.card}>
          <div style={styles.cardLabel}>Holdings Value</div>
          <div style={{ ...styles.cardValue, color: "#00b36b" }}>
            ₹{Number(summary?.total_holdings_value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div style={styles.card}>
          <div style={styles.cardLabel}>Total Equity</div>
          <div style={styles.cardValue}>
            ₹{Number(summary?.total_equity || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div style={styles.card}>
          <div style={styles.cardLabel}>Unrealized P/L</div>
          <div style={{ ...styles.cardValue, fontSize: 18, color: positiveUnrealized ? "#00b36b" : "#ff4d4d" }}>
            {positiveUnrealized ? "+" : ""}
            ₹{Number(summary?.total_unrealized_pnl || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      <div style={{ ...styles.pnlBar, color: positiveDaily ? "#00b36b" : "#ff4d4d" }}>
        Daily P/L: {positiveDaily ? "+" : ""}₹
        {Number(summary?.total_daily_pnl || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
      </div>

      {/* Holdings Table */}
      <h3 style={{ color: "#aaa", fontSize: 15, marginBottom: 12 }}>Holdings</h3>

      {holdings.length === 0 ? (
        <div style={styles.empty}>
          No holdings yet. Place a BUY order to get started.
        </div>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              {["Symbol", "Company", "Qty", "Avg Price (₹)", "Current (₹)", "Value (₹)", "Unrealized P/L", "Daily P/L"].map((h) => (
                <th key={h} style={styles.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {holdings.map((h, i) => {
              const positiveRow = Number(h.unrealized_pnl || 0) >= 0;
              const positiveDay = Number(h.daily_pnl || 0) >= 0;
              return (
                <tr key={i} style={styles.tr}>
                  <td style={{ ...styles.td, color: "#00b36b", fontWeight: 600 }}>
                    {h.symbol?.replace(".NS", "")}
                  </td>
                  <td style={styles.td}>{h.company_name}</td>
                  <td style={styles.td}>{h.stock_quantity}</td>
                  <td style={styles.td}>
                    ₹{Number(h.avg_buy_price || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                  <td style={styles.td}>₹{Number(h.current_price || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                  <td style={{ ...styles.td, color: "#fff", fontWeight: 600 }}>
                    ₹{Number(h.market_value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ ...styles.td, color: positiveRow ? "#00b36b" : "#ff4d4d" }}>
                    {positiveRow ? "+" : ""}
                    ₹{Number(h.unrealized_pnl || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ ...styles.td, color: positiveDay ? "#00b36b" : "#ff4d4d" }}>
                    {positiveDay ? "+" : ""}
                    ₹{Number(h.daily_pnl || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

const styles = {
  headRow: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  refreshBtn: {
    background: "#222",
    color: "#ddd",
    border: "1px solid #333",
    borderRadius: 6,
    padding: "7px 12px",
    cursor: "pointer",
    marginBottom: 16,
  },
  cardRow: { display: "flex", gap: 16, marginBottom: 30, flexWrap: "wrap" },
  card: {
    background: "#1a1a1a", borderRadius: 10, padding: "16px 24px",
    border: "1px solid #2a2a2a", minWidth: 160,
  },
  cardLabel: { color: "#888", fontSize: 12, marginBottom: 6 },
  cardValue: { color: "white", fontWeight: 700, fontSize: 22 },
  pnlBar: {
    background: "#1a1a1a",
    border: "1px solid #2a2a2a",
    borderRadius: 8,
    padding: "10px 14px",
    marginBottom: 20,
    fontWeight: 600,
  },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    color: "#666", fontSize: 12, padding: "6px 12px",
    textAlign: "left", borderBottom: "1px solid #222",
  },
  td: { color: "#ccc", fontSize: 13, padding: "10px 12px" },
  tr: { borderBottom: "1px solid #1a1a1a" },
  empty: {
    background: "#1a1a1a", borderRadius: 10, padding: 24,
    color: "#666", border: "1px solid #2a2a2a",
  },
};
