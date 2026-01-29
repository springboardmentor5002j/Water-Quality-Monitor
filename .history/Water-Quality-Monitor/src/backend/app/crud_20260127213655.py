from sqlalchemy.orm import Session
from fastapi import HTTPException
from datetime import datetime
import bcrypt
import requests

from .models import (
    User,
    WaterStation,
    StationReading,
    ReadingParameter
)

from app.models.ngo import NGO
from app.models.collaboration import Collaboration

from .schema import UserCreate
from .api_fetch import openaq, epa, cpcb

# -------------------------------------
# USER CREATE
# -------------------------------------
def create_user(db: Session, user: UserCreate):
    existing = db.query(User).filter(User.email == user.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed = bcrypt.hashpw(user.password.encode("utf-8"), bcrypt.gensalt())

    db_user = User(
        name=user.name,
        email=user.email,
        password=hashed.decode("utf-8"),
        role=user.role or "citizen",
        location=user.location,
        created_at=datetime.utcnow(),
    )

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


# -------------------------------------
# EXTERNAL DATA FETCH
# -------------------------------------
def fetch_epa(db: Session):
    epa.ingest_epa_data(db)

def fetch_cpcb(db: Session):
    cpcb.ingest_cpcb_data(db)

def fetch_openaq(db: Session):
    openaq.ingest_openaq_data(db)


# =====================================
# WEEK 7 : NGO + COLLABORATION
# =====================================

# -------- NGO CRUD --------
def create_ngo(db: Session, name: str, email: str, phone: str = None, area: str = None):
    existing = db.query(NGO).filter(NGO.contact_email == email).first()
    if existing:
        raise HTTPException(status_code=400, detail="NGO already exists")

    ngo = NGO(
        name=name,
        contact_email=email,
        phone=phone,
        area=area
    )
    db.add(ngo)
    db.commit()
    db.refresh(ngo)
    return ngo


def get_ngos(db: Session):
    return db.query(NGO).all()


# -------- COLLABORATION CRUD --------
def create_collaboration(
    db: Session,
    ngo_id: int,
    station_id: int,
    project_name: str
):
    ngo = db.query(NGO).filter(NGO.id == ngo_id).first()
    if not ngo:
        raise HTTPException(status_code=404, detail="NGO not found")

    station = db.query(WaterStation).filter(WaterStation.id == station_id).first()
    if not station:
        raise HTTPException(status_code=404, detail="Water station not found")

    collab = Collaboration(
        ngo_id=ngo_id,
        station_id=station_id,
        project_name=project_name
    )
    db.add(collab)
    db.commit()
    db.refresh(collab)
    return collab


def get_collaborations(db: Session):
    return db.query(Collaboration).all()
