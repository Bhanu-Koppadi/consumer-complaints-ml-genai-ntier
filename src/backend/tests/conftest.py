"""
Pytest fixtures for backend API tests.
Run from src/backend with PYTHONPATH=. so that app and config resolve.
"""

import os
import sys

# Ensure backend root is on path when running tests from repo or backend
_backend = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _backend not in sys.path:
    sys.path.insert(0, _backend)

import pytest  # noqa: E402
from flask_jwt_extended import create_access_token  # noqa: E402

from app import app as flask_app  # noqa: E402
from app import limiter as flask_limiter  # noqa: E402


@pytest.fixture
def app():
    """Flask application fixture."""
    flask_app.config["TESTING"] = True
    flask_app.config["RATELIMIT_ENABLED"] = False
    flask_limiter.enabled = False
    yield flask_app


@pytest.fixture
def client(app):
    """Flask test client."""
    with app.test_client() as c:
        yield c


@pytest.fixture
def admin_token(app):
    """JWT access token with ADMIN role."""
    with app.app_context():
        return create_access_token(identity="99", additional_claims={"role": "ADMIN"})


@pytest.fixture
def user_token(app):
    """JWT access token with USER role (user_id=1)."""
    with app.app_context():
        return create_access_token(identity="1", additional_claims={"role": "USER"})
