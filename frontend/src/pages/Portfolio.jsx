import { useEffect, useState } from "react";
import { api } from "../api/client";

export default function Portfolio({ user }) {
  const [holdings, setHoldings] = useState([]);
  const [investor, setInvestor] = useState(null);
  const [stocks, setStocks] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getPortfolio(user.investor_id),
      api.getInvestor(user.investor_id),
      api.getStocks(),
    ]).then(([portfolio, inv, stockList]) => {
      setHoldings(Array.isArray(portfolio) ? portfolio : []);
      setInvestor(inv);

      // build price map
      const priceMap = {};
      if (Array.isArray(stockList)) {
        stockList.forEach((s) => {
          priceMap[s.symbol] = Number(s.latest_price) || 0;
        });
      }
      setStocks(priceMap);
      setLoading(false);
    });
  }, [user.investor_id]);

  const totalValue = holdings.reduce((sum, h) => {
    const price = stocks[h.symbol] || 0;
    return sum + price * h.stock_quantity;
  }, 0);

  if (loading) return <div style={{ color: "#888" }}>Loading portfolio...</div>;

  return (
    <div style={{ color: "white" }}>
      <h2 style={{ marginBottom: 20 }}>Portfolio</h2>

      {/* Summary Cards */}
      <div style={styles.cardRow}>
        <div style={styles.card}>
          <div style={styles.cardLabel}>Account Balance</div>
          <div style={styles.cardValue}>
            ₹{Number(investor?.account_balance || 0).toLocaleString("en-IN", {
              minimumFractionDigits: 2,
            })}
          </div>
        </div>
        <div style={styles.card}>
          <div style={styles.cardLabel}>Holdings Value</div>
          <div style={{ ...styles.cardValue, color: "#00b36b" }}>
            ₹{totalValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div style={styles.card}>
          <div style={styles.cardLabel}>Total Stocks</div>
          <div style={styles.cardValue}>{holdings.length}</div>
        </div>
        <div style={styles.card}>
          <div style={styles.cardLabel}>Investor</div>
          <div style={{ ...styles.cardValue, fontSize: 16 }}>{investor?.name}</div>
        </div>
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
              {["Symbol", "Company", "Qty", "Avg Price (₹)", "Current (₹)", "Value (₹)", "P&L"].map((h) => (
                <th key={h} style={styles.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {holdings.map((h, i) => {
              const currentPrice = stocks[h.symbol] || 0;
              const value = currentPrice * h.stock_quantity;
              return (
                <tr key={i} style={styles.tr}>
                  <td style={{ ...styles.td, color: "#00b36b", fontWeight: 600 }}>
                    {h.symbol?.replace(".NS", "")}
                  </td>
                  <td style={styles.td}>{h.company_name}</td>
                  <td style={styles.td}>{h.stock_quantity}</td>
                  <td style={styles.td}>—</td>
                  <td style={styles.td}>
                    {currentPrice > 0
                      ? `₹${currentPrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
                      : "—"}
                  </td>
                  <td style={{ ...styles.td, color: "#fff", fontWeight: 600 }}>
                    {value > 0
                      ? `₹${value.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
                      : "—"}
                  </td>
                  <td style={{ ...styles.td, color: "#888" }}>—</td>
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
  cardRow: { display: "flex", gap: 16, marginBottom: 30, flexWrap: "wrap" },
  card: {
    background: "#1a1a1a", borderRadius: 10, padding: "16px 24px",
    border: "1px solid #2a2a2a", minWidth: 160,
  },
  cardLabel: { color: "#888", fontSize: 12, marginBottom: 6 },
  cardValue: { color: "white", fontWeight: 700, fontSize: 22 },
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
