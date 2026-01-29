# routers/dashboard.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from app.user_models import WaterStation, StationReading, Report, ReportStatus
from math import radians, cos, sin, asin, sqrt

router = APIRouter() 

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