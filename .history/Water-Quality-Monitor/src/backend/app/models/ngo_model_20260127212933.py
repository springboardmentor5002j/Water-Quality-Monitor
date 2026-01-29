from sqlalchemy import Column, Integer, String, DateTime, func
from app.database import Base

class NGO(Base):
    __tablename__ = "ngos"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    contact = Column(String, nullable=True)
    area = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
