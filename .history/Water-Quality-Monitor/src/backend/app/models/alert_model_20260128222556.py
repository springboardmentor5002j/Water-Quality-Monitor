from sqlalchemy import Column, Integer, String, Text, DateTime, Enum
from sqlalchemy.sql import func
import enum
from app.database import Base

# 🔹 Alert Types (Extended for Week-8)
class AlertType(enum.Enum):
    boil_notice = "boil_notice"
    contamination = "contamination"
    outage = "outage"
    predictive = "predictive"   # ✅ NEW (Week-8)

class Alert(Base):
    __tablename__ = "alerts"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True)
    type = Column(Enum(AlertType), nullable=False)
    message = Column(Text, nullable=False)
    location = Column(String(255), nullable=False)
    issued_at = Column(DateTime, server_default=func.now())
