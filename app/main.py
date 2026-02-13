from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session, declarative_base
from app.database import SessionLocal, engine, Base
from app.schemas.user_schema import UserCreate, UserOut
from app.routes import auth_route as routes
from app.models import user
from app.database import get_db
from fastapi.middleware.cors import CORSMiddleware
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173","http://localhost:3000",
        "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
Base.metadata.create_all(bind=engine)
app.include_router(routes.router)


@app.get("/")
def read_root():
    return {"message": "FastAPI + Postgres is working!"}
