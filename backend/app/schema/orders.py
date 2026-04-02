from pydantic import BaseModel, field_validator
from decimal import Decimal


class OrderSchema(BaseModel):
    investor_id: int
    stock_id: int
    order_type: str
    quantity: int
    price: Decimal

    @field_validator("order_type")
    @classmethod
    def valid_order_type(cls, v):
        if v.upper() not in ("BUY", "SELL"):
            raise ValueError("order_type must be BUY or SELL")
        return v.upper()

    @field_validator("quantity")
    @classmethod
    def quantity_positive(cls, v):
        if v <= 0:
            raise ValueError("Quantity must be greater than 0")
        return v

    @field_validator("price")
    @classmethod
    def price_positive(cls, v):
        if v <= 0:
            raise ValueError("Price must be greater than 0")
        return v