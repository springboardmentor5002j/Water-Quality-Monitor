from app.database import SessionLocal
from app.models.alert_model import Alert
from app.constants import PH_MIN, PH_MAX, TURBIDITY_MAX

def check_predictive_alert(station_id, location, parameter, value):
    db = SessionLocal()
    alert_message = None

    if parameter == "pH":
        if value < PH_MIN or value > PH_MAX:
            alert_message = f"⚠️ Abnormal pH detected: {value}"

    if parameter == "turbidity":
        if value > TURBIDITY_MAX:
            alert_message = f"⚠️ High turbidity detected: {value}"

    if alert_message:
        alert = Alert(
            station_id=station_id,
            location=location,
            type="predictive",
            message=alert_message
        )
        db.add(alert)
        db.commit()

    db.close()
