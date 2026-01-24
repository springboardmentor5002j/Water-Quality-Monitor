from sqlalchemy.orm import Session
from datetime import datetime
import requests
from app.user_models import WaterStation, StationReading
import requests as req_module
import math

OPENAQ_URL = "https://api.openaq.org/v2/locations"

OPENAQ_PARAM_MAP = {
    "pm25": "PM2.5",
    "pm10": "PM10",
    "no2": "NO2",
    "so2": "SO2",
    "o3": "O3"
}

# -------------------------
# Geocode location using Nominatim
# -------------------------
def geocode_location(location: str):
    try:
        url = "https://nominatim.openstreetmap.org/search"
        params = {"q": location, "format": "json", "limit": 1}
        r = req_module.get(url, params=params, timeout=10)
        r.raise_for_status()
        data = r.json()
        if not data:
            return None
        return float(data[0]["lat"]), float(data[0]["lon"])
    except Exception as e:
        print("Geocoding error:", e)
        return None

# -------------------------
# Haversine distance
# -------------------------
def haversine(lat1, lon1, lat2, lon2):
    R = 6371  # km
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
# Ingest OpenAQ data dynamically
# -------------------------
def ingest_openaq_data(db: Session, limit: int = 50, lat: float = None, lon: float = None, radius_km: float = 100):
    params = {"country": "IN", "limit": 100, "page": 1}
    count = 0

    while count < limit:
        try:
            res = requests.get(OPENAQ_URL, params=params, timeout=30)
            res.raise_for_status()
            data = res.json()
        except Exception as e:
            print(f"Failed to fetch OpenAQ page {params['page']}: {e}")
            break

        results = data.get("results", [])
        if not results:
            break

        for loc in results:
            if count >= limit:
                break

            station_name = loc.get("name") or "Unknown Station"
            coords = loc.get("coordinates", {})
            s_lat = coords.get("latitude")
            s_lon = coords.get("longitude")
            location = loc.get("city") or "India"

            # Geocode if missing
            if s_lat is None or s_lon is None:
                coords = geocode_location(location)
                if coords:
                    s_lat, s_lon = coords
                else:
                    print(f"Skipping '{station_name}' — no coordinates")
                    continue

            # Filter by user location if provided
            if lat is not None and lon is not None:
                distance = haversine(lat, lon, s_lat, s_lon)
                if distance > radius_km:
                    continue  # skip outside radius

            # Check if station exists
            station = db.query(WaterStation).filter(WaterStation.name == station_name).first()
            if not station:
                station = WaterStation(
                    name=station_name,
                    location=location,
                    latitude=s_lat,
                    longitude=s_lon,
                    managed_by="OpenAQ",
                    created_at=datetime.utcnow()
                )
                db.add(station)
                db.commit()
                db.refresh(station)
                print(f"Ingested OpenAQ station: {station_name} ({location})")

            # Add readings
            readings_added = 0
            for measurement in loc.get("parameters", []):
                param = measurement.get("parameter")
                value = measurement.get("lastValue")
                if param not in OPENAQ_PARAM_MAP or value is None:
                    continue
                try:
                    reading = StationReading(
                        station_id=station.id,
                        parameter=OPENAQ_PARAM_MAP[param],
                        value=float(value),
                        recorded_at=datetime.utcnow()
                    )
                    db.add(reading)
                    readings_added += 1
                except ValueError:
                    print(f"Invalid value for {param} at {station_name}: {value}")
                    continue

            if readings_added > 0:
                db.commit()
                count += 1

        params["page"] += 1

    print(f"Total OpenAQ stations ingested: {count}")
