# app/models/__init__.py

# User model
from ..user_models import User

# Report models
from .report import Report, ReportStatus

# Alerts model (if needed)
from .alert_model import Alert  # replace Alert with actual class name

# Water Station models
from .water_station_model import WaterStation, StationReading
