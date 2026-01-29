from sqlalchemy.orm import Session
from fastapi import HTTPException
from .models import User, WaterStation, StationReading, ReadingParameter, Report, CollaborationRequest, NGOProject
from .schema import UserCreate
import bcrypt
from datetime import datetime
from .api_fetch import openaq  
from .api_fetch import epa  
from .api_fetch import cpcb 
import requests


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
def fetch_epa(db: Session):
    epa.ingest_epa_data(db)

def fetch_cpcb(db: Session):
    cpcb.ingest_cpcb_data(db)

def fetch_openaq(db: Session):
    openaq.ingest_openaq_data(db)


# -------------------------------------
# NGO CRUD FUNCTIONS (for Milestone-4)
# -------------------------------------

# Get all user reports
def get_all_reports(db: Session):
    return db.query(Report).all()

# Verify a user report (approve/reject)
def verify_report(db: Session, report_id: int, status: str):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    report.status = status  # e.g., "approved" or "rejected"
    report.verified_at = datetime.utcnow()
    db.commit()
    db.refresh(report)
    return report

# Get all collaboration requests for NGO
def get_collaboration_requests(db: Session, ngo_id: int):
    return db.query(CollaborationRequest).filter(CollaborationRequest.ngo_id == ngo_id).all()

# Create a collaboration request
def create_collaboration_request(db: Session, ngo_id: int, project_name: str, description: str):
    request = CollaborationRequest(
        ngo_id=ngo_id,
        project_name=project_name,
        description=description,
        status="pending",
        created_at=datetime.utcnow()
    )
    db.add(request)
    db.commit()
    db.refresh(request)
    return request

# Get NGO projects and status
def get_ngo_projects(db: Session, ngo_id: int):
    return db.query(NGOProject).filter(NGOProject.ngo_id == ngo_id).all()
