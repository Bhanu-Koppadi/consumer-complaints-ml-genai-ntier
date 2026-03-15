"""
Integration tests for the Consumer Complaints ML + GenAI System.

These tests require a live database connection.  They are skipped automatically
when the DATABASE_URL environment variable is not set, so they never block the
unit-test CI gate.

Run with:
    pytest tests/ -m integration
"""

import os

import pytest

# Mark every test in this module as an integration test.
pytestmark = pytest.mark.integration


def _db_available():
    """Return True only when DATABASE_URL points to a reachable database."""
    url = os.environ.get("DATABASE_URL")
    if not url:
        return False
    try:
        import psycopg2

        conn = psycopg2.connect(url)
        conn.close()
        return True
    except Exception:
        return False


_skip_no_db = pytest.mark.skipif(
    not _db_available(),
    reason="DATABASE_URL not set or database not reachable",
)


@_skip_no_db
def test_db_save_and_retrieve_complaint():
    """Save a complaint and retrieve it by ID using the live database."""
    from database.db import db

    complaint_id = db.save_complaint(None, "Integration test complaint text.")
    assert complaint_id is not None, "save_complaint must return an integer ID"

    record = db.get_complaint_by_id(complaint_id)
    assert record is not None
    assert record["complaint_text"] == "Integration test complaint text."


@_skip_no_db
def test_db_save_classification():
    """Save a complaint and then persist a classification result."""
    from database.db import db

    complaint_id = db.save_complaint(None, "Integration classification test.")
    assert complaint_id is not None

    db.save_classification(complaint_id, "Billing Issue", 0.87)

    record = db.get_complaint_by_id(complaint_id)
    assert record is not None
    assert record["category"] == "Billing Issue"


@_skip_no_db
def test_db_get_admin_statistics():
    """Admin statistics query must return the expected shape."""
    from database.db import db

    stats = db.get_admin_statistics()
    assert stats is not None
    assert "total_complaints" in stats
    assert "by_category" in stats
    assert "average_confidence" in stats
    assert "low_confidence_count" in stats
    assert "date_range" in stats
