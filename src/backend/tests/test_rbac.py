"""
Phase 12: Role-Based Access Control (RBAC) tests.

Covers:
- admin_required decorator: no token → 401, USER role → 403, ADMIN role → passes
- login_required (JWT) on /api/complaints/<id>: no token → 401
- Ownership enforcement: USER can only access own complaints
- ADMIN can access any complaint
- Role included in JWT access token at login
"""

import datetime
from unittest.mock import patch

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _auth(token):
    return {"Authorization": f"Bearer {token}"}


def _make_complaint(owner_id=1):
    return {
        "id": 10,
        "user_id": owner_id,
        "complaint_text": "Package never arrived.",
        "category": "Delivery Problem",
        "confidence": 0.88,
        "explanation": "Classified as Delivery Problem.",
        "created_at": datetime.datetime(2026, 1, 1, 10, 0, 0),
        "classified_at": datetime.datetime(2026, 1, 1, 10, 1, 0),
    }


# ---------------------------------------------------------------------------
# admin_required: /api/admin/complaints
# ---------------------------------------------------------------------------


def test_admin_required_no_token_returns_401(client):
    """No Authorization header → 401."""
    response = client.get("/api/admin/complaints")
    assert response.status_code == 401


def test_admin_required_user_role_returns_403(client, user_token):
    """Valid JWT with role=USER → 403 Forbidden."""
    response = client.get("/api/admin/complaints", headers=_auth(user_token))
    assert response.status_code == 403
    data = response.get_json()
    assert data["error"] == "Forbidden"
    assert data["message"] == "Admin access required"
    assert data["status"] == 403


def test_admin_required_admin_role_passes(client, admin_token):
    """Valid JWT with role=ADMIN → 200."""
    with patch("database.db.db.get_admin_complaints", return_value=([], 0)):
        response = client.get("/api/admin/complaints", headers=_auth(admin_token))
    assert response.status_code == 200


def test_admin_statistics_user_role_returns_403(client, user_token):
    """Statistics endpoint: valid JWT with role=USER → 403."""
    response = client.get("/api/admin/statistics", headers=_auth(user_token))
    assert response.status_code == 403
    data = response.get_json()
    assert data["error"] == "Forbidden"


def test_admin_statistics_admin_role_passes(client, admin_token):
    """Statistics endpoint: valid JWT with role=ADMIN → 200."""
    mock_stats = {
        "total_complaints": 0,
        "by_category": {},
        "average_confidence": 0.0,
        "low_confidence_count": 0,
        "date_range": {"start": None, "end": None},
    }
    with patch("database.db.db.get_admin_statistics", return_value=mock_stats):
        response = client.get("/api/admin/statistics", headers=_auth(admin_token))
    assert response.status_code == 200


# ---------------------------------------------------------------------------
# /api/complaints/<id>: ownership check
# ---------------------------------------------------------------------------


def test_complaint_by_id_no_auth_returns_401(client):
    """No token on protected complaint endpoint → 401."""
    response = client.get("/api/complaints/10")
    assert response.status_code == 401


def test_complaint_by_id_admin_can_access_any(client, admin_token):
    """ADMIN can access complaints belonging to any user."""
    record = _make_complaint(owner_id=5)  # Complaint owned by user 5, not admin (99)
    with patch("database.db.db.get_complaint_by_id", return_value=record):
        response = client.get("/api/complaints/10", headers=_auth(admin_token))
    assert response.status_code == 200
    data = response.get_json()
    assert data["id"] == 10


def test_complaint_by_id_user_can_access_own(client, user_token):
    """USER can access their own complaint (user_id matches JWT identity=1)."""
    record = _make_complaint(owner_id=1)  # Owned by user 1
    with patch("database.db.db.get_complaint_by_id", return_value=record):
        response = client.get("/api/complaints/10", headers=_auth(user_token))
    assert response.status_code == 200
    data = response.get_json()
    assert data["id"] == 10


def test_complaint_by_id_user_cannot_access_others(client, user_token):
    """USER cannot access a complaint belonging to a different user → 403."""
    record = _make_complaint(owner_id=5)  # Owned by user 5, not user 1
    with patch("database.db.db.get_complaint_by_id", return_value=record):
        response = client.get("/api/complaints/10", headers=_auth(user_token))
    assert response.status_code == 403
    data = response.get_json()
    assert data["error"] == "Forbidden"


def test_complaint_by_id_not_found_returns_404(client, admin_token):
    """404 returned before ownership check when complaint does not exist."""
    with patch("database.db.db.get_complaint_by_id", return_value=None):
        response = client.get("/api/complaints/999", headers=_auth(admin_token))
    assert response.status_code == 404


# ---------------------------------------------------------------------------
# Role in JWT claims at login
# ---------------------------------------------------------------------------


def _make_user(role="USER"):
    from werkzeug.security import generate_password_hash

    return {
        "id": 1,
        "username": "alice",
        "role": role,
        "password_hash": generate_password_hash("secret123"),
    }


def test_login_access_token_contains_user_role(client):
    """JWT access token issued on login must carry the user's role claim."""
    import jwt as pyjwt

    user = _make_user(role="USER")
    with patch("database.db.db.find_user_by_username", return_value=user):
        resp = client.post("/api/auth/login", json={"username": "alice", "password": "secret123"})
    assert resp.status_code == 200
    token = resp.get_json()["access_token"]
    # Decode without verification to inspect claims (signature is irrelevant here)
    payload = pyjwt.decode(token, options={"verify_signature": False})
    assert payload.get("role") == "USER"


def test_login_access_token_contains_admin_role(client):
    """JWT access token must carry role=ADMIN for admin users."""
    import jwt as pyjwt

    user = _make_user(role="ADMIN")
    with patch("database.db.db.find_user_by_username", return_value=user):
        resp = client.post("/api/auth/login", json={"username": "alice", "password": "secret123"})
    assert resp.status_code == 200
    token = resp.get_json()["access_token"]
    payload = pyjwt.decode(token, options={"verify_signature": False})
    assert payload.get("role") == "ADMIN"
