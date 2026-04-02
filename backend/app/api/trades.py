from fastapi import APIRouter
from backend.app.db.session import get_connection

router = APIRouter()


@router.get("/")
def get_trades():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT t.trade_id, s.symbol, s.company_name,
               t.trade_price, t.trade_quantity, t.trade_time,
               t.buy_order_id, t.sell_order_id
        FROM trades t
        JOIN stocks s ON s.stock_id = t.stock_id
        ORDER BY t.trade_time DESC
        LIMIT 100
    """)

    data = cursor.fetchall()
    cursor.close()
    conn.close()
    return data


@router.get("/stock/{stock_id}")
def get_trades_by_stock(stock_id: int):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT t.trade_id, s.symbol, t.trade_price,
               t.trade_quantity, t.trade_time
        FROM trades t
        JOIN stocks s ON s.stock_id = t.stock_id
        WHERE t.stock_id = %s
        ORDER BY t.trade_time DESC
    """, (stock_id,))

    data = cursor.fetchall()
    cursor.close()
    conn.close()
    return data