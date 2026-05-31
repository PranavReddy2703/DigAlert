from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import List, Dict, Any
from backend.database import get_db
from backend.models import Permit, Clash, Complaint, User

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

class AnalyticsSummary(BaseModel):
    total_permits: int
    active_permits: int
    conflicts_detected: int
    conflicts_resolved: int
    co_dig_projects: int
    money_saved_inr: float
    total_complaints: int
    complaints_by_status: Dict[str, int]
    complaints_by_type: Dict[str, int]

class UtilityLeaderboardItem(BaseModel):
    rank: int
    agency_name: str
    total_permits: int
    conflicts_resolved: int
    active_digs: int
    complaints_count: int
    complaints_resolved: int
    compliance_score: float  # Percentage score (e.g. 0-100)

@router.get("/summary", response_model=AnalyticsSummary)
def get_analytics_summary(db: Session = Depends(get_db)):
    # Counts
    total_permits = db.query(Permit).count()
    active_permits = db.query(Permit).filter(Permit.status == "IN_PROGRESS").count()
    
    conflicts_detected = db.query(Clash).count()
    conflicts_resolved = db.query(Clash).filter(Clash.resolved == True).count()
    
    # Co-dig projects represent approved/active permits where conflicts were successfully resolved
    co_dig_projects = db.query(Clash.permit_id).filter(Clash.resolved == True).distinct().count()
    
    # Savings calculation
    savings_sum = db.query(func.sum(Clash.estimated_savings)).filter(Clash.resolved == True).scalar()
    money_saved = float(savings_sum) if savings_sum is not None else 0.0
    
    total_complaints = db.query(Complaint).count()
    
    # Complaints grouping by status
    status_counts = db.query(Complaint.status, func.count(Complaint.id)).group_by(Complaint.status).all()
    complaints_by_status = {"OPEN": 0, "ASSIGNED": 0, "RESOLVED": 0}
    for status_name, count in status_counts:
        if status_name in complaints_by_status:
            complaints_by_status[status_name] = count
            
    # Complaints grouping by type
    type_counts = db.query(Complaint.complaint_type, func.count(Complaint.id)).group_by(Complaint.complaint_type).all()
    complaints_by_type = {}
    for type_name, count in type_counts:
        complaints_by_type[type_name] = count
        
    return AnalyticsSummary(
        total_permits=total_permits,
        active_permits=active_permits,
        conflicts_detected=conflicts_detected,
        conflicts_resolved=conflicts_resolved,
        co_dig_projects=co_dig_projects,
        money_saved_inr=money_saved,
        total_complaints=total_complaints,
        complaints_by_status=complaints_by_status,
        complaints_by_type=complaints_by_type
    )

@router.get("/leaderboard", response_model=List[UtilityLeaderboardItem])
def get_utility_leaderboard(db: Session = Depends(get_db)):
    """
    Computes a compliance score leaderboard of all registered utility agencies.
    Agency list is derived dynamically from Users with role=UTILITY so any newly
    registered agency appears automatically without code changes.

    Compliance formula (0-100):
      50% clash health  = 1 - (unresolved_clashes / total_permits)
      50% complaint resolution = resolved_complaints / total_complaints
    Agencies with no activity yet start at a 85.0 baseline.
    """
    # --- 1. Discover all registered utility agencies from the Users table ----------
    agency_rows = (
        db.query(User.agency_name)
        .filter(User.role == "UTILITY", User.agency_name.isnot(None))
        .distinct()
        .all()
    )
    agencies = [row.agency_name for row in agency_rows]

    if not agencies:
        return []

    # --- 2. Batch-aggregate permit stats across all agencies in 3 queries ----------
    # Total permits per agency
    permit_totals = dict(
        db.query(Permit.agency_name, func.count(Permit.id))
        .filter(Permit.agency_name.in_(agencies))
        .group_by(Permit.agency_name)
        .all()
    )
    # Active (IN_PROGRESS) permits per agency
    permit_active = dict(
        db.query(Permit.agency_name, func.count(Permit.id))
        .filter(Permit.agency_name.in_(agencies), Permit.status == "IN_PROGRESS")
        .group_by(Permit.agency_name)
        .all()
    )
    # Unresolved clashes per agency (joined through the permit owner)
    unresolved_clashes = dict(
        db.query(Permit.agency_name, func.count(Clash.id))
        .join(Clash, Clash.permit_id == Permit.id)
        .filter(Permit.agency_name.in_(agencies), Clash.resolved == False)
        .group_by(Permit.agency_name)
        .all()
    )
    # Resolved clashes per agency
    resolved_clashes = dict(
        db.query(Permit.agency_name, func.count(Clash.id))
        .join(Clash, Clash.permit_id == Permit.id)
        .filter(Permit.agency_name.in_(agencies), Clash.resolved == True)
        .group_by(Permit.agency_name)
        .all()
    )

    # --- 3. Batch-aggregate complaint stats in 2 queries --------------------------
    complaint_totals = dict(
        db.query(Complaint.agency_assigned, func.count(Complaint.id))
        .filter(Complaint.agency_assigned.in_(agencies))
        .group_by(Complaint.agency_assigned)
        .all()
    )
    complaint_resolved = dict(
        db.query(Complaint.agency_assigned, func.count(Complaint.id))
        .filter(Complaint.agency_assigned.in_(agencies), Complaint.status == "RESOLVED")
        .group_by(Complaint.agency_assigned)
        .all()
    )

    # --- 4. Build leaderboard rows -------------------------------------------------
    leaderboard = []
    for agency in agencies:
        total_p    = permit_totals.get(agency, 0)
        active_p   = permit_active.get(agency, 0)
        resolved_c = resolved_clashes.get(agency, 0)
        unresolv_c = unresolved_clashes.get(agency, 0)
        total_comp = complaint_totals.get(agency, 0)
        resolv_comp = complaint_resolved.get(agency, 0)

        if total_p == 0 and total_comp == 0:
            compliance = 85.0  # new agency baseline — no data yet
        else:
            clash_health     = 1.0 if total_p == 0 else (1.0 - unresolv_c / max(total_p, 1))
            complaint_health = 1.0 if total_comp == 0 else (resolv_comp / max(total_comp, 1))
            compliance = (clash_health * 50.0) + (complaint_health * 50.0)
            compliance = max(40.0, min(100.0, compliance))

        leaderboard.append({
            "agency_name":       agency,
            "total_permits":     total_p,
            "conflicts_resolved": resolved_c,
            "active_digs":       active_p,
            "complaints_count":  total_comp,
            "complaints_resolved": resolv_comp,
            "compliance_score":  round(compliance, 1),
        })

    # --- 5. Sort by compliance score, then assign ranks ---------------------------
    leaderboard.sort(key=lambda x: x["compliance_score"], reverse=True)

    return [
        UtilityLeaderboardItem(rank=idx + 1, **item)
        for idx, item in enumerate(leaderboard)
    ]