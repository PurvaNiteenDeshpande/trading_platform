import { useEffect, useState } from "react";
import { api } from "../api/client";

export default function OrderBook({ stockId }) {
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!stockId) {
      setBook(null);
      return;
    }

    const loadBook = async () => {
      const data = await api.getOrderBook(stockId);
      setBook(data?.error ? null : data);
      setLoading(false);
    };

    setLoading(true);
    loadBook();

    const interval = setInterval(loadBook, 5000);
    return () => clearInterval(interval);
  }, [stockId]);

  if (!stockId) return (
    <div style={styles.empty}>Select a stock to see its order book</div>
  );

  if (loading) return <div style={styles.empty}>Loading...</div>;

  const buyLevels = Array.isArray(book?.buy_levels) ? book.buy_levels : [];
  const sellLevels = Array.isArray(book?.sell_levels) ? book.sell_levels : [];
  const recentTrades = Array.isArray(book?.recent_trades) ? book.recent_trades : [];

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>Live Order Book</h3>

      <div style={styles.summaryRow}>
        <div style={styles.summaryBox}>
          <div style={styles.label}>BUY Orders</div>
          <div style={{ ...styles.value, color: "#00b36b" }}>{book?.buy_order_count || 0}</div>
          <div style={styles.sub}>Open Qty: {book?.buy_open_qty || 0}</div>
        </div>
        <div style={styles.summaryBox}>
          <div style={styles.label}>SELL Orders</div>
          <div style={{ ...styles.value, color: "#ff4d4d" }}>{book?.sell_order_count || 0}</div>
          <div style={styles.sub}>Open Qty: {book?.sell_open_qty || 0}</div>
        </div>
      </div>

      <div style={styles.metaRow}>
        <span>Best Bid: {book?.best_bid ? `₹${Number(book.best_bid).toFixed(2)}` : "—"}</span>
        <span>Best Ask: {book?.best_ask ? `₹${Number(book.best_ask).toFixed(2)}` : "—"}</span>
        <span>Spread: {book?.spread ? `₹${Number(book.spread).toFixed(2)}` : "—"}</span>
      </div>

      <div style={styles.depthWrap}>
        <div style={styles.depthCol}>
          <div style={{ ...styles.depthTitle, color: "#00b36b" }}>Buy Depth</div>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Price</th>
                <th style={styles.th}>Qty</th>
                <th style={styles.th}>Orders</th>
              </tr>
            </thead>
            <tbody>
              {buyLevels.length === 0 ? (
                <tr><td style={styles.td} colSpan={3}>No open BUY orders</td></tr>
              ) : buyLevels.map((b, idx) => (
                <tr key={`b-${idx}`} style={styles.row}>
                  <td style={{ ...styles.td, color: "#00b36b" }}>₹{Number(b.price).toFixed(2)}</td>
                  <td style={styles.td}>{b.total_qty}</td>
                  <td style={styles.td}>{b.order_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={styles.depthCol}>
          <div style={{ ...styles.depthTitle, color: "#ff4d4d" }}>Sell Depth</div>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Price</th>
                <th style={styles.th}>Qty</th>
                <th style={styles.th}>Orders</th>
              </tr>
            </thead>
            <tbody>
              {sellLevels.length === 0 ? (
                <tr><td style={styles.td} colSpan={3}>No open SELL orders</td></tr>
              ) : sellLevels.map((s, idx) => (
                <tr key={`s-${idx}`} style={styles.row}>
                  <td style={{ ...styles.td, color: "#ff4d4d" }}>₹{Number(s.price).toFixed(2)}</td>
                  <td style={styles.td}>{s.total_qty}</td>
                  <td style={styles.td}>{s.order_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ ...styles.depthTitle, marginTop: 14 }}>Recent Trades (Stock)</div>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Time</th>
            <th style={styles.th}>Price (₹)</th>
            <th style={styles.th}>Quantity</th>
          </tr>
        </thead>
        <tbody>
          {recentTrades.length === 0 ? (
            <tr><td style={styles.td} colSpan={3}>No trades yet for this stock</td></tr>
          ) : recentTrades.map((t) => (
            <tr key={t.trade_id} style={styles.row}>
              <td style={styles.td}>{new Date(t.trade_time).toLocaleTimeString()}</td>
              <td style={{ ...styles.td, color: "#00b36b", fontWeight: 600 }}>₹{Number(t.trade_price).toFixed(2)}</td>
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
  summaryRow: { display: "flex", gap: 10, marginBottom: 10 },
  summaryBox: {
    flex: 1,
    border: "1px solid #2a2a2a",
    borderRadius: 8,
    padding: 10,
    background: "#131313",
  },
  label: { color: "#888", fontSize: 12 },
  value: { fontWeight: 700, fontSize: 20, marginTop: 2 },
  sub: { color: "#777", fontSize: 11, marginTop: 4 },
  metaRow: {
    display: "flex",
    justifyContent: "space-between",
    color: "#999",
    fontSize: 12,
    marginBottom: 10,
    borderBottom: "1px solid #242424",
    paddingBottom: 8,
  },
  depthWrap: { display: "flex", gap: 10, marginBottom: 10 },
  depthCol: { flex: 1 },
  depthTitle: { color: "#ccc", fontSize: 13, marginBottom: 8, fontWeight: 600 },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    color: "#888", fontSize: 12, padding: "6px 8px",
    textAlign: "left", borderBottom: "1px solid #2a2a2a"
  },
  td: { color: "#ccc", fontSize: 13, padding: "7px 8px" },
  row: { borderBottom: "1px solid #1f1f1f" },
  empty: { color: "#666", fontSize: 13, padding: 16 },
};
