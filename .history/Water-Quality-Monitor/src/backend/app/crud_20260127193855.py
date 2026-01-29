from sqlalchemy.orm import Session
from fastapi import HTTPException
from .models import WaterStation, StationReading, ReadingParameter, Collaboration
from app.models import User

from .schema import UserCreate
import bcrypt
from datetime import datetime
from .api_fetch import openaq  
from .api_fetch import epa  
from .api_fetch import cpcb 
import requests

# ---------------- Users ----------------
def create_user(db: Session, user: UserCreate):
    # Check if email already exists
    existing = db.query(User).filter(User.email == user.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    # Hash password
    hashed = bcrypt.hashpw(user.password.encode("utf-8"), bcrypt.gensalt())
    # Create user object (no latitude/longitude)
    db_user = User(
        name=user.name,
        email=user.email,
        password=hashed.decode("utf-8"),
        role=user.role or "citizen",
        location=user.location,
        created_at=datetime.utcnow(),
    )
    # Save to DB
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# -------------------------------------
# STATION + READING UPSERT
# -------------------------------------
def upsert_station_reading(
    db: Session,
    station_name: str,
    location: str,
    lat: float,
    lon: float,
    parameter: str,
    value: float,
    recorded_at: datetime,
):
    station = db.query(WaterStation).filter(
        WaterStation.name == station_name
    ).first()
    if not station:
        station = WaterStation(
            name=station_name,
            location=location,
            latitude=lat,
            longitude=lon,
            managed_by="government",
            created_at=datetime.utcnow(),
        )
        db.add(station)
        db.commit()
        db.refresh(station)
    reading = StationReading(
        station_id=station.id,
        parameter=ReadingParameter(parameter),
        value=value,
        recorded_at=recorded_at,
    )
    db.add(reading)
    db.commit()

# ---------------- External Fetch ----------------
def fetch_epa(db: Session):
    epa.ingest_epa_data(db)

def fetch_cpcb(db: Session):
    cpcb.ingest_cpcb_data(db)

def fetch_openaq(db: Session):
    openaq.ingest_openaq_data(db)

# ---------------- Collaborations CRUD (Week 7) ----------------
from .models import Collaboration
from .schema import CollaborationCreate

def create_collaboration(db: Session, collab: CollaborationCreate):
    db_collab = Collaboration(
        ngo_name=collab.ngo_name,
        project_name=collab.project_name,
        contact_email=collab.contact_email,
        created_at=datetime.utcnow()
    )
    db.add(db_collab)
    db.commit()
    db.refresh(db_collab)
    return db_collab

def get_collaborations(db: Session, skip: int = 0, limit: int = 50):
    return db.query(Collaboration).offset(skip).limit(limit).all()

def get_collaboration_by_id(db: Session, collab_id: int):
    collab = db.query(Collaboration).filter(Collaboration.id == collab_id).first()
    if not collab:
        raise HTTPException(status_code=404, detail="Collaboration not found")
    return collab

def delete_collaboration(db: Session, collab_id: int):
    collab = db.query(Collaboration).filter(Collaboration.id == collab_id).first()
    if not collab:
        raise HTTPException(status_code=404, detail="Collaboration not found")
    db.delete(collab)
    db.commit()
    return {"detail": "Collaboration deleted"}
