from fastapi import APIRouter, HTTPException
from backend.app.db.session import get_connection
from backend.app.core.matching_engine import match_order
from backend.app.schema.orders import OrderSchema

router = APIRouter()


@router.get("/book/{stock_id}")
def get_order_book(stock_id: int):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute(
            """
            SELECT
                COALESCE(SUM(CASE WHEN order_type='BUY' THEN 1 ELSE 0 END), 0) AS buy_order_count,
                COALESCE(SUM(CASE WHEN order_type='SELL' THEN 1 ELSE 0 END), 0) AS sell_order_count,
                COALESCE(SUM(CASE WHEN order_type='BUY' THEN (order_quantity - executed_quantity) ELSE 0 END), 0) AS buy_open_qty,
                COALESCE(SUM(CASE WHEN order_type='SELL' THEN (order_quantity - executed_quantity) ELSE 0 END), 0) AS sell_open_qty
            FROM orders
            WHERE stock_id=%s
              AND order_status IN ('OPEN', 'PARTIAL')
              AND (order_quantity - executed_quantity) > 0
            """,
            (stock_id,),
        )
        summary = cursor.fetchone() or {}

        cursor.execute(
            """
            SELECT
                order_price AS price,
                SUM(order_quantity - executed_quantity) AS total_qty,
                COUNT(*) AS order_count
            FROM orders
            WHERE stock_id=%s
              AND order_type='BUY'
              AND order_status IN ('OPEN', 'PARTIAL')
              AND (order_quantity - executed_quantity) > 0
            GROUP BY order_price
            ORDER BY order_price DESC
            LIMIT 10
            """,
            (stock_id,),
        )
        buy_levels = cursor.fetchall()

        cursor.execute(
            """
            SELECT
                order_price AS price,
                SUM(order_quantity - executed_quantity) AS total_qty,
                COUNT(*) AS order_count
            FROM orders
            WHERE stock_id=%s
              AND order_type='SELL'
              AND order_status IN ('OPEN', 'PARTIAL')
              AND (order_quantity - executed_quantity) > 0
            GROUP BY order_price
            ORDER BY order_price ASC
            LIMIT 10
            """,
            (stock_id,),
        )
        sell_levels = cursor.fetchall()

        cursor.execute(
            """
            SELECT
                t.trade_id,
                t.trade_price,
                t.trade_quantity,
                t.trade_time,
                t.buy_order_id,
                t.sell_order_id
            FROM trades t
            WHERE t.stock_id=%s
            ORDER BY t.trade_time DESC
            LIMIT 10
            """,
            (stock_id,),
        )
        recent_trades = cursor.fetchall()

        for row in buy_levels:
            row["price"] = float(row["price"] or 0)
            row["total_qty"] = int(row["total_qty"] or 0)

        for row in sell_levels:
            row["price"] = float(row["price"] or 0)
            row["total_qty"] = int(row["total_qty"] or 0)

        for row in recent_trades:
            row["trade_price"] = float(row["trade_price"] or 0)
            row["trade_quantity"] = int(row["trade_quantity"] or 0)

        best_bid = buy_levels[0]["price"] if buy_levels else None
        best_ask = sell_levels[0]["price"] if sell_levels else None
        spread = (best_ask - best_bid) if best_ask is not None and best_bid is not None else None

        return {
            "stock_id": stock_id,
            "buy_order_count": int(summary.get("buy_order_count") or 0),
            "sell_order_count": int(summary.get("sell_order_count") or 0),
            "buy_open_qty": int(summary.get("buy_open_qty") or 0),
            "sell_open_qty": int(summary.get("sell_open_qty") or 0),
            "best_bid": round(best_bid, 2) if best_bid is not None else None,
            "best_ask": round(best_ask, 2) if best_ask is not None else None,
            "spread": round(spread, 2) if spread is not None else None,
            "buy_levels": buy_levels,
            "sell_levels": sell_levels,
            "recent_trades": recent_trades,
        }
    finally:
        cursor.close()
        conn.close()


@router.post("/place")
def place_order(order: OrderSchema):
    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            INSERT INTO orders
            (investor_id, stock_id, order_type, order_quantity, order_price)
            VALUES (%s, %s, %s, %s, %s)
        """, (
            order.investor_id,
            order.stock_id,
            order.order_type,
            order.quantity,
            float(order.price)
        ))

        order_id = cursor.lastrowid
        conn.commit()

        match_result = match_order(order_id)
        trades_created = int((match_result or {}).get("trades_created", 0))

        return {
            "order_id": order_id,
            "status": "Order placed",
            "trades_created": trades_created,
            "matched": trades_created > 0,
        }

    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=str(e))

    finally:
        cursor.close()
        conn.close()


@router.get("/")
def get_orders():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT o.order_id, o.investor_id, s.symbol,
               o.order_type, o.order_quantity, o.executed_quantity,
               o.order_price, o.order_status, o.order_time
        FROM orders o
        JOIN stocks s ON s.stock_id = o.stock_id
        ORDER BY o.order_time DESC
    """)

    data = cursor.fetchall()
    cursor.close()
    conn.close()
    return data


@router.get("/{investor_id}")
def get_orders_by_investor(investor_id: int):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT o.order_id, s.symbol, o.order_type,
               o.order_quantity, o.executed_quantity,
               o.order_price, o.order_status, o.order_time
        FROM orders o
        JOIN stocks s ON s.stock_id = o.stock_id
        WHERE o.investor_id = %s
        ORDER BY o.order_time DESC
    """, (investor_id,))

    data = cursor.fetchall()
    cursor.close()
    conn.close()
    return data