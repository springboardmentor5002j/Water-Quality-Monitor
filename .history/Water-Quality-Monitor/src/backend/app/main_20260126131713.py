
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .routers.report_routers import router as report_router
from .auth import router as auth_router
from .routers.dashboard import router as dashboard_router
from .routers.stations import router as station_router
from .database import Base, engine
from .routers.alerts import router as alerts_router
# Create tables
Base.metadata.create_all(bind=engine, checkfirst=True)


app = FastAPI()

# CORS
origins = ["http://localhost:5173"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Static files (uploads)
UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../uploads"))
print("UPLOAD_DIR:", UPLOAD_DIR)
print("Files in upload dir:", os.listdir(UPLOAD_DIR))
UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../uploads"))
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")
from .routers.geocode import router as geocode_router

app.include_router(geocode_router)
# Routers
app.include_router(auth_router, prefix="/auth")
app.include_router(report_router)
app.include_router(station_router)
app.include_router(dashboard_router)
app.include_router(alerts_router)
from app.routers import ngo

app.include_router(ngo.router)
