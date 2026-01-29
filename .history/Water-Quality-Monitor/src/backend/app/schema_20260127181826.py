from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional
from pydantic import BaseModel
from datetime import datetime
from enum import Enum

# ---------------- Users ----------------
class UserCreate(BaseModel):
    name: Optional[str] = None
    email: EmailStr
    password: str
    role: Optional[str] = None
    location: Optional[str] = None

class UserLoginSchema(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: int
    name: Optional[str]
    email: EmailStr
    role: Optional[str] = None
    location: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class UserPublic(BaseModel):
    id: int
    name: Optional[str]
    email: EmailStr
    role: Optional[str]
    location: Optional[str]

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# ---------------- Station Readings ----------------
class StationReadingBase(BaseModel):
    station_id: int
    parameter: str
    value: float
    recorded_at: datetime

class StationReadingCreate(StationReadingBase):
    pass

class StationReadingResponse(StationReadingBase):
    id: int

    class Config:
        from_attributes = True

# ---------------- Password Reset ----------------
class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str

# ---------------- Alerts ----------------
class AlertTypeEnum(str, Enum):
    boil_notice = "boil_notice"
    contamination = "contamination"
    outage = "outage"

class AlertCreate(BaseModel):
    type: AlertTypeEnum
    message: str
    location: str

class AlertResponse(BaseModel):
    id: int
    type: AlertTypeEnum
    message: str
    location: str
    issued_at: datetime

    class Config:
        from_attributes = True

# ---------------- Collaborations (Week 7) ----------------
class CollaborationBase(BaseModel):
    ngo_name: str
    project_name: str
    contact_email: EmailStr

class CollaborationCreate(CollaborationBase):
    pass

class CollaborationResponse(CollaborationBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
