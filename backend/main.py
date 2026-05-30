from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.database import engine, Base
from backend.routers import auth, permits, complaints, analytics

# Create all database tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="DigAlert API - Hyderabad Road Excavation Platform",
    description="Backend services for preventing redundant road digging by utility agencies.",
    version="1.0.0"
)

# Set up CORS middleware to communicate with the Vite React application
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the active React client URL
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
