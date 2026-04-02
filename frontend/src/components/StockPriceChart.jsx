export default function StockPriceChart({ symbol, points }) {
  const series = Array.isArray(points) ? points : [];

  if (series.length < 2) {
    return (
      <div style={styles.empty}>
        Not enough historical prices to draw chart for {symbol || "selected stock"}.
      </div>
    );
  }

  const width = 760;
  const height = 220;
  const padX = 22;
  const padY = 18;
  const prices = series.map((p) => Number(p.price || 0));
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const range = Math.max(maxPrice - minPrice, 0.01);

  const xFor = (index) => {
    const usableWidth = width - padX * 2;
    return padX + (index / (series.length - 1)) * usableWidth;
  };

  const yFor = (price) => {
    const usableHeight = height - padY * 2;
    return padY + (1 - (price - minPrice) / range) * usableHeight;
  };

  const path = series
    .map((point, index) => `${index === 0 ? "M" : "L"}${xFor(index).toFixed(2)},${yFor(Number(point.price || 0)).toFixed(2)}`)
    .join(" ");

  const startPrice = Number(series[0].price || 0);
  const endPrice = Number(series[series.length - 1].price || 0);
  const delta = endPrice - startPrice;
  const deltaPct = startPrice ? (delta / startPrice) * 100 : 0;
  const isUp = delta >= 0;

  return (
    <div style={styles.wrap}>
      <div style={styles.head}>
        <div style={styles.title}>{symbol} Price Movement</div>
        <div style={{ ...styles.delta, color: isUp ? "#00b36b" : "#ff4d4d" }}>
          {isUp ? "+" : ""}₹{delta.toFixed(2)} ({deltaPct.toFixed(2)}%)
        </div>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} style={styles.svg}>
        <line x1={padX} y1={padY} x2={padX} y2={height - padY} stroke="#242424" strokeWidth="1" />
        <line x1={padX} y1={height - padY} x2={width - padX} y2={height - padY} stroke="#242424" strokeWidth="1" />

        <path d={path} fill="none" stroke={isUp ? "#00b36b" : "#ff4d4d"} strokeWidth="2.5" strokeLinecap="round" />

        <circle
          cx={xFor(series.length - 1)}
          cy={yFor(endPrice)}
          r="3.5"
          fill={isUp ? "#00b36b" : "#ff4d4d"}
        />
      </svg>

      <div style={styles.meta}>
        <span>Low: ₹{minPrice.toFixed(2)}</span>
        <span>High: ₹{maxPrice.toFixed(2)}</span>
      </div>
    </div>
  );
}

const styles = {
  wrap: {
    background: "#1a1a1a",
    border: "1px solid #2a2a2a",
    borderRadius: 10,
    padding: 14,
    marginBottom: 20,
  },
  head: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  title: { color: "#fff", fontSize: 14, fontWeight: 600 },
  delta: { fontSize: 13, fontWeight: 600 },
  svg: { width: "100%", height: 220, background: "#131313", borderRadius: 8 },
  meta: {
    marginTop: 8,
    display: "flex",
    justifyContent: "space-between",
    color: "#888",
    fontSize: 12,
  },
  empty: {
    background: "#1a1a1a",
    border: "1px solid #2a2a2a",
    borderRadius: 10,
    padding: 16,
    color: "#888",
    marginBottom: 20,
    fontSize: 13,
  },
};
