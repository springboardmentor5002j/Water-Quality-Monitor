# routers/dashboard.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Report, ReportStatus

from math import radians, cos, sin, asin, sqrt
from ..auth import get_current_user
from ..models import User, Collaboration , WaterStation
from sqlalchemy import text
from fastapi import HTTPException
from pydantic import BaseModel
from datetime import datetime



router = APIRouter()
router = APIRouter(prefix="/dashboard", tags=["Dashboard"])
# -----------------------------
# Haversine formula to calculate distance in km
# -----------------------------
def haversine(lat1, lon1, lat2, lon2):
    R = 6371  # Earth radius in km
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a = sin(dlat/2)**2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a))
    return R * c
#----------------
class CollaborationCreate(BaseModel):
    ngo_id: int
    station_id: int
    project_name: str
    contact_email: str


class CollaborationResponse(BaseModel):
    project_name: str
    station_name: str
    station_location: str
    contact_email: str
    created_at: datetime | None
# -----------------------------
# Endpoint: Get stations + latest readings + verified reports
# -----------------------------
@router.get("/stations/by_location_full")
def get_stations_full(
    lat: float,
    lon: float,
    radius_km: float = 100,
    db: Session = Depends(get_db)
):
    stations = db.query(WaterStation).all()
    result = []

    for s in stations:
        # Skip stations without coordinates
        if not s.latitude or not s.longitude:
            continue

        dist = haversine(lat, lon, float(s.latitude), float(s.longitude))
        if dist > radius_km:
            continue

        # Fetch latest readings per parameter
        readings = (
            db.query(StationReading)
            .filter(StationReading.station_id == s.id)
            .order_by(StationReading.recorded_at.desc())
            .all()
        )

        latest_per_param = {}
        for r in readings:
            if r.parameter not in latest_per_param:
                latest_per_param[r.parameter] = r

        # Fetch verified reports at the same station location
        verified_reports = (
            db.query(Report)
            .filter(Report.location == s.location, Report.status == ReportStatus.verified)
            .all()
        )

        result.append({
            "id": s.id,
            "name": s.name,
            "location": s.location,
            "latitude": float(s.latitude),
            "longitude": float(s.longitude),
            "managed_by": s.managed_by,
            "distance_km": dist,
            "latest_readings": [
                {
                    "id": r.id,
                    "parameter": r.parameter.value if hasattr(r.parameter, "value") else r.parameter,
                    "value": float(r.value),
                    "recorded_at": r.recorded_at.isoformat()
                }
                for r in latest_per_param.values()
            ],
            "verified_reports": [
                {
                    "id": rep.id,
                    "description": rep.description,
                    "water_source": rep.water_source,
                    "reported_by": rep.user.name if rep.user else "Anonymous",
                    "created_at": rep.created_at.isoformat()
                }
                for rep in verified_reports
            ]
        })

    return {"stations": result}



# -----------------------------
# ngo_collaborations endpoint
# -----------------------------


@router.get("/ngo/my-collaborations")
def get_my_collaborations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "ngo":
        return {"collaborations": []}

    collaborations = (
        db.query(Collaboration)
        .filter(Collaboration.ngo_id == current_user.id)
        .all()
    )

    response = []

    for c in collaborations:
        station = db.query(WaterStation).filter(
            WaterStation.id == c.station_id
        ).first()

        response.append({
            "project_name": c.project_name,
            "station_name": station.name if station else "Unknown",
            "station_location": station.location if station else "Unknown",
            "contact_email": c.contact_email,
            "created_at": c.created_at.isoformat() if c.created_at else None,
        })

    return {"collaborations": response}


@router.get("/admin/ngos")
def get_all_ngos(db: Session = Depends(get_db)):
    ngos = db.execute(
        text("""
            SELECT id, name, email
            FROM users
            WHERE role = 'ngo'
        """)
    ).fetchall()

    return {
        "ngos": [
            {"id": n.id, "name": n.name, "email": n.email}
            for n in ngos
        ]
    }

@router.post("/admin/collaborations")
def assign_ngo_to_station(
    payload: CollaborationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    collaboration = Collaboration(
        ngo_id=payload.ngo_id,
        station_id=payload.station_id,
        project_name=payload.project_name,
        contact_email=payload.contact_email,
    )

    db.add(collaboration)
    db.commit()
    db.refresh(collaboration)

    return {"message": "NGO assigned successfully"}