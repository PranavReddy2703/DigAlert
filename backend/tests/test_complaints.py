import pytest
import datetime
from io import BytesIO
from backend.models import Complaint, Permit

def test_create_complaint_no_proximity(client):
    payload = {
        "citizen_name": "Srinivas Rao",
        "complaint_type": "TRAFFIC_OBSTRUCTION",
        "description": "Road excavation blocking traffic flow completely",
        "latitude": 17.3850,
        "longitude": 78.4867
    }
    response = client.post("/api/complaints", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["citizen_name"] == "Srinivas Rao"
    assert data["status"] == "OPEN"
    assert data["permit_id"] is None
    assert data["agency_assigned"] is None


def test_create_complaint_with_proximity_matching(client, db_session, utility_user):
    # Seed active permit near Hyderabad center
    p = Permit(
        title="Main Sewer Line Repair",
        utility_id=utility_user.id,
        agency_name="HMWSSB",
        wkt_geometry="LINESTRING(78.4867 17.3850, 78.4870 17.3855)",
        depth_meters=2.0,
        work_type="SEWERAGE",
        start_date=datetime.date(2026, 6, 1),
        end_date=datetime.date(2026, 6, 10),
        status="IN_PROGRESS"
    )
    db_session.add(p)
    db_session.commit()

    # File complaint right on the permit excavation path
    payload = {
        "citizen_name": "Anonymous",
        "complaint_type": "OPEN_TRENCH",
        "description": "Deep open trench with no barricades near center coordinates",
        "latitude": 17.3851,
        "longitude": 78.4868
    }
    response = client.post("/api/complaints", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ASSIGNED"
    assert data["permit_id"] == p.id
    assert data["agency_assigned"] == "HMWSSB"


def test_upload_complaint_form_data(client):
    # Test upload with form details
    form_data = {
        "citizen_name": "Satish Kumar",
        "complaint_type": "WATER_LEAKAGE",
        "description": "Large water leakage from excavation site",
        "latitude": "17.4000",
        "longitude": "78.5000",
    }
    response = client.post("/api/complaints/upload", data=form_data)
    assert response.status_code == 200
    data = response.json()
    assert data["citizen_name"] == "Satish Kumar"
    assert data["complaint_type"] == "WATER_LEAKAGE"
    assert data["status"] == "OPEN"


def test_list_and_get_complaints(client, db_session):
    c = Complaint(
        citizen_name="Pranitha G",
        complaint_type="UNSAFE_BARRICADING",
        description="Barricades are falling into traffic lane",
        latitude=17.3900,
        longitude=78.4900,
        status="OPEN"
    )
    db_session.add(c)
    db_session.commit()

    # List all
    response = client.get("/api/complaints")
    assert response.status_code == 200
    assert len(response.json()) >= 1

    # Get Single
    response_single = client.get(f"/api/complaints/{c.id}")
    assert response_single.status_code == 200
    assert response_single.json()["citizen_name"] == "Pranitha G"

    # Get non-existent
    assert client.get("/api/complaints/9999").status_code == 404


def test_update_complaint_status_workflow(client, db_session, admin_headers, utility_headers, citizen_headers):
    c = Complaint(
        citizen_name="Pranitha G",
        complaint_type="ABANDONED_WORK",
        description="Excavation site has been idle for a week",
        latitude=17.3900,
        longitude=78.4900,
        status="OPEN",
        agency_assigned="TSSPDCL" # Assigned to TSSPDCL (utility_headers user is TSSPDCL)
    )
    db_session.add(c)
    db_session.commit()

    # Citizen cannot update
    response_citizen = client.patch(f"/api/complaints/{c.id}", json={"status": "RESOLVED"}, headers=citizen_headers)
    assert response_citizen.status_code == 403

    # Assigned utility can resolve
    response_utility = client.patch(f"/api/complaints/{c.id}", json={"status": "RESOLVED"}, headers=utility_headers)
    assert response_utility.status_code == 200
    assert response_utility.json()["status"] == "RESOLVED"

    # Reset to open
    c.status = "OPEN"
    c.agency_assigned = "HMWSSB" # Now assigned to HMWSSB
    db_session.commit()

    # TSSPDCL utility user cannot update complaint assigned to HMWSSB
    response_lockout = client.patch(f"/api/complaints/{c.id}", json={"status": "RESOLVED"}, headers=utility_headers)
    assert response_lockout.status_code == 403
    assert "You can only resolve complaints assigned to your specific agency." in response_lockout.json()["detail"]

    # Admin update succeeds and can assign/unassign agencies
    response_admin = client.patch(f"/api/complaints/{c.id}", json={"agency_assigned": "", "status": "OPEN"}, headers=admin_headers)
    assert response_admin.status_code == 200
    assert response_admin.json()["agency_assigned"] is None
