"""
Phase 11: JWT Authentication tests.
Covers register, login, and refresh endpoints including success and failure paths.
"""

from unittest.mock import patch

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _make_user(id_=1, username="alice", role="USER", password_hash=None):
    from werkzeug.security import generate_password_hash

    return {
        "id": id_,
        "username": username,
        "role": role,
        "password_hash": password_hash or generate_password_hash("secret123"),
    }


# ---------------------------------------------------------------------------
# /api/auth/register
# ---------------------------------------------------------------------------


def test_register_success(client):
    user_row = {"id": 1, "username": "alice", "role": "USER"}
    with (
        patch("database.db.db.find_user_by_username", return_value=None),
        patch("database.db.db.create_user", return_value=user_row) as mock_create,
    ):
        resp = client.post(
            "/api/auth/register",
            json={"username": "alice", "email": "alice@example.com", "password": "secret123"},
        )
    assert resp.status_code == 201
    data = resp.get_json()
    assert data["user"]["username"] == "alice"
    assert data["user"]["role"] == "USER"
    # Verify email was forwarded to create_user
    args = mock_create.call_args
    assert args[0][1] == "alice@example.com"  # positional: username, email, password_hash


def test_register_missing_fields_returns_400(client):
    # Missing password
    resp = client.post("/api/auth/register", json={"username": "alice", "email": "alice@example.com"})
    assert resp.status_code == 400
    assert "error" in resp.get_json()


def test_register_missing_email_returns_400(client):
    resp = client.post("/api/auth/register", json={"username": "alice", "password": "secret123"})
    assert resp.status_code == 400
    assert "error" in resp.get_json()


def test_register_short_username_returns_400(client):
    resp = client.post(
        "/api/auth/register",
        json={"username": "ab", "email": "ab@example.com", "password": "secret123"},
    )
    assert resp.status_code == 400
    assert "error" in resp.get_json()


def test_register_short_password_returns_400(client):
    resp = client.post(
        "/api/auth/register",
        json={"username": "alice", "email": "alice@example.com", "password": "short"},
    )
    assert resp.status_code == 400
    assert "error" in resp.get_json()


def test_register_duplicate_username_returns_409(client):
    with patch("database.db.db.find_user_by_username", return_value=_make_user()):
        resp = client.post(
            "/api/auth/register",
            json={"username": "alice", "email": "alice@example.com", "password": "secret123"},
        )
    assert resp.status_code == 409
    assert "error" in resp.get_json()


def test_register_db_failure_returns_500(client):
    with (
        patch("database.db.db.find_user_by_username", return_value=None),
        patch("database.db.db.create_user", return_value=None),
    ):
        resp = client.post(
            "/api/auth/register",
            json={"username": "alice", "email": "alice@example.com", "password": "secret123"},
        )
    assert resp.status_code == 500
    assert "error" in resp.get_json()


# ---------------------------------------------------------------------------
# /api/auth/login
# ---------------------------------------------------------------------------


def test_login_success(client):
    user = _make_user()
    with patch("database.db.db.find_user_by_username", return_value=user):
        resp = client.post("/api/auth/login", json={"username": "alice", "password": "secret123"})
    assert resp.status_code == 200
    data = resp.get_json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "Bearer"
    assert data["expires_in"] == 86400
    assert data["user"]["username"] == "alice"
    assert data["user"]["role"] == "USER"
    assert "password_hash" not in data["user"]


def test_login_missing_fields_returns_400(client):
    resp = client.post("/api/auth/login", json={"username": "alice"})
    assert resp.status_code == 400
    assert "error" in resp.get_json()


def test_login_wrong_password_returns_401(client):
    user = _make_user()
    with patch("database.db.db.find_user_by_username", return_value=user):
        resp = client.post("/api/auth/login", json={"username": "alice", "password": "wrongpw"})
    assert resp.status_code == 401
    assert "error" in resp.get_json()


def test_login_unknown_user_returns_401(client):
    with patch("database.db.db.find_user_by_username", return_value=None):
        resp = client.post("/api/auth/login", json={"username": "ghost", "password": "secret123"})
    assert resp.status_code == 401
    assert "error" in resp.get_json()


# ---------------------------------------------------------------------------
# /api/auth/refresh
# ---------------------------------------------------------------------------


def test_refresh_success(client):
    user = _make_user()
    # Obtain a real refresh token first
    with patch("database.db.db.find_user_by_username", return_value=user):
        login_resp = client.post("/api/auth/login", json={"username": "alice", "password": "secret123"})
    refresh_token = login_resp.get_json()["refresh_token"]

    resp = client.post(
        "/api/auth/refresh",
        headers={"Authorization": f"Bearer {refresh_token}"},
    )
    assert resp.status_code == 200
    data = resp.get_json()
    assert "access_token" in data
    assert data["token_type"] == "Bearer"
    assert data["expires_in"] == 86400


def test_refresh_missing_token_returns_401(client):
    resp = client.post("/api/auth/refresh")
    assert resp.status_code == 401


def test_refresh_invalid_token_returns_422(client):
    resp = client.post(
        "/api/auth/refresh",
        headers={"Authorization": "Bearer not.a.valid.token"},
    )
    assert resp.status_code in (401, 422)


# ---------------------------------------------------------------------------
# F-026-012: Email format validation
# ---------------------------------------------------------------------------


def test_register_invalid_email_no_at_returns_400(client):
    resp = client.post(
        "/api/auth/register",
        json={"username": "alice", "email": "notanemail", "password": "secret123"},
    )
    assert resp.status_code == 400
    data = resp.get_json()
    assert "error" in data


def test_register_invalid_email_no_domain_returns_400(client):
    resp = client.post(
        "/api/auth/register",
        json={"username": "alice", "email": "alice@", "password": "secret123"},
    )
    assert resp.status_code == 400
    assert "error" in resp.get_json()


def test_register_valid_email_passes_format_check(client):
    user_row = {"id": 1, "username": "alice", "role": "USER"}
    with (
        patch("database.db.db.find_user_by_username", return_value=None),
        patch("database.db.db.create_user", return_value=user_row),
    ):
        resp = client.post(
            "/api/auth/register",
            json={"username": "alice", "email": "alice@example.com", "password": "secret123"},
        )
    assert resp.status_code == 201
