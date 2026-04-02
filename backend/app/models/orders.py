from pydantic import BaseModel
from typing import Optional
from decimal import Decimal
from datetime import datetime


class OrderCreate(BaseModel):
    investor_id: int
    stock_id: int
    order_type: str           # 'BUY' or 'SELL'
    quantity: int
    price: Decimal


class OrderOut(BaseModel):
    order_id: int
    investor_id: int
    stock_id: int
    order_type: str
    order_quantity: int
    executed_quantity: int
    order_price: Decimal
    order_status: str
    order_time: datetime

    class Config:
        from_attributes = True