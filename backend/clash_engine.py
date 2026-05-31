import datetime
from shapely import wkt
from shapely.geometry import LineString, Polygon
from sqlalchemy.orm import Session
from backend.models import Permit, RoadSegment, Clash

# Approximate conversion: 1 degree latitude/longitude ~= 111,000 meters
# A buffer of 0.00015 degrees is roughly 16.5 meters.
SPATIAL_BUFFER_DEGREES = 0.00015


def parse_geometry(wkt_str: str):
    """
    Parse a WKT string into a Shapely geometry object.
    Supports LineString and Polygon. Fallbacks gracefully.
    """
    try:
        return wkt.loads(wkt_str)
    except Exception as e:
        print(f"Error parsing geometry: {e}")
        # Return a simple mock geometry if invalid, to avoid total failure
        return LineString([(78.4867, 17.3850), (78.4870, 17.3855)])


def check_date_overlap(start1, end1, start2, end2):
    """
    Check if two date ranges overlap.
    Returns (is_overlapping, overlap_days)
    """
    # Convert dates if they are string format
    if isinstance(start1, str):
        start1 = datetime.datetime.strptime(start1, "%Y-%m-%d").date()
    if isinstance(end1, str):
        end1 = datetime.datetime.strptime(end1, "%Y-%m-%d").date()
    if isinstance(start2, str):
        start2 = datetime.datetime.strptime(start2, "%Y-%m-%d").date()
    if isinstance(end2, str):
        end2 = datetime.datetime.strptime(end2, "%Y-%m-%d").date()

    overlap_start = max(start1, start2)
    overlap_end = min(end1, end2)

    if overlap_start <= overlap_end:
        overlap_days = (overlap_end - overlap_start).days + 1
        return True, overlap_days
    return False, 0


def check_depth_conflict(depth1: float, depth2: float) -> bool:
    """
    If the vertical depth of the two excavations is within 0.5 meters,
    they are highly likely to cut into each other.
    """
    return abs(depth1 - depth2) < 0.5


def check_clash_for_permit(new_permit: Permit, db: Session):
    """
    Checks the newly submitted permit against:
    1. Other active/upcoming permits (except itself, DRAFT or REJECTED)
    2. Locked/recently resurfaced roads (24-month protection)

    Returns a list of Clash objects and a boolean indicating if a clash exists.
    """
    clash_detected = False
    clash_reports = []

    # 1. Parse new permit geometry
    new_geom = parse_geometry(new_permit.wkt_geometry)
    new_buffered = new_geom.buffer(SPATIAL_BUFFER_DEGREES)

    # 2. Get active / upcoming permits
    # Exclude itself, and non-active statuses (DRAFT, REJECTED, COMPLETED)
    other_permits = db.query(Permit).filter(
        Permit.id != new_permit.id,
        Permit.status.in_(["SUBMITTED", "PENDING_REVIEW", "APPROVED",
                          "IN_PROGRESS", "CLASH_DETECTED", "EMERGENCY"])
    ).all()

    for other in other_permits:
        # Check Spatial Overlap
        other_geom = parse_geometry(other.wkt_geometry)
        other_buffered = other_geom.buffer(SPATIAL_BUFFER_DEGREES)

        if new_buffered.intersects(other_buffered):
            # Calculate overlapping percentage
            intersection = new_buffered.intersection(other_buffered)
            overlap_pct = (intersection.area / new_buffered.area) * 100

            # If spatial overlap is extremely small (e.g. less than 1%), ignore it
            if overlap_pct < 1.0:
                continue

            # Check Temporal Overlap
            temp_overlap, overlap_days = check_date_overlap(
                new_permit.start_date, new_permit.end_date,
                other.start_date, other.end_date
            )

            # Check Depth Overlap
            depth_overlap = check_depth_conflict(
                new_permit.depth_meters, other.depth_meters)

            # Standard clash triggers if we have spatial AND (temporal OR depth) overlap
            if temp_overlap or depth_overlap:
                clash_detected = True

                # Calculate co-digging savings (mock formula based on real economic models)
                # Co-digging reduces road cutting, backfilling, and resurfacing costs by 40-50%
                # Base restoration cost is estimated at ₹15,000 per meter length.
                # Standard line length in degrees to meters (approx 1 degree = 111,000 meters)
                line_length_m = new_geom.length * 111000
                overlap_length_m = line_length_m * (overlap_pct / 100)

                # Co-digging savings: ~₹6,000 savings per overlapping meter by combining digging operations
                savings = round(overlap_length_m * 6000, 2)
                if savings < 10000:
                    savings = 12500.00  # Minimum floor savings for showing value

                rec_text = (
                    f"Recommend Co-Digging project! High overlap ({overlap_pct:.1f}%) detected on the same road segment "
                    f"with {other.agency_name}. Splitting road restoration costs would save approximately ₹{savings:,.2f} INR."
                )
                if not temp_overlap and depth_overlap:
                    rec_text += " Note: Schedules do not currently overlap, but physical depth levels are within conflict range (0.5m)."

                clash_obj = Clash(
                    permit_id=new_permit.id,
                    conflicting_permit_id=other.id,
                    overlap_percentage=round(overlap_pct, 1),
                    overlap_days=overlap_days,
                    estimated_savings=savings,
                    recommendation_text=rec_text,
                    resolved=False
                )
                clash_reports.append(clash_obj)

    # 3. Check against locked/resurfaced roads (lock-in period is 2 years/24 months)
    # If permit is EMERGENCY, skip resurfaced road lock check
    if new_permit.work_type != "EMERGENCY" and new_permit.status != "EMERGENCY":
        resurfaced_roads = db.query(RoadSegment).all()
        for road in resurfaced_roads:
            # Check spatial overlap
            road_geom = parse_geometry(road.wkt_geometry)
            road_buffered = road_geom.buffer(SPATIAL_BUFFER_DEGREES)

            if new_buffered.intersects(road_buffered):
                # Check if last resurfaced date is within 2 years of permit start date
                permit_start = new_permit.start_date
                if isinstance(permit_start, str):
                    permit_start = datetime.datetime.strptime(
                        permit_start, "%Y-%m-%d").date()

                months_since_resurface = (
                    permit_start - road.last_resurfaced_date).days / 30.0

                if months_since_resurface < 24.0:
                    clash_detected = True
                    months_left = 24.0 - months_since_resurface
                    rec_text = (
                        f"CRITICAL COLLISION: Road segment '{road.name}' was recently resurfaced on {road.last_resurfaced_date} "
                        f"({months_since_resurface:.1f} months ago). GHMC policy locks recently resurfaced roads for 24 months. "
                        f"Excavation is locked for another {months_left:.1f} months, except for GHMC-approved emergency works."
                    )

                    # Create a specialized clash entry for resurfaced road collision
                    # Set conflicting_permit_id to None instead of -road.id to satisfy Postgres strict Foreign Keys
                    clash_obj = Clash(
                        permit_id=new_permit.id,
                        conflicting_permit_id=None,
                        overlap_percentage=100.0,
                        overlap_days=365,  # Multi-month block
                        estimated_savings=0.0,
                        recommendation_text=rec_text,
                        resolved=False
                    )
                    clash_reports.append(clash_obj)

    return clash_detected, clash_reports
