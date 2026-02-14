"""Pydantic models for authentication endpoints.

All request/response models for user registration, login,
and profile management with comprehensive validation.
"""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field


class User(BaseModel):
    """User model without sensitive information.

    Attributes:
        id: User's unique identifier
        username: User's username
        email: User's email address
        role: User's role (USER or ADMIN)
        created_at: Account creation timestamp
    """

    id: int = Field(..., description="User ID", examples=[1])
    username: str = Field(..., description="Username", examples=["john_doe"])
    email: EmailStr = Field(..., description="Email address", examples=["john.doe@company.com"])
    role: Literal["USER", "ADMIN"] = Field(..., description="User role", examples=["USER"])
    created_at: datetime = Field(..., description="Account creation date", examples=["2026-02-12T10:00:00Z"])


class RegisterRequest(BaseModel):
    """User registration request model with validation.

    Attributes:
        username: Unique username (3-50 chars, alphanumeric + underscore/dash)
        email: Valid email address
        password: Strong password (8-100 chars)
        role: User role (defaults to USER)
    """

    username: str = Field(
        ...,
        min_length=3,
        max_length=50,
        pattern=r"^[a-zA-Z0-9_-]+$",
        description="Username (3-50 chars, alphanumeric + underscore/dash)",
        examples=["john_doe"],
    )
    email: EmailStr = Field(..., description="Valid email address", examples=["john.doe@company.com"])
    password: str = Field(
        ..., min_length=8, max_length=100, description="Password (minimum 8 characters)", examples=["SecurePass123!"]
    )
    role: Literal["USER", "ADMIN"] = Field(default="USER", description="User role", examples=["USER"])


class LoginRequest(BaseModel):
    """User login request model.

    Attributes:
        username: User's username
        password: User's password
    """

    username: str = Field(..., description="Username", examples=["john_doe"])
    password: str = Field(..., description="Password", examples=["SecurePass123!"])


class AuthResponse(BaseModel):
    """Authentication response with JWT token.

    Attributes:
        user: User information
        access_token: JWT access token
        token_type: Token type (always "bearer")
    """

    user: User = Field(..., description="User information")
    access_token: str = Field(..., description="JWT access token", examples=["eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."])
    token_type: str = Field(default="bearer", description="Token type", examples=["bearer"])


class ErrorResponse(BaseModel):
    """Standard error response model.

    Attributes:
        detail: Error message
        error_code: Optional error code for programmatic handling
    """

    detail: str = Field(..., description="Error message", examples=["Invalid credentials"])
    error_code: str | None = Field(None, description="Error code", examples=["AUTH_001"])
