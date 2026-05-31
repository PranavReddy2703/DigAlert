import datetime
from sqlalchemy import Column, Integer, String, Float, Date, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from backend.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False)  # ADMIN, UTILITY, CITIZEN
    # e.g., TSSPDCL, HMWSSB, Airtel, BSNL, GHMC, Citizen
    agency_name = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    permits = relationship("Permit", back_populates="utility")


class RoadSegment(Base):
    """
    Represents Hyderabad roads with lock-in protection periods (e.g., recently resurfaced)
    """
    __tablename__ = "road_segments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    # WKT representation (LINESTRING or POLYGON)
    wkt_geometry = Column(String, nullable=False)
    last_resurfaced_date = Column(Date, nullable=False)


class Permit(Base):
    __tablename__ = "permits"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    utility_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    # Cached agency name for fast access
    agency_name = Column(String, nullable=False)
    # DRAFT, SUBMITTED, CLASH_DETECTED, PENDING_REVIEW, APPROVED, EMERGENCY, IN_PROGRESS, COMPLETED, REJECTED
    status = Column(String, default="DRAFT")
    # WKT LineString of excavation
    wkt_geometry = Column(String, nullable=False)
    depth_meters = Column(Float, nullable=False)
    # WATER, POWER, SEWERAGE, TELECOM, GAS, ROAD_REPAIR
    work_type = Column(String, nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    authorized_at = Column(DateTime, nullable=True)
    authorized_by = Column(String, nullable=True)
    restoration_deadline = Column(Date, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    completed_by = Column(String, nullable=True)
    completion_notes = Column(String, nullable=True)
    restoration_verified_at = Column(DateTime, nullable=True)
    restoration_verified_by = Column(String, nullable=True)
    restoration_remarks = Column(String, nullable=True)
    closed_at = Column(DateTime, nullable=True)
    closed_by = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    utility = relationship("User", back_populates="permits")
    complaints = relationship("Complaint", back_populates="permit")
    audit_logs = relationship("AuditLog", back_populates="permit", cascade="all, delete-orphan")


class Clash(Base):
    __tablename__ = "clashes"

    id = Column(Integer, primary_key=True, index=True)
    permit_id = Column(Integer, ForeignKey("permits.id"), nullable=False)
    conflicting_permit_id = Column(
        Integer, ForeignKey("permits.id"), nullable=True)
    overlap_percentage = Column(Float, nullable=False)
    overlap_days = Column(Integer, nullable=False)
    estimated_savings = Column(Float, nullable=False)
    recommendation_text = Column(String, nullable=True)
    resolved = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    # Using string definitions to avoid circular dependency problems
    permit = relationship("Permit", foreign_keys=[permit_id])
    conflicting_permit = relationship(
        "Permit", foreign_keys=[conflicting_permit_id])


class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    permit_id = Column(Integer, ForeignKey("permits.id"), nullable=True)
    citizen_name = Column(String, nullable=True, default="Anonymous")
    # OPEN_TRENCH, UNSAFE_BARRICADING, ROAD_NOT_RESTORED, ABANDONED_WORK, WATER_LEAKAGE, TRAFFIC_OBSTRUCTION
    complaint_type = Column(String, nullable=False)
    description = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    photo_url = Column(String, nullable=True)
    status = Column(String, default="OPEN")  # OPEN, ASSIGNED, RESOLVED
    # Name of utility agency responsible
    agency_assigned = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    permit = relationship("Permit", back_populates="complaints")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    permit_id = Column(Integer, ForeignKey("permits.id"), nullable=False)
    event_type = Column(String, nullable=False)  # Permit Submitted, Clash Detected, Clash Resolved, Approved By GHMC, Excavation Authorized, Excavation Started, Work Completed, Road Restored
    description = Column(String, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    username = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    permit = relationship("Permit", back_populates="audit_logs")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    message = Column(String, nullable=False)
    read = Column(Boolean, default=False)
    recipient_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    recipient_role = Column(String, nullable=True)  # ADMIN, UTILITY, CITIZEN
    recipient_agency = Column(String, nullable=True)  # e.g. Airtel, BSNL
    permit_id = Column(Integer, ForeignKey("permits.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    recipient = relationship("User", foreign_keys=[recipient_id])
    permit = relationship("Permit", foreign_keys=[permit_id])
