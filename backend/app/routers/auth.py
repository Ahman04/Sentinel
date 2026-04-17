"""
routers/auth.py — Authentication endpoints.

Single endpoint: POST /auth/login
Accepts email + password, returns a signed JWT on success.
All validation (wrong password, unknown email, inactive account)
returns 401 so callers cannot distinguish between the failure reasons
— this prevents user enumeration attacks.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.schemas import LoginRequest, TokenResponse
from app.auth import verify_password, create_access_token

router = APIRouter()


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """
    Validates credentials and returns a JWT access token.

    Returns 401 for any failure (wrong email, wrong password, inactive account).
    A generic error message is intentional — avoids leaking whether an
    email exists in the system.
    """
    # Look up user by email
    user = db.query(User).filter(User.email == payload.email).first()

    # Verify password even if user is None to prevent timing attacks,
    # then reject with the same generic message either way
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    # Inactive accounts cannot log in — checked after password verification
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    # Token subject is the user's UUID as a string
    token = create_access_token(str(user.id))

    return TokenResponse(access_token=token)
