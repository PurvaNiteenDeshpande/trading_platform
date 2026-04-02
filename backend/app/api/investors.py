from fastapi import APIRouter
from backend.app.db.session import get_connection

router = APIRouter()

@router.get("/")
def get_investors():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT investor_id, name, email, account_balance
        FROM investors
    """)

    data = cursor.fetchall()

    cursor.close()
    conn.close()

    return data