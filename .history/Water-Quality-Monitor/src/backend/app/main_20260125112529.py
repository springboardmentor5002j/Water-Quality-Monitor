import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# Import routers
from .routers.report_routers import router as report_router
from .auth import router as auth_router
from .routers.dashboard import router as dashboard_router
from .routers.stations import router as station_router
from .routers.alerts import router as alerts_router
from .routers.geocode import router as geocode_router

# Import database
from .database import Base, engine

# ------------------------
# Create database tables
# ------------------------
Base.metadata.create_all(bind=engine, checkfirst=True)

# ------------------------
# Initialize FastAPI
# ------------------------
app = FastAPI(title="Water Quality Monitoring API")

# ------------------------
# CORS configuration
# ------------------------
origins = [
    "http://localhost:5173",  # Frontend dev server
    "http://127.0.0.1:5173"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------
# Static files (uploads)
# ------------------------
UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../uploads"))
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")
print("Uploads directory:", UPLOAD_DIR)
print("Existing files:", os.listdir(UPLOAD_DIR))

# ------------------------
# Include Routers
# ------------------------
app.include_router(auth_router, prefix="/auth", tags=["Auth"])
app.include_router(report_router, prefix="/reports", tags=["Reports"])
app.include_router(station_router, prefix="/stations", tags=["Stations"])
app.include_router(dashboard_router, prefix="/dashboard", tags=["Dashboard"])
app.include_router(alerts_router, prefix="/alerts", tags=["Alerts"])
app.include_router(geocode_router, prefix="/geocode", tags=["Geocode"])
