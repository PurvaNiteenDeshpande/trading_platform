import yfinance as yf
import mysql.connector

# ✅ CONNECT
conn = mysql.connector.connect(
    host="127.0.0.1",
    user="root",
    password="PASSWORD",
    database="trading_db"
)

cursor = conn.cursor()

# ✅ STOCKS
stocks = [
    ("RELIANCE.NS", "Reliance"),
    ("TCS.NS", "TCS"),
    ("INFY.NS", "Infosys"),
    ("HDFCBANK.NS", "HDFC Bank"),
    ("ICICIBANK.NS", "ICICI Bank"),
    ("SBIN.NS", "SBI"),
    ("LT.NS", "L&T")
]

# ✅ INSERT STOCKS
for symbol, name in stocks:
    cursor.execute("""
        INSERT IGNORE INTO stocks (symbol, company_name)
        VALUES (%s, %s)
    """, (symbol, name))

conn.commit()

# ✅ CREATE SYMBOL → ID MAP
cursor.execute("SELECT stock_id, symbol FROM stocks")
rows = cursor.fetchall()

symbol_to_id = {symbol: stock_id for stock_id, symbol in rows}

# ✅ FETCH & INSERT PRICES
for symbol, _ in stocks:
    print(f"Fetching {symbol}...")

    data = yf.download(symbol, period="1d", interval="1m", progress=False)

    if data.empty:
        print(f"No data for {symbol}")
        continue

    stock_id = symbol_to_id[symbol]

    for index, row in data.iterrows():
        cursor.execute("""
            INSERT INTO stock_prices (stock_id, price, volume, recorded_at)
            VALUES (%s, %s, %s, %s)
        """, (
            stock_id,
            float(row["Close"]),
            int(row["Volume"]),
            index.to_pydatetime()
        ))

# ✅ COMMIT
conn.commit()

print("✅ Data inserted successfully!")

cursor.close()
conn.close()