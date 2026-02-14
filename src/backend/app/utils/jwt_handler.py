"""JWT token creation and validation utilities.

Handles JWT token generation, validation, and user extraction
for authentication and authorization.
"""

from datetime import datetime, timedelta, timezone
from typing import Annotated

from app.config import settings
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

# Bearer token scheme for FastAPI
security = HTTPBearer()


def create_access_token(data: dict) -> str:
    """Create a JWT access token with expiration.

    Args:
        data: Dictionary containing token payload (typically user_id, username, role)

    Returns:
        Encoded JWT token string

    Example:
        >>> token = create_access_token({"user_id": 1, "username": "john_doe"})
        >>> isinstance(token, str)
        True
    """
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_access_token_expire_minutes)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)
    return encoded_jwt


def verify_access_token(token: str) -> dict:
    """Verify and decode a JWT access token.

    Args:
        token: JWT token string to verify

    Returns:
        Decoded token payload as dictionary

    Raises:
        HTTPException: 401 if token is invalid or expired
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
        return payload
    except JWTError:
        raise credentials_exception


async def get_current_user_id(credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)]) -> int:
    """FastAPI dependency to extract user_id from JWT token.

    Args:
        credentials: Bearer token from Authorization header

    Returns:
        User ID extracted from token

    Raises:
        HTTPException: 401 if token is invalid or user_id missing

    Example:
        Use as FastAPI dependency:
        @router.get("/me")
        async def get_me(user_id: int = Depends(get_current_user_id)):
            return {"user_id": user_id}
    """
    token = credentials.credentials
    payload = verify_access_token(token)
    user_id: int | None = payload.get("user_id")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user_id
