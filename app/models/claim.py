from datetime import datetime, timezone, timedelta
from typing import Optional
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from app.database import Base

AUTO_RELEASE_HOURS = 4   # claim expires after this many hours if not picked up


class ClaimStatus:
    CLAIMED   = "claimed"
    PICKED_UP = "picked_up"
    RELEASED  = "released"   # auto-released back to available


class Claim(Base):
    __tablename__ = "claims"

    id              = Column(Integer, primary_key=True, index=True)
    listing_id      = Column(Integer, ForeignKey("food_listings.id", ondelete="CASCADE"), nullable=False)
    camp_id         = Column(Integer, ForeignKey("camps.id"), nullable=False)
    quantity        = Column(Integer, nullable=False)
    pickup_eta      = Column(DateTime, nullable=True)
    status          = Column(String(20), default=ClaimStatus.CLAIMED, nullable=False)
    claimed_at      = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    auto_release_at = Column(DateTime, nullable=True)
    picked_up_at    = Column(DateTime, nullable=True)

    listing = relationship("FoodListing", back_populates="claims")
    camp    = relationship("Camp")

    @staticmethod
    def make_auto_release_at(from_dt: Optional[datetime] = None) -> datetime:
        base = from_dt or datetime.now(timezone.utc)
        return base + timedelta(hours=AUTO_RELEASE_HOURS)
