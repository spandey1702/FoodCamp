from datetime import datetime
from typing import Optional
from pydantic import BaseModel, field_validator


class ClaimCreate(BaseModel):
    quantity: int
    pickup_eta: Optional[datetime] = None

    @field_validator("quantity")
    @classmethod
    def qty_positive(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("Quantity must be at least 1")
        return v


class ClaimResponse(BaseModel):
    id: int
    listing_id: int
    camp_id: int
    quantity: int
    pickup_eta: Optional[datetime] = None
    status: str
    claimed_at: datetime
    auto_release_at: Optional[datetime] = None
    picked_up_at: Optional[datetime] = None

    # Denormalised listing fields — handy for My Claims list without extra fetch
    food_name: Optional[str] = None
    image_url: Optional[str] = None
    restaurant_name: Optional[str] = None

    class Config:
        from_attributes = True
