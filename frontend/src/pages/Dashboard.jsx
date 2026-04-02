import { useEffect, useState } from "react";
import { api } from "../api/client";
import OrderBook from "../components/OrderBook";
import TradeTable from "../components/TradeTable";
import StockPriceChart from "../components/StockPriceChart";

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

export default function Dashboard({ user }) {
  const [stocks, setStocks] = useState([]);
  const [selectedStock, setSelectedStock] = useState(null);
  const [walletCash, setWalletCash] = useState(Number(user?.account_balance || 0));
  const [historyPoints, setHistoryPoints] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [placing, setPlacing] = useState(false);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const activeUser = user || getStoredUser();

  const loadStocks = () => {
    api.getStocks().then((data) => {
      const list = Array.isArray(data) ? data : [];
      setStocks(list);

      if (list.length > 0) {
        setSelectedStock((prev) => {
          if (!prev) return list[0];
          const refreshed = list.find((s) => s.stock_id === prev.stock_id);
          return refreshed || list[0];
        });
      }

      setLoading(false);
    });
  };

  useEffect(() => {
    loadStocks();

    if (activeUser?.investor_id) {
      api.getInvestor(activeUser.investor_id).then((data) => {
        if (data?.investor_id) {
          setWalletCash(Number(data.account_balance || 0));
          localStorage.setItem("user", JSON.stringify(data));
        }
      });
    }

    const interval = setInterval(loadStocks, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!selectedStock?.stock_id) {
      setHistoryPoints([]);
      return;
    }

    setHistoryLoading(true);
    api.getStockHistory(selectedStock.stock_id, 40).then((res) => {
      setHistoryPoints(Array.isArray(res?.points) ? res.points : []);
      setHistoryLoading(false);
    });
  }, [selectedStock?.stock_id]);

  const placeQuickOrder = async (orderType) => {
    if (!activeUser?.investor_id) {
      setMessage({ type: "error", text: "Please log in again." });
      return;
    }

    if (!selectedStock?.stock_id) {
      setMessage({ type: "error", text: "Please select a stock." });
      return;
    }

    if (!quantity || Number(quantity) <= 0) {
      setMessage({ type: "error", text: "Quantity must be greater than 0." });
      return;
    }

    const price = Number(selectedStock.latest_price || 0);
    if (price <= 0) {
      setMessage({ type: "error", text: "Live price unavailable for this stock." });
      return;
    }

    setPlacing(true);
    setMessage(null);

    const res = await api.placeOrder({
      investor_id: activeUser.investor_id,
      stock_id: Number(selectedStock.stock_id),
      order_type: orderType,
      quantity: Number(quantity),
      price,
    });

    if (res?.order_id) {
      setMessage({ type: "success", text: `${orderType} order #${res.order_id} placed.` });
      loadStocks();

      api.getInvestor(activeUser.investor_id).then((data) => {
        if (data?.investor_id) {
          setWalletCash(Number(data.account_balance || 0));
          localStorage.setItem("user", JSON.stringify(data));
        }
      });
    } else {
      setMessage({ type: "error", text: res?.error || res?.detail || "Order failed." });
    }

    setPlacing(false);
  };

  return (
    <div style={{ color: "white" }}>
      <h2 style={{ marginBottom: 20 }}>Market Dashboard</h2>
      <div style={styles.walletBar}>
        Wallet Cash: ₹{Number(walletCash || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
      </div>

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
                <div
                  style={{
                    ...styles.dayChange,
                    color: Number(s.daily_change) >= 0 ? "#00b36b" : "#ff4d4d",
                  }}
                >
                  {Number(s.daily_change) >= 0 ? "+" : ""}
                  ₹{Number(s.daily_change || 0).toFixed(2)} ({Number(s.daily_change_pct || 0).toFixed(2)}%)
                </div>
              </div>
            ))}
          </div>

          <div style={styles.tradePanel}>
            <div>
              <div style={styles.tradeTitle}>
                Quick Trade — {selectedStock?.symbol?.replace(".NS", "") || "Select a stock"}
              </div>
              <div style={styles.tradeSub}>
                Live Price: ₹{Number(selectedStock?.latest_price || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
            </div>

            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              style={styles.qtyInput}
            />

            <button
              disabled={placing}
              onClick={() => placeQuickOrder("BUY")}
              style={{ ...styles.buyBtn, opacity: placing ? 0.7 : 1 }}
            >
              Buy
            </button>
            <button
              disabled={placing}
              onClick={() => placeQuickOrder("SELL")}
              style={{ ...styles.sellBtn, opacity: placing ? 0.7 : 1 }}
            >
              Sell
            </button>
          </div>

          {message && (
            <div
              style={{
                marginTop: 10,
                fontSize: 13,
                color: message.type === "success" ? "#00b36b" : "#ff4d4d",
              }}
            >
              {message.text}
            </div>
          )}

          {historyLoading ? (
            <p style={{ color: "#888", marginBottom: 20 }}>Loading price chart...</p>
          ) : (
            <StockPriceChart
              symbol={selectedStock?.symbol?.replace(".NS", "")}
              points={historyPoints}
            />
          )}

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
                Recent Trades & My Orders
              </h3>
              <TradeTable userId={activeUser?.investor_id} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const styles = {
  walletBar: {
    background: "#122b21",
    border: "1px solid #214735",
    color: "#7ef5bc",
    borderRadius: 8,
    padding: "10px 14px",
    marginBottom: 18,
    fontWeight: 600,
    width: "fit-content",
  },
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
  dayChange: { fontSize: 12, marginTop: 6, fontWeight: 600 },
  tradePanel: {
    background: "#1a1a1a",
    border: "1px solid #2a2a2a",
    borderRadius: 10,
    padding: 14,
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 20,
  },
  tradeTitle: { color: "#fff", fontSize: 14, fontWeight: 600 },
  tradeSub: { color: "#888", fontSize: 12, marginTop: 2 },
  qtyInput: {
    marginLeft: "auto",
    width: 90,
    borderRadius: 6,
    border: "1px solid #333",
    background: "#111",
    color: "white",
    padding: "8px 10px",
  },
  buyBtn: {
    background: "#00b36b",
    color: "white",
    border: "none",
    borderRadius: 6,
    padding: "8px 14px",
    cursor: "pointer",
    fontWeight: 600,
  },
  sellBtn: {
    background: "#ff4d4d",
    color: "white",
    border: "none",
    borderRadius: 6,
    padding: "8px 14px",
    cursor: "pointer",
    fontWeight: 600,
  },
  bottom: {
    display: "flex",
    gap: 20,
    alignItems: "flex-start",
  },
};
