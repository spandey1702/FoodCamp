from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class FoodListingCreate(BaseModel):
    restaurant_id: int
    food_name: str
    quantity: int
    image_url: Optional[str] = None
    is_active: Optional[bool] = True


class FoodListingResponse(BaseModel):
    id: int
    restaurant_id: int
    food_name: str
    quantity: int                        # original total
    remaining_quantity: int              # still available for claiming
    image_url: Optional[str] = None
    status: str
    is_active: bool
    created_at: datetime
    message: Optional[str] = None

    class Config:
        from_attributes = True


class FoodListingStatusUpdate(BaseModel):
    status: str
