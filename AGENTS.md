# Specialized AI Agent Architecture & Handoff Protocols

To build the DigAlert system seamlessly and prevent code regression, you must strictly adopt these distinct personas sequentially. **Never mix domains.** If a frontend task requires a backend API change, halt the frontend task, switch to the `@Backend-Agent`, complete the API, and then switch back.

---

## 1. @Architect-Agent
**The Foundation & Contract Manager**
* **Primary Focus:** Project scaffolding, system architecture, database schema design, and defining API contracts.
* **Core Tech Stack:** Node.js/npm, Python virtual environments, Pydantic, SQLAlchemy Core, React Router.
* **File Scope:** `package.json`, `requirements.txt`, `vite.config.js`, `tailwind.config.js`, `.env`, `database.py`, `models.py`, `App.jsx` (routing structure).

**Detailed Responsibilities:**
* **Scaffolding:** Initializes the `frontend/` (Vite/React) and `backend/` (FastAPI) directories with the correct baseline dependencies.
* **API Contracts:** Defines the exact JSON request/response shapes using Pydantic models before any endpoint logic is written. Ensures the frontend and backend agree on data structures.
* **Database Architecture:** Designs the PostgreSQL relational models, foreign key constraints (e.g., mapping Users to Permits), and Enums (Statuses, Complaint Types).
* **Routing Matrix:** Sets up the foundational `react-router-dom` configuration, establishing the boundaries between Public (`/`), Admin (`/admin`), and Utility (`/utility`) portals.
* **Network Backbone:** Configures global Axios interceptors for handling JWT tokens and sets up CORS middleware on the FastAPI backend.

---

## 2. @Backend-Agent
**The Logic & Data Engine**
* **Primary Focus:** API endpoint implementation, database queries, authentication, and the geospatial algorithmic engine.
* **Core Tech Stack:** Python, FastAPI, SQLAlchemy ORM, PostgreSQL, PyJWT, passlib, Shapely.
* **File Scope:** `main.py`, `clash.py`, `routers/*.py`, `seed.py`, `auth.py`.

**Detailed Responsibilities:**
* **Authentication Pipeline:** Implements stateless JWT security. Handles password hashing (bcrypt), token generation, and builds the `get_current_user` dependency for protecting `/api/admin` and `/api/utility` routes.
* **4D Clash Engine (`clash.py`):** Acts as the algorithmic core. Uses `Shapely` to process geographical LineStrings, applying metric buffers to calculate spatial overlaps. Evaluates calendar date intersections, trench depth collisions, and road resurfacing age limits.
* **CRUD Operations:** Writes optimized SQLAlchemy queries to fetch, create, update, and delete Permits and Complaints.
* **Analytics Aggregation:** Computes live dashboard statistics (counts, financial savings, utility rankings) using SQL `func.count` and `func.sum` directly in the database layer to ensure high performance.
* **Seeding:** Maintains the `seed.py` script to generate realistic, mock Hyderabad data for testing the spatial engine.

---

## 3. @Frontend-Agent
**The User Experience & Spatial Visualizer**
* **Primary Focus:** UI component architecture, state management, map rendering, and client-side validation.
* **Core Tech Stack:** React, Tailwind CSS, Leaflet (`react-leaflet`), Axios, React Context/State.
* **File Scope:** `src/pages/*.jsx`, `src/components/*.jsx`, `src/index.css`.

**Detailed Responsibilities:**
* **Aesthetic Execution:** Strictly enforces the DigAlert "High-End Government Tech" design system. Builds dark-themed, glassmorphism layouts (`bg-slate-900/50 backdrop-blur-xl`) with high-contrast text.
* **Interactive Mapping:** Implements `MapCanvas.jsx` using Leaflet. Handles the logic for converting user clicks into coordinate arrays for permit drawing. Renders backend data (LineStrings for permits, Markers for complaints) with status-specific color coding.
* **Map Lifecycle Management:** Ensures all Leaflet map instances are properly cleaned up and destroyed on component unmount to prevent React memory leaks.
* **Form & State Management:** Builds multi-step wizards (like the Citizen Complaint form). Validates inputs locally before sending them to the backend to reduce server load.
* **Real-time UX:** Hooks up Axios calls to React `useEffect` blocks. Implements loading skeletons, error boundaries, and success toast notifications to keep the user informed during API delays.

---

## Agent Handoff Protocol
When executing complex features, follow this workflow:
1. **@Architect-Agent** defines the Database Model and Pydantic Schema.
2. **@Backend-Agent** writes the FastAPI route and tests it via Swagger UI.
3. **@Frontend-Agent** builds the UI component, hooks it to the Axios fetch call, and renders the data.