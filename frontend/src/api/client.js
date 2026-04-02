const BASE_URL = import.meta.env.PROD ? "/api" : (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api");

async function request(url, options = {}) {
  try {
    const res = await fetch(`${BASE_URL}${url}`, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      if (!res.ok) throw new Error(text.substring(0, 80));
      throw new Error("Failed to parse JSON response");
    }

    if (!res.ok) {
      throw new Error(data.detail || data.error || "API Error");
    }

    return data;
  } catch (err) {
    console.error("API Error:", err.message);
    return { error: err.message };
  }
}

export const api = {
  // Stocks
  getStocks: () => request("/stocks"),

  // Orders
  placeOrder: (order) =>
    request("/orders/place", {
      method: "POST",
      body: JSON.stringify(order),
    }),
  getOrders: (investorId) => request(`/orders/${investorId}`),

  // Portfolio
  getPortfolio: (investorId) => request(`/portfolio/${investorId}`),

  // Trades
  getTrades: () => request("/trades"),
  getTradesByStock: (stockId) => request(`/trades/stock/${stockId}`),

  // Investors
  getInvestors: () => request("/investors"),
  getInvestor: (id) => request(`/investors/${id}`),
  createInvestor: (data) =>
    request("/investors", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// Login by investor_id (simple auth)
export async function login(investorId) {
  return request(`/investors/${investorId}/login`);
}