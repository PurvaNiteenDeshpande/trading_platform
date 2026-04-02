import os

from fastapi import APIRouter, Header, HTTPException

from backend.app.core.db_bootstrap import CORE_TABLES, bootstrap_database
from backend.app.db.session import get_connection

router = APIRouter()


def _check_bootstrap_auth(token: str | None):
    required_token = os.getenv("BOOTSTRAP_TOKEN")
    if not required_token:
        raise HTTPException(status_code=503, detail="BOOTSTRAP_TOKEN is not configured")
    if token != required_token:
        raise HTTPException(status_code=403, detail="Invalid bootstrap token")


@router.post("/bootstrap")
def run_bootstrap(x_bootstrap_token: str | None = Header(default=None)):
    _check_bootstrap_auth(x_bootstrap_token)

    try:
        return bootstrap_database()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Bootstrap failed: {str(exc)}")


@router.get("/bootstrap/status")
def bootstrap_status():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("SHOW TABLES")
        existing_tables = {next(iter(row.values())) for row in cursor.fetchall() if row}

        investors = 0
        if "investors" in existing_tables:
            cursor.execute("SELECT COUNT(*) AS total FROM investors")
            investors = int(cursor.fetchone()["total"])

        return {
            "database_connected": True,
            "core_tables_ready": CORE_TABLES.issubset(existing_tables),
            "table_count": len(existing_tables),
            "investor_count": investors,
        }
    finally:
        cursor.close()
        conn.close()


@router.post("/reset-trading-state")
def reset_trading_state(
    x_bootstrap_token: str | None = Header(default=None),
    reset_wallet: bool = True,
):
    _check_bootstrap_auth(x_bootstrap_token)

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("SELECT COUNT(*) AS total FROM investors")
        investor_count = int(cursor.fetchone()["total"])

        cursor.execute("DELETE FROM trades")
        trades_deleted = cursor.rowcount

        cursor.execute("DELETE FROM orders")
        orders_deleted = cursor.rowcount

        cursor.execute("DELETE FROM holdings")
        holdings_deleted = cursor.rowcount

        cursor.execute("INSERT IGNORE INTO portfolio (investor_id) SELECT investor_id FROM investors")

        cursor.execute(
            """
            INSERT INTO holdings (portfolio_id, stock_id, stock_quantity)
            SELECT p.portfolio_id, s.stock_id, 20
            FROM portfolio p
            CROSS JOIN stocks s
            """
        )

        if reset_wallet:
            cursor.execute("UPDATE investors SET account_balance = 100000.00")

        cursor.execute("SELECT COUNT(*) AS total FROM holdings")
        holdings_after_reset = int(cursor.fetchone()["total"])

        conn.commit()

        return {
            "message": "Trading state reset successfully",
            "investor_count": investor_count,
            "trades_deleted": trades_deleted,
            "orders_deleted": orders_deleted,
            "holdings_deleted": holdings_deleted,
            "holdings_after_reset": holdings_after_reset,
            "wallet_reset_applied": reset_wallet,
            "shares_per_stock_per_user": 20,
        }
    except Exception as exc:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Reset failed: {str(exc)}")
    finally:
        cursor.close()
        conn.close()
