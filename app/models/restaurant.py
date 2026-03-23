from datetime import datetime
from sqlalchemy import Column, Integer, String,DateTime
from sqlalchemy.ext.declarative import declarative_base
from app.database import Base
class Restaurant(Base):
    __tablename__ = "restaurants" 
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    location = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
