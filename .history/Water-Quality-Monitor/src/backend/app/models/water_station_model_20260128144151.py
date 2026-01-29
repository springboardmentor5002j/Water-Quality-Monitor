from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from ..database import Base
from datetime import datetime

class WaterStation(Base):
    __tablename__ = "water_stations"
    __table_args__ = {"extend_existing": True}  # <-- Add this line

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    location = Column(String, nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    managed_by = Column(String, nullable=True)

    readings = relationship("StationReading", back_populates="station")


class StationReading(Base):
    __tablename__ = "station_readings"
    __table_args__ = {"extend_existing": True}  # <-- Add this line

    id = Column(Integer, primary_key=True, index=True)
    station_id = Column(Integer, ForeignKey("water_stations.id"))
    parameter = Column(String, nullable=False)
    value = Column(Float, nullable=False)
    recorded_at = Column(DateTime, default=datetime.utcnow)

    station = relationship("WaterStation", back_populates="readings")
