from sqlalchemy.orm import Session
from datetime import datetime
import requests
from ..models import WaterStation, StationReading
import requests as req_module
import math

EPA_STATION_URL = "https://www.waterqualitydata.us/data/Station/search"
EPA_RESULT_URL = "https://www.waterqualitydata.us/data/Result/search"

EPA_PARAM_MAP = {
    "pH": "pH",
    "Lead": "lead",
    "Arsenic": "arsenic",
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
# Fetch EPA Stations
# -------------------------
def fetch_epa_stations():
    params = {"countrycode": "US", "mimeType": "geojson"}
    r = requests.get(EPA_STATION_URL, params=params, timeout=30)
    r.raise_for_status()
    return r.json()

# -------------------------
# Fetch EPA Results for a station
# -------------------------
def fetch_epa_results(station_code):
    params = {"siteid": station_code, "mimeType": "json", "sorted": "yes"}
    r = requests.get(EPA_RESULT_URL, params=params, timeout=30)
    r.raise_for_status()
    return r.json()

# -------------------------
# Ingest EPA data (dynamic)
# -------------------------
def ingest_epa_data(db: Session, limit: int = 50, lat: float = None, lon: float = None, radius_km: float = 100):
    try:
        stations_geo = fetch_epa_stations()
    except Exception as e:
        print("Failed to fetch EPA stations:", e)
        return

    count = 0
    for feature in stations_geo.get("features", []):
        if count >= limit:
            break

        props = feature.get("properties", {})
        coords = feature.get("geometry", {}).get("coordinates", [])
        station_name = props.get("MonitoringLocationName")
        station_code = props.get("MonitoringLocationIdentifier")
        location = "United States"

        if len(coords) == 2:
            s_lon, s_lat = coords[0], coords[1]
        else:
            coords = geocode_location(location)
            if coords:
                s_lat, s_lon = coords
            else:
                print(f"Skipping '{station_name}' — no coordinates found")
                continue

        # Filter by user location if provided
        if lat is not None and lon is not None:
            distance = haversine(lat, lon, s_lat, s_lon)
            if distance > radius_km:
                continue  # skip stations outside radius

        if not station_name or not station_code:
            continue

        # Check if station already exists
        station = db.query(WaterStation).filter(WaterStation.name == station_name).first()
        if not station:
            station = WaterStation(
                name=station_name,
                location=location,
                latitude=s_lat,
                longitude=s_lon,
                managed_by="US EPA",
                created_at=datetime.utcnow(),
            )
            db.add(station)
            db.commit()
            db.refresh(station)
            print(f"Ingested EPA station: {station_name} ({location})")

        # Fetch readings for this station
        try:
            results = fetch_epa_results(station_code)
        except Exception as e:
            print(f"Failed to fetch results for {station_name}: {e}")
            continue

        readings_added = 0
        for row in results.get("Results", [])[:5]:  # limit first 5 readings
            param = row.get("CharacteristicName")
            value = row.get("ResultMeasureValue")
            date = row.get("ActivityStartDate")

            if param not in EPA_PARAM_MAP or value is None or not date:
                continue

            try:
                reading = StationReading(
                    station_id=station.id,
                    parameter=EPA_PARAM_MAP[param],
                    value=float(value),
                    recorded_at=datetime.strptime(date, "%Y-%m-%d"),
                )
                db.add(reading)
                readings_added += 1
            except ValueError:
                print(f"Invalid reading value for {param} at {station_name}: {value}")
                continue

        if readings_added > 0:
            db.commit()
            count += 1

    print(f"Total EPA stations ingested: {count}")
