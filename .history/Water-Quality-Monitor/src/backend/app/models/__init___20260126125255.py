# Import all your model classes here

# User model
from .user_models import User

# Water stations and readings
from .stations import WaterStation, StationReading

# Reading parameters enum
from .report_schema import ReadingParameter

# Reports, NGO projects, collaboration requests
from .report import Report, NGOProject
from .alerts_model import CollaborationRequest
