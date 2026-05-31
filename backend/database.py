import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Read DATABASE_URL from environment; default to local SQLite for zero-config
DATABASE_URL = os.getenv("DATABASE_URL", "").strip()
if not DATABASE_URL:
    DATABASE_URL = "sqlite:///./digalert.db"

# Some cloud providers (and older URLs) may provide 'postgres://' which
# SQLAlchemy recommends replacing with the 'postgresql://' scheme.
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# If using SQLite, apply the check_same_thread connect arg. Do NOT pass
# this to PostgreSQL — it will cause a runtime error.
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={
                           "check_same_thread": False})
else:
    # Use pool_pre_ping to help with cloud DB connections that may be recycled
    engine = create_engine(DATABASE_URL, pool_pre_ping=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
