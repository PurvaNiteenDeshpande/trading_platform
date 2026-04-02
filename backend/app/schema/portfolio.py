from pydantic import BaseModel


class PortfolioCreateSchema(BaseModel):
    investor_id: int