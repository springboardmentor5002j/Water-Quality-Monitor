from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..crud import create_collaboration, get_collaborations, create_ngo, get_ngos

router = APIRouter(prefix="/collaborations", tags=["collaborations"])

@router.post("/ngo")
def add_ngo(name: str, email: str, phone: str = None, area: str = None, db: Session = Depends(get_db)):
    return create_ngo(db, name, email, phone, area)

@router.get("/ngos")
def list_ngos(db: Session = Depends(get_db)):
    return get_ngos(db)

@router.post("/")
def add_collaboration(ngo_id: int, station_id: int, description: str = None, db: Session = Depends(get_db)):
    return create_collaboration(db, ngo_id, station_id, description)

@router.get("/")
def list_collaborations(station_id: int = None, db: Session = Depends(get_db)):
    return get_collaborations(db, station_id)
