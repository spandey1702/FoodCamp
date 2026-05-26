from datetime import datetime
from pydantic import BaseModel
from typing import Optional, List
from app.schemas.food_listing_schema import FoodListingResponse


class RestaurantCreate(BaseModel):
    name: str
    address: Optional[str] = None
    phone_number: Optional[str] = None


class RestaurantResponse(BaseModel):
    id: int
    name: str
    address: Optional[str] = None
    phone_number: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    created_at: datetime

    class Config:
        from_attributes = True


class RestaurantMapItem(BaseModel):
    """Used by GET /camp/map — one pin per restaurant that has active listings."""
    restaurant_id: int
    restaurant_name: str
    address: Optional[str] = None
    latitude: float
    longitude: float
    listings: List[FoodListingResponse]

    class Config:
        from_attributes = True
