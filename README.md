# 📈 Trading Platform (Full Stack)

A full-stack stock trading simulation platform built using **FastAPI, MySQL, and React (Vite)**.
It supports order placement, time matching, trade execution, and portfolio tracking.

---

## 🚀 Features

* 🛒 Place Buy/Sell Orders
* ⚡ Order Matching Engine (Price-Time Priority)
* 📊 Live Order Book
* 📉 Trade Execution Tracking
* 💼 Portfolio Management
* 👤 Investor Accounts
* 📡 REST API with FastAPI
* ⚛️ React Frontend (Vite)

---

## 🏗️ Tech Stack

### Backend

* Python (FastAPI)
* MySQL
* SQL (Triggers, Constraints)

### Frontend

* React (Vite)
* React Router
* Fetch API

---

## 📂 Project Structure

```
trading-platform/
│
├── backend/
│   ├── app/
│   │   ├── api/              # API routes
│   │   ├── core/             # Matching engine
│   │   ├── db/               # DB connection
│   │   ├── models/           # DB models (optional)
│   │   ├── schemas/          # Request/response schemas
│   │   └── main.py           # FastAPI entry point
│
├── database/
│   ├── schema.sql           # Tables
│   ├── constraints.sql      # Constraints
│   ├── triggers.sql         # DB triggers
│   ├── functions.sql        # Stored procedures
│   └── seed_data.sql        # Initial data
│
├── frontend/
│   ├── src/
│   │   ├── pages/           # Dashboard, Orders, Portfolio
│   │   ├── components/      # OrderBook, TradeTable, Navbar
│   │   ├── api/             # API client
│   │   ├── App.jsx          # Routing
│   │   └── main.jsx         # Entry point
│
└── README.md
```

---

## ⚙️ Setup Instructions

### 1️⃣ Clone the repository

```
git clone https://github.com/your-username/trading-platform.git
cd trading-platform
```

---

### 2️⃣ Setup Database (MySQL)

* Create database:

```
CREATE DATABASE trading_db;
```

* Run SQL files:

```
schema.sql
constraints.sql
triggers.sql
functions.sql
seed_data.sql
```

---

### 3️⃣ Backend Setup

```
cd backend
pip install -r requirements.txt
uvicorn backend.app.main:app --reload
```

Backend runs at:

```
http://127.0.0.1:8000
```

---

### 4️⃣ Frontend Setup (Vite)

```
cd frontend
npm install
npm run dev
```

Frontend runs at:

```
http://localhost:5173
```

---

## 🔌 API Endpoints

### Orders

* `POST /orders/place` → Place order

### Stocks

* `GET /stocks` → Get stock list

### Portfolio

* `GET /portfolio/{investor_id}` → Get holdings

### Trades

* `GET /trades` → Get executed trades

---

## ⚙️ Matching Engine Logic

* Price-Time Priority
* BUY matches lowest SELL price
* SELL matches highest BUY price
* Supports partial fills
* Updates order status:

  * OPEN
  * PARTIAL
  * FILLED

---

## 📸 Screens (Optional)

Add screenshots here later:

* Dashboard
* Order Book
* Portfolio

---

## 🚧 Future Improvements

* 🔄 WebSocket for real-time updates
* 🔐 Authentication (JWT)
* 📊 Charts (stock trends)
* 💳 Multiple Portfolios
* 📈 Advanced order types (limit, market, stop-loss)

---

## 👨‍💻 Author

* Purva Niteen Deshpande 

---

## ⭐ Contribute

Feel free to fork, improve, and submit PRs!

---
