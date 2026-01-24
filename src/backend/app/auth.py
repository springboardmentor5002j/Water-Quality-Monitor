from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer 
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from typing import Annotated
from pydantic import BaseModel, EmailStr
from jose import JWTError, jwt 
from passlib.context import CryptContext
from .database import get_db
from app.user_models import User
from .schema import (
    UserCreate,
    UserPublic,
    Token,
    TokenData,
    PasswordResetRequest,
    PasswordResetConfirm,
)

# --- Configuration and Security Logic ---
SECRET_KEY = "ba18411991727556ad3997b732f0a143188c0f2f990ec46ebbf5c1ca29604233"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

RESET_SECRET = "e2e09389e9a4dde4bd4ac5ded6b6f52fb42c9218b5ca3c109cab7553e4bf35e0" 
RESET_ALGO = "HS256" 
RESET_EXPIRE_MIN = 30

# ----------------------
# PASSWORD HASHING
# ----------------------
# Use bcrypt because your DB passwords are bcrypt-hashed
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token") 

def verify_password(plain_password: str, hashed_password: str) -> bool:
    # bcrypt supports max 72 bytes
    plain_password = plain_password[:72]
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password[:72])
# ----------------------
# TOKEN CREATION
# ----------------------
def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def create_reset_token(email: str):
    payload = {
        "sub": email,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=RESET_EXPIRE_MIN)
    }
    return jwt.encode(payload, RESET_SECRET, algorithm=RESET_ALGO)

def verify_reset_token(token: str):
    try:
        payload = jwt.decode(token, RESET_SECRET, algorithms=[RESET_ALGO])
        return payload.get("sub")
    except JWTError:
        return None

# ----------------------
# USER AUTH HELPERS
# ----------------------
def get_user_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email).first()

def authenticate_user(db: Session, email: str, password: str) -> User | None:
    user = get_user_by_email(db, email)
    if not user: return None
    if not verify_password(password, user.password): return None
    return user

def get_current_user(token: Annotated[str, Depends(oauth2_scheme)], db: Annotated[Session, Depends(get_db)]) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email)
    except JWTError:
        raise credentials_exception

    user = get_user_by_email(db, email=token_data.email)
    if user is None:
        raise credentials_exception
    return user

# ----------------------
# API ROUTER
# ----------------------
router = APIRouter()

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class TokenWithUser(Token):
    user: UserPublic

@router.post("/signup", response_model=UserPublic, status_code=status.HTTP_201_CREATED)
def register_user(user_data: UserCreate, db: Annotated[Session, Depends(get_db)]):
    existing_user = get_user_by_email(db, user_data.email)
    if existing_user:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Account with this email already exists.")

    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        name=user_data.name,
        email=user_data.email,
        role=user_data.role,
        location=user_data.location,
        password=hashed_password, 
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/token", response_model=TokenWithUser)
def login_for_access_token(
    db: Annotated[Session, Depends(get_db)],
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()]
):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password", headers={"WWW-Authenticate": "Bearer"})

    access_token = create_access_token(data={"sub": user.email}, expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    return {"access_token": access_token, "token_type": "bearer", "user": user}

@router.get("/me", response_model=UserPublic)
def read_user_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/reset-password")
def request_password_reset(data: PasswordResetRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Email does not exist")

    token = create_reset_token(user.email)
    return {"reset_link": f"http://localhost:5173/reset-password?token={token}"}

@router.post("/reset-password/confirm")
def confirm_reset_password(data: PasswordResetConfirm, db: Session = Depends(get_db)):
    email = verify_reset_token(data.token)
    if not email:
        raise HTTPException(status_code=400, detail="Invalid or expired token")

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid token")

    user.password = get_password_hash(data.new_password)
    db.commit()
    return {"message": "Password reset successful"}

