from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import List, Optional
import datetime
from backend.database import get_db
from backend.models import Permit, User, Clash, RoadSegment
from backend.auth import get_current_user, RoleChecker
from backend.clash_engine import check_clash_for_permit, parse_geometry, check_date_overlap, check_depth_conflict, SPATIAL_BUFFER_DEGREES

router = APIRouter(prefix="/api/permits", tags=["permits"])

# ==========================================
# PYDANTIC SCHEMAS
# ==========================================


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
    # Updated so Pydantic allows None
    conflicting_permit_id: Optional[int] = None
    conflicting_agency: str
    conflicting_title: str
    overlap_percentage: float
    overlap_days: int
    estimated_savings: float
    recommendation_text: str
    resolved: bool

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
    created_at: datetime.datetime
    clashes: List[ClashResponse] = []

    class Config:
        from_attributes = True


class StatusUpdate(BaseModel):
    status: str  # APPROVED, REJECTED, IN_PROGRESS, COMPLETED, PENDING_REVIEW


# ==========================================
# ENDPOINTS
# ==========================================

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
        if clash.conflicting_permit_id is None:
            conflicting_agency = "GHMC (Road Safety Division)"
            conflicting_title = "Locked Resurfaced Road"
        else:
            other_permit = db.query(Permit).filter(
                Permit.id == clash.conflicting_permit_id).first()
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

    # Run spatial and temporal clash analysis
    clash_exists, clash_objects = check_clash_for_permit(new_permit, db)

    final_clash_responses = []
    if clash_exists:
        new_permit.status = "CLASH_DETECTED"
        db.commit()

        # Save all detected clashes
        for clash in clash_objects:
            clash.permit_id = new_permit.id
            db.add(clash)
            db.commit()
            db.refresh(clash)

            # Form response structure
            if clash.conflicting_permit_id is None:
                conflicting_agency = "GHMC"
                conflicting_title = "Recently Resurfaced Road"
            else:
                other_permit = db.query(Permit).filter(
                    Permit.id == clash.conflicting_permit_id).first()
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
        created_at=new_permit.created_at,
        clashes=final_clash_responses
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
            if clash.conflicting_permit_id is None:
                conflicting_agency = "GHMC"
                conflicting_title = "Locked Resurfaced Road"
            else:
                other_p = db.query(Permit).filter(
                    Permit.id == clash.conflicting_permit_id).first()
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
                created_at=permit.created_at,
                clashes=clash_responses
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
        if clash.conflicting_permit_id is None:
            conflicting_agency = "GHMC"
            conflicting_title = "Locked Road"
        else:
            other_p = db.query(Permit).filter(
                Permit.id == clash.conflicting_permit_id).first()
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
        created_at=permit.created_at,
        clashes=clash_responses
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
        raise HTTPException(
            status_code=403, detail="Only GHMC administrators can approve co-dig plans")

    permit = db.query(Permit).filter(Permit.id == permit_id).first()
    if not permit:
        raise HTTPException(status_code=404, detail="Permit not found")

    # Mark all related clashes as resolved
    clashes = db.query(Clash).filter(Clash.permit_id == permit.id).all()
    for clash in clashes:
        clash.resolved = True

        # If it's a conflict with another permit, mark the inverse clash as resolved too
        if clash.conflicting_permit_id is not None:
            inverse_clashes = db.query(Clash).filter(
                Clash.permit_id == clash.conflicting_permit_id,
                Clash.conflicting_permit_id == permit.id
            ).all()
            for inv in inverse_clashes:
                inv.resolved = True

            # Move the conflicting permit to PENDING_REVIEW or APPROVED as part of joint scheduling
            other_permit = db.query(Permit).filter(
                Permit.id == clash.conflicting_permit_id).first()
            if other_permit and other_permit.status == "CLASH_DETECTED":
                other_permit.status = "APPROVED"  # Auto-approve the co-dig partner too!

    # Transition this permit status to APPROVED (or IN_PROGRESS if started)
    permit.status = "APPROVED"
    db.commit()
    db.refresh(permit)

    return get_permit(permit_id, db)
