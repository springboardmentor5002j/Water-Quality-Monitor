from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.user_models import Report, ReportStatus
from app.auth import get_current_user

router = APIRouter(prefix="/ngo", tags=["NGO Dashboard"])

# ---------------- GET ALL REPORTS (NGO VIEW) ----------------
@router.get("/reports")
def get_all_reports(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    # OPTIONAL role check (recommended for real-time project)
    if current_user.role not in ["ngo", "admin"]:
        raise HTTPException(status_code=403, detail="Access denied")

    reports = db.query(Report).all()

    return {
        "reports": [
            {
                "id": r.id,
                "location": r.location,
                "water_source": r.water_source,
                "description": r.description,
                "status": r.status.value,
                "photo_url": f"http://localhost:8000{r.photo_url}",
                "created_at": r.created_at,
                "reported_by": r.user.name if r.user else "Unknown",
            }
            for r in reports
        ]
    }

# ---------------- VERIFY REPORT ----------------
@router.patch("/reports/{report_id}/verify")
def verify_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    if current_user.role not in ["ngo", "admin"]:
        raise HTTPException(status_code=403, detail="Access denied")

    report = db.query(Report).filter(Report.id == report_id).first()

    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    report.status = ReportStatus.verified
    db.commit()

    return {"message": "Report verified successfully"}

# ---------------- REJECT REPORT ----------------
@router.patch("/reports/{report_id}/reject")
def reject_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    if current_user.role not in ["ngo", "admin"]:
        raise HTTPException(status_code=403, detail="Access denied")

    report = db.query(Report).filter(Report.id == report_id).first()

    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    report.status = ReportStatus.rejected
    db.commit()

    return {"message": "Report rejected successfully"}
