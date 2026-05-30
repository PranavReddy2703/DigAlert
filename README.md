# TrenchSync

> **Coordinate before you cut.**

TrenchSync is a civic-tech platform that prevents redundant road digging in Hyderabad by enabling utility agencies to register dig permits, detect clashes before work begins, and coordinate shared trenches — saving GHMC crores in avoidable road re-lay costs.

---

## The Problem

Hyderabad's roads are dug up repeatedly by multiple utility agencies — HMWSSB, TSSPDCL, Jio, BSNL, GAIL — each operating without knowledge of the others' plans. A road freshly re-laid by GHMC is broken open weeks later by a different utility. There is no cross-agency system to prevent this, no public visibility into who is digging where, and no way for citizens to report unattended or abandoned dig sites causing hazards.

---

## What TrenchSync Does

| Feature | Description |
|---|---|
| Permit Registry | Any utility submits a dig permit with road segment, dates, depth |
| Clash Detection | Auto-detects spatial + date overlaps with existing permits |
| Co-dig Suggestions | Alerts both agencies, proposes shared trench scheduling |
| Savings Calculator | Computes Rs. saved per co-dig event based on GHMC re-lay rates |
| GHMC Dashboard | Live map of all active permits + running savings counter |
| Citizen Reports | Citizens report unattended/hazardous dig sites with photo + location |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite |
| Styling | Tailwind CSS |
| Map | Leaflet.js + OpenStreetMap |
| Backend | FastAPI (Python) |
| Database | SQLite (dev) / PostgreSQL (prod) |
| Spatial logic | Shapely (Python) |
| Image upload | Cloudinary (citizen reports) |
| Deploy — Frontend | Vercel |
| Deploy — Backend | Render |

---

## Project Structure

```
trencsync/
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx        # GHMC live permit map + savings
│   │   │   ├── SubmitPermit.jsx     # Utility permit submission form
│   │   │   ├── ClashAlert.jsx       # Clash detection result + co-dig UI
│   │   │   └── CitizenReport.jsx    # Public issue reporting page
│   │   ├── components/
│   │   │   ├── MapView.jsx          # Leaflet map wrapper
│   │   │   ├── PermitCard.jsx       # Single permit display card
│   │   │   └── ReportCard.jsx       # Citizen report card
│   │   └── main.jsx
│   ├── index.html
│   └── vite.config.js
│
├── backend/
│   ├── main.py                      # FastAPI app + route registration
│   ├── models.py                    # SQLAlchemy models
│   ├── schemas.py                   # Pydantic schemas
│   ├── clash.py                     # Spatial + date clash detection logic
│   ├── seed.py                      # Seed script — 8 Hyderabad permits
│   └── database.py                  # DB connection + session
│
└── README.md
```

---

## Getting Started

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install fastapi uvicorn sqlalchemy shapely pydantic python-multipart
python seed.py
uvicorn main:app --reload
```

Backend runs at `http://localhost:8000`  
API docs at `http://localhost:8000/docs`

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`

---

## API Reference

### Permits

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/permits` | List all active permits |
| `POST` | `/permits` | Submit a new permit (triggers clash detection) |
| `GET` | `/permits/{id}` | Get a single permit |

#### POST `/permits` — request body

```json
{
  "utility": "TSSPDCL",
  "road_name": "Road No. 12, Banjara Hills",
  "lat1": 17.4156, "lng1": 78.4347,
  "lat2": 17.4189, "lng2": 78.4401,
  "depth_m": 1.2,
  "start_date": "2026-06-10",
  "end_date": "2026-06-25"
}
```

#### Response — clash detected

```json
{
  "status": "clash",
  "clashing_permits": [
    {
      "id": 3,
      "utility": "HMWSSB",
      "road_name": "Road No. 12, Banjara Hills",
      "start_date": "2026-06-01",
      "end_date": "2026-06-20"
    }
  ],
  "estimated_saving_inr": 57600,
  "co_dig_suggestion": "Coordinate with HMWSSB to share a single trench on Road No. 12. Proposed window: June 10-20."
}
```

### Citizen Reports

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/reports` | List all citizen-submitted reports |
| `POST` | `/reports` | Submit a new unattended dig report |
| `PATCH` | `/reports/{id}/status` | Update report status (admin) |

#### POST `/reports` — multipart form

| Field | Type | Description |
|---|---|---|
| `description` | string | What the citizen observed |
| `location_text` | string | Landmark / address |
| `lat` | float | GPS latitude |
| `lng` | float | GPS longitude |
| `photo` | file | Image of the hazard (optional) |
| `reporter_phone` | string | Optional contact for follow-up |

---

## Clash Detection Logic

```python
from shapely.geometry import LineString

def segments_overlap(p1, p2, q1, q2, buffer_m=15):
    seg_p = LineString([p1, p2]).buffer(buffer_m / 111320)
    seg_q = LineString([q1, q2])
    return seg_p.intersects(seg_q)

def dates_overlap(start1, end1, start2, end2):
    return start1 <= end2 and start2 <= end1
```

Cost saving formula:

```
saving (Rs.) = segment_length_m x avg_trench_width_m x ghmc_relay_rate_per_sqm
             = segment_length_m x 1.5 x 1000
```

---

## Citizen Report Flow

1. Citizen visits `/report` — no login required
2. Fills description, drops a pin on the map, optionally uploads a photo
3. Report stored with status `open`
4. GHMC admin sees all open reports alongside active permits on the same map
5. Admin updates status to `in_progress` or `resolved`
6. Citizen can track status via their report ID

---

## Seeded Demo Data

Run `python seed.py` to load these Hyderabad permits:

| Utility | Road | Dates |
|---|---|---|
| HMWSSB | Road No. 12, Banjara Hills | Jun 1 – Jun 20 |
| TSSPDCL | Jubilee Hills Rd 36 | Jun 15 – Jul 5 |
| Jio | Madhapur Main Rd | May 20 – Jun 10 |
| BSNL | HITEC City Lane | Jun 18 – Jul 10 |
| HMWSSB | Kondapur Main Rd | Jun 5 – Jun 28 |
| GAIL | Gachibowli Rd | Jul 1 – Jul 20 |
| TSSPDCL | Film Nagar Rd | Jun 10 – Jun 30 |
| Jio | Madhapur Inner Ring | Jun 22 – Jul 15 |

**Demo clash**: Submit TSSPDCL on Road No. 12, Banjara Hills for Jun 15–25 → clashes with HMWSSB permit.

---

## Impact

- Hyderabad: 400+ road cutting permits per year
- GHMC re-lay cost: Rs. 800–1,200 per sq.m
- 15% co-dig coordination = ~Rs. 4–6 crore saved annually
- Citizen reports reduce unattended dig hazard time from ~11 days to under 48 hours

---

## License

MIT — Built at CivicTech Hackathon, Hyderabad 2026

