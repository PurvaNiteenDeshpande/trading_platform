from pydantic import BaseModel
from decimal import Decimal
from datetime import datetime


class TradeOut(BaseModel):
    trade_id: int
    stock_id: int
    buy_order_id: int
    sell_order_id: int
    trade_price: Decimal
    trade_quantity: int
    trade_time: datetime

    class Config:
        from_attributes = True