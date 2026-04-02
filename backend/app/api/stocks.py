from fastapi import APIRouter, Query
from backend.app.db.session import get_connection

router = APIRouter()


@router.get("/")
def get_stocks():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT
            s.stock_id,
            s.symbol,
            s.company_name,
            COALESCE((
                SELECT sp.price
                FROM stock_prices sp
                WHERE sp.stock_id = s.stock_id
                ORDER BY recorded_at DESC
                LIMIT 1
            ), 0) AS latest_price,
            COALESCE((
                SELECT sp.price
                FROM stock_prices sp
                WHERE sp.stock_id = s.stock_id
                ORDER BY recorded_at DESC
                LIMIT 1 OFFSET 1
            ), (
                SELECT sp.price
                FROM stock_prices sp
                WHERE sp.stock_id = s.stock_id
                ORDER BY recorded_at DESC
                LIMIT 1
            ), 0) AS previous_close
        FROM stocks s
    """)

    data = cursor.fetchall()

    for row in data:
        latest_price = float(row["latest_price"] or 0)
        previous_close = float(row["previous_close"] or latest_price or 0)
        daily_change = latest_price - previous_close
        daily_change_pct = (daily_change / previous_close * 100) if previous_close else 0

        row["latest_price"] = round(latest_price, 2)
        row["previous_close"] = round(previous_close, 2)
        row["daily_change"] = round(daily_change, 2)
        row["daily_change_pct"] = round(daily_change_pct, 2)

    cursor.close()
    conn.close()

    return data


@router.get("/{stock_id}/history")
def get_stock_history(stock_id: int, points: int = Query(default=30, ge=2, le=200)):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        safe_points = max(2, min(int(points), 200))

        cursor.execute(
            f"""
            SELECT price, volume, recorded_at
            FROM stock_prices
            WHERE stock_id = %s
            ORDER BY recorded_at DESC
            LIMIT {safe_points}
            """,
            (stock_id,),
        )

        rows = cursor.fetchall()
        rows.reverse()

        history = []
        for row in rows:
            history.append(
                {
                    "price": float(row["price"] or 0),
                    "volume": int(row["volume"] or 0),
                    "recorded_at": row["recorded_at"],
                }
            )

        return {"stock_id": stock_id, "points": history}
    finally:
        cursor.close()
        conn.close()