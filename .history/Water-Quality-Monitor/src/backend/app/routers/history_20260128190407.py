from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.user_models import (
    WaterStation,
    StationReading,
    ReadingParameter
)

router = APIRouter(
    prefix="/readings",
    tags=["Historical Readings"]
)

@router.get("/history/location")
def get_history_by_location(
    location: str = Query(..., description="Location name"),
    parameter: ReadingParameter = Query(..., description="Water quality parameter"),
    db: Session = Depends(get_db)
):
    # 1️⃣ Find station by location
    station = (
        db.query(WaterStation)
        .filter(WaterStation.location.ilike(f"%{location}%"))
        .first()
    )

    if not station:
        return []

    # 2️⃣ Get historical readings
    readings = (
        db.query(StationReading)
        .filter(
            StationReading.station_id == station.id,
            StationReading.parameter == parameter
        )
        .order_by(StationReading.recorded_at.asc())
        .all()
    )

    # 3️⃣ Format response
    return [
        {
            "value": float(r.value),
            "recorded_at": r.recorded_at
        }
        for r in readings
    ]
