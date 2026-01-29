from sqlalchemy import Column, Integer, String, Text, Enum, ForeignKey, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum

from ..database import Base


# ---------------------------
# REPORT STATUS ENUM
# ---------------------------
class ReportStatus(str, enum.Enum):
    pending = "pending"
    verified = "verified"
    rejected = "rejected"


# ---------------------------
# REPORT MODEL
# ---------------------------
class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)

    # who submitted the report (citizen)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    photo_url = Column(String, nullable=False)
    location = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    water_source = Column(String, nullable=False)

    # NGO / Authority will change this
    status = Column(
        Enum(ReportStatus, name="report_status_enum"),
        default=ReportStatus.pending,
        nullable=False,
    )

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # ---------------------------
    # RELATIONSHIPS
    # ---------------------------
    user = relationship(
        "User",
        back_populates="reports"
    )
