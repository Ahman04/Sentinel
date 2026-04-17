"""
schemas.py — Pydantic request and response models.

Pydantic validates incoming request data and shapes outgoing responses.
hashed_password is never included in any response schema — by design.
"""

import uuid
from datetime import datetime
from pydantic import BaseModel, EmailStr
from typing import Optional


# ---------------------------------------------------------------------------
# Request schemas (what the API accepts)
# ---------------------------------------------------------------------------

class UserCreate(BaseModel):
    """Payload to create a new user. Admin sets permissions at creation time."""
    email: EmailStr
    full_name: str
    password: str
    is_admin: bool = False
    can_create_user: bool = False
    can_update_user: bool = False
    can_delete_user: bool = False


class UserUpdate(BaseModel):
    """
    Payload to update an existing user.
    All fields are optional — only provided fields are changed.
    """
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None
    is_admin: Optional[bool] = None
    can_create_user: Optional[bool] = None
    can_update_user: Optional[bool] = None
    can_delete_user: Optional[bool] = None


class LoginRequest(BaseModel):
    """Credentials submitted on the login form."""
    email: EmailStr
    password: str


# ---------------------------------------------------------------------------
# Response schemas (what the API returns)
# ---------------------------------------------------------------------------

class UserResponse(BaseModel):
    """
    Safe user representation returned by all endpoints.
    hashed_password is deliberately excluded.
    """
    id: uuid.UUID
    email: str
    full_name: str
    is_admin: bool
    is_active: bool
    can_create_user: bool
    can_update_user: bool
    can_delete_user: bool
    created_at: datetime

    class Config:
        from_attributes = True  # Allows mapping from SQLAlchemy model instances


class TokenResponse(BaseModel):
    """Returned after a successful login."""
    access_token: str
    token_type: str = "bearer"
