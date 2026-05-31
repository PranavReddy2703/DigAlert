# Contributing to DigAlert

Thank you for considering a contribution to DigAlert. This guide covers everything you need to get your changes from idea to merged pull request.

---

## Table of Contents

1. [Local Setup](#local-setup)
2. [Branch Naming](#branch-naming)
3. [Commit Messages](#commit-messages)
4. [Pull Request Guidelines](#pull-request-guidelines)
5. [Coding Standards — Backend](#coding-standards--backend)
6. [Coding Standards — Frontend](#coding-standards--frontend)
7. [Running the Project](#running-the-project)
8. [Running Tests](#running-tests)

---

## Local Setup

### 1. Fork and Clone

```bash
git clone https://github.com/your-org/digalert.git
cd digalert
```

### 2. Backend

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
# Open .env and set at minimum: JWT_SECRET=any-random-string

uvicorn main:app --reload
# Verify: http://localhost:8000/health -> {"status":"ok"}
```

The first run auto-creates `digalert.db` and seeds sample Hyderabad permit + complaint data, including deliberate clashes for testing the co-dig engine.

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env
# VITE_API_URL=http://localhost:8000 (already the default)

npm run dev
# App: http://localhost:5173
```

### 4. Default Admin Credentials

```
Email:    admin@digalert.gov.in
Password: digalert123
```

---

## Branch Naming

All branches must follow one of these prefixes:

| Prefix | Use for |
|---|---|
| `feature/*` | New features or enhancements |
| `fix/*` | Bug fixes |
| `docs/*` | Documentation-only changes |
| `refactor/*` | Code restructuring with no behaviour change |
| `test/*` | Adding or improving tests |
| `chore/*` | Dependency updates, build tooling, CI |
| `hotfix/*` | Urgent production fixes branched from `main` |

**Examples:**

```
feature/contractor-portal
fix/clash-detection-same-segment
docs/api-reference-v2
refactor/permit-route-query-helpers
```

Branch names use lowercase letters, numbers, and hyphens only. No spaces, no underscores, no uppercase.

---

## Commit Messages

DigAlert follows [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/).

**Format:**

```
<type>(<scope>): <short description>

[optional body]

[optional footer(s)]
```

**Types:**

| Type | When to use |
|---|---|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, whitespace (no logic change) |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `perf` | Performance improvement |
| `test` | Adding missing tests or correcting existing tests |
| `chore` | Build process, auxiliary tools, dependencies |
| `ci` | CI configuration changes |

**Scopes (optional but encouraged):**

`auth`, `permits`, `complaints`, `clashes`, `codig`, `analytics`, `notifications`, `map`, `ui`, `seed`, `export`, `deps`, `config`

**Examples:**

```
feat(permits): add area_sqm field to permit submission form

fix(clash): handle edge case when both permits share exact coordinates

docs(api): add missing /api/savings endpoint to reference

chore(deps): bump fastapi to 0.111.0

feat(map): add circle-based heat overlay for complaint density
```

**Rules:**
- Subject line: 72 characters maximum, imperative mood, no trailing period
- Body: wrap at 100 characters; explain the *why*, not the *what*
- Breaking changes: add `BREAKING CHANGE:` footer or append `!` after the type, e.g. `feat(auth)!: switch to RS256`

---

## Pull Request Guidelines

### Before Opening a PR

- [ ] Your branch is up to date with `main` (`git pull origin main` or rebase)
- [ ] All existing tests pass
- [ ] New behavior has corresponding tests or a documented reason why tests are not appropriate
- [ ] `tsc --noEmit` passes in `frontend/` with zero errors
- [ ] Backend starts cleanly with `uvicorn main:app --reload` (no import errors, no migration failures)
- [ ] No `TODO`, `FIXME`, `NotImplemented`, `pass`, or placeholder comments in production code paths
- [ ] Enum values match the spec exactly (lowercase, no Python Enum objects in DB columns)
- [ ] New API endpoints follow the existing error shape `{"detail": "message"}` with correct HTTP status codes

### PR Description

Use this template:

```markdown
## What does this PR do?
<!-- One paragraph summary -->

## Why?
<!-- Link to issue or describe the motivation -->

## How was it tested?
<!-- Manual steps, automated tests, seeded data scenario -->

## Checklist
- [ ] Tests added / updated
- [ ] Docs updated (if API changed)
- [ ] Breaking changes documented
- [ ] Screenshots attached (if UI changed)
```

### Review Process

1. Open a PR against `main`.
2. At least one approving review is required before merge.
3. All CI checks must pass.
4. Squash-merge is preferred for feature branches; merge commits are acceptable for release branches.
5. Delete the branch after merge.

### Screenshot Requirement

If your PR changes any UI screen, attach a before/after screenshot. Dark mode and light mode screenshots are both appreciated for significant layout changes.

---

## Coding Standards — Backend

### General

- Python 3.10+ features are allowed (match/case, `X | None` unions, etc.)
- Type hints on all function parameters and return types (exceptions: trivial lambdas, test helpers)
- One model per file in `app/models/`, one schema file per model in `app/schemas/`
- No raw SQL — use SQLAlchemy ORM or `select()` expressions

### FastAPI Routes

```python
# Good — clear types, Depends injection, HTTPException for errors
@router.get("/{id}", response_model=PermitRead)
def get_permit(id: int, db: Session = Depends(get_db)) -> PermitRead:
    permit = db.get(Permit, id)
    if not permit:
        raise HTTPException(status_code=404, detail="Permit not found")
    return permit

# Bad — no response_model, bare dict, silent 200 on missing
@router.get("/{id}")
def get_permit(id: int, db=Depends(get_db)):
    return db.query(Permit).filter(Permit.id == id).first() or {}
```

- Always declare `response_model` on routes that return data
- Use `db.get(Model, pk)` for single-PK lookups (SQLAlchemy 2.0 style)
- Use `select()` + `db.execute().scalars()` for filtered queries
- Enum values: store and compare as plain strings matching the spec (`"submitted"`, not `PermitStatus.SUBMITTED`)
- Dates: accept `date` / `datetime` from Pydantic; ISO strings serialize automatically
- Money: plain `float` (INR); no Decimal

### Services

- `clash_detection.py`, `codig.py`, `audit.py`, `notify.py`, `export.py` — keep business logic here, not in routes
- Services receive a `db: Session` and commit their own changes
- `log_action()` is called for every mutating operation; include actor (user email or "system")
- `push_notification()` is called whenever a user-facing event occurs

### Error Handling

```python
# All user-facing errors use HTTPException
raise HTTPException(status_code=400, detail="Start date must be before end date")
raise HTTPException(status_code=404, detail="Clash not found")
raise HTTPException(status_code=403, detail="Admin privileges required")
```

Never let unhandled exceptions reach the client. Catch and re-raise as HTTPException where appropriate.

### Naming

- Files: `snake_case.py`
- Classes: `PascalCase`
- Functions / variables: `snake_case`
- Constants: `UPPER_SNAKE_CASE`
- Private helpers: `_leading_underscore`

---

## Coding Standards — Frontend

### General

- TypeScript strict mode — no `any`, no `@ts-ignore` unless unavoidable and documented
- All API interactions via `api.*` from `@/lib/api`, never raw `fetch` or a second axios instance
- All server state via TanStack Query hooks in `src/hooks/`
- No inline styles — use Tailwind classes and the design-system tokens (`bg-surface`, `text-primary`, etc.)
- Framer Motion for entrance animations; no CSS `transition` on layout shifts

### Component Rules

```tsx
// Good — named export, typed props, accessible, design-system classes
interface Props {
  permitId: number;
  onClose: () => void;
}

export function PermitDetailModal({ permitId, onClose }: Props) {
  const { data, isLoading, isError } = usePermit(permitId);

  if (isLoading) return <Skeleton />;
  if (isError || !data) return <ErrorState message="Could not load permit." />;

  return (
    <Modal open onClose={onClose} title={data.reference}>
      {/* content */}
    </Modal>
  );
}
```

- Every list view must include: loading skeleton, empty state, error state
- Every form submit button must have a `loading` prop tied to the mutation `isPending`
- Pages are **default exports**; all other components are **named exports**
- Use `@/components/ui` primitives — do not re-implement Button, Input, Modal, etc.
- Use `cn()` from `@/lib/utils` for conditional class merging
- Dark / light theme: use CSS-variable Tailwind classes only; never hardcode `#050816`

### Hooks Pattern

```tsx
// src/hooks/usePermits.ts
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { PermitListParams } from "@/types";

export function usePermits(params?: PermitListParams) {
  return useQuery({
    queryKey: ["permits", params],
    queryFn: () => api.permits.list(params),
  });
}
```

- Query keys: `["resource"]` for lists, `["resource", id]` for single items
- Invalidate on mutation: `queryClient.invalidateQueries({ queryKey: ["permits"] })`
- Errors: catch `ApiRequestError` and surface `.message` via `toast.error()`

### File / Folder Conventions

- `src/pages/` — one file per route, PascalCase, default export
- `src/components/ui/` — primitives, named exports, barrel at `index.ts`
- `src/components/layout/` — Layout, Navbar, Footer, PageHeader
- `src/components/map/` — MapView (default export) + helpers
- `src/hooks/` — one file per resource, named exports
- `src/context/` — React contexts (ThemeContext, NotificationContext)
- `src/lib/` — api, queryClient, utils
- `src/types/` — all shared TypeScript types

### Accessibility

- All interactive elements have `aria-label` or visible text
- Focus rings are visible (`focus-visible:ring-2 focus-visible:ring-primary`)
- Form fields use `<label>` + `htmlFor` (managed by `<FormField>`)
- Color is never the only indicator of state — use icons + text alongside color
- `<img>` tags always have `alt`

---

## Running the Project

### Both servers (recommended)

Open two terminal windows:

**Terminal 1 — Backend:**
```bash
cd backend
source venv/bin/activate   # or venv\Scripts\activate on Windows
uvicorn main:app --reload
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

Open http://localhost:5173 in your browser.

### Backend only (API testing)

```bash
cd backend && uvicorn main:app --reload
# Swagger UI: http://localhost:8000/docs
# ReDoc: http://localhost:8000/redoc
```

---

## Running Tests

*(Tests are tracked as a roadmap item — contributions welcome.)*

**Backend:** A `pytest` suite will live at `backend/tests/`. Until it exists, manually verify:
- `uvicorn main:app --reload` starts without errors
- `http://localhost:8000/health` returns `{"status": "ok"}`
- Swagger UI at `/docs` loads all 6 routers
- Submitting a permit via POST `/api/permits` with clashing coordinates returns a `clash` object

**Frontend:** A Vitest + Testing Library suite will live at `frontend/src/__tests__/`. Until it exists, manually verify:
- `npm run build` completes without TypeScript errors
- Core user journeys work: submit complaint, submit permit, view dashboard, resolve clash

---