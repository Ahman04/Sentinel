"""
models.py — SQLAlchemy User model.

A single users table holds all identity and permission data.
Permissions are boolean columns — no joins needed to check access.
UUIDs are used as primary keys for security and scalability.
"""

import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
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

    # Programs this user is assigned to
    programs = relationship("ProgramMember", back_populates="user", cascade="all, delete-orphan")


class Program(Base):
    __tablename__ = "programs"

    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name        = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    # status: active | completed | paused
    status      = Column(String, default="active", nullable=False)
    start_date  = Column(String, nullable=True)   # stored as ISO date string (YYYY-MM-DD)
    created_at  = Column(DateTime, default=datetime.utcnow, nullable=False)

    members       = relationship("ProgramMember", back_populates="program", cascade="all, delete-orphan")
    beneficiaries = relationship("Beneficiary", back_populates="program", cascade="all, delete-orphan")


class ProgramMember(Base):
    """Join table linking users to programs."""
    __tablename__ = "program_members"

    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    program_id = Column(UUID(as_uuid=True), ForeignKey("programs.id"), nullable=False)
    user_id    = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    # role within the program e.g. "coordinator", "field_staff", "volunteer"
    role       = Column(String, default="member", nullable=False)
    joined_at  = Column(DateTime, default=datetime.utcnow, nullable=False)

    program = relationship("Program", back_populates="members")
    user    = relationship("User", back_populates="programs")


class Beneficiary(Base):
    """
    A person receiving services from a program.
    Linked to a program so field staff can manage beneficiaries within their assigned program.
    """
    __tablename__ = "beneficiaries"

    id              = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    program_id      = Column(UUID(as_uuid=True), ForeignKey("programs.id"), nullable=False)
    full_name       = Column(String, nullable=False)
    age             = Column(String, nullable=True)   # stored as string to allow ranges like "18-25"
    gender          = Column(String, nullable=True)   # "male" | "female" | "other" | "prefer_not_to_say"
    location        = Column(String, nullable=True)
    notes           = Column(Text, nullable=True)
    date_registered = Column(String, nullable=True)   # ISO date string (YYYY-MM-DD)
    created_at      = Column(DateTime, default=datetime.utcnow, nullable=False)

    program = relationship("Program", back_populates="beneficiaries")


class Donor(Base):
    """
    An individual or organisation that donates to the NGO.
    Donor records are admin-only — not visible to regular staff.
    """
    __tablename__ = "donors"

    id           = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    full_name    = Column(String, nullable=False)
    email        = Column(String, nullable=True)
    phone        = Column(String, nullable=True)
    organization = Column(String, nullable=True)   # company or foundation name if applicable
    notes        = Column(Text, nullable=True)
    created_at   = Column(DateTime, default=datetime.utcnow, nullable=False)

    donations = relationship("Donation", back_populates="donor", cascade="all, delete-orphan")


class Donation(Base):
    """
    A single donation made by a donor, optionally tied to a program.
    Amount is stored as a float; currency defaults to USD.
    """
    __tablename__ = "donations"

    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    donor_id   = Column(UUID(as_uuid=True), ForeignKey("donors.id"), nullable=False)
    # program_id is optional — some donations are unrestricted (not tied to a program)
    program_id = Column(UUID(as_uuid=True), ForeignKey("programs.id"), nullable=True)
    amount     = Column(String, nullable=False)   # stored as string to avoid float precision issues
    currency   = Column(String, default="USD", nullable=False)
    date       = Column(String, nullable=True)    # ISO date string (YYYY-MM-DD)
    notes      = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    donor   = relationship("Donor", back_populates="donations")
    program = relationship("Program")
