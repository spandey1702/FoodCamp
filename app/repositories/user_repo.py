from sqlalchemy.orm import Session
from app.models.user import User
from typing import Optional
from app.schema import UserCreate

def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email).first()

def create_user(db: Session, user_create: UserCreate, hashed_password: str) -> User:
    user = User(
        name=user_create.name,
        email=user_create.email,
        password=hashed_password,
        role="user"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
