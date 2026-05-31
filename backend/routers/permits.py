from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import List, Optional
import datetime
from backend.database import get_db
from backend.models import Permit, User, Clash, RoadSegment, AuditLog
from backend.auth import get_current_user, RoleChecker
from backend.clash_engine import check_clash_for_permit, parse_geometry, check_date_overlap, check_depth_conflict, SPATIAL_BUFFER_DEGREES

router = APIRouter(prefix="/api/permits", tags=["permits"])

# Pydantic Schemas
class PermitCreate(BaseModel):
    title: str
    description: Optional[str] = None
    wkt_geometry: str  # LineString representing excavation path
    depth_meters: float
    work_type: str  # WATER, POWER, SEWERAGE, TELECOM, GAS, ROAD_REPAIR, EMERGENCY
    start_date: datetime.date
    end_date: datetime.date

class PermitPrecheck(BaseModel):
    wkt_geometry: str
    depth_meters: float
    work_type: str
    start_date: datetime.date
    end_date: datetime.date

class ClashResponse(BaseModel):
    id: Optional[int] = None
    permit_id: int
    conflicting_permit_id: int
    conflicting_agency: str
    conflicting_title: str
    overlap_percentage: float
    overlap_days: int
    estimated_savings: float
    recommendation_text: str
    resolved: bool

    class Config:
        from_attributes = True

class AuditLogResponse(BaseModel):
    id: int
    permit_id: int
    event_type: str
    description: str
    user_id: Optional[int] = None
    username: Optional[str] = None
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class PermitResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    utility_id: int
    agency_name: str
    status: str
    wkt_geometry: str
    depth_meters: float
    work_type: str
    start_date: datetime.date
    end_date: datetime.date
    authorized_at: Optional[datetime.datetime] = None
    authorized_by: Optional[str] = None
    restoration_deadline: Optional[datetime.date] = None
    completed_at: Optional[datetime.datetime] = None
    completed_by: Optional[str] = None
    completion_notes: Optional[str] = None
    restoration_verified_at: Optional[datetime.datetime] = None
    restoration_verified_by: Optional[str] = None
    restoration_remarks: Optional[str] = None
    closed_at: Optional[datetime.datetime] = None
    closed_by: Optional[str] = None
    created_at: datetime.datetime
    clashes: List[ClashResponse] = []
    audit_logs: List[AuditLogResponse] = []

    class Config:
        from_attributes = True

class StatusUpdate(BaseModel):
    status: str  # APPROVED, REJECTED, IN_PROGRESS, COMPLETED, PENDING_REVIEW, AUTHORIZED_EXCAVATION, ROAD_RESTORED, EXCAVATION_COMPLETED, PROJECT_CLOSED

class PermitAuthorize(BaseModel):
    restoration_deadline: Optional[datetime.date] = None

class PermitComplete(BaseModel):
    completion_notes: Optional[str] = None

class PermitVerifyRestoration(BaseModel):
    remarks: Optional[str] = None

# Precheck Endpoint for Clash Detection (Non-committing)
@router.post("/precheck", response_model=List[ClashResponse])
def precheck_clashes(data: PermitPrecheck, db: Session = Depends(get_db)):
    """
    Run the clash engine dynamically on a mock permit segment before it is saved.
    Provides immediate UX feedback.
    """
    # Instantiate a mock permit for checking
    mock_permit = Permit(
        id=0,
        title="Precheck",
        wkt_geometry=data.wkt_geometry,
        depth_meters=data.depth_meters,
        work_type=data.work_type,
        start_date=data.start_date,
        end_date=data.end_date,
        agency_name="Precheck Agency"
    )
    
    clash_exists, clash_objects = check_clash_for_permit(mock_permit, db)
    
    clash_responses = []
    for clash in clash_objects:
        # Load conflicting entity details (could be another permit or a recently resurfaced road)
        if clash.conflicting_permit_id < 0:
            # It's a recently resurfaced road!
            road_id = -clash.conflicting_permit_id
            road = db.query(RoadSegment).filter(RoadSegment.id == road_id).first()
            conflicting_agency = "GHMC (Road Safety Division)"
            conflicting_title = f"Locked Resurfaced Road: {road.name if road else 'Hyderabad Highway'}"
        else:
            other_permit = db.query(Permit).filter(Permit.id == clash.conflicting_permit_id).first()
            conflicting_agency = other_permit.agency_name if other_permit else "Unknown Agency"
            conflicting_title = other_permit.title if other_permit else "Active Excavation"
            
        clash_responses.append(
            ClashResponse(
                permit_id=0,
                conflicting_permit_id=clash.conflicting_permit_id,
                conflicting_agency=conflicting_agency,
                conflicting_title=conflicting_title,
                overlap_percentage=clash.overlap_percentage,
                overlap_days=clash.overlap_days,
                estimated_savings=clash.estimated_savings,
                recommendation_text=clash.recommendation_text,
                resolved=False
            )
        )
        
    return clash_responses

# Submit Permit (with automatic clash detection triggered)
@router.post("", response_model=PermitResponse)
def create_permit(permit_data: PermitCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role not in ["UTILITY", "ADMIN"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only utilities or admins can submit permit requests"
        )
        
    # Create the permit database entry
    new_permit = Permit(
        title=permit_data.title,
        description=permit_data.description,
        utility_id=current_user.id,
        agency_name=current_user.agency_name or "Utility",
        status="SUBMITTED",  # Initial status for clash check
        wkt_geometry=permit_data.wkt_geometry,
        depth_meters=permit_data.depth_meters,
        work_type=permit_data.work_type,
        start_date=permit_data.start_date,
        end_date=permit_data.end_date
    )
    db.add(new_permit)
    db.commit()
    db.refresh(new_permit)
    
    # Log Audit Event for Submission
    audit_log = AuditLog(
        permit_id=new_permit.id,
        event_type="Permit Submitted",
        description=f"Excavation permit request registered in GHMC central grid by {new_permit.agency_name} (User: {current_user.username}).",
        user_id=current_user.id,
        username=current_user.username
    )
    db.add(audit_log)
    db.commit()
    
    # Run spatial and temporal clash analysis
    clash_exists, clash_objects = check_clash_for_permit(new_permit, db)
    
    final_clash_responses = []
    if clash_exists:
        new_permit.status = "CLASH_DETECTED"
        db.commit()
        
        # Log Audit Event for Clash Detection
        audit_log_clash = AuditLog(
            permit_id=new_permit.id,
            event_type="Clash Detected",
            description=f"Geospatial scan flagged {len(clash_objects)} conflict(s) with road safety or other utility schedules.",
            username="DigAlert Clash Engine"
        )
        db.add(audit_log_clash)
        db.commit()
        
        # Save all detected clashes
        for clash in clash_objects:
            clash.permit_id = new_permit.id
            db.add(clash)
            db.commit()
            db.refresh(clash)
            
            # Form response structure
            if clash.conflicting_permit_id < 0:
                road_id = -clash.conflicting_permit_id
                road = db.query(RoadSegment).filter(RoadSegment.id == road_id).first()
                conflicting_agency = "GHMC"
                conflicting_title = f"Recently Resurfaced: {road.name if road else 'Road segment'}"
            else:
                other_permit = db.query(Permit).filter(Permit.id == clash.conflicting_permit_id).first()
                conflicting_agency = other_permit.agency_name if other_permit else "Unknown Agency"
                conflicting_title = other_permit.title if other_permit else "Excavation Works"
                
            final_clash_responses.append(
                ClashResponse(
                    id=clash.id,
                    permit_id=clash.permit_id,
                    conflicting_permit_id=clash.conflicting_permit_id,
                    conflicting_agency=conflicting_agency,
                    conflicting_title=conflicting_title,
                    overlap_percentage=clash.overlap_percentage,
                    overlap_days=clash.overlap_days,
                    estimated_savings=clash.estimated_savings,
                    recommendation_text=clash.recommendation_text,
                    resolved=clash.resolved
                )
            )
    else:
        # Standard workflow: No conflicts found -> Move to review
        new_permit.status = "PENDING_REVIEW"
        db.commit()
        
    return PermitResponse(
        id=new_permit.id,
        title=new_permit.title,
        description=new_permit.description,
        utility_id=new_permit.utility_id,
        agency_name=new_permit.agency_name,
        status=new_permit.status,
        wkt_geometry=new_permit.wkt_geometry,
        depth_meters=new_permit.depth_meters,
        work_type=new_permit.work_type,
        start_date=new_permit.start_date,
        end_date=new_permit.end_date,
        authorized_at=new_permit.authorized_at,
        authorized_by=new_permit.authorized_by,
        restoration_deadline=new_permit.restoration_deadline,
        completed_at=new_permit.completed_at,
        completed_by=new_permit.completed_by,
        completion_notes=new_permit.completion_notes,
        restoration_verified_at=new_permit.restoration_verified_at,
        restoration_verified_by=new_permit.restoration_verified_by,
        restoration_remarks=new_permit.restoration_remarks,
        closed_at=new_permit.closed_at,
        closed_by=new_permit.closed_by,
        created_at=new_permit.created_at,
        clashes=final_clash_responses,
        audit_logs=new_permit.audit_logs
    )

# List Permits
@router.get("", response_model=List[PermitResponse])
def list_permits(
    status_filter: Optional[str] = None,
    agency_filter: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Permit)
    
    if status_filter:
        query = query.filter(Permit.status == status_filter)
    if agency_filter:
        query = query.filter(Permit.agency_name == agency_filter)
        
    permits = query.order_by(Permit.created_at.desc()).all()
    
    responses = []
    for permit in permits:
        clashes = db.query(Clash).filter(Clash.permit_id == permit.id).all()
        clash_responses = []
        for clash in clashes:
            if clash.conflicting_permit_id < 0:
                road_id = -clash.conflicting_permit_id
                road = db.query(RoadSegment).filter(RoadSegment.id == road_id).first()
                conflicting_agency = "GHMC"
                conflicting_title = f"Locked Resurfaced Road: {road.name if road else 'Hyderabad Segment'}"
            else:
                other_p = db.query(Permit).filter(Permit.id == clash.conflicting_permit_id).first()
                conflicting_agency = other_p.agency_name if other_p else "Unknown Agency"
                conflicting_title = other_p.title if other_p else "Excavation"
                
            clash_responses.append(
                ClashResponse(
                    id=clash.id,
                    permit_id=clash.permit_id,
                    conflicting_permit_id=clash.conflicting_permit_id,
                    conflicting_agency=conflicting_agency,
                    conflicting_title=conflicting_title,
                    overlap_percentage=clash.overlap_percentage,
                    overlap_days=clash.overlap_days,
                    estimated_savings=clash.estimated_savings,
                    recommendation_text=clash.recommendation_text,
                    resolved=clash.resolved
                )
            )
        responses.append(
            PermitResponse(
                id=permit.id,
                title=permit.title,
                description=permit.description,
                utility_id=permit.utility_id,
                agency_name=permit.agency_name,
                status=permit.status,
                wkt_geometry=permit.wkt_geometry,
                depth_meters=permit.depth_meters,
                work_type=permit.work_type,
                start_date=permit.start_date,
                end_date=permit.end_date,
                authorized_at=permit.authorized_at,
                authorized_by=permit.authorized_by,
                restoration_deadline=permit.restoration_deadline,
                completed_at=permit.completed_at,
                completed_by=permit.completed_by,
                completion_notes=permit.completion_notes,
                restoration_verified_at=permit.restoration_verified_at,
                restoration_verified_by=permit.restoration_verified_by,
                restoration_remarks=permit.restoration_remarks,
                closed_at=permit.closed_at,
                closed_by=permit.closed_by,
                created_at=permit.created_at,
                clashes=clash_responses,
                audit_logs=permit.audit_logs
            )
        )
        
    return responses

# Get Single Permit Detail
@router.get("/{permit_id}", response_model=PermitResponse)
def get_permit(permit_id: int, db: Session = Depends(get_db)):
    permit = db.query(Permit).filter(Permit.id == permit_id).first()
    if not permit:
        raise HTTPException(status_code=404, detail="Permit not found")
        
    clashes = db.query(Clash).filter(Clash.permit_id == permit.id).all()
    clash_responses = []
    for clash in clashes:
        if clash.conflicting_permit_id < 0:
            road_id = -clash.conflicting_permit_id
            road = db.query(RoadSegment).filter(RoadSegment.id == road_id).first()
            conflicting_agency = "GHMC"
            conflicting_title = f"Locked Road: {road.name if road else 'Hyderabad Road'}"
        else:
            other_p = db.query(Permit).filter(Permit.id == clash.conflicting_permit_id).first()
            conflicting_agency = other_p.agency_name if other_p else "Unknown"
            conflicting_title = other_p.title if other_p else "Active Digging"
            
        clash_responses.append(
            ClashResponse(
                id=clash.id,
                permit_id=clash.permit_id,
                conflicting_permit_id=clash.conflicting_permit_id,
                conflicting_agency=conflicting_agency,
                conflicting_title=conflicting_title,
                overlap_percentage=clash.overlap_percentage,
                overlap_days=clash.overlap_days,
                estimated_savings=clash.estimated_savings,
                recommendation_text=clash.recommendation_text,
                resolved=clash.resolved
            )
        )
        
    return PermitResponse(
        id=permit.id,
        title=permit.title,
        description=permit.description,
        utility_id=permit.utility_id,
        agency_name=permit.agency_name,
        status=permit.status,
        wkt_geometry=permit.wkt_geometry,
        depth_meters=permit.depth_meters,
        work_type=permit.work_type,
        start_date=permit.start_date,
        end_date=permit.end_date,
        authorized_at=permit.authorized_at,
        authorized_by=permit.authorized_by,
        restoration_deadline=permit.restoration_deadline,
        completed_at=permit.completed_at,
        completed_by=permit.completed_by,
        completion_notes=permit.completion_notes,
        restoration_verified_at=permit.restoration_verified_at,
        restoration_verified_by=permit.restoration_verified_by,
        restoration_remarks=permit.restoration_remarks,
        closed_at=permit.closed_at,
        closed_by=permit.closed_by,
        created_at=permit.created_at,
        clashes=clash_responses,
        audit_logs=permit.audit_logs
    )

# Update Permit Status (Admin only workflow)
@router.patch("/{permit_id}/status", response_model=PermitResponse)
def update_permit_status(
    permit_id: int,
    status_update: StatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Only Admin (GHMC) can change statuses manually (e.g. approve/reject, or clear clash)
    if current_user.role != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only GHMC administrators can approve/reject/modify permit workflows"
        )
        
    permit = db.query(Permit).filter(Permit.id == permit_id).first()
    if not permit:
        raise HTTPException(status_code=404, detail="Permit not found")
        
    permit.status = status_update.status
    
    # Audit log integrations
    event_desc = f"Permit status manually updated to {status_update.status} by GHMC Admin '{current_user.username}'."
    event_type = "Permit Updated"
    
    if status_update.status == "APPROVED":
        event_type = "Approved By GHMC"
        event_desc = f"Permit approved by GHMC Administrator '{current_user.username}'. Excavation schedule cleared."
    elif status_update.status == "COMPLETED":
        event_type = "Work Completed"
        event_desc = f"Excavation works completed on-site. Backfilling and utility laying completed."
    elif status_update.status == "ROAD_RESTORED":
        event_type = "Road Restored"
        event_desc = f"Road segment restored, tarred, and barricades cleared. Tarring verified by GHMC inspector."
    
    audit_log = AuditLog(
        permit_id=permit.id,
        event_type=event_type,
        description=event_desc,
        user_id=current_user.id,
        username=current_user.username
    )
    db.add(audit_log)
    db.commit()
    db.refresh(permit)
    
    return get_permit(permit_id, db)

# Resolve Clash (Admin workflow to establish co-digging project)
@router.post("/{permit_id}/resolve-clash", response_model=PermitResponse)
def resolve_clash(
    permit_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Only GHMC administrators can approve co-dig plans")
        
    permit = db.query(Permit).filter(Permit.id == permit_id).first()
    if not permit:
        raise HTTPException(status_code=404, detail="Permit not found")
        
    # Mark all related clashes as resolved
    clashes = db.query(Clash).filter(Clash.permit_id == permit.id).all()
    for clash in clashes:
        clash.resolved = True
        
        # If it's a conflict with another permit, mark the inverse clash as resolved too
        if clash.conflicting_permit_id > 0:
            inverse_clashes = db.query(Clash).filter(
                Clash.permit_id == clash.conflicting_permit_id,
                Clash.conflicting_permit_id == permit.id
            ).all()
            for inv in inverse_clashes:
                inv.resolved = True
                
            # Move the conflicting permit to PENDING_REVIEW or APPROVED as part of joint scheduling
            other_permit = db.query(Permit).filter(Permit.id == clash.conflicting_permit_id).first()
            if other_permit and other_permit.status == "CLASH_DETECTED":
                other_permit.status = "APPROVED"  # Auto-approve the co-dig partner too!
                
    # Log Audit Event for Clash Resolution
    audit_log_resolve = AuditLog(
        permit_id=permit.id,
        event_type="Clash Resolved",
        description=f"GHMC Admin '{current_user.username}' reviewed spatial overlapping and approved co-digging joint alignment.",
        user_id=current_user.id,
        username=current_user.username
    )
    db.add(audit_log_resolve)
    
    # Log Audit Event for Approval
    audit_log_approve = AuditLog(
        permit_id=permit.id,
        event_type="Approved By GHMC",
        description=f"Permit approved by GHMC Admin '{current_user.username}'. Excavation schedule cleared.",
        user_id=current_user.id,
        username=current_user.username
    )
    db.add(audit_log_approve)
                
    # Transition this permit status to APPROVED (or IN_PROGRESS if started)
    permit.status = "APPROVED"
    db.commit()
    db.refresh(permit)
    
    return get_permit(permit_id, db)

# Authorize Excavation (Admin Workflow)
@router.post("/{permit_id}/authorize", response_model=PermitResponse)
def authorize_permit(
    permit_id: int,
    auth_data: Optional[PermitAuthorize] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only GHMC administrators can authorize road excavations"
        )
        
    permit = db.query(Permit).filter(Permit.id == permit_id).first()
    if not permit:
        raise HTTPException(status_code=404, detail="Permit not found")
        
    if permit.status != "APPROVED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Permits must be in APPROVED status to be authorized for excavation"
        )
        
    deadline = auth_data.restoration_deadline if (auth_data and auth_data.restoration_deadline) else permit.end_date
    
    permit.status = "AUTHORIZED_EXCAVATION"
    permit.authorized_at = datetime.datetime.utcnow()
    permit.authorized_by = current_user.username or "GHMC Admin"
    permit.restoration_deadline = deadline
    
    # Log Audit Event
    audit_log = AuditLog(
        permit_id=permit.id,
        event_type="Excavation Authorized",
        description=f"Excavation authorized by GHMC Administrator '{current_user.username}'. Restoration deadline scheduled for {deadline}.",
        user_id=current_user.id,
        username=current_user.username
    )
    db.add(audit_log)
    db.commit()
    db.refresh(permit)
    
    return get_permit(permit_id, db)

# Start Excavation (Utility Field Workflow)
@router.post("/{permit_id}/start-excavation", response_model=PermitResponse)
def start_excavation(
    permit_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "UTILITY" and current_user.role != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only utility operators can start excavation"
        )
        
    permit = db.query(Permit).filter(Permit.id == permit_id).first()
    if not permit:
        raise HTTPException(status_code=404, detail="Permit not found")
        
    # Security check: Airtel cannot activate BSNL's permit
    if current_user.role == "UTILITY" and permit.agency_name != current_user.agency_name:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Security lockout: Your agency '{current_user.agency_name}' is not authorized to activate works for '{permit.agency_name}'"
        )
        
    if permit.status != "AUTHORIZED_EXCAVATION":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Permit must be in AUTHORIZED_EXCAVATION status to start digging operations"
        )
        
    permit.status = "IN_PROGRESS"
    
    # Log Audit Event
    audit_log = AuditLog(
        permit_id=permit.id,
        event_type="Excavation Started",
        description=f"Physical excavation and road cutting initiated on-site by {permit.agency_name} engineers.",
        user_id=current_user.id,
        username=current_user.username
    )
    db.add(audit_log)
    db.commit()
    db.refresh(permit)
    
    return get_permit(permit_id, db)

# Complete Excavation (Utility Field Workflow)
@router.post("/{permit_id}/complete", response_model=PermitResponse)
def complete_excavation(
    permit_id: int,
    comp_data: Optional[PermitComplete] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "UTILITY" and current_user.role != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only utility operators or admins can complete excavation"
        )
        
    permit = db.query(Permit).filter(Permit.id == permit_id).first()
    if not permit:
        raise HTTPException(status_code=404, detail="Permit not found")
        
    # Security check: Airtel cannot complete BSNL's permit
    if current_user.role == "UTILITY" and permit.agency_name != current_user.agency_name:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Security lockout: Your agency '{current_user.agency_name}' is not authorized to modify works for '{permit.agency_name}'"
        )
        
    if permit.status != "IN_PROGRESS":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Permit must be IN_PROGRESS to be marked as completed"
        )
        
    notes = comp_data.completion_notes if comp_data else None
    
    permit.status = "EXCAVATION_COMPLETED"
    permit.completed_at = datetime.datetime.utcnow()
    permit.completed_by = current_user.username or "Utility Operator"
    permit.completion_notes = notes
    
    # Log Audit Event
    audit_log = AuditLog(
        permit_id=permit.id,
        event_type="Excavation Completed",
        description=f"Physical excavation completed on-site. Trench refilled/backfilled. Notes: {notes or 'No remarks provided.'}",
        user_id=current_user.id,
        username=current_user.username
    )
    db.add(audit_log)
    db.commit()
    db.refresh(permit)
    
    return get_permit(permit_id, db)

# Verify Restoration (Admin Workflow)
@router.post("/{permit_id}/verify-restoration", response_model=PermitResponse)
def verify_restoration(
    permit_id: int,
    verify_data: Optional[PermitVerifyRestoration] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only GHMC administrators can verify road restoration"
        )
        
    permit = db.query(Permit).filter(Permit.id == permit_id).first()
    if not permit:
        raise HTTPException(status_code=404, detail="Permit not found")
        
    if permit.status != "EXCAVATION_COMPLETED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Permits must be in EXCAVATION_COMPLETED status to be verified"
        )
        
    remarks = verify_data.remarks if verify_data else None
    
    permit.status = "ROAD_RESTORED"
    permit.restoration_verified_at = datetime.datetime.utcnow()
    permit.restoration_verified_by = current_user.username or "GHMC Admin"
    permit.restoration_remarks = remarks
    
    # Log Audit Event
    audit_log = AuditLog(
        permit_id=permit.id,
        event_type="Restoration Verified",
        description=f"Road restoration verified and approved by GHMC Admin '{current_user.username}'. Remarks: {remarks or 'Verified clean and level.'}",
        user_id=current_user.id,
        username=current_user.username
    )
    db.add(audit_log)
    db.commit()
    db.refresh(permit)
    
    return get_permit(permit_id, db)

# Request Rework (Admin Workflow)
@router.post("/{permit_id}/request-rework", response_model=PermitResponse)
def request_rework(
    permit_id: int,
    verify_data: Optional[PermitVerifyRestoration] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only GHMC administrators can request rework"
        )
        
    permit = db.query(Permit).filter(Permit.id == permit_id).first()
    if not permit:
        raise HTTPException(status_code=404, detail="Permit not found")
        
    if permit.status != "EXCAVATION_COMPLETED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Permits must be in EXCAVATION_COMPLETED status to request rework"
        )
        
    remarks = verify_data.remarks if verify_data else None
    
    permit.status = "IN_PROGRESS"
    permit.restoration_remarks = remarks
    
    # Log Audit Event
    audit_log = AuditLog(
        permit_id=permit.id,
        event_type="Rework Requested",
        description=f"Restoration check failed. GHMC Admin '{current_user.username}' requested physical site rework. Remarks: {remarks or 'Incomplete leveling.'}",
        user_id=current_user.id,
        username=current_user.username
    )
    db.add(audit_log)
    db.commit()
    db.refresh(permit)
    
    return get_permit(permit_id, db)

# Close Project (Admin Workflow)
@router.post("/{permit_id}/close", response_model=PermitResponse)
def close_permit_project(
    permit_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only GHMC administrators can close projects"
        )
        
    permit = db.query(Permit).filter(Permit.id == permit_id).first()
    if not permit:
        raise HTTPException(status_code=404, detail="Permit not found")
        
    if permit.status != "ROAD_RESTORED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Permits must be in ROAD_RESTORED status to be closed"
        )
        
    permit.status = "PROJECT_CLOSED"
    permit.closed_at = datetime.datetime.utcnow()
    permit.closed_by = current_user.username or "GHMC Admin"
    
    # Log Audit Event
    audit_log = AuditLog(
        permit_id=permit.id,
        event_type="Project Closed",
        description=f"Project officially closed by GHMC Admin '{current_user.username}'. Central road safety grid cleared.",
        user_id=current_user.id,
        username=current_user.username
    )
    db.add(audit_log)
    db.commit()
    db.refresh(permit)
    
    return get_permit(permit_id, db)
