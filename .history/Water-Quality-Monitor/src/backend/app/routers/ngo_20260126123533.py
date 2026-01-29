from fastapi import APIRouter, Depends
from app import crud
from app.authorization.jwt_handler import verify_token

router = APIRouter(
    prefix="/ngo",
    tags=["NGO"]
)

# Example route: Get all reports
@router.get("/reports")
def get_reports(token: str = Depends(verify_token)):
    return crud.get_all_reports()
