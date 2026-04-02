from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from decimal import Decimal


class InvestorCreateSchema(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    account_balance: Decimal = Decimal("0.00")

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v):
        if not v.strip():
            raise ValueError("Name cannot be empty")
        return v.strip()

    @field_validator("account_balance")
    @classmethod
    def balance_non_negative(cls, v):
        if v < 0:
            raise ValueError("Balance cannot be negative")
        return v