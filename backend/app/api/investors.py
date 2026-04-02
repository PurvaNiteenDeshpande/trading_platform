from fastapi import APIRouter, HTTPException
from backend.app.db.session import get_connection
from backend.app.schema.investor import InvestorCreateSchema
from mysql.connector.errors import IntegrityError
from decimal import Decimal

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

@router.get("/{investor_id}")
def get_investor(investor_id: int):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT investor_id, name, email, account_balance
        FROM investors
        WHERE investor_id = %s
    """, (investor_id,))
    data = cursor.fetchone()
    cursor.close()
    conn.close()
    if not data:
        raise HTTPException(status_code=404, detail="Investor not found")
    return data

@router.get("/{investor_id}/login")
def login(investor_id: int):
    # Extremely simplified authentication matching frontend's logic
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT investor_id, name, email, account_balance
            FROM investors
            WHERE investor_id = %s
        """, (investor_id,))
        data = cursor.fetchone()
        cursor.close()
        conn.close()
        if not data:
            raise HTTPException(status_code=404, detail="Investor not found")
        return {
            "message": "Login successful",
            "investor": data,
            "user": data,
            "token": f"investor-{data['investor_id']}"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database Connection Error: {str(e)}")

@router.post("/")
def create_investor(investor: InvestorCreateSchema):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        initial_wallet_cash = Decimal("100000.00")

        cursor.execute("""
            INSERT INTO investors (name, email, phone, account_balance)
            VALUES (%s, %s, %s, %s)
        """, (investor.name, investor.email, investor.phone, initial_wallet_cash))
        investor_id = cursor.lastrowid
        
        # Create portfolio row if trigger is not installed.
        cursor.execute("""
            INSERT IGNORE INTO portfolio (investor_id)
            VALUES (%s)
        """, (investor_id,))

        cursor.execute(
            """
            SELECT investor_id, name, email, account_balance
            FROM investors
            WHERE investor_id = %s
            """,
            (investor_id,),
        )
        created = cursor.fetchone()
        
        conn.commit()
        return {
            "message": "Account created successfully",
            "investor_id": investor_id,
            "investor": created,
            "user": created,
            "token": f"investor-{investor_id}"
        }
    except IntegrityError:
        conn.rollback()
        raise HTTPException(status_code=400, detail="Email already exists or invalid data")
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()