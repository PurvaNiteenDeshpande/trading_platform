import { useEffect, useState } from "react";
import { api } from "../api/client";

export default function TradeTable({ userId }) {
  const [trades, setTrades] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const [tradeData, orderData] = await Promise.all([
        api.getTrades(),
        userId ? api.getOrders(userId) : Promise.resolve([]),
      ]);

      setTrades(Array.isArray(tradeData) ? tradeData : []);
      setMyOrders(Array.isArray(orderData) ? orderData.slice(0, 5) : []);
      setLoading(false);
    };

    loadData();

    // auto-refresh every 10 seconds
    const interval = setInterval(() => {
      loadData();
    }, 10000);

    return () => clearInterval(interval);
  }, [userId]);

  if (loading) return <div style={styles.empty}>Loading trades...</div>;
  if (trades.length === 0) return <div style={styles.empty}>No trades yet</div>;

  return (
    <div style={styles.grid}>
      <div style={styles.container}>
        <div style={styles.header}>
          <h3 style={styles.title}>Live Trade Feed</h3>
          <span style={styles.badge}>{trades.length} trades</span>
        </div>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>#</th>
              <th style={styles.th}>Symbol</th>
              <th style={styles.th}>Price (₹)</th>
              <th style={styles.th}>Qty</th>
              <th style={styles.th}>Value (₹)</th>
              <th style={styles.th}>Time</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((t) => (
              <tr key={t.trade_id} style={styles.row}>
                <td style={{ ...styles.td, color: "#555" }}>{t.trade_id}</td>
                <td style={{ ...styles.td, color: "#00b36b", fontWeight: 600 }}>
                  {t.symbol}
                </td>
                <td style={{ ...styles.td, color: "#fff" }}>
                  ₹{Number(t.trade_price).toFixed(2)}
                </td>
                <td style={styles.td}>{t.trade_quantity}</td>
                <td style={{ ...styles.td, color: "#aaa" }}>
                  ₹{(Number(t.trade_price) * t.trade_quantity).toLocaleString("en-IN")}
                </td>
                <td style={{ ...styles.td, color: "#666", fontSize: 12 }}>
                  {new Date(t.trade_time).toLocaleString("en-IN")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={styles.container}>
        <div style={styles.header}>
          <h3 style={styles.title}>My Last 5 Orders</h3>
          <span style={styles.badge}>{myOrders.length}</span>
        </div>

        {myOrders.length === 0 ? (
          <div style={styles.empty}>No recent orders</div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>#</th>
                <th style={styles.th}>Symbol</th>
                <th style={styles.th}>Type</th>
                <th style={styles.th}>Qty</th>
                <th style={styles.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {myOrders.map((o) => (
                <tr key={o.order_id} style={styles.row}>
                  <td style={{ ...styles.td, color: "#555" }}>{o.order_id}</td>
                  <td style={{ ...styles.td, color: "#00b36b", fontWeight: 600 }}>{o.symbol}</td>
                  <td style={{ ...styles.td, color: o.order_type === "BUY" ? "#00b36b" : "#ff4d4d" }}>
                    {o.order_type}
                  </td>
                  <td style={styles.td}>{o.executed_quantity}/{o.order_quantity}</td>
                  <td style={styles.td}>{o.order_status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const styles = {
  grid: { display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14 },
  container: {
    background: "#1a1a1a",
    borderRadius: 10,
    padding: 16,
    border: "1px solid #2a2a2a",
  },
  header: { display: "flex", alignItems: "center", gap: 10, marginBottom: 12 },
  title: { color: "white", fontSize: 15, margin: 0 },
  badge: {
    background: "#00b36b22", color: "#00b36b",
    fontSize: 12, padding: "2px 8px", borderRadius: 20,
  },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    color: "#888", fontSize: 12, padding: "6px 10px",
    textAlign: "left", borderBottom: "1px solid #2a2a2a"
  },
  td: { color: "#ccc", fontSize: 13, padding: "8px 10px" },
  row: { borderBottom: "1px solid #1f1f1f" },
  empty: { color: "#666", fontSize: 13, padding: 16 },
};
