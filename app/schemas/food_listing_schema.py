from typing import Optional
from pydantic import BaseModel

class FoodListingCreate(BaseModel):
    restaurant_id: int
    food_name: str
    quantity: int
    is_active: Optional[bool] = True

class FoodListingResponse(BaseModel):
    id: int
    restaurant_id: int
    food_name: str
    quantity: int
    created_at: str
    is_active: bool
    message: str