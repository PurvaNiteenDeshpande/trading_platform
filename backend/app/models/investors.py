from pydantic import BaseModel, EmailStr
from typing import Optional
from decimal import Decimal


class InvestorBase(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    account_balance: Decimal


class InvestorCreate(InvestorBase):
    pass


class InvestorOut(InvestorBase):
    investor_id: int

    class Config:
        from_attributes = True