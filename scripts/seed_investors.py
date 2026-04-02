import mysql.connector

conn = mysql.connector.connect(
    host="127.0.0.1",
    user="root",
    password="YOUR_PASSWORD",
    database="trading_db"
)

cursor = conn.cursor()

investors = [
    ("Purva Deshpande", "purva@example.com", "9876543210", 500000.00),
    ("Rahul Mehta",     "rahul@example.com", "9123456789", 250000.00),
    ("Ananya Shah",     "ananya@example.com","9000011111", 750000.00),
    ("Vikram Joshi",    "vikram@example.com","9812345678", 100000.00),
    ("Sneha Patil",     "sneha@example.com", "9988776655", 300000.00),
]

for name, email, phone, balance in investors:
    cursor.execute("""
        INSERT IGNORE INTO investors (name, email, phone, account_balance)
        VALUES (%s, %s, %s, %s)
    """, (name, email, phone, balance))

conn.commit()

# auto-create a portfolio for each investor
cursor.execute("SELECT investor_id FROM investors")
investor_ids = cursor.fetchall()

for (inv_id,) in investor_ids:
    cursor.execute("""
        INSERT IGNORE INTO portfolio (investor_id) VALUES (%s)
    """, (inv_id,))

conn.commit()

print(f"Seeded {len(investors)} investors + portfolios")

cursor.close()
conn.close()
