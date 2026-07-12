# TransitOps

Smart Transport Operations Platform — fleet, driver, dispatch, maintenance, and analytics with RBAC.

## Quick start

### 1. Backend (FastAPI + PostgreSQL)

```bash
# Create database (once)
createdb transitops   # or: psql -U postgres -c "CREATE DATABASE transitops;"

# Configure secrets
cp backend/.env.example backend/.env
# Edit backend/.env — set SMTP_PASSWORD (Gmail App Password) and DATABASE_URL

cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

### 2. Frontend (React + Vite)

```bash
npm install
npm run dev
```

App: http://localhost:5173

## Demo accounts

| Role | Email | Password |
|---|---|---|
| Fleet Manager | `fleet.manager@transitops.dev` | `TransitOps@123` |
| Driver | `driver@transitops.dev` | `TransitOps@123` |
| Safety Officer | `safety@transitops.dev` | `TransitOps@123` |
| Financial Analyst | `finance@transitops.dev` | `TransitOps@123` |

## Auth features (Phase 1)

- Email + password login with JWT (`python-jose`)
- bcrypt password hashing
- OTP email verification on signup (Gmail SMTP)
- OTP password reset flow
- Account lockout after **5 failed login attempts** (30-minute lock)
- RBAC guards: Fleet Manager, Driver, Safety Officer, Financial Analyst

## API endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/send-otp` | Send OTP (`purpose`: `register` \| `reset_password`) |
| POST | `/api/auth/verify-otp` | Validate OTP |
| POST | `/api/auth/register` | Register with OTP + role |
| POST | `/api/auth/login` | Login → JWT |
| POST | `/api/auth/reset-password` | Reset password with OTP |
| GET | `/api/auth/me` | Current user (Bearer token) |
