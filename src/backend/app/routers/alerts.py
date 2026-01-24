from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.alerts import Alert, AlertType
from ..auth import get_current_user
from ..schema import AlertCreate, AlertResponse
from ..models.alerts import Alert

router = APIRouter(prefix="/alerts", tags=["Alerts"])

# -------------------------
# Create Alert (Admin only)
# -------------------------
@router.post("/", response_model=AlertResponse)
def create_alert(
    alert: AlertCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    if user.role not in ["admin", "authority"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    new_alert = Alert(**alert.dict())
    db.add(new_alert)
    db.commit()
    db.refresh(new_alert)
    return new_alert

# -------------------------
# Get alerts by location
# -------------------------
@router.get("/by_location")
def get_alerts_by_location(
    location: str,
    db: Session = Depends(get_db)
):
    alerts = (
        db.query(Alert)
        .filter(Alert.location.ilike(f"%{location}%"))
        .order_by(Alert.issued_at.desc())
        .all()
    )
    return {"alerts": alerts}
