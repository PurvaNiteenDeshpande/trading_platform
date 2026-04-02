from pydantic import BaseModel, field_validator
from decimal import Decimal


class TradeSchema(BaseModel):
    stock_id: int
    buy_order_id: int
    sell_order_id: int
    trade_price: Decimal
    trade_quantity: int

    @field_validator("trade_price")
    @classmethod
    def price_positive(cls, v):
        if v <= 0:
            raise ValueError("Trade price must be greater than 0")
        return v

    @field_validator("trade_quantity")
    @classmethod
    def qty_positive(cls, v):
        if v <= 0:
            raise ValueError("Trade quantity must be greater than 0")
        return v

    @field_validator("buy_order_id", "sell_order_id")
    @classmethod
    def ids_differ(cls, v):
        return v