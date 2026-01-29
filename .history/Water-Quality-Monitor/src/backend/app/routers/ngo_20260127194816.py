from sqlalchemy import Column, Integer, String, Text, Enum, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from ..database import Base
import enum
from sqlalchemy.sql import func

class CollaborationStatus(str, enum.Enum):
    pending = "pending"
    active = "active"
    completed = "completed"

class NGO(Base):
    __tablename__ = "ngos"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    contact_email = Column(String, nullable=False, unique=True)
    contact_phone = Column(String)
    area_of_operation = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    collaborations = relationship("Collaboration", back_populates="ngo")


class Collaboration(Base):
    __tablename__ = "collaborations"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True)
    ngo_id = Column(Integer, ForeignKey("ngos.id"))
    station_id = Column(Integer, ForeignKey("stations.id"))  # link to water station
    status = Column(Enum(CollaborationStatus), default=CollaborationStatus.pending)
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    ngo = relationship("NGO", back_populates="collaborations")
    # you can add station relationship if needed
