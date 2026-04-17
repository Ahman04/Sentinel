"""
auth.py — JWT creation and verification, password hashing.

Tokens are stateless — no session is stored server-side.
The SECRET_KEY signs tokens; anyone with the key can verify them.
Change SECRET_KEY via environment variable before deploying.
"""

import os
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext

# Secret used to sign JWTs — must be changed in production via env var
SECRET_KEY = os.getenv("SECRET_KEY", "change-this-secret-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))

# bcrypt is the hashing algorithm — passlib handles the salt automatically
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain_password: str) -> str:
    """One-way hash — used when creating or updating a user's password."""
    return pwd_context.hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Compares a plain-text attempt against the stored bcrypt hash."""
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(user_id: str) -> str:
    """
    Creates a signed JWT with the user's ID as the subject.
    Expiry is set from ACCESS_TOKEN_EXPIRE_MINUTES env var (default: 30 min).
    """
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": user_id, "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> str | None:
    """
    Decodes and validates a JWT.
    Returns the user ID (sub claim) if valid, None if expired or tampered.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload.get("sub")
    except JWTError:
        return None
