import pytest
from backend.auth import get_password_hash, verify_password, create_access_token
from backend.models import User

def test_password_hashing():
    password = "MySecurePassword123"
    hashed = get_password_hash(password)
    assert hashed != password
    assert verify_password(password, hashed) is True
    assert verify_password("wrong_password", hashed) is False
    assert verify_password(password, "invalid_hash") is False


def test_register_user_success(client, db_session):
    register_payload = {
        "username": "new_agency",
        "email": "new_agency@hmwssb.gov.in",
        "password": "HmwssbPassword123",
        "role": "UTILITY",
        "agency_name": "HMWSSB"
    }
    response = client.post("/api/auth/register", json=register_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "new_agency"
    assert data["email"] == "new_agency@hmwssb.gov.in"
    assert data["role"] == "UTILITY"
    assert data["agency_name"] == "HMWSSB"
    assert "id" in data

    # Verify user in database
    db_user = db_session.query(User).filter(User.username == "new_agency").first()
    assert db_user is not None
    assert db_user.role == "UTILITY"


def test_register_duplicate_username_or_email(client, utility_user):
    # Try duplicate username
    register_payload = {
        "username": utility_user.username,
        "email": "another_email@gmail.com",
        "password": "Password123",
        "role": "CITIZEN",
        "agency_name": "Citizen"
    }
    response = client.post("/api/auth/register", json=register_payload)
    assert response.status_code == 400
    assert "Username or email already registered" in response.json()["detail"]

    # Try duplicate email
    register_payload2 = {
        "username": "unique_username",
        "email": utility_user.email,
        "password": "Password123",
        "role": "CITIZEN",
        "agency_name": "Citizen"
    }
    response = client.post("/api/auth/register", json=register_payload2)
    assert response.status_code == 400


def test_register_invalid_role(client):
    register_payload = {
        "username": "invalid_role_user",
        "email": "invalid_role@gmail.com",
        "password": "Password123",
        "role": "SUPERUSER",
        "agency_name": "Citizen"
    }
    response = client.post("/api/auth/register", json=register_payload)
    assert response.status_code == 400
    assert "Role must be one of ADMIN, UTILITY, or CITIZEN" in response.json()["detail"]


def test_login_success(client, utility_user):
    login_payload = {
        "username": utility_user.username,
        "password": "UtilityPass123"
    }
    response = client.post("/api/auth/login", data=login_payload)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["role"] == "UTILITY"
    assert data["agency_name"] == "TSSPDCL"
    assert data["username"] == utility_user.username


def test_login_failure(client, utility_user):
    # Invalid password
    login_payload = {
        "username": utility_user.username,
        "password": "WrongPassword"
    }
    response = client.post("/api/auth/login", data=login_payload)
    assert response.status_code == 401
    assert "Incorrect username or password" in response.json()["detail"]

    # Invalid user
    login_payload2 = {
        "username": "non_existent",
        "password": "SomePassword"
    }
    response = client.post("/api/auth/login", data=login_payload2)
    assert response.status_code == 401


def test_get_me_success(client, utility_headers, utility_user):
    response = client.get("/api/auth/me", headers=utility_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == utility_user.username
    assert data["email"] == utility_user.email
    assert data["role"] == "UTILITY"


def test_get_me_unauthorized(client):
    # No headers
    response = client.get("/api/auth/me")
    assert response.status_code == 401

    # Invalid token headers
    response = client.get("/api/auth/me", headers={"Authorization": "Bearer invalidtoken123"})
    assert response.status_code == 401
