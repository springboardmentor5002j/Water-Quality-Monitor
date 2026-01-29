from app.database import SessionLocal
from app.models.alert_model import Alert, AlertType

# Thresholds
PH_MIN = 6.5
PH_MAX = 8.5
TURBIDITY_MAX = 5

def check_predictive_alert(location, parameter, value):
    db = SessionLocal()
    alert_message = None

    if parameter.lower() == "ph":
        if value < PH_MIN or value > PH_MAX:
            alert_message = f"Abnormal pH detected: {value}"

    elif parameter.lower() == "turbidity":
        if value > TURBIDITY_MAX:
            alert_message = f"High turbidity detected: {value}"

    if alert_message:
        alert = Alert(
            type=AlertType.predictive,
            message=alert_message,
            location=location
        )
        db.add(alert)
        db.commit()

    db.close()
