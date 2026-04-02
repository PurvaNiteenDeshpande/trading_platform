from pydantic import BaseModel
from typing import Optional
from decimal import Decimal


class StockOut(BaseModel):
    stock_id: int
    symbol: str
    company_name: str
    latest_price: Optional[Decimal] = None

    class Config:
        from_attributes = True