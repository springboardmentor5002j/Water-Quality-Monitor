from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.crud import create_collaboration, get_collaborations

router = APIRouter(prefix="/collaborations", tags=["Collaboration"])

@router.post("/")
def add_collaboration(
    ngo_id: int,
    station_id: int,
    project_name: str,
    db: Session = Depends(get_db)
):
    return create_collaboration(db, ngo_id, station_id, project_name)

@router.get("/")
def list_collaborations(db: Session = Depends(get_db)):
    return get_collaborations(db)
