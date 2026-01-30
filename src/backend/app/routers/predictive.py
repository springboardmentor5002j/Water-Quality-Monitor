from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.predictive import generate_predictive_alerts

router = APIRouter(prefix="/predictive", tags=["Predictive"])

@router.post("/run")
def run_prediction(db: Session = Depends(get_db)):
    alerts = generate_predictive_alerts(db)
    return {
        "generated": len(alerts),
        "alerts": alerts
    }
