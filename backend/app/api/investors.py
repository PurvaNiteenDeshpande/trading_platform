from fastapi import APIRouter, HTTPException
from backend.app.db.session import get_connection
from backend.app.schema.investor import InvestorCreateSchema
from mysql.connector.errors import IntegrityError

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
        return {"message": "Login successful", "investor": data}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database Connection Error: {str(e)}")

@router.post("/")
def create_investor(investor: InvestorCreateSchema):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO investors (name, email, phone, account_balance)
            VALUES (%s, %s, %s, %s)
        """, (investor.name, investor.email, investor.phone, investor.account_balance))
        investor_id = cursor.lastrowid
        
        # Also create initial portfolio
        cursor.execute("""
            INSERT INTO portfolio (investor_id)
            VALUES (%s)
        """, (investor_id,))
        
        conn.commit()
        return {"investor_id": investor_id, "message": "Profile created successfully"}
    except IntegrityError as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail="Email already exists or invalid data")
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
        conn.close()