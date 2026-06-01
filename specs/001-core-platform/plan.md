# DigAlert Technical Design Specification

Version: 1.0
Status: Approved

---

# System Overview

DigAlert is a CivicTech platform that prevents redundant road excavation through:

1. Centralized Permit Management
2. Clash Detection Engine
3. Co-Dig Recommendation Engine
4. Citizen Complaint Portal
5. Administrative Analytics

The platform supports:
- Citizens
- Utility Agencies
- Administrators

---

# High-Level Architecture

```text
┌─────────────────────────────────┐
│ React Frontend                  │
│ Vite + TS + Tailwind            │
└──────────────┬──────────────────┘
               │
         REST API
               │
┌──────────────▼──────────────────┐
│ FastAPI Backend                 │
│ JWT Auth                        │
│ Clash Engine                    │
│ Permit Services                 │
│ Complaint Services              │
└──────────────┬──────────────────┘
               │
      SQLAlchemy ORM
               │
┌──────────────▼──────────────────┐
│ PostgreSQL / SQLite             │
└─────────────────────────────────┘
```

---

# User Roles

## Citizen
Permissions:
- Create complaints
- View complaints
- Track complaint status

Restrictions:
- Cannot create permits
- Cannot access admin dashboard

---

## Utility Agency
Permissions:
- Create permits
- Edit own permits
- View clashes
- View recommendations

Restrictions:
- Cannot manage other agencies

---

## Administrator
Permissions:
- Full system access
- Permit approval
- Clash management
- Dashboard analytics
- Complaint management

---

# Database Design

## Schema Definition

```sql
-- Users Table
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL, -- ADMIN, UTILITY, CITIZEN
    agency_name VARCHAR(100), -- e.g., TSSPDCL, HMWSSB, Airtel
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Road Segments Table (Hyderabad protected roads)
CREATE TABLE road_segments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    wkt_geometry TEXT NOT NULL, -- WKT representation (LINESTRING or POLYGON)
    last_resurfaced_date DATE NOT NULL
);

-- Permits Table
CREATE TABLE permits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    utility_id INTEGER NOT NULL,
    agency_name VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'DRAFT', -- DRAFT, SUBMITTED, CLASH_DETECTED, APPROVED, REJECTED, EMERGENCY, COMPLETED
    wkt_geometry TEXT NOT NULL, -- WKT LineString of excavation route
    depth_meters FLOAT NOT NULL,
    work_type VARCHAR(100) NOT NULL, -- WATER, POWER, SEWERAGE, TELECOM, GAS
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    authorized_at TIMESTAMP,
    authorized_by VARCHAR(100),
    restoration_deadline DATE,
    completed_at TIMESTAMP,
    completed_by VARCHAR(100),
    completion_notes TEXT,
    restoration_verified_at TIMESTAMP,
    restoration_verified_by VARCHAR(100),
    restoration_remarks TEXT,
    closed_at TIMESTAMP,
    closed_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(utility_id) REFERENCES users(id)
);

-- Clashes Table
CREATE TABLE clashes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    permit_id INTEGER NOT NULL,
    conflicting_permit_id INTEGER, -- Nullable for recently resurfaced road locks
    overlap_percentage FLOAT NOT NULL,
    overlap_days INTEGER NOT NULL,
    estimated_savings FLOAT NOT NULL,
    recommendation_text TEXT,
    resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(permit_id) REFERENCES permits(id),
    FOREIGN KEY(conflicting_permit_id) REFERENCES permits(id)
);

-- Citizen Complaints Table
CREATE TABLE complaints (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    permit_id INTEGER,
    citizen_name VARCHAR(100) DEFAULT 'Anonymous',
    complaint_type VARCHAR(100) NOT NULL, -- OPEN_TRENCH, ROAD_NOT_RESTORED, WATER_LEAKAGE, etc.
    description TEXT NOT NULL,
    latitude FLOAT NOT NULL,
    longitude FLOAT NOT NULL,
    photo_url VARCHAR(255),
    status VARCHAR(50) DEFAULT 'OPEN', -- OPEN, ASSIGNED, RESOLVED
    agency_assigned VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(permit_id) REFERENCES permits(id)
);

-- Audit Logs Table
CREATE TABLE audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    permit_id INTEGER NOT NULL,
    event_type VARCHAR(100) NOT NULL, -- Permit Submitted, Clash Detected, Approved, etc.
    description TEXT NOT NULL,
    user_id INTEGER,
    username VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(permit_id) REFERENCES permits(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
);

-- Notifications Table
CREATE TABLE notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    recipient_id INTEGER,
    recipient_role VARCHAR(50), -- ADMIN, UTILITY, CITIZEN
    recipient_agency VARCHAR(100),
    permit_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(recipient_id) REFERENCES users(id),
    FOREIGN KEY(permit_id) REFERENCES permits(id)
);
```

---

# Clash Detection & Geospatial Logic

The backend geospatial engine (`clash_engine.py`) performs 4D analysis based on three dimensions of coordinate geometry + vertical depth levels + temporal schedules.

### Spatial Overlap Rules
- Coordinates are stored as Well-Known Text (WKT) geometries.
- Permissive excavations are buffered using Shapely's standard degrees buffer (`SPATIAL_BUFFER_DEGREES = 0.00015`, approximately **16.5 meters**).
- Overlaps are detected when buffered permit lines intersect (`new_buffered.intersects(other_buffered)`).
- Overlap percentage is computed based on relative intersecting buffer areas:
  $$\text{Overlap Percentage} = \frac{\text{Area}(\text{Intersection})}{\text{Area}(\text{New Permit Buffer})} \times 100$$

### Temporal Overlap Rules
- Schedules are parsed to compare date bounds:
  $$\text{Overlap Start} = \max(\text{Start}_1, \text{Start}_2)$$
  $$\text{Overlap End} = \min(\text{End}_1, \text{End}_2)$$
- Overlapping active days are computed if $\text{Overlap Start} \le \text{Overlap End}$.

### Trench Depth Rules
- Excavations within **0.5 meters** of vertical depth proximity are flagged as high risk for structural trench failure or cable damage.

### Road Protection Lock-in
- Road segments contain a metadata property `last_resurfaced_date`.
- If a permit start date is within **24 months** of the road segment resurfacing date, the request is flagged with a **CRITICAL COLLISION** lock-in violation, preventing non-emergency work approvals.

---

# REST API Endpoint Signatures

## Authentication Router (`/api/auth`)
- `POST /register`: Registers new user and hashes credentials.
- `POST /login`: Validates password and generates JWT token.
- `GET /me`: Returns details of active authenticated session context.

## Permits Router (`/api/permits`)
- `GET /`: Lists permits filtered by role, agency, or status.
- `POST /`: Registers a new permit and executes the `clash_engine` check synchronously.
- `GET /{permit_id}`: Returns complete details of a specific permit.
- `PUT /{permit_id}`: Updates permit fields (requires owner agency or admin credentials).
- `DELETE /{permit_id}`: Deletes a draft permit.
- `GET /{permit_id}/clashes`: Lists spatial, temporal, or road-resurfacing conflict instances.

## Complaints Router (`/api/complaints`)
- `GET /`: Lists all active public complaints.
- `POST /`: Creates a citizen complaint. Allows photo uploads.
- `PUT /{complaint_id}`: Admin/agency workflow updates (assigns agencies, adjusts status).

## Analytics Router (`/api/analytics`)
- `GET /summary`: Compiles metrics (total permits, clash counts, co-dig savings) directly from DB aggregations for the admin dashboard.

## Notifications Router (`/api/notifications`)
- `GET /`: Returns unread notifications for the authorized recipient user.

---

# Frontend Design & Interactive Map

The user interface follows the **High-End Government Tech** dark theme system using:
- **Theme**: Slate/Navy base background (`bg-slate-900/50 backdrop-blur-xl`) with high-contrast text and vibrant indicators.
- **Visualizer**: Uses `MapCanvas.jsx` wrapping Leaflet Maps.
- **Memory Safety**: Cleanups are registered on Leaflet component unmount hooks to ensure all map references are cleared and prevents React memory leaks.
- **Coordination**: Uses visual status-based markers and LineStrings:
  - Green: Approved / Completed Permits
  - Red: Conflict / Clash Detected Permits
  - Orange: Citizen Complaints
  - Blue: Co-Dig Opportunities

---

# Verification Plan

### Automated Endpoint Verification
- Execute API endpoints via FastAPI interactive Swagger docs (`/docs`).
- Perform unit test suites on clash detection geometry routines in `clash_engine.py`.

### Manual UI Verification
- Verify the responsive layouts on mobile screens (Principle VI).
- Confirm coordinates capture and interactive line-draw tool behavior on `MapCanvas.jsx`.
- Check JWT session persistence across tab reloads.
