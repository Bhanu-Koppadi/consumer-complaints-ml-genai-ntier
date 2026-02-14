"""Tests for root endpoint and OpenAPI endpoints."""

from fastapi import status


def test_root_endpoint(test_client):
    """Test root endpoint returns API metadata.

    Args:
        test_client: FastAPI test client fixture
    """
    response = test_client.get("/")

    assert response.status_code == status.HTTP_200_OK

    data = response.json()
    assert data["status"] == "ok"
    assert data["message"] == "Enterprise Policy Assistant API"
    assert data["version"] == "1.0.0"
    assert "endpoints" in data
    assert data["endpoints"]["health"] == "/health"
    assert data["endpoints"]["openapi"] == "/api/openapi.yaml"
    assert data["endpoints"]["swagger"] == "/api/docs"


def test_openapi_yaml_endpoint(test_client):
    """Test OpenAPI YAML endpoint returns valid YAML.

    Args:
        test_client: FastAPI test client fixture
    """
    response = test_client.get("/api/openapi.yaml")

    assert response.status_code == status.HTTP_200_OK
    assert "application/x-yaml" in response.headers["content-type"]

    # Check that response contains YAML content
    content = response.text
    assert "openapi:" in content
    assert "info:" in content
    assert "title: Enterprise Policy Assistant API" in content
    assert "paths:" in content
