from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.orm import Session

from app.models.food_listing import FoodListing, ListingStatus
from app.schemas.food_listing_schema import FoodListingCreate


def create_food_listing(db: Session, data: FoodListingCreate, image_url: Optional[str] = None) -> FoodListing:
    listing = FoodListing(
        restaurant_id      = data.restaurant_id,
        food_name          = data.food_name,
        quantity           = data.quantity,
        remaining_quantity = data.quantity,   # starts equal to total
        image_url          = image_url,
        status             = ListingStatus.PENDING,
        is_active          = data.is_active if data.is_active is not None else True,
        created_at         = datetime.now(timezone.utc),
    )
    db.add(listing)
    db.commit()
    db.refresh(listing)
    return listing


def get_listings_by_restaurant(
    db: Session,
    restaurant_id: int,
    active_only: bool = False,
) -> list[FoodListing]:
    q = db.query(FoodListing).filter(FoodListing.restaurant_id == restaurant_id)
    if active_only:
        q = q.filter(FoodListing.is_active == True)
    return q.order_by(FoodListing.created_at.desc()).all()


def get_available_listings(db: Session) -> list[FoodListing]:
    """Listings that still have portions available (remaining_quantity > 0)."""
    return (
        db.query(FoodListing)
        .filter(
            FoodListing.is_active == True,
            FoodListing.remaining_quantity > 0,
        )
        .order_by(FoodListing.created_at.desc())
        .all()
    )


def get_listing_by_id(db: Session, listing_id: int) -> Optional[FoodListing]:
    return db.query(FoodListing).filter(FoodListing.id == listing_id).first()
