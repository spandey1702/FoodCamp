from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr

class UserCreate(BaseModel):
    email: str
    password: str
    name: str
    role: str 
    restaurant_id: Optional[int] = None
    camp_id: Optional[int] = None

class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str
    restaurant_id: Optional[int] 
    camp_id: Optional[int] 
    created_at: datetime

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    role: str
    restaurant_id: Optional[int]
    camp_id: Optional[int]
