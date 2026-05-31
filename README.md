# DigAlert — Smart Permit Intelligence for Safer Cities

> **Premium CivicTech platform** that prevents repeated road excavations by coordinating utility agencies before digging — powered by spatial clash detection, co-dig recommendations, and real-time citizen complaint tracking.

---

## The Problem

Hyderabad's roads are dug up repeatedly — sometimes the same stretch within weeks — because water, electricity, gas, telecom, and fiber agencies plan their excavations independently. Each agency submits a permit, digs, repairs the road, and leaves. Weeks later, the next agency arrives and digs up the same patch. The result: perpetual road damage, wasted public funds, traffic disruption, and frustrated citizens.

## The Solution

DigAlert introduces **Smart Permit Intelligence**: when a utility agency submits a new excavation permit, the system instantly checks whether any other agency is planning work on the same road segment or within 150 metres during an overlapping date window. If a clash is found, both agencies are notified and offered a **co-dig recommendation** — a shared excavation window that eliminates duplicate work and saves lakhs of rupees per operation.

Three stakeholders are served by one unified platform:

| Stakeholder | What they get |
|---|---|
| **Citizens** | Report open trenches, water leaks, unsafe excavations via mobile-friendly form; track status |
| **Utility Agencies** | Submit permits; receive instant clash alerts + co-dig proposals; accept or dismiss |
| **GHMC Administrators** | Full permit + complaint registries; clash resolution dashboard; analytics + CSV exports |

---

## Key Features

- **Instant Clash Detection** — Haversine spatial check (150 m radius) + same-road-segment match + date-window overlap, all within the permit submission request
- **Co-Dig Recommendations** — Automatically proposed shared excavation windows with estimated INR savings
- **Interactive Map** — OSM-powered permit + complaint + clash visualization with colored markers and popups
- **Citizen Complaint Portal** — Category-driven reports with photo upload support and live status tracking
- **Real-Time Notifications** — In-app notification feed for clashes, co-dig proposals, permit updates, and system events
- **Analytics Dashboard** — Monthly trends, savings summary, status breakdowns, and recent activity feed (Recharts)
- **CSV Export** — One-click export of permits and complaints for offline analysis
- **JWT Authentication** — Role-based access (citizen / utility / admin) with persistent sessions
- **Premium Dark/Light Themes** — Glassmorphism design system; WCAG AA accessible; fully responsive
- **Zero-Config SQLite Default** — Runs out of the box; switch to PostgreSQL via a single env var

## Architecture

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│                              DigAlert Platform                               │
│                                                                              │
│  ┌──────────────┐    ┌──────────────────┐    ┌────────────────────┐          │
│  │   Citizens   │    │ Utility Agencies │    │    GHMC Admins     │          │
│  │              │    │                  │    │                    │          │
│  │ • File report│    │ • Submit permit  │    │ • View dashboards  │          │
│  │ • Track case │    │ • View clash     │    │ • Resolve clashes  │          │
│  │ • View map   │    │ • Accept co-dig  │    │ • Export data      │          │
│  └──────┬───────┘    └────────┬─────────┘    └─────────┬──────────┘          │
│         │                     │                        │                     │
│         └─────────────────────┼────────────────────────┘                     │
│                               │                                              │
│                ┌──────────────▼──────────────┐                               │
│                │   React 18 + Vite Frontend  │                               │
│                │ TypeScript · Tailwind       │                               │
│                │ Framer Motion · React Router│                               │
│                │ TanStack Query · Recharts   │                               │
│                │ Leaflet                     │                               │
│                └──────────────┬──────────────┘                               │
│                               │ REST API (JSON)                              │
│                               ▼                                              │
│                ┌─────────────────────────────┐                               │
│                │       FastAPI Backend       │                               │
│                │ /api/auth                   │                               │
│                │ /api/permits                │                               │
│                │ /api/clashes                │                               │
│                │ /api/complaints             │                               │
│                │ /api/analytics              │                               │
│                │ /api/notifications          │                               │
│                │                             │                               │
│                │ ┌─────────────────────────┐ │                               │
│                │ │ Clash Detection Engine  │ │                               │
│                │ │ • Haversine(lat, lon)   │ │                               │
│                │ │ • 150m spatial radius   │ │                               │
│                │ │ • Same-segment match    │ │                               │
│                │ │ • Date overlap window   │ │                               │
│                │ │ • Severity assessment   │ │                               │
│                │ │ • Co-dig generation     │ │                               │
│                │ └─────────────────────────┘ │                               │
│                └──────────────┬──────────────┘                               │
│                               │ SQLAlchemy 2.0                               │
│                               ▼                                              │
│                ┌─────────────────────────────┐                               │
│                │     Database (SQLite/PG)    │                               │
│                │ Users · Permits             │                               │
│                │ Complaints · Clashes        │                               │
│                │ CoDigRecs                   │                               │
│                │ Notifications · AuditLog    │                               │
│                └─────────────────────────────┘                               │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Screenshots

| Screen | Preview |
|---|---|
| Landing Page | ![Landing](docs/screenshots/landing.png) |
| Submit Permit | ![Permit Submit](docs/screenshots/permit-submit.png) |
| Clash Alert | ![Clash Alert](docs/screenshots/clash-alert.png) |
| Dashboard | ![Dashboard](docs/screenshots/dashboard.png) |
| Permit Registry | ![Permit Registry](docs/screenshots/permit-registry.png) |
| Complaint Portal | ![Complaint Portal](docs/screenshots/complaint-portal.png) |
| Complaint Registry | ![Complaint Registry](docs/screenshots/complaint-registry.png) |
| About | ![About](docs/screenshots/about.png) |

---

## Setup Instructions

### Prerequisites

- Python 3.10+
- Node.js 18+
- npm 9+

### Backend

```bash
# 1. Clone the repository
git clone https://github.com/your-org/digalert.git
cd digalert

# 2. Create and activate a virtual environment
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# macOS / Linux
source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. (Optional) Configure environment
cp .env.example .env
# Edit .env to set JWT_SECRET and any optional SMTP settings

# 5. Start the API server
uvicorn main:app --reload
# API available at http://localhost:8000
# Interactive docs at http://localhost:8000/docs
```

**SQLite (zero-config default):** The database file `digalert.db` is created automatically in `backend/` on first run. Sample seed data including deliberate clashes is inserted on startup.

**Switch to PostgreSQL:** Set `DATABASE_URL` in your `.env`:
```
DATABASE_URL=postgresql://user:password@localhost:5432/digalert
```
No other changes required — all queries use SQLAlchemy ORM.

### Frontend

```bash
# From the repository root
cd frontend

# 1. Install dependencies
npm install

# 2. (Optional) Configure API URL
cp .env.example .env
# Edit VITE_API_URL if your backend runs on a non-default port

# 3. Start the dev server
npm run dev
# App available at http://localhost:5173
```

### Environment Variables

**Backend (`backend/.env`):**

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `sqlite:///./digalert.db` | SQLAlchemy database URL |
| `JWT_SECRET` | `changeme-in-production` | JWT signing secret |
| `JWT_EXPIRE_MINUTES` | `1440` | Token lifetime (24 hours) |
| `CORS_ORIGINS` | `http://localhost:5173` | Allowed frontend origins |
| `SMTP_HOST` | — | Email server host (optional) |
| `SMTP_PORT` | `587` | Email server port |
| `SMTP_USER` | — | Email username |
| `SMTP_PASSWORD` | — | Email password |

**Frontend (`frontend/.env`):**

| Variable | Default | Description |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8000` | Backend base URL |

---

## Deployment

### Frontend — Vercel

1. Push the `frontend/` directory (or the full repo) to GitHub.
2. Import the project on [vercel.com](https://vercel.com).
3. Set **Root Directory** to `frontend`.
4. Add environment variable: `VITE_API_URL=https://your-backend.onrender.com`
5. Deploy — Vercel auto-detects Vite.

### Backend — Render

1. Create a new **Web Service** on [render.com](https://render.com).
2. Connect your GitHub repo.
3. Set **Root Directory** to `backend`.
4. **Build command:** `pip install -r requirements.txt`
5. **Start command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Add environment variables: `DATABASE_URL` (use Render's free PostgreSQL), `JWT_SECRET`, `CORS_ORIGINS`.
7. Deploy.

---

## API Documentation

Full reference in [docs/API.md](docs/API.md). Quick summary:

### Auth — `/api/auth`

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login and receive JWT |
| GET | `/api/auth/me` | Get current user (Bearer) |

### Permits — `/api/permits`

| Method | Path | Description |
|---|---|---|
| GET | `/api/permits` | List permits (filterable) |
| POST | `/api/permits` | Submit permit + run clash detection |
| GET | `/api/permits/{id}` | Get permit by ID |
| PUT | `/api/permits/{id}` | Update permit |
| DELETE | `/api/permits/{id}` | Delete permit |
| GET | `/api/permits/export/csv` | Download CSV export |

### Clashes — `/api/clashes`

| Method | Path | Description |
|---|---|---|
| GET | `/api/clashes` | List clashes (filterable) |
| GET | `/api/clashes/{id}` | Get clash with nested data |
| POST | `/api/clashes/{id}/resolve` | Resolve clash (accept/dismiss) |

### Complaints — `/api/complaints`

| Method | Path | Description |
|---|---|---|
| GET | `/api/complaints` | List complaints (filterable) |
| POST | `/api/complaints` | Submit a complaint |
| GET | `/api/complaints/{id}` | Get complaint by ID |
| PATCH | `/api/complaints/{id}` | Update status/assignment |
| GET | `/api/complaints/export/csv` | Download CSV export |

### Analytics — `/api`

| Method | Path | Description |
|---|---|---|
| GET | `/api/analytics` | Full analytics snapshot |
| GET | `/api/savings` | Savings summary + breakdown |

### Notifications — `/api/notifications`

| Method | Path | Description |
|---|---|---|
| GET | `/api/notifications` | List notifications |
| PATCH | `/api/notifications/{id}/read` | Mark as read |

### System

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Health check |
| GET | `/` | Service info |
| GET | `/docs` | Swagger UI |

---

## Tech Stack

### Backend
- **FastAPI** — async Python web framework
- **SQLAlchemy 2.0** — ORM with SQLite (dev) and PostgreSQL (prod) support
- **Pydantic v2** — data validation and serialization
- **python-jose** — JWT authentication
- **passlib[bcrypt]** — password hashing
- **Shapely** — geometric operations for clash detection
- **python-dateutil** — date arithmetic

### Frontend
- **React 18** — UI framework
- **Vite** — build tool and dev server
- **TypeScript** — static typing
- **Tailwind CSS** — utility-first styling
- **Framer Motion** — animations
- **React Router v6** — client-side routing
- **TanStack Query v5** — server state management
- **Recharts** — data visualization
- **Leaflet + React-Leaflet** — interactive maps
- **Axios** — HTTP client
- **react-hot-toast** — notifications
- **jsPDF + jspdf-autotable** — PDF generation
- **date-fns** — date utilities
- **lucide-react** — icon set

---

## Roadmap

- [ ] **Mobile App** — React Native companion for field officers
- [ ] **GIS Integration** — Import road network from GHMC GIS server
- [ ] **Push Notifications** — Web push + SMS (Twilio) for permit status updates
- [ ] **Multilingual Support** — Telugu, Hindi, Urdu alongside English
- [ ] **Bulk Permit Import** — CSV/Excel upload for large-scale projects
- [ ] **Advanced Analytics** — Predictive clash detection using historical patterns
- [ ] **Contractor Portal** — Track actual excavation vs approved boundaries
- [ ] **SLA Tracking** — Automated escalation when permits exceed approved duration
- [ ] **Aadhaar/DigiLocker Integration** — Verified identity for permit applicants
- [ ] **Scalability to Other Cities** — Multi-tenant city configuration

---

## License

MIT License — see [LICENSE](LICENSE).

---

*Built with care for the people of Hyderabad. DigAlert is a DigAlert Technologies initiative, designed to make city infrastructure management smarter, safer, and more collaborative.*
