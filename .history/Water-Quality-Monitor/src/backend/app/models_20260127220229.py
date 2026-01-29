from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Enum,
    Float,
    ForeignKey,
    DateTime,
    Numeric,
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum

from .database import Base
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.sql import func

# -------------------------------------
# USER ROLES
# -------------------------------------
class UserRole(str, enum.Enum):
    citizen = "citizen"
    ngo = "ngo"
    authority = "authority"
    admin = "admin"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True)
    password = Column(String(255))
    role = Column(Enum(UserRole), default=UserRole.citizen)
    location = Column(String(255))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    reports = relationship("Report", back_populates="user")


# -------------------------------------
# REPORT STATUS
# -------------------------------------
class ReportStatus(str, enum.Enum):
    pending = "pending"
    verified = "verified"
    rejected = "rejected"


# -------------------------------------
# MODEL: REPORTS
# -------------------------------------
class Report(Base):
    __tablename__ = "reports"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    photo_url = Column(String(500), nullable=False)
    location = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    water_source = Column(String(255), nullable=False)
    status = Column(Enum(ReportStatus), default=ReportStatus.pending)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="reports")


# -------------------------------------
# READING PARAMETERS ENUM
# -------------------------------------
class ReadingParameter(enum.Enum):
    ph = "ph"
    temperature = "temperature"
    conductance = "conductance"
    discharge = "discharge"
    dissolved_oxygen = "dissolved_oxygen"



# -------------------------------------
# MODEL: WATER STATIONS
# -------------------------------------
class WaterStation(Base):
    __tablename__ = "water_stations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    location = Column(String(255), nullable=False)
    latitude = Column(Numeric)
    longitude = Column(Numeric)
    managed_by = Column(String(255))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    readings = relationship("StationReading", back_populates="station")


# -------------------------------------
# MODEL: STATION READINGS
# -------------------------------------
class StationReading(Base):
    __tablename__ = "station_readings"

    id = Column(Integer, primary_key=True, index=True)
    station_id = Column(Integer, ForeignKey("water_stations.id"))
    parameter = Column(Enum(ReadingParameter))
    value = Column(Numeric)
    recorded_at = Column(DateTime(timezone=True), server_default=func.now())

    station = relationship("WaterStation", back_populates="readings")


# -------------------------------------
# ALERT TYPES ENUM
# -------------------------------------
class AlertType(str, enum.Enum):
    boil_notice = "boil notice"
    contamination = "contamination"
    outage = "outage"


# -------------------------------------
# MODEL: ALERTS
# -------------------------------------
class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(Enum(AlertType))
    message = Column(Text)
    location = Column(String(255))
    issued_at = Column(DateTime(timezone=True), server_default=func.now())


# -------------------------------------
# MODEL: COLLABORATIONS
# -------------------------------------


class Collaboration(Base):
    __tablename__ = "collaborations"

    id = Column(Integer, primary_key=True, index=True)
    ngo_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    station_id = Column(Integer, ForeignKey("water_stations.id"), nullable=False)
    project_name = Column(String, nullable=False)
    contact_email = Column(String, nullable=False)

    # ✅ THIS LINE FIXES EVERYTHING
    created_at = Column(DateTime(timezone=True), server_default=func.now())