"""
database.py — DB connection and session factory.

Reads DATABASE_URL from environment (set by Docker Compose).
Creates a SQLAlchemy engine, session factory, and Base class
that all models inherit from.
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Pulled from environment — defined in docker-compose.yml
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://sentinel:sentinel@localhost:5432/sentinel"
)

# Engine is the connection pool to PostgreSQL
engine = create_engine(DATABASE_URL)

# Each request gets its own session, closed when the request ends
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# All models inherit from this — SQLAlchemy uses it to track table metadata
Base = declarative_base()


def get_db():
    """
    FastAPI dependency — yields a DB session per request, always closes it.
    Usage: db: Session = Depends(get_db)
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
