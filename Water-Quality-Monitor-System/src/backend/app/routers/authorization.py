from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from app.database import get_db
from app.models import User
from passlib.context import CryptContext
from jose import jwt

router = APIRouter(prefix="/auth", tags=["Authentication"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SECRET_KEY = "your_really_long_secret_here_123456789"
ALGORITHM = "HS256"

@router.post("/register")
def register(name: str, email: str, password: str, location: str, db: Session = Depends(get_db)):

    # Check if user already exists
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed = pwd_context.hash(password)

    new_user = User(
        name=name,
        email=email,
        password=hashed,
        location=location,
        created_at=datetime.utcnow()
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {"message": "User registered successfully", "user_id": new_user.id}


# ---------------------
# LOGIN
# ---------------------
@router.post("/login")
def login(email: str, password: str, db: Session = Depends(get_db)):

    user = db.query(User).filter(User.email == email).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not pwd_context.verify(password, user.password):
        raise HTTPException(status_code=400, detail="Incorrect password")

    token = jwt.encode({"sub": user.email}, SECRET_KEY, algorithm=ALGORITHM)

    return {"access_token": token, "user": user.email, "role": user.role}


# ---------------------
# LOGOUT
# ---------------------
@router.post("/logout")
def logout():
    return {"message": "Logged out successfully"}
