from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

Base = declarative_base()

class FoodListing(Base):
    __tablename__ = 'food_listings'
    id = Column(Integer, primary_key=True)
    title = Column(String, nullable=False)
    quantity = Column(Integer, nullable=False)
    price = Column(Float, nullable=False)
    location = Column(String, nullable=False)
    created_at = Column(DateTime, nullable=False)
    restaurant = relationship("Restaurant")

    