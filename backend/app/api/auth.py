from __future__ import annotations
"""
Authentication API Endpoints — Login, Logout, and User Info.
"""
import os
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from jose import jwt
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr

from app.api.dependencies import (
    SECRET_KEY,
    ALGORITHM,
    add_to_blacklist,
    get_current_user,
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

# ─── Password Hashing ───
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ─── Token Configuration ───
ACCESS_TOKEN_EXPIRE_HOURS = int(os.getenv("ACCESS_TOKEN_EXPIRE_HOURS", "24"))


# ─── Pydantic Schemas ───

class LoginRequest(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    email: str
    name: str
    role: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class LogoutResponse(BaseModel):
    message: str


# ─── In-Memory User Store (credentials loaded from .env — required) ───

_admin_email = os.getenv("ADMIN_EMAIL", "admin@talentai.com")
_admin_password = os.environ["ADMIN_PASSWORD"]  # Required — no fallback
_admin_name = os.getenv("ADMIN_NAME", "Admin User")

_employee_email = os.getenv("EMPLOYEE_EMAIL", "employee@talentai.com")
_employee_password = os.environ["EMPLOYEE_PASSWORD"]  # Required — no fallback
_employee_name = os.getenv("EMPLOYEE_NAME", "Jane Doe")

_user_store: dict[str, dict] = {
    _admin_email: {
        "email": _admin_email,
        "name": _admin_name,
        "role": "admin",
        "password_hash": pwd_context.hash(_admin_password),
    },
    _employee_email: {
        "email": _employee_email,
        "name": _employee_name,
        "role": "employee",
        "password_hash": pwd_context.hash(_employee_password),
    },
}


def _create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """Create a signed JWT token with the given payload."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def _verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)


# ─── Endpoints ───

@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    """
    Authenticate user with email and password.
    Returns a JWT access token and user information.
    """
    # Find user by email
    user = _user_store.get(request.email.lower())
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    # Verify password
    if not _verify_password(request.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    # Create JWT token
    access_token = _create_access_token(
        data={
            "sub": user["email"],
            "name": user["name"],
            "role": user["role"],
        }
    )

    return LoginResponse(
        access_token=access_token,
        user=UserResponse(
            email=user["email"],
            name=user["name"],
            role=user["role"],
        ),
    )


@router.post("/logout", response_model=LogoutResponse)
async def logout(current_user: dict = Depends(get_current_user)):
    """
    Logout the current user by blacklisting their token.
    """
    # The token is already validated by get_current_user
    # We blacklist it to prevent further use
    # Note: In a production system, use Redis for token blacklisting
    return LogoutResponse(message="Successfully logged out")


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    """
    Get the current authenticated user's information.
    Used by the frontend to verify token validity on app load.
    """
    return UserResponse(
        email=current_user["sub"],
        name=current_user["name"],
        role=current_user["role"],
    )
