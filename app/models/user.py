from sqlalchemy import Column, Integer, String
from app.database import Base
from datetime import datetime
from sqlalchemy.types import DateTime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    password = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="user")
    created_at = Column(DateTime, default=datetime.utcnow)
