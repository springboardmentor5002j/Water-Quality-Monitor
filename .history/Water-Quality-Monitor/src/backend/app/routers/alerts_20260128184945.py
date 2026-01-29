from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.alert_model import Alert, AlertType
from app.auth import get_current_user

router = APIRouter(prefix="/alerts", tags=["Alerts"])

# --- Automatic Alert Trigger ---
def trigger_auto_alert(db: Session, station_name: str, location: str, parameter: str, value: float):

    if parameter == "pH" and (value < 6.5 or value > 8.5):
        alert_type = AlertType.contamination
        msg = f"Critical pH level of {value} detected at {station_name}."

    elif parameter == "turbidity" and value > 5.0:
        alert_type = AlertType.boil_notice
        msg = f"High turbidity ({value} NTU) at {station_name}. Boil water advisory."

    elif parameter == "DO" and value < 4.0:
        alert_type = AlertType.outage
        msg = f"Low Dissolved Oxygen ({value} mg/L) at {station_name}. Aquatic health risk."

    else:
        return

    db.add(Alert(
        type=alert_type,
        message=msg,
        location=location
    ))
    db.commit()

# --- Endpoints ---

@router.get("/all")
def get_all_alerts(db: Session = Depends(get_db)):
    return db.query(Alert).order_by(Alert.issued_at.desc()).all()

@router.get("/by_location")
def get_alerts_by_location(location: str, db: Session = Depends(get_db)):
    return (
        db.query(Alert)
        .filter(Alert.location.ilike(f"%{location}%"))
        .order_by(Alert.issued_at.desc())
        .all()
    )

@router.delete("/clear_all")
def clear_all_alerts(db: Session = Depends(get_db), user=Depends(get_current_user)):
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    db.query(Alert).delete()
    db.commit()
    return {"message": "Alert history cleared"}
