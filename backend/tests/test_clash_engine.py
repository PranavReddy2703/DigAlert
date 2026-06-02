import datetime
from shapely.geometry import LineString, Polygon
from backend.clash_engine import (
    parse_geometry,
    check_date_overlap,
    check_depth_conflict,
    check_clash_for_permit
)
from backend.models import Permit, RoadSegment

def test_parse_geometry_valid_linestring():
    wkt_str = "LINESTRING(78.4867 17.3850, 78.4870 17.3855)"
    geom = parse_geometry(wkt_str)
    assert isinstance(geom, LineString)
    assert geom.coords[0] == (78.4867, 17.3850)


def test_parse_geometry_valid_polygon():
    wkt_str = "POLYGON((78.4867 17.3850, 78.4870 17.3850, 78.4870 17.3855, 78.4867 17.3855, 78.4867 17.3850))"
    geom = parse_geometry(wkt_str)
    assert isinstance(geom, Polygon)


def test_parse_geometry_invalid_fallback():
    geom = parse_geometry("INVALID WKT STRING")
    assert isinstance(geom, LineString)
    assert geom.coords[0] == (78.4867, 17.3850)


def test_check_date_overlap_various_cases():
    # String dates overlap
    overlap, days = check_date_overlap("2026-06-01", "2026-06-10", "2026-06-05", "2026-06-15")
    assert overlap is True
    assert days == 6  # June 5 to June 10 = 6 days inclusive

    # Date objects non-overlap
    d1 = datetime.date(2026, 6, 1)
    d2 = datetime.date(2026, 6, 10)
    d3 = datetime.date(2026, 6, 11)
    d4 = datetime.date(2026, 6, 20)
    overlap, days = check_date_overlap(d1, d2, d3, d4)
    assert overlap is False
    assert days == 0


def test_check_depth_conflict():
    # Conflict: diff < 0.5
    assert check_depth_conflict(1.2, 1.5) is True
    assert check_depth_conflict(1.2, 1.69) is True

    # No conflict: diff >= 0.5
    assert check_depth_conflict(1.2, 1.7) is False
    assert check_depth_conflict(1.0, 2.0) is False


def test_check_clash_for_permit_no_clashes(db_session, utility_user):
    # Setup fresh DB session with no existing permits/roads
    p1 = Permit(
        id=1,
        title="Water Pipe Excavation",
        utility_id=utility_user.id,
        agency_name="HMWSSB",
        wkt_geometry="LINESTRING(78.4867 17.3850, 78.4870 17.3855)",
        depth_meters=1.5,
        work_type="WATER",
        start_date=datetime.date(2026, 6, 1),
        end_date=datetime.date(2026, 6, 10),
        status="SUBMITTED"
    )
    db_session.add(p1)
    db_session.commit()

    # Check clash for p1
    clash_detected, clashes = check_clash_for_permit(p1, db_session)
    assert clash_detected is False
    assert len(clashes) == 0


def test_check_clash_for_permit_with_existing_permit_overlap(db_session, utility_user):
    # Create an existing permit
    existing = Permit(
        title="Power Cable Excavation",
        utility_id=utility_user.id,
        agency_name="TSSPDCL",
        wkt_geometry="LINESTRING(78.4867 17.3850, 78.4870 17.3855)",
        depth_meters=1.5,
        work_type="POWER",
        start_date=datetime.date(2026, 6, 5),
        end_date=datetime.date(2026, 6, 15),
        status="APPROVED"
    )
    db_session.add(existing)
    db_session.commit()

    # Create new overlapping permit (spatial overlap, temporal overlap, and depth conflict)
    new_permit = Permit(
        title="Telecom Duct Work",
        utility_id=utility_user.id,
        agency_name="Airtel",
        wkt_geometry="LINESTRING(78.4867 17.3850, 78.4870 17.3855)",
        depth_meters=1.3, # within 0.5m of existing
        work_type="TELECOM",
        start_date=datetime.date(2026, 6, 1),
        end_date=datetime.date(2026, 6, 10),
        status="SUBMITTED"
    )
    db_session.add(new_permit)
    db_session.commit()

    clash_detected, clashes = check_clash_for_permit(new_permit, db_session)
    assert clash_detected is True
    assert len(clashes) == 1
    assert clashes[0].conflicting_permit_id == existing.id
    assert clashes[0].overlap_percentage > 90.0
    assert clashes[0].estimated_savings > 0.0


def test_check_clash_for_permit_road_resurfacing_lock(db_session, utility_user):
    # Create recently resurfaced road
    road = RoadSegment(
        name="Raj Bhavan Road",
        wkt_geometry="LINESTRING(78.4867 17.3850, 78.4870 17.3855)",
        last_resurfaced_date=datetime.date(2025, 12, 1) # Resurfaced Dec 2025
    )
    db_session.add(road)
    db_session.commit()

    # Create permit starting in June 2026 (within 24 months limit)
    new_permit = Permit(
        title="Gas Line Laying",
        utility_id=utility_user.id,
        agency_name="GAIL",
        wkt_geometry="LINESTRING(78.4867 17.3850, 78.4870 17.3855)",
        depth_meters=2.0,
        work_type="GAS",
        start_date=datetime.date(2026, 6, 1),
        end_date=datetime.date(2026, 6, 10),
        status="SUBMITTED"
    )
    db_session.add(new_permit)
    db_session.commit()

    clash_detected, clashes = check_clash_for_permit(new_permit, db_session)
    assert clash_detected is True
    assert len(clashes) == 1
    assert clashes[0].conflicting_permit_id is None
    assert "CRITICAL COLLISION" in clashes[0].recommendation_text


def test_check_clash_for_permit_emergency_bypasses_road_lock(db_session, utility_user):
    # Create recently resurfaced road
    road = RoadSegment(
        name="Raj Bhavan Road",
        wkt_geometry="LINESTRING(78.4867 17.3850, 78.4870 17.3855)",
        last_resurfaced_date=datetime.date(2025, 12, 1)
    )
    db_session.add(road)
    db_session.commit()

    # Create EMERGENCY permit
    emergency_permit = Permit(
        title="Sewer Pipeline Leak Emergency",
        utility_id=utility_user.id,
        agency_name="HMWSSB",
        wkt_geometry="LINESTRING(78.4867 17.3850, 78.4870 17.3855)",
        depth_meters=3.0,
        work_type="EMERGENCY",
        start_date=datetime.date(2026, 6, 1),
        end_date=datetime.date(2026, 6, 10),
        status="EMERGENCY"
    )
    db_session.add(emergency_permit)
    db_session.commit()

    clash_detected, clashes = check_clash_for_permit(emergency_permit, db_session)
    # Emergency bypasses road segment locks, so no road lock clash detected
    assert clash_detected is False
    assert len(clashes) == 0
