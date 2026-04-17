"""
conftest.py — Shared pytest fixtures.

Uses an in-memory SQLite database so tests run without Docker or PostgreSQL.
Each test gets a fresh database — tables are created before and dropped after.
The FastAPI dependency override swaps the real DB session for the test one.
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database import Base, get_db

# In-memory SQLite — fast, isolated, no external dependencies
SQLITE_URL = "sqlite:///./test.db"

engine = create_engine(SQLITE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    """Replaces the real PostgreSQL session with the SQLite test session."""
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(autouse=True)
def setup_database():
    """Creates all tables before each test and drops them after."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client():
    """TestClient with the DB dependency overridden to use SQLite."""
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def admin_token(client):
    """
    Logs in as the default seed admin and returns a ready-to-use
    Authorization header dict for use in authenticated requests.
    """
    response = client.post("/auth/login", json={
        "email": "admin@sentinel.io",
        "password": "admin123"
    })
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
