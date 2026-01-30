from sqlalchemy.orm import Session
from app.user_models import StationReading, WaterStation, Alert, AlertType, ReadingParameter

# Thresholds (simple ML-like rules)
PH_HIGH = 7
PH_LOW = 6.5
TURBIDITY_LIMIT = 5
DO_LOW = 4


def generate_predictive_alerts(db: Session):

    alerts_created = []

    readings = (
        db.query(StationReading)
        .join(WaterStation)
        .all()
    )

    for r in readings:
        station = r.station

        message = None
        alert_type = None

        # ---- pH ----
        if r.parameter == ReadingParameter.pH:
            if float(r.value) > PH_HIGH or float(r.value) < PH_LOW:
                alert_type = AlertType.contamination
                message = f"Critical pH level ({r.value}) detected at {station.name}"

        # ---- Turbidity ----
        if r.parameter == ReadingParameter.turbidity:
            if float(r.value) > TURBIDITY_LIMIT:
                alert_type = AlertType.boil_notice
                message = f"High turbidity ({r.value} NTU) at {station.name}. Boil water advisory."

        # ---- Dissolved Oxygen ----
        if r.parameter == ReadingParameter.DO:
            if float(r.value) < DO_LOW:
                alert_type = AlertType.contamination
                message = f"Low Dissolved Oxygen ({r.value} mg/L) at {station.name}. Aquatic risk."

        if alert_type:
            alert = Alert(
                type=alert_type,
                message=message,
                location=station.location,
            )

            db.add(alert)
            alerts_created.append(alert)

    db.commit()
    return alerts_created
