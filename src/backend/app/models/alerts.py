from sqlalchemy import Column, Integer, String, Text, Enum, DateTime
from sqlalchemy.sql import func
import enum
from ..database import Base
from ..schema import AlertTypeEnum
from sqlalchemy import Enum

class AlertType(enum.Enum):
    boil_notice = "boil_notice"
    contamination = "contamination"
    outage = "outage"

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(Enum(AlertTypeEnum), nullable=False)
    message = Column(Text, nullable=False)
    location = Column(String(255), nullable=False)
    issued_at = Column(DateTime, server_default=func.now())
