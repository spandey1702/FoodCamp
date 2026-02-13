from sqlalchemy import Session
from app.models.food_listing import FoodListing
from app.schemas.food_listing_schema import FoodListingCreate, FoodListingResponse

def create_food_listing(db: Session, food_listing:FoodListingCreate) -> FoodListingResponse:
    new_listing = FoodListing(
        restaurant_id=food_listing.restaurant_id,
        food_name=food_listing.food_name,
        quantity=food_listing.quantity,
        is_active=food_listing.is_active
    )
    db.add(new_listing)
    db.commit()
    db.refresh(new_listing)
    return new_listing