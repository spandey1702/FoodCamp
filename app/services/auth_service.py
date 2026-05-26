from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.user import User
from app.models.camp import Camp
from app.schemas.user_schema import UserCreate
from app.services.security import verify_password,hash_password, create_access_token
from app.repositories.user_repo import create_user,get_user_by_email
from app.database import get_db

def register_user(user_create: UserCreate, db: Session):
    existing_user = get_user_by_email(db, user_create.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    hashed_password = hash_password(user_create.password)
    user = create_user(db, user_create, hashed_password)
    return user

def login_user(email: str, password: str, db: Session):
    user = get_user_by_email(db, email)
    if not user or not verify_password(password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    token = create_access_token(data={"sub": str(user.id), "role": user.role})
    response={
        "access_token": token,
        "token_type": "bearer",
        "role": user.role , 
        "restaurant_id": None,
        "camp_id": None
    }
    if user.role == "restaurant":
        response["restaurant_id"] = user.restaurant_id
        print("User is a restaurant, restaurant_id:", user.restaurant_id)    
    if user.role == "camp":
        response["camp_id"] = user.camp_id
    print ("Login successful, response:", response)
    return response
    
