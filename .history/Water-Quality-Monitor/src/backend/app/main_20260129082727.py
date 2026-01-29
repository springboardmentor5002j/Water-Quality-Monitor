import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.database import Base, engine

# Routers
from app.auth import router as auth_router
from app.routers.report_routers import router as report_router
from app.routers.stations import router as station_router
from app.routers.history import router as history_router
from app.routers.alerts import router as alerts_router
from app.routers.geocode import router as geocode_router
from app.routers import ngo
from app.routers.dashboard import router as dashboard_router  # ✅ MAKE SURE THIS FILE EXISTS

# ------------------------
# Create DB tables
# ------------------------
Base.metadata.create_all(bind=engine)

# ------------------------
# FastAPI app
# ------------------------
app = FastAPI()

# ------------------------
# CORS
# ------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------
# Static files (uploads)
# ------------------------
UPLOAD_DIR = os.path.abspath("uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# ------------------------
# Include Routers
# ------------------------
app.include_router(auth_router, prefix="/auth")
app.include_router(report_router)
app.include_router(station_router)
app.include_router(history_router)
app.include_router(alerts_router)      # ✅ ALERTS
app.include_router(geocode_router)
app.include_router(dashboard_router)
app.include_router(ngo.router)
