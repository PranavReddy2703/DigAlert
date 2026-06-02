import pytest
import datetime
from backend.models import Permit, Clash, RoadSegment, Notification, AuditLog

def test_precheck_clashes_empty(client):
    payload = {
        "wkt_geometry": "LINESTRING(78.4867 17.3850, 78.4870 17.3855)",
        "depth_meters": 1.5,
        "work_type": "WATER",
        "start_date": "2026-06-01",
        "end_date": "2026-06-10"
    }
    response = client.post("/api/permits/precheck", json=payload)
    assert response.status_code == 200
    assert response.json() == []


def test_create_permit_no_clashes(client, utility_headers):
    payload = {
        "title": "Main Water Duct Repair",
        "description": "Laying new high density water pipes",
        "wkt_geometry": "LINESTRING(78.4867 17.3850, 78.4870 17.3855)",
        "depth_meters": 1.5,
        "work_type": "WATER",
        "start_date": "2026-06-01",
        "end_date": "2026-06-10"
    }
    response = client.post("/api/permits", json=payload, headers=utility_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Main Water Duct Repair"
    assert data["status"] == "PENDING_REVIEW"
    assert data["utility_id"] > 0
    assert data["agency_name"] == "TSSPDCL"
    assert data["clashes"] == []


def test_create_permit_unauthorized_citizen(client, citizen_headers):
    payload = {
        "title": "Main Water Duct Repair",
        "wkt_geometry": "LINESTRING(78.4867 17.3850, 78.4870 17.3855)",
        "depth_meters": 1.5,
        "work_type": "WATER",
        "start_date": "2026-06-01",
        "end_date": "2026-06-10"
    }
    response = client.post("/api/permits", json=payload, headers=citizen_headers)
    assert response.status_code == 403


def test_create_permit_clash_detection_workflow(client, db_session, utility_headers, utility_user):
    # Seed an existing permit
    existing = Permit(
        title="Telecom Duct Work",
        utility_id=utility_user.id,
        agency_name="Airtel",
        wkt_geometry="LINESTRING(78.4867 17.3850, 78.4870 17.3855)",
        depth_meters=1.5,
        work_type="TELECOM",
        start_date=datetime.date(2026, 6, 1),
        end_date=datetime.date(2026, 6, 15),
        status="APPROVED"
    )
    db_session.add(existing)
    db_session.commit()

    # Submit new overlapping permit
    payload = {
        "title": "Water Pipeline Work",
        "description": "Laying water lines",
        "wkt_geometry": "LINESTRING(78.4867 17.3850, 78.4870 17.3855)",
        "depth_meters": 1.3, # Depth conflict
        "work_type": "WATER",
        "start_date": "2026-06-05",
        "end_date": "2026-06-12" # Schedule overlap
    }
    response = client.post("/api/permits", json=payload, headers=utility_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "CLASH_DETECTED"
    assert len(data["clashes"]) == 1
    assert data["clashes"][0]["conflicting_title"] == "Telecom Duct Work"
    assert data["clashes"][0]["conflicting_agency"] == "Airtel"


def test_list_and_get_permits(client, db_session, utility_user):
    p = Permit(
        title="Power Grid Excavation",
        utility_id=utility_user.id,
        agency_name="TSSPDCL",
        wkt_geometry="LINESTRING(78.4867 17.3850, 78.4870 17.3855)",
        depth_meters=2.0,
        work_type="POWER",
        start_date=datetime.date(2026, 6, 1),
        end_date=datetime.date(2026, 6, 10),
        status="SUBMITTED"
    )
    db_session.add(p)
    db_session.commit()

    # List all
    response = client.get("/api/permits")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert data[0]["title"] == "Power Grid Excavation"

    # List with status filter
    response_filtered = client.get("/api/permits?status_filter=SUBMITTED")
    assert response_filtered.status_code == 200
    assert len(response_filtered.json()) >= 1

    response_empty = client.get("/api/permits?status_filter=APPROVED")
    assert response_empty.status_code == 200
    assert len(response_empty.json()) == 0

    # Get Single
    response_single = client.get(f"/api/permits/{p.id}")
    assert response_single.status_code == 200
    assert response_single.json()["title"] == "Power Grid Excavation"

    # Get non-existent
    assert client.get("/api/permits/9999").status_code == 404


def test_admin_update_status(client, db_session, admin_headers, utility_user):
    p = Permit(
        title="Pipeline Work",
        utility_id=utility_user.id,
        agency_name="HMWSSB",
        wkt_geometry="LINESTRING(78.4867 17.3850, 78.4870 17.3855)",
        depth_meters=1.5,
        work_type="WATER",
        start_date=datetime.date(2026, 6, 1),
        end_date=datetime.date(2026, 6, 10),
        status="SUBMITTED"
    )
    db_session.add(p)
    db_session.commit()

    # Admin changes status to APPROVED
    response = client.patch(f"/api/permits/{p.id}/status", json={"status": "APPROVED"}, headers=admin_headers)
    assert response.status_code == 200
    assert response.json()["status"] == "APPROVED"

    # Verify notifications and audits created
    notif = db_session.query(Notification).filter(Notification.permit_id == p.id).first()
    assert notif is not None
    assert "APPROVED" in notif.title

    audit = db_session.query(AuditLog).filter(AuditLog.permit_id == p.id).first()
    assert audit is not None


def test_resolve_clash_workflow(client, db_session, admin_headers, utility_headers, utility_user):
    p1 = Permit(
        title="Telecom Laying",
        utility_id=utility_user.id,
        agency_name="Airtel",
        wkt_geometry="LINESTRING(78.4867 17.3850, 78.4870 17.3855)",
        depth_meters=1.5,
        work_type="TELECOM",
        start_date=datetime.date(2026, 6, 1),
        end_date=datetime.date(2026, 6, 10),
        status="CLASH_DETECTED"
    )
    db_session.add(p1)
    db_session.commit()

    clash = Clash(
        permit_id=p1.id,
        conflicting_permit_id=None,
        overlap_percentage=80.0,
        overlap_days=10,
        estimated_savings=25000.0,
        recommendation_text="Joint layout co-dig suggestion",
        resolved=False
    )
    db_session.add(clash)
    db_session.commit()

    # Non-admin try to resolve
    response_fail = client.post(f"/api/permits/{p1.id}/resolve-clash", headers=utility_headers)
    assert response_fail.status_code == 403

    # Admin resolve
    response = client.post(f"/api/permits/{p1.id}/resolve-clash", headers=admin_headers)
    assert response.status_code == 200
    assert response.json()["status"] == "APPROVED"

    # Check clash resolved
    db_session.refresh(clash)
    assert clash.resolved is True


def test_excavation_lifecycle_workflow(client, db_session, admin_headers, utility_headers, utility_user):
    p = Permit(
        title="Emergency Gas Pipeline Repair",
        utility_id=utility_user.id,
        agency_name="TSSPDCL",  # Match agency of utility_headers fixture
        wkt_geometry="LINESTRING(78.4867 17.3850, 78.4870 17.3855)",
        depth_meters=1.5,
        work_type="GAS",
        start_date=datetime.date(2026, 6, 1),
        end_date=datetime.date(2026, 6, 10),
        status="APPROVED"
    )
    db_session.add(p)
    db_session.commit()

    # Step 1: Admin Authorize Excavation
    response_auth = client.post(
        f"/api/permits/{p.id}/authorize",
        json={"restoration_deadline": "2026-06-15"},
        headers=admin_headers
    )
    assert response_auth.status_code == 200
    assert response_auth.json()["status"] == "AUTHORIZED_EXCAVATION"

    # Step 2: Utility Starts Excavation
    response_start = client.post(f"/api/permits/{p.id}/start-excavation", headers=utility_headers)
    assert response_start.status_code == 200
    assert response_start.json()["status"] == "IN_PROGRESS"

    # Step 3: Utility Completes Excavation
    response_complete = client.post(
        f"/api/permits/{p.id}/complete",
        json={"completion_notes": "All gas pipelines laid and trench backfilled"},
        headers=utility_headers
    )
    assert response_complete.status_code == 200
    assert response_complete.json()["status"] == "EXCAVATION_COMPLETED"

    # Step 4: Admin Requests Rework (Restoration Rejected)
    response_rework = client.post(
        f"/api/permits/{p.id}/request-rework",
        json={"remarks": "Surface leveling is bumpy, needs re-tarring"},
        headers=admin_headers
    )
    assert response_rework.status_code == 200
    assert response_rework.json()["status"] == "IN_PROGRESS"

    # Back to in progress -> Utility completes again
    p.status = "EXCAVATION_COMPLETED"
    db_session.commit()

    # Step 5: Admin Verifies Restoration (Success)
    response_verify = client.post(
        f"/api/permits/{p.id}/verify-restoration",
        json={"remarks": "Perfect level restoration"},
        headers=admin_headers
    )
    assert response_verify.status_code == 200
    assert response_verify.json()["status"] == "ROAD_RESTORED"

    # Step 6: Admin Closes Project
    response_close = client.post(f"/api/permits/{p.id}/close", headers=admin_headers)
    assert response_close.status_code == 200
    assert response_close.json()["status"] == "PROJECT_CLOSED"
