from fastapi import APIRouter, Depends
from ..schema import UserCreate
from ..crud import create_user
from ..database import get_db
from sqlalchemy.orm import Session

router = APIRouter()

@router.post("/register")
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    new_user = create_user(db, user)
    return {"message": "User registered", "user": new_user}

@router.post("/login")
def login_user():
    return {"message": "Login route working"}
