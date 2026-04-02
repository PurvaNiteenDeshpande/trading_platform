from backend.app.db.session import get_connection


def get_portfolio(cursor, investor_id):
    cursor.execute("SELECT portfolio_id FROM portfolio WHERE investor_id=%s", (investor_id,))
    return cursor.fetchone()[0]


def update_balance(cursor, investor_id, amount):
    cursor.execute("""
        UPDATE investors
        SET account_balance = account_balance + %s
        WHERE investor_id=%s
    """, (amount, investor_id))


def update_holding(cursor, portfolio_id, stock_id, qty):
    cursor.execute("""
        SELECT stock_quantity FROM holdings
        WHERE portfolio_id=%s AND stock_id=%s
    """, (portfolio_id, stock_id))

    row = cursor.fetchone()

    if row:
        cursor.execute("""
            UPDATE holdings
            SET stock_quantity = stock_quantity + %s
            WHERE portfolio_id=%s AND stock_id=%s
        """, (qty, portfolio_id, stock_id))
    else:
        cursor.execute("""
            INSERT INTO holdings (portfolio_id, stock_id, stock_quantity)
            VALUES (%s, %s, %s)
        """, (portfolio_id, stock_id, qty))


def match_order(order_id):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("SELECT * FROM orders WHERE order_id=%s", (order_id,))
        order = cursor.fetchone()

        remaining = order["order_quantity"] - order["executed_quantity"]

        if remaining <= 0:
            return

        buyer_portfolio = get_portfolio(cursor, order["investor_id"])

        if order["order_type"] == "BUY":
            cursor.execute("""
                SELECT * FROM orders
                WHERE stock_id=%s
                AND order_type='SELL'
                AND order_price<=%s
                AND order_status IN ('OPEN','PARTIAL')
                ORDER BY order_price ASC
            """, (order["stock_id"], order["order_price"]))
        else:
            cursor.execute("""
                SELECT * FROM orders
                WHERE stock_id=%s
                AND order_type='BUY'
                AND order_price>=%s
                AND order_status IN ('OPEN','PARTIAL')
                ORDER BY order_price DESC
            """, (order["stock_id"], order["order_price"]))

        matches = cursor.fetchall()

        for m in matches:
            if remaining <= 0:
                break

            m_remaining = m["order_quantity"] - m["executed_quantity"]
            trade_qty = min(remaining, m_remaining)
            trade_value = trade_qty * m["order_price"]

            seller_portfolio = get_portfolio(cursor, m["investor_id"])

            cursor.execute("""
                INSERT INTO trades
                (stock_id, buy_order_id, sell_order_id, trade_price, trade_quantity)
                VALUES (%s,%s,%s,%s,%s)
            """, (
                order["stock_id"],
                order["order_id"] if order["order_type"]=="BUY" else m["order_id"],
                m["order_id"] if order["order_type"]=="BUY" else order["order_id"],
                m["order_price"],
                trade_qty
            ))

            if order["order_type"] == "BUY":
                update_balance(cursor, order["investor_id"], -trade_value)
                update_balance(cursor, m["investor_id"], trade_value)

                update_holding(cursor, buyer_portfolio, order["stock_id"], trade_qty)
                update_holding(cursor, seller_portfolio, order["stock_id"], -trade_qty)
            else:
                update_balance(cursor, order["investor_id"], trade_value)
                update_balance(cursor, m["investor_id"], -trade_value)

                update_holding(cursor, seller_portfolio, order["stock_id"], -trade_qty)
                update_holding(cursor, buyer_portfolio, order["stock_id"], trade_qty)

            cursor.execute("""
                UPDATE orders
                SET executed_quantity = executed_quantity + %s
                WHERE order_id=%s
            """, (trade_qty, order["order_id"]))

            cursor.execute("""
                UPDATE orders
                SET executed_quantity = executed_quantity + %s
                WHERE order_id=%s
            """, (trade_qty, m["order_id"]))

            remaining -= trade_qty

        cursor.execute("""
            UPDATE orders
            SET order_status =
            CASE
                WHEN executed_quantity = order_quantity THEN 'FILLED'
                ELSE 'PARTIAL'
            END
            WHERE order_id=%s
        """, (order_id,))

        conn.commit()

    except Exception as e:
        conn.rollback()
        print("MATCH ERROR:", e)

    finally:
        cursor.close()
        conn.close()