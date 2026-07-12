# TransitOps — Build Progress

> Living tracker for hackathon work. Updated as tasks complete.

**Last updated:** 2026-07-12  
**Current phase:** Phase 4 — Maintenance & Expense Tracking

---

## Phase 1 — Authentication ✅ DONE

| Task | Status | Notes |
|------|--------|-------|
| JWT login (`python-jose`) | ✅ | `POST /api/auth/login` |
| bcrypt password hashing | ✅ | `backend/app/security.py` |
| OTP email via Gmail SMTP | ✅ | Register + password reset |
| Account lockout (5 attempts) | ✅ | 30-minute lock |
| RBAC `Depends` guards | ✅ | `get_current_user`, `require_roles` |
| Demo users (4 roles) | ✅ | Seeded on startup |
| React login / signup UI | ✅ | WorkForce styling, TransitOps branding |
| `AuthContext` + protected routes | ✅ | `/fleet`, `/driver`, `/safety`, `/finance` |
| Google OAuth | ⏭️ Skipped | Per user request |

---

## Phase 2 — Vehicle & Driver CRUD ✅ DONE

| Task | Status | Notes |
|------|--------|-------|
| `GET /api/vehicles/` | ✅ | Trailing slash API list |
| `GET /api/drivers/` | ✅ | Trailing slash API list |
| Vehicle CRUD backend | ✅ | Enforced uniqueness, region support |
| Driver CRUD backend | ✅ | License fields, compliance warnings |
| Pydantic create/update/response schemas | ✅ | Enums + flags |
| Demo seed data (vehicles + drivers) | ✅ | Seeded on startup |
| React Vehicle list + form pages | ✅ | Fleet Manager Registry page |
| React Driver list + form pages | ✅ | Fleet Manager and Safety Officer views |
| License expiry warning on driver list | ✅ | Red/amber compliance badges |
| RBAC on write endpoints | ✅ | Fleet Manager = full write; Safety Officer = driver edit |
| Role dashboard navigation | ✅ | Quick link dashboard cards |

---

## Phase 3 — Trip Management ✅ DONE

| Task | Status | Notes |
|------|--------|-------|
| Trip CRUD Backend | ✅ | `routers/trips.py` endpoints |
| Vehicle/Driver Availability Guard | ✅ | Validates status & active license |
| Automatic Asset State Transition | ✅ | `"In Transit"`/`"Completed"` updates |
| Vehicle Odometer Sync | ✅ | Completed distance increments odometer |
| Demo Seed Trips | ✅ | Pre-seeded for all status states |
| Trips API Client & TS Types | ✅ | `trips.ts` client + `trip.ts` types |
| React Trip Registry Page | ✅ | Fleet Manager dispatch dashboard |
| React Driver Workspace Page | ✅ | Driver journey tracking at `/driver` |
| Dashboard & Navigation Links | ✅ | Integrated in App shell and Overview |

---

## Phase 4+ — Not started

| Module | Status |
|--------|--------|
| Maintenance workflow | ⬜ |
| Fuel & expense tracking | ⬜ |
| Dashboard KPIs | ⬜ |
| Reports & analytics | ⬜ |
| CSV export | ⬜ |

---

## Assumptions & Rules

- PostgreSQL remains the database
- All list endpoints require JWT authentication
- Trailing slashes are enforced on base routes to avoid cross-origin token loss
- License expiry warning: amber if ≤30 days, red if expired
