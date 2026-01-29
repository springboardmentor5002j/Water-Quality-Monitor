import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.database import Base, engine

# ✅ IMPORT MODELS FIRST (VERY IMPORTANT)
from app.models import report
from app.models.user_models import User

# ✅ Create tables ONLY ONCE
Base.metadata.create_all(bind=engine)

# ✅ NOW create app
app = FastAPI()

# CORS
origins = ["http://localhost:5173"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files
UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../uploads"))
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# ✅ Routers IMPORT AFTER tables created
from app.routers.report_routers import router as report_router
from app.routers.stations import router as station_router
from app.routers.dashboard import router as dashboard_router
from app.routers.geocode import router as geocode_router
from app.auth import router as auth_router

# Include routers
app.include_router(auth_router, prefix="/auth")
app.include_router(report_router)
app.include_router(station_router)
app.include_router(dashboard_router)
app.include_router(geocode_router)
