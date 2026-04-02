from fastapi import APIRouter, HTTPException
from backend.app.db.session import get_connection
from backend.app.core.matching_engine import match_order
from backend.app.schema.orders import OrderSchema

router = APIRouter()


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

        match_order(order_id)

        return {"order_id": order_id, "status": "Order placed and matched"}

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