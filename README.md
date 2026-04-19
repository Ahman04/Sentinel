# HopeAccess

An NGO & Charity Staff Portal for managing staff, programs, beneficiaries, and donors — with role-based access control so every team member sees only what they need to.

---

## Features

- **Authentication** — JWT-based login with secure bcrypt password hashing
- **User Management** — Create, update, and deactivate staff accounts with granular permissions
- **Role-Based Access Control** — Admins have full access; staff see only their assigned programs
- **Programs** — Create and manage NGO initiatives, assign staff members, track status
- **Beneficiaries** — Record and manage beneficiaries per program; staff can only access their own programs
- **Donors** — Admin-only donor records with full donation history and multi-currency support
- **Dashboard Stats** — Live impact numbers: staff count, active programs, beneficiaries served, donations received

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), Tailwind CSS |
| Backend | FastAPI, SQLAlchemy ORM |
| Database | PostgreSQL 15 |
| Auth | JWT (python-jose), bcrypt (passlib) |
| Container | Docker, Docker Compose |

---

## Getting Started

### Prerequisites

- [Docker](https://www.docker.com/) and Docker Compose installed

### Run with Docker (recommended)

```bash
git clone https://github.com/Ahman04/Sentinel.git
cd Sentinel
docker-compose up --build
```

Three services start automatically:

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/docs |

### Default Admin Account

On first run, a default admin account is created automatically:

| Field | Value |
|---|---|
| Email | `admin@sentinel.io` |
| Password | `admin123` |

> Change this password immediately after first login in a production environment.

---

## Project Structure

```
├── backend/
│   ├── app/
│   │   ├── routers/        # auth, users, programs, beneficiaries, donors, stats
│   │   ├── models.py       # SQLAlchemy models
│   │   ├── schemas.py      # Pydantic request/response schemas
│   │   ├── dependencies.py # Auth guards (get_current_user, require_admin)
│   │   ├── auth.py         # JWT creation and password hashing
│   │   └── main.py         # App entry point, CORS, router registration
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── app/                # Next.js App Router pages
│   │   ├── dashboard/
│   │   ├── users/
│   │   ├── programs/
│   │   ├── donors/
│   │   └── profile/
│   ├── components/
│   │   └── Navbar.tsx
│   ├── lib/
│   │   ├── api.ts          # Centralised API client
│   │   └── auth.ts         # Token helpers
│   └── Dockerfile
└── docker-compose.yml
```

---

## Access Control

| Feature | Admin | Staff |
|---|---|---|
| View all users | Yes | No |
| Create / edit users | Yes | No |
| View all programs | Yes | No |
| View assigned programs | Yes | Yes |
| Manage beneficiaries | Yes | Yes (assigned programs only) |
| View donors | Yes | No |
| Dashboard stats | Global | Scoped to assigned programs |

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/login` | Login and receive JWT |
| GET | `/users/me` | Get current user profile |
| GET/POST | `/users` | List / create users |
| GET/PUT/DELETE | `/users/{id}` | Get / update / delete user |
| GET/POST | `/programs` | List / create programs |
| GET/PUT/DELETE | `/programs/{id}` | Get / update / delete program |
| POST/DELETE | `/programs/{id}/members` | Add / remove program members |
| GET/POST | `/programs/{id}/beneficiaries` | List / create beneficiaries |
| GET/PUT/DELETE | `/programs/{id}/beneficiaries/{id}` | Get / update / delete beneficiary |
| GET/POST | `/donors` | List / create donors |
| GET/PUT/DELETE | `/donors/{id}` | Get / update / delete donor |
| GET/POST | `/donors/{id}/donations` | List / record donations |
| DELETE | `/donors/{id}/donations/{id}` | Remove a donation |
| GET | `/stats` | Dashboard statistics |
