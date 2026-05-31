from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from backend.database import engine, Base
from backend.routers import auth, permits, complaints, analytics

# Create all database tables on startup
Base.metadata.create_all(bind=engine)

BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"
UPLOAD_DIR = STATIC_DIR / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(
    title="DigAlert API - Hyderabad Road Excavation Platform",
    description="Backend services for preventing redundant road digging by utility agencies.",
    version="1.0.0"
)

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# Note: Ensure the Vercel URL below perfectly matches your live site (no trailing slash)
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5175",
    "http://127.0.0.1:5175",
    "https://dig-alert.vercel.app"
]

# Set up CORS middleware to communicate with the Vite React application
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount APIRouters
app.include_router(auth.router)
app.include_router(permits.router)
app.include_router(complaints.router)
app.include_router(analytics.router)


@app.get("/")
def read_root():
    return {
        "status": "online",
        "system": "DigAlert",
        "city": "Hyderabad",
        "message": "Welcome to the DigAlert Civic-Tech API platform. Center of Hyderabad coordinates: 17.3850 N, 78.4867 E."
    }
