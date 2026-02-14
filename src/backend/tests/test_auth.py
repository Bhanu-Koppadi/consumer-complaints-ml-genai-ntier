"""Tests for authentication endpoints."""

from unittest.mock import AsyncMock, patch

from fastapi import status


def test_register_success(test_client, test_user):
    """Test successful user registration.

    Args:
        test_client: FastAPI test client fixture
        test_user: Test user fixture
    """
    with patch("app.routers.auth.register_user", new=AsyncMock(return_value=test_user)):
        response = test_client.post(
            "/api/auth/register",
            json={
                "username": "testuser",
                "email": "test@example.com",
                "password": "SecurePass123!",
                "role": "USER",
            },
        )

        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert "user" in data
        assert "access_token" in data
        assert "token_type" in data
        assert data["user"]["username"] == "testuser"
        assert data["token_type"] == "bearer"


def test_register_validation_error(test_client):
    """Test registration with invalid data.

    Args:
        test_client: FastAPI test client fixture
    """
    response = test_client.post(
        "/api/auth/register", json={"username": "ab", "email": "invalid-email", "password": "short"}
    )

    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


def test_login_success(test_client, test_user):
    """Test successful user login.

    Args:
        test_client: FastAPI test client fixture
        test_user: Test user fixture
    """
    with patch("app.routers.auth.authenticate_user", new=AsyncMock(return_value=test_user)):
        response = test_client.post("/api/auth/login", json={"username": "testuser", "password": "SecurePass123!"})

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "user" in data
        assert "access_token" in data
        assert "token_type" in data
        assert data["user"]["username"] == "testuser"
        assert data["token_type"] == "bearer"


def test_login_invalid_credentials(test_client):
    """Test login with invalid credentials.

    Args:
        test_client: FastAPI test client fixture
    """
    with patch("app.routers.auth.authenticate_user", new=AsyncMock(return_value=None)):
        response = test_client.post("/api/auth/login", json={"username": "testuser", "password": "WrongPassword"})

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        data = response.json()
        assert "detail" in data


def test_get_current_user_success(test_client, test_user):
    """Test getting current user with valid token.

    Args:
        test_client: FastAPI test client fixture
        test_user: Test user fixture
    """
    # First register/login to get token
    with patch("app.routers.auth.register_user", new=AsyncMock(return_value=test_user)):
        register_response = test_client.post(
            "/api/auth/register",
            json={
                "username": "testuser",
                "email": "test@example.com",
                "password": "SecurePass123!",
                "role": "USER",
            },
        )
        token = register_response.json()["access_token"]

    # Then try to get current user
    with patch("app.routers.auth.get_user_by_id", new=AsyncMock(return_value=test_user)):
        response = test_client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "user" in data
        assert data["user"]["username"] == "testuser"


def test_get_current_user_no_token(test_client):
    """Test getting current user without token.

    Args:
        test_client: FastAPI test client fixture
    """
    response = test_client.get("/api/auth/me")

    assert response.status_code == status.HTTP_403_FORBIDDEN


def test_get_current_user_invalid_token(test_client):
    """Test getting current user with invalid token.

    Args:
        test_client: FastAPI test client fixture
    """
    response = test_client.get("/api/auth/me", headers={"Authorization": "Bearer invalid_token"})

    assert response.status_code == status.HTTP_401_UNAUTHORIZED
