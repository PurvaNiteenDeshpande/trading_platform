from fastapi import APIRouter
from backend.app.db.session import get_connection

router = APIRouter()

@router.get("/{investor_id}")
def get_portfolio(investor_id: int):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT 
            s.symbol,
            s.company_name,
            h.stock_quantity
        FROM holdings h
        JOIN portfolio p ON p.portfolio_id = h.portfolio_id
        JOIN stocks s ON s.stock_id = h.stock_id
        WHERE p.investor_id=%s
    """, (investor_id,))

    data = cursor.fetchall()

    cursor.close()
    conn.close()

    return data