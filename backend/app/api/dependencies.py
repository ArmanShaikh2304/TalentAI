from __future__ import annotations
"""
Authentication Dependencies — JWT token validation for protected routes.
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from datetime import datetime, timezone
import os

# ─── Configuration (loaded from .env — required) ───
SECRET_KEY = os.environ["SECRET_KEY"]  # Required — no fallback, must be set in .env
ALGORITHM = os.getenv("ALGORITHM", "HS256")

# Security scheme — extracts Bearer token from Authorization header
security = HTTPBearer()

# Token blacklist for logout support (in-memory, matches existing storage pattern)
_token_blacklist: set[str] = set()


def add_to_blacklist(token: str) -> None:
    """Add a token to the blacklist (called on logout)."""
    _token_blacklist.add(token)


def is_blacklisted(token: str) -> bool:
    """Check if a token has been blacklisted."""
    return token in _token_blacklist


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """
    FastAPI dependency that validates JWT tokens.

    Returns the authenticated user payload dict with keys:
        - sub (email)
        - name
        - role
        - exp

    Raises 401 Unauthorized for missing, invalid, expired, or blacklisted tokens.
    """
    token = credentials.credentials

    # Check if token has been invalidated via logout
    if is_blacklisted(token):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been revoked",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        # Validate required fields
        email: str | None = payload.get("sub")
        if email is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Check expiration (jose handles this, but be explicit)
        exp = payload.get("exp")
        if exp and datetime.fromtimestamp(exp, tz=timezone.utc) < datetime.now(timezone.utc):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired",
                headers={"WWW-Authenticate": "Bearer"},
            )

        return payload

    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
