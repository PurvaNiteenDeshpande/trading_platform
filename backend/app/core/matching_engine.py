from backend.app.db.session import get_connection


def get_portfolio(cursor, investor_id):
    cursor.execute("SELECT portfolio_id FROM portfolio WHERE investor_id=%s", (investor_id,))
    row = cursor.fetchone()
    if not row:
        raise ValueError(f"Portfolio not found for investor_id={investor_id}")

    if isinstance(row, dict):
        return row.get("portfolio_id")
    return row[0]


def update_order_status(cursor, order_id):
    cursor.execute(
        """
        UPDATE orders
        SET order_status = CASE
            WHEN executed_quantity >= order_quantity THEN 'FILLED'
            WHEN executed_quantity > 0 THEN 'PARTIAL'
            ELSE 'OPEN'
        END
        WHERE order_id=%s
        """,
        (order_id,),
    )


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
        current_qty = row["stock_quantity"] if isinstance(row, dict) else row[0]
        new_qty = current_qty + qty

        if new_qty < 0:
            raise ValueError("Insufficient holdings to settle trade")

        cursor.execute("""
            UPDATE holdings
            SET stock_quantity = stock_quantity + %s
            WHERE portfolio_id=%s AND stock_id=%s
        """, (qty, portfolio_id, stock_id))
    else:
        if qty < 0:
            raise ValueError("Cannot reduce holdings below zero")

        cursor.execute("""
            INSERT INTO holdings (portfolio_id, stock_id, stock_quantity)
            VALUES (%s, %s, %s)
        """, (portfolio_id, stock_id, qty))


def match_order(order_id):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    trades_created = 0

    try:
        cursor.execute("SELECT * FROM orders WHERE order_id=%s", (order_id,))
        order = cursor.fetchone()

        if not order:
            return {"trades_created": 0}

        remaining = order["order_quantity"] - order["executed_quantity"]

        if remaining <= 0:
            return {"trades_created": 0}

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

            # Avoid self matching the same investor's opposite order.
            if m["investor_id"] == order["investor_id"]:
                continue

            m_remaining = m["order_quantity"] - m["executed_quantity"]
            if m_remaining <= 0:
                continue

            trade_qty = min(remaining, m_remaining)

            if order["order_type"] == "BUY":
                buy_order = order
                sell_order = m
            else:
                buy_order = m
                sell_order = order

            buy_portfolio = get_portfolio(cursor, buy_order["investor_id"])
            sell_portfolio = get_portfolio(cursor, sell_order["investor_id"])

            trade_price = float(sell_order["order_price"])
            trade_value = trade_qty * trade_price

            cursor.execute("""
                INSERT INTO trades
                (stock_id, buy_order_id, sell_order_id, trade_price, trade_quantity)
                VALUES (%s,%s,%s,%s,%s)
            """, (
                order["stock_id"],
                buy_order["order_id"],
                sell_order["order_id"],
                trade_price,
                trade_qty
            ))

            trades_created += 1

            update_balance(cursor, buy_order["investor_id"], -trade_value)
            update_balance(cursor, sell_order["investor_id"], trade_value)

            update_holding(cursor, buy_portfolio, order["stock_id"], trade_qty)
            update_holding(cursor, sell_portfolio, order["stock_id"], -trade_qty)

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

            update_order_status(cursor, order["order_id"])
            update_order_status(cursor, m["order_id"])

            remaining -= trade_qty

        update_order_status(cursor, order_id)

        conn.commit()
        return {"trades_created": trades_created}

    except Exception as e:
        conn.rollback()
        raise

    finally:
        cursor.close()
        conn.close()