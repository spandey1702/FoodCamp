from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.schemas.user_schema import UserCreate, UserOut
from app.services.auth_service import register_user
from app.database import get_db
from fastapi import APIRouter, status
from app.schemas.user_schema import UserCreate
from app.services.auth_service import login_user
from app.schemas.user_schema import UserLogin, TokenResponse

router = APIRouter(prefix="/auth")

@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(user_create: UserCreate, db: Session = Depends(get_db)):
    return register_user(user_create, db)


@router.post("/login", response_model=TokenResponse)
def login(user: UserLogin, db: Session = Depends(get_db)):
    return login_user(user.email, user.password, db)

