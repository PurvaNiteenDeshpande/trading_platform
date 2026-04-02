from pydantic import BaseModel


class HoldingBase(BaseModel):
    portfolio_id: int
    stock_id: int
    stock_quantity: int


class HoldingOut(HoldingBase):
    id: int

    class Config:
        from_attributes = True