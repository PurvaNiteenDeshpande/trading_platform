from pydantic import BaseModel
from decimal import Decimal
from datetime import datetime


class StockPriceOut(BaseModel):
    id: int
    stock_id: int
    price: Decimal
    volume: int
    recorded_at: datetime

    class Config:
        from_attributes = True