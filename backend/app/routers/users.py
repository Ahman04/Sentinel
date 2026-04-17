"""
routers/users.py — User management endpoints.

All endpoints are protected — a valid JWT is required on every request.
Permission checks are enforced via dependency injection before the
handler code runs. The default admin account cannot be deleted.

Endpoints:
  GET    /users/me         — current user's own profile
  GET    /users            — all users (admin or can_create/update)
  POST   /users            — create user (admin or can_create_user)
  GET    /users/{id}       — single user (admin or same user)
  PUT    /users/{id}       — update user (admin or can_update_user)
  DELETE /users/{id}       — delete user (admin or can_delete_user)
"""

import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.schemas import UserCreate, UserUpdate, UserResponse
from app.auth import hash_password
from app.dependencies import (
    get_current_user,
    require_create_permission,
    require_update_permission,
    require_delete_permission,
)

router = APIRouter()

# Seed admin's email — this account cannot be deleted via the API
PROTECTED_ADMIN_EMAIL = "admin@sentinel.io"


@router.get("/me", response_model=UserResponse)
def get_my_profile(current_user: User = Depends(get_current_user)):
    """Returns the authenticated user's own profile. Available to all logged-in users."""
    return current_user


@router.get("", response_model=list[UserResponse])
def list_users(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns all users in the system.
    Accessible to admins and users who can create or update users —
    they need the list to avoid duplicates and to select users to edit.
    """
    if not (
        current_user.is_admin
        or current_user.can_create_user
        or current_user.can_update_user
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view the user list",
        )
    return db.query(User).all()


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    payload: UserCreate,
    current_user: User = Depends(require_create_permission),
    db: Session = Depends(get_db),
):
    """
    Creates a new user account.
    Only admins can assign is_admin or permissions — non-admin creators
    always produce regular users with no permissions regardless of payload.
    """
    # Prevent duplicate emails
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists",
        )

    # Non-admin creators cannot create admins or grant permissions
    if not current_user.is_admin:
        payload.is_admin = False
        payload.can_create_user = False
        payload.can_update_user = False
        payload.can_delete_user = False

    user = User(
        email=payload.email,
        full_name=payload.full_name,
        hashed_password=hash_password(payload.password),
        is_admin=payload.is_admin,
        can_create_user=payload.can_create_user,
        can_update_user=payload.can_update_user,
        can_delete_user=payload.can_delete_user,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns a single user by ID.
    Admins can fetch anyone. Regular users can only fetch their own profile.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    # Regular users can only see themselves
    if not current_user.is_admin and current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view your own profile",
        )

    return user


@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: uuid.UUID,
    payload: UserUpdate,
    current_user: User = Depends(require_update_permission),
    db: Session = Depends(get_db),
):
    """
    Updates a user's fields. Only provided fields are changed.
    Only admins can change is_admin or permission flags.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    # Apply only the fields that were explicitly sent in the request
    if payload.full_name is not None:
        user.full_name = payload.full_name
    if payload.email is not None:
        user.email = payload.email
    if payload.password is not None:
        user.hashed_password = hash_password(payload.password)
    if payload.is_active is not None:
        user.is_active = payload.is_active

    # Permission and admin flag changes restricted to admins
    if current_user.is_admin:
        if payload.is_admin is not None:
            user.is_admin = payload.is_admin
        if payload.can_create_user is not None:
            user.can_create_user = payload.can_create_user
        if payload.can_update_user is not None:
            user.can_update_user = payload.can_update_user
        if payload.can_delete_user is not None:
            user.can_delete_user = payload.can_delete_user

    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: uuid.UUID,
    current_user: User = Depends(require_delete_permission),
    db: Session = Depends(get_db),
):
    """
    Deletes a user permanently.
    The default admin account (admin@sentinel.io) cannot be deleted
    to prevent accidental system lockout.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    # Hard guard on the seed admin — no one can delete this account via API
    if user.email == PROTECTED_ADMIN_EMAIL:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The default admin account cannot be deleted",
        )

    db.delete(user)
    db.commit()
