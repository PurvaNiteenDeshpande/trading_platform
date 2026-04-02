import { useEffect, useState } from "react";
import { api } from "../api/client";
import OrderBook from "../components/OrderBook";
import TradeTable from "../components/TradeTable";

export default function Dashboard() {
  const [stocks, setStocks] = useState([]);
  const [selectedStock, setSelectedStock] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getStocks().then((data) => {
      const list = Array.isArray(data) ? data : [];
      setStocks(list);
      if (list.length > 0) setSelectedStock(list[0]);
      setLoading(false);
    });
  }, []);

  return (
    <div style={{ color: "white" }}>
      <h2 style={{ marginBottom: 20 }}>Market Dashboard</h2>

      {loading ? (
        <p style={{ color: "#888" }}>Loading market data...</p>
      ) : (
        <>
          {/* Stock Cards */}
          <div style={styles.grid}>
            {stocks.map((s) => (
              <div
                key={s.stock_id}
                onClick={() => setSelectedStock(s)}
                style={{
                  ...styles.card,
                  border: selectedStock?.stock_id === s.stock_id
                    ? "1px solid #00b36b"
                    : "1px solid #2a2a2a",
                }}
              >
                <div style={styles.symbol}>{s.symbol.replace(".NS", "")}</div>
                <div style={styles.company}>{s.company_name}</div>
                <div style={styles.price}>
                  {s.latest_price
                    ? `₹${Number(s.latest_price).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
                    : "—"}
                </div>
              </div>
            ))}
          </div>

          {/* Order Book + Trade Feed */}
          <div style={styles.bottom}>
            <div style={{ flex: 1 }}>
              <h3 style={{ color: "#aaa", fontSize: 14, marginBottom: 10 }}>
                Order Book — {selectedStock?.symbol?.replace(".NS", "") || ""}
              </h3>
              <OrderBook stockId={selectedStock?.stock_id} />
            </div>

            <div style={{ flex: 2 }}>
              <h3 style={{ color: "#aaa", fontSize: 14, marginBottom: 10 }}>
                Recent Trades
              </h3>
              <TradeTable />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const styles = {
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
    gap: 12,
    marginBottom: 30,
  },
  card: {
    background: "#1a1a1a",
    borderRadius: 10,
    padding: 16,
    cursor: "pointer",
    transition: "border 0.15s",
  },
  symbol: { color: "#00b36b", fontWeight: 700, fontSize: 16 },
  company: { color: "#888", fontSize: 12, marginTop: 4 },
  price: { color: "white", fontWeight: 600, fontSize: 18, marginTop: 10 },
  bottom: {
    display: "flex",
    gap: 20,
    alignItems: "flex-start",
  },
};
