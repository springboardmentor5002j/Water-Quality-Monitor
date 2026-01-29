# app/models/__init__.py

# User model
from ..user_models import User

# Report models
from .report import Report, ReportStatus

# Alerts (if any)
from .alert_model import Alert  # replace with actual class name

# Water Station models
from .water_station_model import WaterStation, StationReading
