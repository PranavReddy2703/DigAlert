import pytest
from backend.models import Notification

def test_list_notifications_by_role(client, db_session, admin_headers, utility_headers, citizen_headers, utility_user):
    # Seed various notifications
    n1 = Notification(
        title="Admin Alert",
        message="A new permit was submitted.",
        recipient_role="ADMIN"
    )
    n2 = Notification(
        title="Utility Alert (TSSPDCL)",
        message="Your permit was approved.",
        recipient_role="UTILITY",
        recipient_agency="TSSPDCL"
    )
    n3 = Notification(
        title="Utility Alert (HMWSSB)",
        message="Your permit was approved.",
        recipient_role="UTILITY",
        recipient_agency="HMWSSB"
    )
    db_session.add_all([n1, n2, n3])
    db_session.commit()

    # Admin list
    resp_admin = client.get("/api/notifications", headers=admin_headers)
    assert resp_admin.status_code == 200
    data_admin = resp_admin.json()
    assert len(data_admin) == 1
    assert data_admin[0]["title"] == "Admin Alert"

    # TSSPDCL Utility list
    resp_util = client.get("/api/notifications", headers=utility_headers)
    assert resp_util.status_code == 200
    data_util = resp_util.json()
    assert len(data_util) == 1
    assert data_util[0]["title"] == "Utility Alert (TSSPDCL)"

    # Citizen list (returns empty list)
    resp_citizen = client.get("/api/notifications", headers=citizen_headers)
    assert resp_citizen.status_code == 200
    assert resp_citizen.json() == []


def test_mark_notification_as_read(client, db_session, admin_headers, utility_headers):
    n = Notification(
        title="Admin Alert",
        message="Check updates.",
        recipient_role="ADMIN"
    )
    db_session.add(n)
    db_session.commit()

    # Try read with utility headers (should fail 403)
    resp_fail = client.post(f"/api/notifications/{n.id}/read", headers=utility_headers)
    assert resp_fail.status_code == 403

    # Read with admin headers
    resp_ok = client.post(f"/api/notifications/{n.id}/read", headers=admin_headers)
    assert resp_ok.status_code == 200
    assert resp_ok.json()["read"] is True

    # Mark non-existent
    assert client.post("/api/notifications/9999/read", headers=admin_headers).status_code == 404


def test_mark_all_read(client, db_session, admin_headers):
    n1 = Notification(title="Alert 1", message="Msg 1", recipient_role="ADMIN", read=False)
    n2 = Notification(title="Alert 2", message="Msg 2", recipient_role="ADMIN", read=False)
    db_session.add_all([n1, n2])
    db_session.commit()

    response = client.post("/api/notifications/read-all", headers=admin_headers)
    assert response.status_code == 200
    assert "Successfully marked 2 notifications as read" in response.json()["message"]


def test_delete_notification(client, db_session, admin_headers, utility_headers):
    n = Notification(
        title="Admin Alert",
        message="Delete me.",
        recipient_role="ADMIN"
    )
    db_session.add(n)
    db_session.commit()

    # Try delete with utility headers (fail 403)
    resp_fail = client.delete(f"/api/notifications/{n.id}", headers=utility_headers)
    assert resp_fail.status_code == 403

    # Delete with admin headers (success 204)
    resp_ok = client.delete(f"/api/notifications/{n.id}", headers=admin_headers)
    assert resp_ok.status_code == 204

    # Delete non-existent
    assert client.delete("/api/notifications/9999", headers=admin_headers).status_code == 404
