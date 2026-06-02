import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.database import Base, get_db
from backend.main import app
from backend.models import User, RoadSegment
from backend.auth import get_password_hash, create_access_token

# Use in-memory SQLite database for fast, isolated tests
DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    """
    Creates a clean in-memory database, creates all tables,
    yields a session for use in tests, and drops all tables after.
    """
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    """
    Overridden FastAPI client that uses the testing database session.
    """
    def _get_db_override():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = _get_db_override
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture(scope="function")
def admin_user(db_session):
    """Creates a mock administrator user."""
    user = User(
        username="admin_user",
        email="admin@ghmc.gov.in",
        hashed_password=get_password_hash("AdminPass123"),
        role="ADMIN",
        agency_name="GHMC",
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture(scope="function")
def utility_user(db_session):
    """Creates a mock utility user from TSSPDCL agency."""
    user = User(
        username="utility_user",
        email="utility@tsspdcl.gov.in",
        hashed_password=get_password_hash("UtilityPass123"),
        role="UTILITY",
        agency_name="TSSPDCL",
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture(scope="function")
def citizen_user(db_session):
    """Creates a mock citizen user."""
    user = User(
        username="citizen_user",
        email="citizen@gmail.com",
        hashed_password=get_password_hash("CitizenPass123"),
        role="CITIZEN",
        agency_name="Citizen",
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture(scope="function")
def admin_headers(admin_user):
    """Authorization headers for Admin."""
    token = create_access_token(data={"sub": admin_user.username})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="function")
def utility_headers(utility_user):
    """Authorization headers for Utility User."""
    token = create_access_token(data={"sub": utility_user.username})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="function")
def citizen_headers(citizen_user):
    """Authorization headers for Citizen."""
    token = create_access_token(data={"sub": citizen_user.username})
    return {"Authorization": f"Bearer {token}"}
