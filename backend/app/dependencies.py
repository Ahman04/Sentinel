"""
dependencies.py — FastAPI dependency injection for auth and permission checks.

Every protected endpoint declares one of these as a dependency.
FastAPI resolves them automatically before the endpoint handler runs.
If a check fails, the dependency raises an HTTP exception and the
endpoint code never executes.
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.auth import decode_access_token

# Extracts the Bearer token from the Authorization header
bearer_scheme = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    """
    Core auth dependency — used by every protected endpoint.
    Decodes the JWT, looks up the user, and confirms the account is active.
    """
    token = credentials.credentials
    user_id = decode_access_token(token)

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    user = db.query(User).filter(User.id == user_id).first()

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or account disabled",
        )

    return user


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Restricts endpoint to admins only. Raises 403 for everyone else."""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user


def require_create_permission(current_user: User = Depends(get_current_user)) -> User:
    """Allows admins or users with can_create_user = true."""
    if not current_user.is_admin and not current_user.can_create_user:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to create users",
        )
    return current_user


def require_update_permission(current_user: User = Depends(get_current_user)) -> User:
    """Allows admins or users with can_update_user = true."""
    if not current_user.is_admin and not current_user.can_update_user:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to update users",
        )
    return current_user


def require_delete_permission(current_user: User = Depends(get_current_user)) -> User:
    """Allows admins or users with can_delete_user = true."""
    if not current_user.is_admin and not current_user.can_delete_user:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to delete users",
        )
    return current_user
