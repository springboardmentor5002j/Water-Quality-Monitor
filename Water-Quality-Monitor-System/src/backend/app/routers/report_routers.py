from fastapi import APIRouter, Depends, UploadFile, File, Form, Query, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..auth import get_current_user
from app.user_models import Report, ReportStatus, User
import os, shutil, uuid
from typing import List

router = APIRouter(prefix="/reports", tags=["Reports"])

# ------------------------------
# Upload directory setup
# ------------------------------
UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../uploads"))
os.makedirs(UPLOAD_DIR, exist_ok=True)

# ------------------------------
# CREATE REPORT
# ------------------------------
@router.post("/")
async def create_report(
    photo: UploadFile = File(...),
    location: str = Form(...),
    description: str = Form(...),
    water_source: str = Form(...),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Endpoint for users/NGOs to submit a water quality report with a photo.
    """
    # Generate unique filename
    ext = photo.filename.split(".")[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    path = os.path.join(UPLOAD_DIR, filename)

    # Save file to uploads
    with open(path, "wb") as f:
        shutil.copyfileobj(photo.file, f)

    # Create DB entry
    report = Report(
        user_id=current_user.id,
        photo_url=f"/uploads/{filename}",
        location=location,
        description=description,
        water_source=water_source,
        status=ReportStatus.pending,
    )

    db.add(report)
    db.commit()
    db.refresh(report)

    return {"message": "Report created", "id": report.id}

# ------------------------------
# GET MY REPORTS
# ------------------------------
@router.get("/my")
def get_my_reports(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Fetch all reports submitted by the logged-in user.
    """
    reports = db.query(Report).filter(Report.user_id == current_user.id).all()

    return {
        "data": [
            {
                "id": r.id,
                "photo_url": f"http://localhost:8000{r.photo_url}",
                "location": r.location,
                "water_source": r.water_source,
                "description": r.description,
                "status": r.status.value,
                "reported_by": current_user.name,
                "created_at": r.created_at,
            }
            for r in reports
        ]
    }

# ------------------------------
# GET ALL REPORTS
# ------------------------------
@router.get("/all")
def get_all_reports(db: Session = Depends(get_db)):
    """
    Fetch all reports (for admin/NGO/authority dashboards).
    """
    reports = db.query(Report).join(User).all()

    return {
        "data": [
            {
                "id": r.id,
                "photo_url": f"http://localhost:8000{r.photo_url}",
                "location": r.location,
                "description": r.description,
                "water_source": r.water_source,
                "status": r.status.value,
                "created_at": r.created_at,
                "reported_by": r.user.name if r.user else "Unknown"
            }
            for r in reports
        ]
    }

# ------------------------------
# UPDATE REPORT STATUS
# ------------------------------
@router.patch("/{report_id}/status")
def update_report_status(
    report_id: int,
    status: ReportStatus = Query(...),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Update status of a report (pending -> verified/rejected)
    """
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    report.status = status
    db.commit()
    return {"message": "Status updated"}

# ------------------------------
# DELETE REPORT (ADMIN ONLY)
# ------------------------------
@router.delete("/{report_id}")
def delete_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Delete a report (Admin only).
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    db.delete(report)
    db.commit()
    return {"message": "Report deleted"}

# ------------------------------
# GET SINGLE REPORT
# ------------------------------
@router.get("/{report_id}")
def get_report(report_id: int, db: Session = Depends(get_db)):
    """
    Fetch single report details by ID.
    """
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    return {
        "id": report.id,
        "photo_url": f"http://localhost:8000{report.photo_url}",
        "location": report.location,
        "description": report.description,
        "water_source": report.water_source,
        "status": report.status.value,
        "reported_by": report.user.name if report.user else "Unknown",
        "created_at": report.created_at,
    }
