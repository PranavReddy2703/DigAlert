import pytest
import datetime
from backend.models import Permit, Clash, Complaint, User

def test_analytics_summary_empty(client):
    response = client.get("/api/analytics/summary")
    assert response.status_code == 200
    data = response.json()
    assert data["total_permits"] == 0
    assert data["active_permits"] == 0
    assert data["money_saved_inr"] == 0.0
    assert data["complaints_by_status"] == {"OPEN": 0, "ASSIGNED": 0, "RESOLVED": 0}


def test_analytics_summary_with_data(client, db_session, utility_user):
    # Seed Permits
    p1 = Permit(
        title="Excavation 1", utility_id=utility_user.id, agency_name="TSSPDCL",
        wkt_geometry="LINESTRING(78.4867 17.3850, 78.4870 17.3855)", depth_meters=1.5,
        work_type="POWER", start_date=datetime.date(2026, 6, 1), end_date=datetime.date(2026, 6, 10),
        status="IN_PROGRESS" # Active
    )
    p2 = Permit(
        title="Excavation 2", utility_id=utility_user.id, agency_name="TSSPDCL",
        wkt_geometry="LINESTRING(78.4867 17.3850, 78.4870 17.3855)", depth_meters=1.5,
        work_type="WATER", start_date=datetime.date(2026, 6, 1), end_date=datetime.date(2026, 6, 10),
        status="APPROVED"
    )
    db_session.add_all([p1, p2])
    db_session.commit()

    # Seed Clashes (1 resolved, 1 unresolved)
    clash1 = Clash(permit_id=p1.id, conflicting_permit_id=p2.id, overlap_percentage=50.0, overlap_days=5, estimated_savings=15000.0, resolved=True)
    clash2 = Clash(permit_id=p2.id, conflicting_permit_id=p1.id, overlap_percentage=50.0, overlap_days=5, estimated_savings=15000.0, resolved=False)
    db_session.add_all([clash1, clash2])
    db_session.commit()

    # Seed Complaints
    comp1 = Complaint(citizen_name="Citizen 1", complaint_type="OPEN_TRENCH", description="Trench open", latitude=17.385, longitude=78.486, status="RESOLVED", agency_assigned="TSSPDCL")
    comp2 = Complaint(citizen_name="Citizen 2", complaint_type="WATER_LEAKAGE", description="Water leak", latitude=17.385, longitude=78.486, status="OPEN")
    db_session.add_all([comp1, comp2])
    db_session.commit()

    response = client.get("/api/analytics/summary")
    assert response.status_code == 200
    data = response.json()
    assert data["total_permits"] == 2
    assert data["active_permits"] == 1
    assert data["conflicts_detected"] == 2
    assert data["conflicts_resolved"] == 1
    assert data["money_saved_inr"] == 15000.0
    assert data["total_complaints"] == 2
    assert data["complaints_by_status"]["RESOLVED"] == 1
    assert data["complaints_by_status"]["OPEN"] == 1
    assert data["complaints_by_type"]["OPEN_TRENCH"] == 1


def test_utility_leaderboard(client, db_session, utility_user):
    # Verify that leaderboard works with registered utility users
    response = client.get("/api/analytics/leaderboard")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["agency_name"] == "TSSPDCL"
    assert data[0]["compliance_score"] == 85.0 # Baseline score
