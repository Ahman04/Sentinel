"""
main.py — FastAPI app entry point and startup seed.

On first run, checks if any users exist in the DB.
If the table is empty, creates the default admin account automatically.
This prevents the system from being in an inaccessible state on fresh deploys.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.database import engine, SessionLocal, Base
from app.models import User
from app.auth import hash_password
from app.routers import auth, users, programs, beneficiaries, donors

# Creates all tables defined in models.py if they don't already exist
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Sentinel API",
    description="Access Control & User Management Platform",
    version="1.0.0",
)

# Allow the Next.js frontend (port 3000) to make cross-origin requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register route groups
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(programs.router, prefix="/programs", tags=["programs"])
# Beneficiary routes are nested under /programs — e.g. /programs/{id}/beneficiaries
app.include_router(beneficiaries.router, prefix="/programs", tags=["beneficiaries"])
# Donor routes — admin-only
app.include_router(donors.router, prefix="/donors", tags=["donors"])


@app.on_event("startup")
def seed_default_admin():
    """
    Runs once when the app starts.
    Creates admin@sentinel.io if no users exist yet.
    Safe to run on every startup — skips if users already present.
    """
    db: Session = SessionLocal()
    try:
        if db.query(User).count() == 0:
            admin = User(
                email="admin@sentinel.io",
                full_name="Default Admin",
                hashed_password=hash_password("admin123"),
                is_admin=True,
                is_active=True,
            )
            db.add(admin)
            db.commit()
    finally:
        db.close()


@app.get("/", tags=["health"])
def health_check():
    """Simple health check — confirms the API is running."""
    return {"status": "ok", "service": "Sentinel API"}
