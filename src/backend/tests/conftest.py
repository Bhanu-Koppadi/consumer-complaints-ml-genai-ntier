"""Pytest configuration and fixtures for backend tests.

Provides test client, mock database, and test user fixtures.
"""

import os

# Set test environment variables BEFORE any imports
os.environ["JWT_SECRET_KEY"] = "test-secret-key-for-testing-only"
os.environ["JWT_ALGORITHM"] = "HS256"
os.environ["JWT_ACCESS_TOKEN_EXPIRE_MINUTES"] = "30"
os.environ["DATABASE_URL"] = "postgresql://postgres:postgres@localhost:5432/test_db"

from datetime import datetime  # noqa: E402
from unittest.mock import MagicMock  # noqa: E402

import pytest  # noqa: E402
from app.main import app  # noqa: E402
from app.models.auth import User  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402


@pytest.fixture
def test_client():
    """Create a test client for FastAPI app.

    Returns:
        TestClient instance for making test requests
    """
    return TestClient(app)


@pytest.fixture
def mock_db_connection():
    """Mock database connection for tests.

    Returns:
        MagicMock connection object
    """
    mock_conn = MagicMock()
    mock_cursor = MagicMock()
    mock_conn.cursor.return_value = mock_cursor
    return mock_conn, mock_cursor


@pytest.fixture
def test_user():
    """Create a test user object.

    Returns:
        User object for testing
    """
    return User(
        id=1, username="testuser", email="test@example.com", role="USER", created_at=datetime(2026, 2, 12, 10, 0, 0)
    )


@pytest.fixture
def test_admin_user():
    """Create a test admin user object.

    Returns:
        Admin User object for testing
    """
    return User(
        id=2, username="adminuser", email="admin@example.com", role="ADMIN", created_at=datetime(2026, 2, 12, 10, 0, 0)
    )
