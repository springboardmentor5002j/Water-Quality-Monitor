@router.get("/verified_reports_by_location")
def get_verified_reports_by_location(
    location: str = Query(..., description="Name of the location"),
    db: Session = Depends(get_db)
):
    """
    Return all verified reports for a specific location.
    Strips trailing spaces and performs a case-insensitive match.
    """
    # 1. Clean the input
    location_clean = location.strip()  # removes trailing/leading spaces

    # 2. Query verified reports
    reports = db.query(Report).filter(
        Report.location.ilike(f"%{location_clean}%"),  # partial match, case-insensitive
        Report.status == ReportStatus.verified  # only verified reports
    ).all()

    # 3. Return results
    if not reports:
        return {"verified_reports": []}  # return empty array instead of 404

    return {
        "verified_reports": [
            {
                "id": r.id,
                "user_id": r.user_id,
                "photo_url": r.photo_url,
                "location": r.location,
                "description": r.description,
                "water_source": r.water_source,
                "status": r.status.value,
                "created_at": r.created_at
            }
            for r in reports
        ]
    }
