from sqlalchemy.orm import Session
from fastapi import HTTPException
from datetime import datetime
import bcrypt
import requests

# Existing models and schemas
from .models import User, WaterStation, StationReading, ReadingParameter
from .schema import UserCreate

# NGO/Collaboration models
from .models.ngo import NGO, Collaboration

# API fetch modules
from .api_fetch import openaq
from .api_fetch import epa
from .api_fetch import cpcb

# -------------------------------
# USER CRUD
# -------------------------------
def create_user(db: Session, user: UserCreate):
    # Check if email already exists
    existing = db.query(User).filter(User.email == user.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash password
    hashed = bcrypt.hashpw(user.password.encode("utf-8"), bcrypt.gensalt())
    
    # Create user object
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

# -------------------------------
# STATION + READING UPSERT
# -------------------------------
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

# -------------------------------
# DATA FETCHERS
# -------------------------------
def fetch_epa(db: Session):
    epa.ingest_epa_data(db)

def fetch_cpcb(db: Session):
    cpcb.ingest_cpcb_data(db)

def fetch_openaq(db: Session):
    openaq.ingest_openaq_data(db)

# -------------------------------
# NGO / COLLABORATION CRUD
# -------------------------------
def create_ngo(db: Session, name: str, email: str, phone: str = None, area: str = None):
    ngo = NGO(
        name=name,
        contact_email=email,
        contact_phone=phone,
        area_of_operation=area
    )
    db.add(ngo)
    db.commit()
    db.refresh(ngo)
    return ngo

def get_ngos(db: Session):
    return db.query(NGO).all()

def create_collaboration(db: Session, ngo_id: int, station_id: int, description: str = None):
    collab = Collaboration(
        ngo_id=ngo_id,
        station_id=station_id,
        description=description
    )
    db.add(collab)
    db.commit()
    db.refresh(collab)
    return collab

def get_collaborations(db: Session, station_id: int = None):
    query = db.query(Collaboration)
    if station_id:
        query = query.filter(Collaboration.station_id == station_id)
    return query.all()
