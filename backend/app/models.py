"""
models.py — SQLAlchemy User model.

A single users table holds all identity and permission data.
Permissions are boolean columns — no joins needed to check access.
UUIDs are used as primary keys for security and scalability.
"""

import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base


class User(Base):
    __tablename__ = "users"

    # UUID primary key — safer than sequential integers (no enumeration attacks)
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Login identity — must be unique across the system
    email = Column(String, unique=True, nullable=False, index=True)

    full_name = Column(String, nullable=False)

    # bcrypt hash only — plain-text password is never stored
    hashed_password = Column(String, nullable=False)

    # Admins bypass all permission checks — full access to everything
    is_admin = Column(Boolean, default=False, nullable=False)

    # Soft disable — deactivated users cannot log in but records are preserved
    is_active = Column(Boolean, default=True, nullable=False)

    # Granular permissions for non-admin users
    can_create_user = Column(Boolean, default=False, nullable=False)
    can_update_user = Column(Boolean, default=False, nullable=False)
    can_delete_user = Column(Boolean, default=False, nullable=False)

    # Audit timestamp — set once on creation, never updated
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
