from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.database import get_db
from app.user_models import WaterStation, StationReading, ReadingParameter, Report, ReportStatus
from ..api_fetch.cpcb import ingest_cpcb_data, geocode_location
from ..api_fetch.openaq import ingest_openaq_data
from ..api_fetch.epa import ingest_epa_data
import math
from app.auth import get_current_user
from app.models.alert_model import Alert
from app.routers.alerts import trigger_auto_alert # Ensure this path is correct

router = APIRouter(prefix="/stations", tags=["Stations"])

def haversine(lat1, lon1, lat2, lon2):
    R = 6371
    dlat, dlon = math.radians(lat2 - lat1), math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    return 2 * R * math.asin(math.sqrt(a))

@router.get("/by_location_full")
def get_stations_with_readings(
    location: str | None = Query(None),
    lat: float | None = Query(None),
    lon: float | None = Query(None),
    radius_km: float = Query(1000),
    db: Session = Depends(get_db),
):
    # 1. Resolve Coordinates
    user_lat, user_lon = 0.0, 0.0
    if lat is not None and lon is not None:
        user_lat, user_lon = lat, lon
    elif location:
        coords = geocode_location(location)
        if coords: user_lat, user_lon = coords
        else:
            station = db.query(WaterStation).filter(WaterStation.location.ilike(f"%{location}%")).first()
            if station: user_lat, user_lon = float(station.latitude), float(station.longitude)
    
    # 2. Helper for fetching nearby
    def get_nearby_stations():
        all_s = db.query(WaterStation).all()
        return [s for s in all_s if s.latitude and haversine(user_lat, user_lon, float(s.latitude), float(s.longitude)) <= radius_km]

    nearby_stations = get_nearby_stations()

    # 3. Dynamic Ingestion if empty
    if not nearby_stations:
        try:
            ingest_cpcb_data(db, limit=20)
            ingest_openaq_data(db, limit=20, lat=user_lat, lon=user_lon, radius_km=radius_km)
            nearby_stations = get_nearby_stations()
        except Exception as e: print(f"Ingestion error: {e}")

    # 4. Process Each Station and Trigger Alerts
    final_stations = []
    for s in nearby_stations:
        readings = []
        for param in ReadingParameter:
            r = db.query(StationReading).filter(
                StationReading.station_id == s.id, 
                StationReading.parameter == param
            ).order_by(desc(StationReading.recorded_at)).first()

            if r:
                val = float(r.value)
                readings.append({"parameter": r.parameter.value, "value": val, "recorded_at": r.recorded_at})
                
                # --- AUTOMATIC ALERT TRIGGER ---
                # This ensures every parameter for every station is checked
                trigger_auto_alert(
                    db=db, 
                    station_name=s.name, 
                    location=s.location, 
                    parameter=r.parameter.value, 
                    value=val
                )

        # Fetch local alerts for this specific station location
        station_alerts = db.query(Alert).filter(Alert.location.ilike(f"%{s.location}%")).all()
        
        final_stations.append({
            "id": s.id,
            "name": s.name,
            "location": s.location,
            "latitude": s.latitude,
            "longitude": s.longitude,
            "distance_km": round(haversine(user_lat, user_lon, float(s.latitude), float(s.longitude)), 2),
            "latest_readings": readings,
            "alerts": [{"id": a.id, "type": a.type, "message": a.message} for a in station_alerts]
        })

    # 5. Build Global Response
    search_query = location if location else "General"
    global_alerts = db.query(Alert).filter(Alert.location.ilike(f"%{search_query}%")).all()

    return {
        "count": len(final_stations),
        "user_location": {"latitude": user_lat, "longitude": user_lon},
        "stations": final_stations,
        "alerts": [{"id": a.id, "type": a.type, "message": a.message} for a in global_alerts]
    }
@router.get("/locations")
def get_station_locations(db: Session = Depends(get_db)):
    """Return all unique station locations for dropdown selection."""
    locations = db.query(WaterStation.location).distinct().all()
    return [loc[0] for loc in locations]  # return array of strings
