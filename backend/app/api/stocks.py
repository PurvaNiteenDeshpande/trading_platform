from fastapi import APIRouter
from backend.app.db.session import get_connection

router = APIRouter()

@router.get("/")
def get_stocks():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT s.stock_id, s.symbol, s.company_name,
               (SELECT price FROM stock_prices sp
                WHERE sp.stock_id = s.stock_id
                ORDER BY recorded_at DESC LIMIT 1) as latest_price
        FROM stocks s
    """)

    data = cursor.fetchall()

    cursor.close()
    conn.close()

    return data