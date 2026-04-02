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
