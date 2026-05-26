from datetime import datetime, timezone
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from app.database import Base


class ListingStatus:
    PENDING       = "pending"        # has remaining_quantity > 0
    FULLY_CLAIMED = "fully_claimed"  # remaining_quantity == 0, awaiting pickups
    COMPLETED     = "completed"      # restaurant closed / all picked up


class FoodListing(Base):
    __tablename__ = "food_listings"

    id                 = Column(Integer, primary_key=True, index=True)
    food_name          = Column(String, nullable=False)
    image_url          = Column(String, nullable=True)
    quantity           = Column(Integer, nullable=False)          # original total
    remaining_quantity = Column(Integer, nullable=False)          # decrements on claim
    status             = Column(String(20), default=ListingStatus.PENDING, nullable=False)
    is_active          = Column(Boolean, default=True)
    created_at         = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    restaurant_id = Column(Integer, ForeignKey("restaurants.id"), nullable=False)

    restaurant = relationship("Restaurant", back_populates="listings")
    claims     = relationship("Claim", back_populates="listing", cascade="all, delete-orphan")
