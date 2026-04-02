import { useState, useEffect } from "react";
import { api } from "../api/client";

export default function Orders({ user }) {
  const [stocks, setStocks] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [form, setForm] = useState({
    stock_id: "",
    order_type: "BUY",
    quantity: "",
    price: "",
  });
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getStocks().then((data) => {
      const list = Array.isArray(data) ? data : [];
      setStocks(list);
      if (list.length > 0) {
        setForm((f) => ({
          ...f,
          stock_id: list[0].stock_id,
          price: list[0].latest_price || "",
        }));
      }
    });
    fetchMyOrders();
  }, []);

  const fetchMyOrders = () => {
    api.getOrders(user.investor_id).then((data) => {
      setMyOrders(Array.isArray(data) ? data : []);
    });
  };

  const handleStockChange = (e) => {
    const id = Number(e.target.value);
    const stock = stocks.find((s) => s.stock_id === id);
    setForm((f) => ({
      ...f,
      stock_id: id,
      price: stock?.latest_price || "",
    }));
  };

  const placeOrder = async () => {
    if (!form.stock_id || !form.quantity || !form.price) {
      return setMsg({ type: "error", text: "Please fill all fields" });
    }

    setLoading(true);
    setMsg(null);

    const res = await api.placeOrder({
      investor_id: user.investor_id,
      stock_id: Number(form.stock_id),
      order_type: form.order_type,
      quantity: Number(form.quantity),
      price: Number(form.price),
    });

    if (res.order_id) {
      setMsg({ type: "success", text: `Order #${res.order_id} placed successfully!` });
      setForm((f) => ({ ...f, quantity: "" }));
      fetchMyOrders();
    } else {
      setMsg({ type: "error", text: res.error || res.detail || "Order failed" });
    }

    setLoading(false);
  };

  const statusColor = (s) => ({
    OPEN: "#f0a500",
    PARTIAL: "#00aaff",
    FILLED: "#00b36b",
    CANCELLED: "#ff4d4d",
  }[s] || "#888");

  return (
    <div style={{ color: "white" }}>
      <h2 style={{ marginBottom: 20 }}>Place Order</h2>

      <div style={styles.layout}>
        {/* Order Form */}
        <div style={styles.form}>
          {/* BUY / SELL toggle */}
          <div style={styles.toggle}>
            {["BUY", "SELL"].map((t) => (
              <button
                key={t}
                onClick={() => setForm((f) => ({ ...f, order_type: t }))}
                style={{
                  ...styles.toggleBtn,
                  background: form.order_type === t
                    ? (t === "BUY" ? "#00b36b" : "#ff4d4d")
                    : "#2a2a2a",
                  color: "white",
                }}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Stock selector */}
          <label style={styles.label}>Stock</label>
          <select
            value={form.stock_id}
            onChange={handleStockChange}
            style={styles.input}
          >
            {stocks.map((s) => (
              <option key={s.stock_id} value={s.stock_id}>
                {s.symbol.replace(".NS", "")} — {s.company_name}
              </option>
            ))}
          </select>

          {/* Quantity */}
          <label style={styles.label}>Quantity</label>
          <input
            type="number"
            placeholder="e.g. 10"
            value={form.quantity}
            onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
            style={styles.input}
          />

          {/* Price */}
          <label style={styles.label}>Price (₹)</label>
          <input
            type="number"
            step="0.01"
            placeholder="e.g. 2500.00"
            value={form.price}
            onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
            style={styles.input}
          />

          {msg && (
            <div style={{
              padding: "8px 12px", borderRadius: 6, fontSize: 13, marginTop: 8,
              background: msg.type === "success" ? "#00b36b22" : "#ff4d4d22",
              color: msg.type === "success" ? "#00b36b" : "#ff4d4d",
              border: `1px solid ${msg.type === "success" ? "#00b36b44" : "#ff4d4d44"}`,
            }}>
              {msg.text}
            </div>
          )}

          <button
            onClick={placeOrder}
            disabled={loading}
            style={{
              ...styles.submitBtn,
              background: loading ? "#333"
                : form.order_type === "BUY" ? "#00b36b" : "#ff4d4d",
            }}
          >
            {loading ? "Placing..." : `Place ${form.order_type} Order`}
          </button>
        </div>

        {/* My Orders */}
        <div style={{ flex: 2 }}>
          <h3 style={{ color: "#aaa", fontSize: 15, marginBottom: 12 }}>My Orders</h3>
          {myOrders.length === 0 ? (
            <p style={{ color: "#666" }}>No orders placed yet</p>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  {["#", "Symbol", "Type", "Qty", "Exec", "Price", "Status", "Time"].map((h) => (
                    <th key={h} style={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {myOrders.map((o) => (
                  <tr key={o.order_id} style={styles.tr}>
                    <td style={styles.td}>{o.order_id}</td>
                    <td style={{ ...styles.td, color: "#00b36b", fontWeight: 600 }}>
                      {o.symbol?.replace(".NS", "")}
                    </td>
                    <td style={{
                      ...styles.td,
                      color: o.order_type === "BUY" ? "#00b36b" : "#ff4d4d"
                    }}>
                      {o.order_type}
                    </td>
                    <td style={styles.td}>{o.order_quantity}</td>
                    <td style={styles.td}>{o.executed_quantity}</td>
                    <td style={styles.td}>₹{Number(o.order_price).toFixed(2)}</td>
                    <td style={{ ...styles.td }}>
                      <span style={{
                        color: statusColor(o.order_status),
                        fontSize: 12, fontWeight: 600
                      }}>
                        {o.order_status}
                      </span>
                    </td>
                    <td style={{ ...styles.td, color: "#555", fontSize: 11 }}>
                      {new Date(o.order_time).toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  layout: { display: "flex", gap: 30, alignItems: "flex-start" },
  form: {
    background: "#1a1a1a", borderRadius: 10, padding: 24,
    border: "1px solid #2a2a2a", minWidth: 280, display: "flex",
    flexDirection: "column", gap: 8,
  },
  toggle: { display: "flex", gap: 8, marginBottom: 8 },
  toggleBtn: {
    flex: 1, padding: "10px 0", border: "none",
    borderRadius: 6, cursor: "pointer", fontWeight: 600, fontSize: 14,
  },
  label: { color: "#888", fontSize: 12 },
  input: {
    padding: "9px 12px", borderRadius: 6, border: "1px solid #333",
    background: "#111", color: "white", fontSize: 14, width: "100%",
    boxSizing: "border-box",
  },
  submitBtn: {
    padding: "11px 0", border: "none", borderRadius: 8,
    color: "white", fontSize: 15, fontWeight: 600,
    cursor: "pointer", marginTop: 8,
  },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    color: "#666", fontSize: 12, padding: "6px 10px",
    textAlign: "left", borderBottom: "1px solid #222",
  },
  td: { color: "#ccc", fontSize: 13, padding: "8px 10px" },
  tr: { borderBottom: "1px solid #1a1a1a" },
};
