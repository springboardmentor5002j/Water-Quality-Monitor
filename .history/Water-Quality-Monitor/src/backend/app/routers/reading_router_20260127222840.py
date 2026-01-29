from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.user_models import StationReading,WaterStation, ReadingParameter
from app.schema import ReadingHistoryResponse
from typing import List

router = APIRouter(prefix="/readings", tags=["Readings"])

# 🔹 WEEK 6 API – Historical Data
@router.get("/history/location")
def get_history_by_location(
    location: str = Query(...),
    parameter: ReadingParameter = Query(...),  # 🔥 IMPORTANT
    db: Session = Depends(get_db)
):
    readings = (
        db.query(StationReading)
        .join(WaterStation)
        .filter(WaterStation.location.ilike(f"%{location}%"))
        .filter(StationReading.parameter == parameter)  # enum-safe
        .order_by(StationReading.recorded_at.asc())
        .all()
    )

    if not readings:
        return []

    return [
        {
            "recorded_at": r.recorded_at,
            "value": float(r.value),
        }
        for r in readings
    ]