import requests

def get_lat_lon(location: str):
    url = "https://nominatim.openstreetmap.org/search"
    params = {
        "q": location,
        "format": "json",
        "limit": 1
    }
    headers = {
        "User-Agent": "WaterQualityApp"
    }

    response = requests.get(url, params=params, headers=headers)
    data = response.json()

    if not data:
        return None, None

    return float(data[0]["lat"]), float(data[0]["lon"])