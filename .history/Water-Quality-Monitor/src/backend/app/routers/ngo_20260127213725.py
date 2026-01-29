from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.crud import create_ngo, get_ngos

router = APIRouter(prefix="/ngos", tags=["NGO"])

@router.post("/")
def add_ngo(
    name: str,
    email: str,
    phone: str = None,
    area: str = None,
    db: Session = Depends(get_db)
):
    return create_ngo(db, name, email, phone, area)

@router.get("/")
def list_ngos(db: Session = Depends(get_db)):
    return get_ngos(db)
