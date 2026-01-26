from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.alert_model import Alert, AlertType
from app.auth import get_current_user
from ..schema import AlertResponse
from sqlalchemy.sql import func

router = APIRouter(prefix="/alerts", tags=["Alerts"])

# --- Internal Logic for Automatic Alerts ---
# This function is called by your Readings router when data is saved
def trigger_auto_alert(db: Session, station_name: str, location: str, parameter: str, value: float):
    # Define your safety criteria here
    is_unsafe = False
    alert_type = None
    msg = ""

    if parameter == "pH" and (value < 6.5 or value > 8.5):
        is_unsafe = True
        alert_type = "contamination"
        msg = f"Critical pH level of {value} detected at {station_name}."
    
    elif parameter == "turbidity" and value > 5.0:
        is_unsafe = True
        alert_type = "boil_notice"
        msg = f"High turbidity ({value} NTU) at {station_name}. Boil water advisory."
    
    elif parameter == "DO" and value < 4.0:
        is_unsafe = True
        alert_type = "outage"
        msg = f"Low Dissolved Oxygen ({value} mg/L) at {station_name}. Aquatic health risk."

    if is_unsafe:
        new_alert = Alert(
            type=alert_type,
            message=msg,
            location=location
        )
        db.add(new_alert)
        db.commit()

# --- Endpoints ---

@router.get("/all")
def get_all_alerts(db: Session = Depends(get_db)):
    alerts = db.query(Alert).order_by(Alert.issued_at.desc()).all()
    return {"alerts": alerts}

@router.get("/by_location")
def get_alerts_by_location(location: str, db: Session = Depends(get_db)):
    alerts = db.query(Alert).filter(Alert.location.ilike(f"%{location}%")).order_by(Alert.issued_at.desc()).all()
    return {"alerts": alerts}

@router.delete("/clear_all")
def clear_all_alerts(db: Session = Depends(get_db), user=Depends(get_current_user)):
    """Admin tool to clear the alert history"""
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    db.query(Alert).delete()
    db.commit()
    return {"message": "Alert history cleared"}