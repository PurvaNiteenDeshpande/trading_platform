import { useEffect, useState } from "react";
import { api } from "../api/client";

export default function OrderBook({ stockId }) {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!stockId) return;
    setLoading(true);
    api.getTradesByStock(stockId).then((data) => {
      setTrades(Array.isArray(data) ? data : []);
      setLoading(false);
    });
  }, [stockId]);

  if (!stockId) return (
    <div style={styles.empty}>Select a stock to see its order book</div>
  );

  if (loading) return <div style={styles.empty}>Loading...</div>;

  if (trades.length === 0) return (
    <div style={styles.empty}>No trades yet for this stock</div>
  );

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>Recent Trades</h3>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Time</th>
            <th style={styles.th}>Price (₹)</th>
            <th style={styles.th}>Quantity</th>
          </tr>
        </thead>
        <tbody>
          {trades.slice(0, 20).map((t) => (
            <tr key={t.trade_id} style={styles.row}>
              <td style={styles.td}>
                {new Date(t.trade_time).toLocaleTimeString()}
              </td>
              <td style={{ ...styles.td, color: "#00b36b", fontWeight: 600 }}>
                ₹{Number(t.trade_price).toFixed(2)}
              </td>
              <td style={styles.td}>{t.trade_quantity}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const styles = {
  container: {
    background: "#1a1a1a",
    borderRadius: 10,
    padding: 16,
    border: "1px solid #2a2a2a",
  },
  title: { color: "white", marginBottom: 12, fontSize: 15 },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    color: "#888", fontSize: 12, padding: "6px 8px",
    textAlign: "left", borderBottom: "1px solid #2a2a2a"
  },
  td: { color: "#ccc", fontSize: 13, padding: "7px 8px" },
  row: { borderBottom: "1px solid #1f1f1f" },
  empty: { color: "#666", fontSize: 13, padding: 16 },
};
