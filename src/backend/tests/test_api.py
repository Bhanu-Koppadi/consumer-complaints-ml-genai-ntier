"""
Phase 14 (partial): API integration tests.
Minimal tests so CI has something to run; expand per phase-14 workitem.
"""

import datetime
from unittest.mock import patch


def test_health_endpoint(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.get_json()
    assert data.get("status") == "healthy"
    assert "app_name" in data
    assert "version" in data


def test_root_endpoint(client):
    response = client.get("/")
    assert response.status_code == 200
    data = response.get_json()
    assert data == {
        "status": "ok",
        "message": "Consumer Complaints ML + GenAI System API",
        "health": "/health",
        "openapi": "/api/openapi.yaml",
        "swagger": "/api/docs",
    }


def test_openapi_spec_endpoint(client):
    response = client.get("/api/openapi.yaml")
    assert response.status_code == 200
    assert "yaml" in response.mimetype
    assert "openapi: 3.0.3" in response.get_data(as_text=True)


def test_swagger_ui_endpoint(client):
    response = client.get("/api/docs")
    assert response.status_code == 200
    assert response.mimetype == "text/html"
    body = response.get_data(as_text=True)
    assert "SwaggerUIBundle" in body
    assert "/api/openapi.yaml" in body


def test_api_info_endpoint(client):
    response = client.get("/api/info")
    assert response.status_code == 200
    data = response.get_json()
    assert "name" in data
    assert "endpoints" in data
    assert isinstance(data["endpoints"], list)
    assert "GET  /" in data["endpoints"]
    assert "GET  /api/openapi.yaml" in data["endpoints"]
    assert "GET  /api/docs" in data["endpoints"]


def test_classify_missing_text_returns_400(client):
    response = client.post(
        "/api/classify",
        json={},
        content_type="application/json",
    )
    assert response.status_code == 400
    data = response.get_json()
    assert "error" in data


def test_get_complaint_by_id_found(client, admin_token):
    mock_record = {
        "id": 1,
        "user_id": 99,
        "complaint_text": "I was charged twice for the same transaction.",
        "category": "Billing Issue",
        "confidence": 0.91,
        "explanation": "Classified as Billing Issue due to duplicate charge mention.",
        "created_at": datetime.datetime(2024, 1, 1, 12, 0, 0),
        "classified_at": datetime.datetime(2024, 1, 1, 12, 1, 0),
    }
    headers = {"Authorization": f"Bearer {admin_token}"}
    with patch("database.db.db.get_complaint_by_id", return_value=mock_record):
        response = client.get("/api/complaints/1", headers=headers)
    assert response.status_code == 200
    data = response.get_json()
    assert data["id"] == 1
    assert data["complaint_text"] == "I was charged twice for the same transaction."
    assert data["category"] == "Billing Issue"
    assert data["confidence"] == 0.91
    assert data["explanation"] == "Classified as Billing Issue due to duplicate charge mention."
    assert "created_at" in data
    assert "classified_at" in data


def test_get_complaint_by_id_not_found(client, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    with patch("database.db.db.get_complaint_by_id", return_value=None):
        response = client.get("/api/complaints/999", headers=headers)
    assert response.status_code == 404
    data = response.get_json()
    assert "error" in data


def test_get_complaint_by_id_no_auth_returns_401(client):
    response = client.get("/api/complaints/1")
    assert response.status_code == 401


# ---------------------------------------------------------------------------
# Phase 12: Admin endpoints — success paths
# ---------------------------------------------------------------------------


def test_admin_complaints_success(client, admin_token):
    mock_row = {
        "id": 1,
        "complaint_text": "Charged twice.",
        "category": "Billing Issue",
        "confidence": 0.91,
        "created_at": datetime.datetime(2026, 1, 16, 14, 30, 0),
    }
    with patch("database.db.db.get_admin_complaints", return_value=([mock_row], 1)):
        response = client.get("/api/admin/complaints", headers={"Authorization": f"Bearer {admin_token}"})
    assert response.status_code == 200
    data = response.get_json()
    assert data["total"] == 1
    assert data["page"] == 1
    assert data["limit"] == 20
    assert len(data["complaints"]) == 1
    assert data["complaints"][0]["id"] == 1
    assert data["complaints"][0]["category"] == "Billing Issue"


def test_admin_complaints_pagination_params(client, admin_token):
    with patch("database.db.db.get_admin_complaints", return_value=([], 0)) as mock_fn:
        response = client.get(
            "/api/admin/complaints?page=2&limit=5&category=Billing+Issue&min_confidence=0.8",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
    assert response.status_code == 200
    mock_fn.assert_called_once_with(2, 5, category="Billing Issue", min_confidence=0.8, status_filter=None)


def test_admin_complaints_invalid_params_returns_400(client, admin_token):
    response = client.get("/api/admin/complaints?page=abc", headers={"Authorization": f"Bearer {admin_token}"})
    assert response.status_code == 400


def test_admin_statistics_success(client, admin_token):
    mock_stats = {
        "total_complaints": 100,
        "by_category": {"Billing Issue": 50, "Delivery Problem": 30},
        "average_confidence": 0.85,
        "low_confidence_count": 5,
        "date_range": {"start": "2026-01-01", "end": "2026-01-31"},
    }
    with patch("database.db.db.get_admin_statistics", return_value=mock_stats):
        response = client.get("/api/admin/statistics", headers={"Authorization": f"Bearer {admin_token}"})
    assert response.status_code == 200
    data = response.get_json()
    assert data["total_complaints"] == 100
    assert data["average_confidence"] == 0.85
    assert data["low_confidence_count"] == 5
    assert "by_category" in data
    assert "date_range" in data


def test_admin_statistics_db_error_returns_500(client, admin_token):
    with patch("database.db.db.get_admin_statistics", return_value=None):
        response = client.get("/api/admin/statistics", headers={"Authorization": f"Bearer {admin_token}"})
    assert response.status_code == 500


# ---------------------------------------------------------------------------
# Phase 14: POST /api/classify — happy path and exception path
# ---------------------------------------------------------------------------


def test_classify_happy_path(client):
    with (
        patch("database.db.db.save_complaint", return_value=42),
        patch("app.predict_complaint", return_value={"category": "Billing Issue", "confidence": 0.92}),
        patch("app.generate_explanation", return_value="Classified as Billing Issue."),
        patch("database.db.db.save_classification", return_value=True),
        patch("database.db.db.save_explanation", return_value=True),
    ):
        response = client.post(
            "/api/classify",
            json={"complaint_text": "I was charged twice"},
            content_type="application/json",
        )
    assert response.status_code == 200
    data = response.get_json()
    assert data["complaint_id"] == 42
    assert data["category"] == "Billing Issue"
    assert data["confidence"] == 0.92
    assert data["explanation"] == "Classified as Billing Issue."


def test_classify_exception_returns_500(client):
    with (
        patch("database.db.db.save_complaint", return_value=1),
        patch("app.predict_complaint", side_effect=RuntimeError("model error")),
    ):
        response = client.post(
            "/api/classify",
            json={"complaint_text": "test"},
            content_type="application/json",
        )
    assert response.status_code == 500
    data = response.get_json()
    assert "error" in data


def test_classify_delete_orphan_when_classification_save_fails(client):
    with (
        patch("database.db.db.save_complaint", return_value=99),
        patch("app.predict_complaint", return_value={"category": "Billing Issue", "confidence": 0.92}),
        patch("app.generate_explanation", return_value="Classified as Billing Issue."),
        patch("database.db.db.save_classification", return_value=False),
        patch("database.db.db.delete_complaint", return_value=True) as delete_mock,
    ):
        response = client.post(
            "/api/classify",
            json={"complaint_text": "I was charged twice"},
            content_type="application/json",
        )

    assert response.status_code == 500
    delete_mock.assert_called_once_with(99)


# ---------------------------------------------------------------------------
# Phase 14: POST /api/complaints
# ---------------------------------------------------------------------------


def test_submit_complaint_success(client, user_token):
    with patch("database.db.db.save_complaint", return_value=7):
        response = client.post(
            "/api/complaints",
            json={"complaint_text": "My order never arrived"},
            content_type="application/json",
            headers={"Authorization": f"Bearer {user_token}"},
        )
    assert response.status_code == 201
    data = response.get_json()
    assert data["id"] == 7


def test_submit_complaint_no_auth_returns_401(client):
    response = client.post(
        "/api/complaints",
        json={"complaint_text": "My order never arrived"},
        content_type="application/json",
    )
    assert response.status_code == 401


def test_submit_complaint_missing_text_returns_400(client, user_token):
    response = client.post(
        "/api/complaints",
        json={},
        content_type="application/json",
        headers={"Authorization": f"Bearer {user_token}"},
    )
    assert response.status_code == 400
    data = response.get_json()
    assert "error" in data


# ---------------------------------------------------------------------------
# Phase 14: GET /api/explanation/<id>
# ---------------------------------------------------------------------------


def test_get_explanation_found(client):
    mock_record = {
        "complaint_id": 1,
        "explanation": "Billing issue.",
        "created_at": datetime.datetime(2026, 1, 1, 12, 0, 0),
    }
    with patch("database.db.db.get_explanation", return_value=mock_record):
        response = client.get("/api/explanation/1")
    assert response.status_code == 200
    data = response.get_json()
    assert data["complaint_id"] == 1
    assert data["explanation"] == "Billing issue."
    assert "created_at" in data


def test_get_explanation_not_found(client):
    with patch("database.db.db.get_explanation", return_value=None):
        response = client.get("/api/explanation/999")
    assert response.status_code == 404
    data = response.get_json()
    assert "error" in data


# ---------------------------------------------------------------------------
# Phase 14: GET /api/complaints/<id> — USER ownership enforcement
# ---------------------------------------------------------------------------


def test_get_complaint_user_forbidden_returns_403(client, user_token):
    mock_record = {
        "id": 5,
        "user_id": 99,
        "complaint_text": "Someone else's complaint.",
        "category": "Billing Issue",
        "confidence": 0.85,
        "explanation": None,
        "created_at": datetime.datetime(2026, 1, 1, 12, 0, 0),
        "classified_at": None,
    }
    headers = {"Authorization": f"Bearer {user_token}"}
    with patch("database.db.db.get_complaint_by_id", return_value=mock_record):
        response = client.get("/api/complaints/5", headers=headers)
    assert response.status_code == 403
    data = response.get_json()
    assert "error" in data or "message" in data


# ---------------------------------------------------------------------------
# Phase 24: POST /api/draft-response — input validation + happy path
# ---------------------------------------------------------------------------


def test_draft_response_no_auth_returns_401(client):
    response = client.post("/api/draft-response", json={}, content_type="application/json")
    assert response.status_code == 401


def test_draft_response_missing_fields_returns_400(client, user_token):
    response = client.post(
        "/api/draft-response",
        json={},
        content_type="application/json",
        headers={"Authorization": f"Bearer {user_token}"},
    )
    assert response.status_code == 400
    assert "error" in response.get_json()


def test_draft_response_missing_category_returns_400(client, user_token):
    response = client.post(
        "/api/draft-response",
        json={"complaint_text": "I was overcharged.", "confidence": 0.9},
        headers={"Authorization": f"Bearer {user_token}"},
    )
    assert response.status_code == 400
    assert "error" in response.get_json()


def test_draft_response_invalid_confidence_returns_400(client, user_token):
    response = client.post(
        "/api/draft-response",
        json={"complaint_text": "I was overcharged.", "category": "Billing Issue", "confidence": 1.5},
        headers={"Authorization": f"Bearer {user_token}"},
    )
    assert response.status_code == 400
    data = response.get_json()
    assert "error" in data


def test_draft_response_whitespace_text_returns_400(client, user_token):
    response = client.post(
        "/api/draft-response",
        json={"complaint_text": "   ", "category": "Billing Issue", "confidence": 0.9},
        headers={"Authorization": f"Bearer {user_token}"},
    )
    assert response.status_code == 400
    assert "error" in response.get_json()


def test_draft_response_happy_path_returns_200(client, user_token):
    with patch("app.draft_response_fn", return_value="Dear Customer, thank you…"):
        response = client.post(
            "/api/draft-response",
            json={"complaint_text": "I was charged twice.", "category": "Billing Issue", "confidence": 0.91},
            headers={"Authorization": f"Bearer {user_token}"},
        )
    assert response.status_code == 200
    data = response.get_json()
    assert "draft_response" in data
    assert data["draft_response"] == "Dear Customer, thank you…"


# ---------------------------------------------------------------------------
# Phase 24: GET /api/complaints — user history endpoint
# ---------------------------------------------------------------------------


def test_get_user_complaints_no_auth_returns_401(client):
    response = client.get("/api/complaints")
    assert response.status_code == 401


def test_get_user_complaints_returns_list(client, user_token):
    mock_rows = [
        {
            "id": 1,
            "complaint_text": "I was charged twice.",
            "category": "Billing Issue",
            "confidence": 0.91,
            "created_at": datetime.datetime(2026, 3, 4, 12, 0, 0),
        }
    ]
    with patch("database.db.db.get_complaints_by_user", return_value=mock_rows):
        response = client.get(
            "/api/complaints",
            headers={"Authorization": f"Bearer {user_token}"},
        )
    assert response.status_code == 200
    data = response.get_json()
    assert "complaints" in data
    assert len(data["complaints"]) == 1
    assert data["complaints"][0]["category"] == "Billing Issue"


def test_get_user_complaints_db_error_returns_500(client, user_token):
    with patch("database.db.db.get_complaints_by_user", return_value=None):
        response = client.get(
            "/api/complaints",
            headers={"Authorization": f"Bearer {user_token}"},
        )
    assert response.status_code == 500


# ---------------------------------------------------------------------------
# Phase 25: Input length validation — /api/classify and /api/complaints
# ---------------------------------------------------------------------------


def test_classify_over_length_returns_400(client):
    """complaint_text exceeding 5000 characters must be rejected with 400."""
    long_text = "x" * 5001
    response = client.post(
        "/api/classify",
        json={"complaint_text": long_text},
        content_type="application/json",
    )
    assert response.status_code == 400
    data = response.get_json()
    assert "error" in data


def test_classify_at_max_length_is_accepted(client):
    """complaint_text of exactly 5000 characters must not be rejected on length."""
    exact_text = "a" * 5000
    with (
        patch("database.db.db.save_complaint", return_value=1),
        patch("app.predict_complaint", return_value={"category": "Other", "confidence": 0.5}),
        patch("app.generate_explanation", return_value="Mock explanation."),
        patch("database.db.db.save_classification", return_value=True),
        patch("database.db.db.save_explanation", return_value=True),
    ):
        response = client.post(
            "/api/classify",
            json={"complaint_text": exact_text},
            content_type="application/json",
        )
    assert response.status_code == 200


def test_classify_whitespace_only_returns_400(client):
    """complaint_text containing only whitespace must be rejected with 400."""
    response = client.post(
        "/api/classify",
        json={"complaint_text": "   "},
        content_type="application/json",
    )
    assert response.status_code == 400
    data = response.get_json()
    assert "error" in data


def test_submit_over_length_returns_400(client, user_token):
    """POST /api/complaints with text > 5000 chars must be rejected with 400."""
    long_text = "y" * 5001
    response = client.post(
        "/api/complaints",
        json={"complaint_text": long_text},
        content_type="application/json",
        headers={"Authorization": f"Bearer {user_token}"},
    )
    assert response.status_code == 400
    data = response.get_json()
    assert "error" in data


def test_classify_error_response_hides_internal_detail(client):
    """500 error response from /api/classify must not expose raw exception message."""
    with (
        patch("database.db.db.save_complaint", return_value=1),
        patch("app.predict_complaint", side_effect=RuntimeError("internal db path /var/secret")),
    ):
        response = client.post(
            "/api/classify",
            json={"complaint_text": "My bill is wrong."},
            content_type="application/json",
        )
    assert response.status_code == 500
    data = response.get_json()
    assert "error" in data
    assert "internal db path" not in data["error"]
    assert "/var/secret" not in data["error"]


# ---------------------------------------------------------------------------
# F-026-016: Admin pagination limit cap at 100
# ---------------------------------------------------------------------------


def test_admin_complaints_limit_capped_at_100(client, admin_token):
    """limit > 100 must be silently capped to 100."""
    rows = [
        {
            "id": i,
            "complaint_text": "test",
            "category": "Other",
            "confidence": 0.5,
            "created_at": datetime.datetime(2024, 1, 1),
        }
        for i in range(1, 6)
    ]
    with patch("database.db.db.get_admin_complaints", return_value=(rows, 5)) as mock_fn:
        response = client.get(
            "/api/admin/complaints?limit=500",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
    assert response.status_code == 200
    # The limit passed to db must not exceed 100
    call_args = mock_fn.call_args
    assert call_args[0][1] <= 100
