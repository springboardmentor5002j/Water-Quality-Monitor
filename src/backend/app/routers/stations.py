from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.user_models import WaterStation, StationReading, ReadingParameter, Report, ReportStatus, User
from ..api_fetch.cpcb import ingest_cpcb_data, geocode_location
from ..api_fetch.openaq import ingest_openaq_data
from ..api_fetch.epa import ingest_epa_data
import math
from app.auth import get_current_user
from app.models.alert_model import Alert
router = APIRouter(prefix="/stations", tags=["Stations"])

# -------------------------
# Haversine distance
# -------------------------
def haversine(lat1, lon1, lat2, lon2):
    R = 6371  # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlon / 2) ** 2
    )
    return 2 * R * math.asin(math.sqrt(a))


# -------------------------
# Get stations with readings (dynamic ingestion if needed)
# -------------------------
@router.get("/by_location_full")
def get_stations_with_readings(
    location: str | None = Query(None),
    lat: float | None = Query(None),
    lon: float | None = Query(None),
    radius_km: float = Query(1000),
    db: Session = Depends(get_db),
):
    # 1️⃣ Resolve coordinates
    if lat is not None and lon is not None:
        user_lat, user_lon = lat, lon
    elif location:
        coords = geocode_location(location)
        if coords:
            user_lat, user_lon = coords
        else:
            # 🔁 Fallback: if no geocode, try to get first matching station
            station = db.query(WaterStation).filter(WaterStation.location.ilike(f"%{location}%")).first()
            if station:
                user_lat, user_lon = float(station.latitude), float(station.longitude)
            else:
                # 🔹 If completely unknown location → default coordinates (0,0)
                user_lat, user_lon = 0.0, 0.0
    else:
        raise HTTPException(status_code=400, detail="Provide location or lat/lon")

    # -------------------------
    # Helper: fetch nearby stations
    # -------------------------
    def get_nearby_stations():
        stations = db.query(WaterStation).all()
        result = []
        for s in stations:
            if s.latitude is None or s.longitude is None:
                continue
            distance = haversine(user_lat, user_lon, float(s.latitude), float(s.longitude))
            if distance <= radius_km:
                result.append(s)
        return result

    # 2️⃣ Fetch nearby stations from DB
    nearby_stations = get_nearby_stations()

    # 3️⃣ If no stations → fetch dynamically from APIs
    if not nearby_stations:
        try:
            print(f"No stations near coordinates ({user_lat}, {user_lon}), fetching dynamically...",flush=True)

            # 🔹 Pass user lat/lon & radius to dynamically fetch only relevant stations
            ingest_cpcb_data(db, limit=50)                       # CPCB: India stations
            ingest_openaq_data(db, limit=50, lat=user_lat, lon=user_lon, radius_km=radius_km)  # OpenAQ filtered
            ingest_epa_data(db, limit=50, lat=user_lat, lon=user_lon, radius_km=radius_km)     # EPA filtered
        except Exception as e:
            print("API ingestion failed:", e, flush=True)

        # 🔹 Refetch nearby stations after ingestion
        nearby_stations = get_nearby_stations()

    # 4️⃣ Build response with readings & reports
    result = []
    for s in nearby_stations:
        latest_readings = []
        for param in ReadingParameter:
            reading = (
                db.query(StationReading)
                .filter(StationReading.station_id == s.id, StationReading.parameter == param)
                .order_by(StationReading.recorded_at.desc())
                .first()
            )
            if reading:
                latest_readings.append({
                    "parameter": reading.parameter.value,
                    "value": float(reading.value),
                    "recorded_at": reading.recorded_at
                })

        # Verified reports at this station
        reports = db.query(Report).filter(
            Report.status == ReportStatus.verified,
            Report.location.ilike(f"%{s.location}%")
        ).all()

        reports_list = []
        for r in reports:
            user_name = db.query(User.name).filter(User.id == r.user_id).scalar() or "Unknown"
            reports_list.append({
                "id": r.id,
                "photo_url": f"http://localhost:8000{r.photo_url}" if r.photo_url else None,
                "description": r.description,
                "water_source": r.water_source,
                "reported_by": user_name,
                "created_at": r.created_at
            })

        distance = haversine(user_lat, user_lon, float(s.latitude), float(s.longitude))
        result.append({
            "id": s.id,
            "name": s.name,
            "location": s.location,
            "latitude": s.latitude,
            "longitude": s.longitude,
            "managed_by": s.managed_by,
            "distance_km": round(distance, 2),
            "latest_readings": latest_readings,
            "verified_reports": reports_list
        })
    alerts = (
        db.query(Alert)
        .filter(Alert.location.ilike(f"%{s.location}%"))
        .all()
    )
    # 🔹 Return even if no stations (frontend map will show user location)
    

    return {
        "count": len(result),
        "user_location": {"latitude": user_lat, "longitude": user_lon},
        "stations": result
    }


# -------------------------
# Verified reports only
# -------------------------
@router.get("/verified_reports_by_location")
def verified_reports_by_location(
    location: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    reports = db.query(Report).filter(
        Report.status == ReportStatus.verified,
        Report.location.ilike(location)
    ).all()

    return {
        "verified_reports": [
            {
                "id": r.id,
                "description": r.description,
                "water_source": r.water_source,
                "reported_by": r.user.name if r.user else "Unknown",
                "created_at": r.created_at,
            }
            for r in reports
        ]
    }

