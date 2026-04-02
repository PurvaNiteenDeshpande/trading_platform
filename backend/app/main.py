import os
import sys

# Add the project root to sys.path so 'backend.app...' imports work on Vercel
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from backend.app.api import orders, stocks, trades, portfolio, investors

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this in production, e.g., ["https://your-frontend-domain.vercel.app"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_router = APIRouter(prefix="/api")
api_router.include_router(orders.router, prefix="/orders")
api_router.include_router(stocks.router, prefix="/stocks")
api_router.include_router(trades.router, prefix="/trades")
api_router.include_router(portfolio.router, prefix="/portfolio")
api_router.include_router(investors.router, prefix="/investors")

app.include_router(api_router)