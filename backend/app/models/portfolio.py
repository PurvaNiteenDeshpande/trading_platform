from pydantic import BaseModel


class PortfolioOut(BaseModel):
    portfolio_id: int
    investor_id: int

    class Config:
        from_attributes = True


class HoldingOut(BaseModel):
    symbol: str
    company_name: str
    stock_quantity: int

    class Config:
        from_attributes = True