from fastapi import APIRouter, HTTPException
from backend.app.db.session import get_connection

router = APIRouter()


def _get_investor(cursor, investor_id: int):
    cursor.execute(
        """
        SELECT investor_id, name, email, account_balance
        FROM investors
        WHERE investor_id = %s
        """,
        (investor_id,),
    )
    investor = cursor.fetchone()
    if not investor:
        raise HTTPException(status_code=404, detail="Investor not found")

    investor["account_balance"] = float(investor["account_balance"] or 0)
    return investor


def _get_holdings_breakdown(cursor, investor_id: int):
    cursor.execute(
        """
        SELECT
            s.stock_id,
            s.symbol,
            s.company_name,
            h.stock_quantity,
            COALESCE((
                SELECT sp.price
                FROM stock_prices sp
                WHERE sp.stock_id = s.stock_id
                ORDER BY sp.recorded_at DESC
                LIMIT 1
            ), 0) AS current_price,
            COALESCE((
                SELECT sp.price
                FROM stock_prices sp
                WHERE sp.stock_id = s.stock_id
                ORDER BY sp.recorded_at DESC
                LIMIT 1 OFFSET 1
            ), (
                SELECT sp.price
                FROM stock_prices sp
                WHERE sp.stock_id = s.stock_id
                ORDER BY sp.recorded_at DESC
                LIMIT 1
            ), 0) AS previous_close,
            COALESCE(bt.total_buy_qty, 0) AS total_buy_qty,
            COALESCE(bt.total_buy_value, 0) AS total_buy_value
        FROM holdings h
        JOIN portfolio p ON p.portfolio_id = h.portfolio_id
        JOIN stocks s ON s.stock_id = h.stock_id
        LEFT JOIN (
            SELECT
                bo.investor_id,
                t.stock_id,
                SUM(t.trade_quantity) AS total_buy_qty,
                SUM(t.trade_quantity * t.trade_price) AS total_buy_value
            FROM trades t
            JOIN orders bo ON bo.order_id = t.buy_order_id
            GROUP BY bo.investor_id, t.stock_id
        ) bt ON bt.investor_id = p.investor_id AND bt.stock_id = h.stock_id
        WHERE p.investor_id = %s
          AND h.stock_quantity > 0
        ORDER BY s.symbol
        """,
        (investor_id,),
    )

    rows = cursor.fetchall()
    holdings = []

    total_holdings_value = 0.0
    total_cost_basis = 0.0
    total_unrealized_pnl = 0.0
    total_daily_pnl = 0.0

    for row in rows:
        quantity = float(row["stock_quantity"] or 0)
        current_price = float(row["current_price"] or 0)
        previous_close = float(row["previous_close"] or current_price or 0)

        total_buy_qty = float(row["total_buy_qty"] or 0)
        total_buy_value = float(row["total_buy_value"] or 0)
        avg_buy_price = (total_buy_value / total_buy_qty) if total_buy_qty > 0 else current_price

        market_value = quantity * current_price
        cost_basis = quantity * avg_buy_price
        unrealized_pnl = market_value - cost_basis
        daily_pnl = quantity * (current_price - previous_close)

        total_holdings_value += market_value
        total_cost_basis += cost_basis
        total_unrealized_pnl += unrealized_pnl
        total_daily_pnl += daily_pnl

        holdings.append(
            {
                "stock_id": row["stock_id"],
                "symbol": row["symbol"],
                "company_name": row["company_name"],
                "stock_quantity": int(quantity),
                "current_price": round(current_price, 2),
                "previous_close": round(previous_close, 2),
                "avg_buy_price": round(avg_buy_price, 2),
                "market_value": round(market_value, 2),
                "cost_basis": round(cost_basis, 2),
                "unrealized_pnl": round(unrealized_pnl, 2),
                "daily_pnl": round(daily_pnl, 2),
            }
        )

    return {
        "holdings": holdings,
        "total_holdings_value": round(total_holdings_value, 2),
        "total_cost_basis": round(total_cost_basis, 2),
        "total_unrealized_pnl": round(total_unrealized_pnl, 2),
        "total_daily_pnl": round(total_daily_pnl, 2),
    }


@router.get("/{investor_id}/summary")
def get_portfolio_summary(investor_id: int):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        investor = _get_investor(cursor, investor_id)
        metrics = _get_holdings_breakdown(cursor, investor_id)

        total_equity = investor["account_balance"] + metrics["total_holdings_value"]

        return {
            "investor": investor,
            "holdings": metrics["holdings"],
            "total_holdings_value": metrics["total_holdings_value"],
            "total_cost_basis": metrics["total_cost_basis"],
            "total_unrealized_pnl": metrics["total_unrealized_pnl"],
            "total_daily_pnl": metrics["total_daily_pnl"],
            "total_equity": round(total_equity, 2),
        }
    finally:
        cursor.close()
        conn.close()


@router.get("/{investor_id}")
def get_portfolio(investor_id: int):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        _get_investor(cursor, investor_id)
        metrics = _get_holdings_breakdown(cursor, investor_id)
        return metrics["holdings"]
    finally:
        cursor.close()
        conn.close()