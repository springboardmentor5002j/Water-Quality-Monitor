from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schema import CollaborationCreate, CollaborationOut

from app.crud import create_collaboration, get_collaborations

router = APIRouter(prefix="/collaborations", tags=["Collaborations"])

@router.get("/", response_model=list[CollaborationOut])
def list_collaborations(db: Session = Depends(get_db)):
    return get_collaborations(db)

@router.post("/", response_model=CollaborationOut)
def add_collaboration(collab: CollaborationCreate, db: Session = Depends(get_db)):
    return create_collaboration(db, collab.dict())
