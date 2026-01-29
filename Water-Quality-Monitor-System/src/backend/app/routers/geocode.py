from fastapi import APIRouter, Query, HTTPException
import requests

router = APIRouter(prefix="/geo", tags=["Geocoding"])

@router.get("/geocode")
def geocode(place: str = Query(...)):
    url = "https://nominatim.openstreetmap.org/search"
    params = {
        "format": "json",
        "q": place,
        "limit": 1
    }
    headers = {
        "User-Agent": "WaterQualityApp/1.0 (contact@yourapp.com)"
    }

    try:
        r = requests.get(url, params=params, headers=headers, timeout=10)
    except Exception:
        raise HTTPException(status_code=502, detail="Geocoding service unavailable")

    if r.status_code != 200:
        raise HTTPException(status_code=502, detail="Geocoding failed")

    data = r.json()
    if not data:
        return {"lat": None, "lon": None}

    return {
        "lat": float(data[0]["lat"]),
        "lon": float(data[0]["lon"]),
        "display_name": data[0]["display_name"]
    }
