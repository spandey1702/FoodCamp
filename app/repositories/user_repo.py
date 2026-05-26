from sqlalchemy.orm import Session
from typing import Optional

from app.models.user import User
from app.schemas.user_schema import UserCreate


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email).first()


def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
    return db.query(User).filter(User.id == user_id).first()


def create_user(db: Session, user_create: UserCreate, hashed_password: str) -> User:
    user = User(
        name=user_create.name,
        email=user_create.email,
        password=hashed_password,
        role=user_create.role,
        restaurant_id=user_create.restaurant_id,
        camp_id=user_create.camp_id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
