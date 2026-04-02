from fastapi import FastAPI
from backend.app.api import orders, stocks, trades, portfolio, investors

app = FastAPI()

app.include_router(orders.router, prefix="/orders")
app.include_router(stocks.router, prefix="/stocks")
app.include_router(trades.router, prefix="/trades")
app.include_router(portfolio.router, prefix="/portfolio")
app.include_router(investors.router, prefix="/investors")