from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import List, Optional
import datetime
from shapely.geometry import Point
from backend.database import get_db
from backend.models import Complaint, Permit, User
from backend.auth import get_current_user
from backend.clash_engine import parse_geometry, SPATIAL_BUFFER_DEGREES

BASE_DIR = Path(__file__).resolve().parent.parent
UPLOAD_DIR = BASE_DIR / "static" / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

router = APIRouter(prefix="/api/complaints", tags=["complaints"])

# Pydantic Schemas
class ComplaintCreate(BaseModel):
    citizen_name: Optional[str] = "Anonymous"
    complaint_type: str  # OPEN_TRENCH, UNSAFE_BARRICADING, ROAD_NOT_RESTORED, ABANDONED_WORK, WATER_LEAKAGE, TRAFFIC_OBSTRUCTION
    description: str
    latitude: float
    longitude: float
    photo_url: Optional[str] = None

class ComplaintUpdate(BaseModel):
    status: str  # OPEN, ASSIGNED, RESOLVED
    agency_assigned: Optional[str] = None

class ComplaintResponse(BaseModel):
    id: int
    permit_id: Optional[int]
    citizen_name: str
    complaint_type: str
    description: str
    latitude: float
    longitude: float
    photo_url: Optional[str]
    status: str
    agency_assigned: Optional[str]
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# Public endpoint: Create Complaint (Auto-resolves spatial proximity to active permits)
@router.post("", response_model=ComplaintResponse)
def create_complaint(data: ComplaintCreate, db: Session = Depends(get_db)):
    """
    Public API to file a complaint. 
    It automatically evaluates the geographic coordinate against active excavations.
    If the complaint lies within 15 meters of an active digging permit, we link it 
    and automatically assign it to the responsible utility agency.
    """
    new_complaint = Complaint(
        citizen_name=data.citizen_name or "Anonymous",
        complaint_type=data.complaint_type,
        description=data.description,
        latitude=data.latitude,
        longitude=data.longitude,
        photo_url=data.photo_url,
        status="OPEN"
    )
    
    # 1. Proximity matching using Shapely
    complaint_point = Point(data.longitude, data.latitude)
    
    # Query only active digging operations
    active_permits = db.query(Permit).filter(Permit.status.in_(["IN_PROGRESS", "APPROVED"])).all()
    
    matched_permit = None
    for permit in active_permits:
        permit_geom = parse_geometry(permit.wkt_geometry)
        # Apply a slightly larger buffer for complaint matching (e.g. 25 meters, ~0.00022 degrees)
        permit_buffered = permit_geom.buffer(0.00025)
        
        if permit_buffered.contains(complaint_point):
            matched_permit = permit
            break
            
    if matched_permit:
        new_complaint.permit_id = matched_permit.id
        new_complaint.agency_assigned = matched_permit.agency_name
        new_complaint.status = "ASSIGNED"
        
    db.add(new_complaint)
    db.commit()
    db.refresh(new_complaint)
    return new_complaint


def save_upload_photo(photo: UploadFile) -> Optional[str]:
    if not photo:
        return None

    extension = Path(photo.filename).suffix or ".jpg"
    filename = f"{uuid4().hex}{extension}"
    destination = UPLOAD_DIR / filename

    with destination.open("wb") as buffer:
        buffer.write(photo.file.read())

    return filename


@router.post("/upload", response_model=ComplaintResponse)
def upload_complaint(
    request: Request,
    citizen_name: str = Form("Anonymous"),
    complaint_type: str = Form(...),
    description: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    photo: UploadFile | None = File(None),
    photo_url: Optional[str] = Form(None),
    db: Session = Depends(get_db),
):
    photo_path = None
    if photo:
        filename = save_upload_photo(photo)
        photo_path = f"{str(request.base_url).rstrip('/')}/static/uploads/{filename}"
    elif photo_url:
        photo_path = photo_url

    new_complaint = Complaint(
        citizen_name=citizen_name or "Anonymous",
        complaint_type=complaint_type,
        description=description,
        latitude=latitude,
        longitude=longitude,
        photo_url=photo_path or "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80",
        status="OPEN"
    )

    # 1. Proximity matching using Shapely
    complaint_point = Point(longitude, latitude)

    # Query only active digging operations
    active_permits = db.query(Permit).filter(Permit.status.in_(["IN_PROGRESS", "APPROVED"])).all()
    
    matched_permit = None
    for permit in active_permits:
        permit_geom = parse_geometry(permit.wkt_geometry)
        # Apply a slightly larger buffer for complaint matching (e.g. 25 meters, ~0.00025 degrees)
        permit_buffered = permit_geom.buffer(0.00025)
        
        if permit_buffered.contains(complaint_point):
            matched_permit = permit
            break
            
    if matched_permit:
        new_complaint.permit_id = matched_permit.id
        new_complaint.agency_assigned = matched_permit.agency_name
        new_complaint.status = "ASSIGNED"
        
    db.add(new_complaint)
    db.commit()
    db.refresh(new_complaint)
    return new_complaint

# List complaints
@router.get("", response_model=List[ComplaintResponse])
def list_complaints(
    status_filter: Optional[str] = None,
    agency_filter: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Complaint)
    
    if status_filter:
        query = query.filter(Complaint.status == status_filter)
    if agency_filter:
        query = query.filter(Complaint.agency_assigned == agency_filter)
        
    return query.order_by(Complaint.created_at.desc()).all()

# Get Single Complaint Detail
@router.get("/{complaint_id}", response_model=ComplaintResponse)
def get_complaint(complaint_id: int, db: Session = Depends(get_db)):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return complaint

# Update Complaint Status (Admin and Utility workflow)
@router.patch("/{complaint_id}", response_model=ComplaintResponse)
def update_complaint(
    complaint_id: int,
    data: ComplaintUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
        
    # GHMC Admin can change anything. Utility agency can resolve complaints assigned to them.
    if current_user.role == "UTILITY":
        if complaint.agency_assigned != current_user.agency_name:
            raise HTTPException(
                status_code=403,
                detail="You can only resolve complaints assigned to your specific agency."
            )
            
    complaint.status = data.status
    if data.agency_assigned:
        complaint.agency_assigned = data.agency_assigned
        if complaint.status == "OPEN":
            complaint.status = "ASSIGNED"
            
    db.commit()
    db.refresh(complaint)
    return complaint
