"""Tests for health check endpoint."""

from fastapi import status


def test_health_check_success(test_client):
    """Test health check endpoint returns 200 and correct response.

    Args:
        test_client: FastAPI test client fixture
    """
    response = test_client.get("/health")

    assert response.status_code == status.HTTP_200_OK

    data = response.json()
    assert data["status"] == "healthy"
    assert data["message"] == "All systems operational"
    assert "timestamp" in data


def test_health_check_response_schema(test_client):
    """Test health check response has correct schema.

    Args:
        test_client: FastAPI test client fixture
    """
    response = test_client.get("/health")

    assert response.status_code == status.HTTP_200_OK

    data = response.json()
    assert "status" in data
    assert "message" in data
    assert "timestamp" in data
    assert isinstance(data["status"], str)
    assert isinstance(data["message"], str)
    assert isinstance(data["timestamp"], str)
