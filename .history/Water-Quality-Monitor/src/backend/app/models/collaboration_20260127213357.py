from sqlalchemy import Column, Integer, ForeignKey, String, DateTime, func
from app.database import Base

class Collaboration(Base):
    __tablename__ = "collaborations"

    id = Column(Integer, primary_key=True, index=True)
    ngo_id = Column(Integer, ForeignKey("ngos.id"))
    station_id = Column(Integer, ForeignKey("water_stations.id"))
    project_name = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
