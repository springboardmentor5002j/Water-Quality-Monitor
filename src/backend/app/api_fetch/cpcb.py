from sqlalchemy.orm import Session
from datetime import datetime
import csv, io, requests
from ..models import WaterStation, StationReading
import requests as req_module  # for geocoding
import math

CPCB_URL = "https://data.gov.in/sites/default/files/Water_Quality_Indicators.csv"

CPCB_PARAM_MAP = {
    "ph": "ph",
    "Lead": "lead",
    "Arsenic": "arsenic",
    "Turbidity": "turbidity",
    "DO": "DO"
}

# ------------------------
# Haversine distance for filtering stations by user location
# ------------------------
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


# ------------------------
# Geocode location using Nominatim
# ------------------------
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
        print(f"Geocoding failed for '{location}': {e}", flush=True)
        return None


# ------------------------
# Ingest CPCB data with optional location filter
# ------------------------
def ingest_cpcb_data(db: Session, limit: int = 50, lat: float | None = None, lon: float | None = None, radius_km: float = 1000):
    try:
        r = requests.get(CPCB_URL, timeout=30)
        r.raise_for_status()
    except Exception as e:
        print(f"Failed to fetch CPCB CSV: {e}", flush=True)
        return

    reader = csv.DictReader(io.StringIO(r.content.decode("utf-8")))
    count = 0

    for row in reader:
        if count >= limit:
            break

        station_name = (row.get("Station Name") or "Unknown Station").strip()
        lat_val = float(row.get("Latitude") or 0)
        lon_val = float(row.get("Longitude") or 0)
        location_name = (row.get("State") or "India").strip()

        # Geocode if coordinates missing
        if lat_val == 0 or lon_val == 0:
            coords = geocode_location(location_name)
            if coords:
                lat_val, lon_val = coords
            else:
                print(f"Skipping '{station_name}' — no coordinates", flush=True)
                continue

        # If user location provided, filter by radius
        if lat is not None and lon is not None:
            distance = haversine(lat, lon, lat_val, lon_val)
            if distance > radius_km:
                continue

        # Check if station already exists
        station = db.query(WaterStation).filter(WaterStation.name == station_name).first()
        if not station:
            station = WaterStation(
                name=station_name,
                location=location_name,
                latitude=lat_val,
                longitude=lon_val,
                managed_by="CPCB",
                created_at=datetime.utcnow()
            )
            db.add(station)
            db.commit()
            db.refresh(station)

        # Save parameters
        for param, db_enum in CPCB_PARAM_MAP.items():
            value_str = row.get(param)
            if value_str is None or value_str.strip() == "":
                continue
            try:
                value = float(value_str)
            except ValueError:
                continue

            reading = StationReading(
                station_id=station.id,
                parameter=db_enum,
                value=value,
                recorded_at=datetime.utcnow()
            )
            db.add(reading)

        db.commit()
        count += 1
        print(f"Ingested station: {station_name}", flush=True)

    print(f"CPCB ingestion completed. Total stations ingested: {count}", flush=True)
