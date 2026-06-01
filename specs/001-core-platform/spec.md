# DigAlert Requirements Specification

## Introduction

DigAlert is a CivicTech platform that prevents repeated road excavations by enabling utility agencies to coordinate excavation permits through intelligent clash detection and co-dig recommendations.

The system serves three stakeholder groups:

1. Citizens
2. Utility Agencies
3. City Administrators

---

# Functional Requirements

## FR-1 User Authentication

### Description

The system shall support secure authentication and authorization.

### Requirements

- Users shall register using email and password.
- Users shall log in using JWT authentication.
- Passwords shall be securely hashed.
- Sessions shall persist until expiration.
- The system shall support role-based access control.

### Roles

- Citizen
- Utility Agency
- Administrator

---

## FR-2 Permit Registration

### Description

Utility agencies shall submit excavation permits.

### Required Fields

- Agency Name
- Utility Type
- Road Name
- Coordinates
- Excavation Depth
- Start Date
- End Date
- Work Description

### Acceptance Criteria

- Permit data is validated.
- Permit is stored successfully.
- Clash detection runs automatically.

---

## FR-3 Permit Management

### Description

Authorized users shall manage permits.

### Actions

- Create
- Read
- Update
- Delete

### Acceptance Criteria

- Administrators can manage all permits.
- Agencies can manage their own permits.
- Citizens cannot modify permits.

---

## FR-4 Clash Detection Engine

### Description

The system shall automatically evaluate new permits for conflicts.

### Evaluation Factors

#### Spatial Overlap

- Same road segment
- Geometric intersection
- Buffer overlap

#### Temporal Overlap

- Overlapping schedules

#### Depth Conflict

- Excavation depth collision

### Acceptance Criteria

- Clash generated immediately after submission.
- Severity level assigned.
- Conflict details returned.

---

## FR-5 Co-Dig Recommendation Engine

### Description

The system shall generate coordinated excavation recommendations.

### Acceptance Criteria

- Shared excavation window identified.
- Agencies involved listed.
- Estimated savings calculated.
- Recommendation visible to administrators.

---

## FR-6 Complaint Management

### Description

Citizens shall report excavation-related issues.

### Complaint Types

- Open Trench
- Damaged Road
- Water Leakage
- Unsafe Excavation
- Traffic Obstruction

### Inputs

- Category
- Description
- Location
- Photo Upload

### Acceptance Criteria

- Complaint stored.
- Status initialized as Open.
- Complaint appears on map.

---

## FR-7 Complaint Tracking

### Description

Citizens shall track submitted complaints.

### Statuses

- Open
- In Progress
- Resolved

### Acceptance Criteria

- Status visible.
- Last update displayed.
- Resolution notes displayed.

---

## FR-8 Administrative Dashboard

### Description

Administrators shall access operational metrics.

### Dashboard Metrics

- Total Permits
- Active Permits
- Approved Permits
- Clash Count
- Co-Dig Opportunities
- Citizen Complaints
- Estimated Savings

### Acceptance Criteria

- Metrics update dynamically.
- Data sourced from database.

---

## FR-9 Interactive Map

### Description

The platform shall provide a city-wide map view.

### Display Objects

- Active Permits
- Complaints
- Clash Locations
- Co-Dig Opportunities

### Acceptance Criteria

- Zoomable map.
- Interactive markers.
- Status-based color coding.

---

## FR-10 Notifications

### Description

Users shall receive system notifications.

### Notification Events

- Clash Detected
- Permit Approved
- Permit Rejected
- Complaint Updated
- Co-Dig Opportunity

### Acceptance Criteria

- Notifications stored.
- Unread count visible.
- Read status tracked.

---

## FR-11 Analytics and Reporting

### Description

Administrators shall generate reports.

### Reports

- Permit Summary
- Clash Summary
- Savings Analysis
- Complaint Statistics

### Export Formats

- CSV
- PDF

### Acceptance Criteria

- Reports generated on demand.
- Download available.

---

# Non-Functional Requirements

## NFR-1 Performance

- Permit submission response under 3 seconds.
- Dashboard load under 2 seconds.
- Clash detection under 1 second for 1000 permits.

---

## NFR-2 Security

- JWT authentication.
- BCrypt password hashing.
- Protected API endpoints.
- Input validation.

---

## NFR-3 Reliability

- No data loss during normal operations.
- Automatic database recovery support.

---

## NFR-4 Scalability

- Support city-scale deployments.
- PostgreSQL production support.
- Modular service architecture.

---

## NFR-5 Accessibility

- Mobile responsive.
- WCAG-compliant UI.
- Keyboard navigable.

---

## NFR-6 Maintainability

- Typed APIs.
- Separation of concerns.
- Documented endpoints.
- Consistent coding standards.

---

# User Stories

## Citizen

As a citizen,
I want to report an unsafe excavation,
so that authorities can resolve it.

---

As a citizen,
I want to track complaint status,
so that I know when action is taken.

---

## Utility Agency

As a utility agency,
I want to submit excavation permits,
so that work can be authorized.

---

As a utility agency,
I want to know about excavation clashes,
so that I can coordinate with others.

---

## Administrator

As an administrator,
I want to monitor all permits,
so that city excavation activities remain coordinated.

---

As an administrator,
I want to review co-dig opportunities,
so that public resources are saved.

---

# Success Metrics

- 100% of permits evaluated for clashes.
- Clash detection completed before approval.
- Reduction in duplicate excavation events.
- Increased co-dig adoption.
- Faster complaint resolution.
- Improved infrastructure transparency.
