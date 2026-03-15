"""Unit tests for genai/response_drafter.py — ResponseDrafter class."""

from unittest.mock import MagicMock, patch


def test_draft_mock_mode_returns_nonempty_string():
    """When _model is None (no API key), draft() must return a non-empty string."""
    from genai.response_drafter import ResponseDrafter

    drafter = ResponseDrafter.__new__(ResponseDrafter)
    drafter._model = None
    drafter._api_key = None
    result = drafter.draft("I was overcharged.", "Billing Issue", 0.91)
    assert isinstance(result, str)
    assert len(result) > 0


def test_draft_mock_contains_category():
    """Mock draft must include the predicted category name."""
    from genai.response_drafter import ResponseDrafter

    drafter = ResponseDrafter.__new__(ResponseDrafter)
    drafter._model = None
    drafter._api_key = None
    result = drafter.draft("Package never arrived.", "Delivery Problem", 0.87)
    assert "Delivery Problem" in result


def test_draft_gemini_error_falls_back_to_mock():
    """If Gemini raises an exception, draft() must still return a non-empty string."""
    from genai.response_drafter import ResponseDrafter

    drafter = ResponseDrafter.__new__(ResponseDrafter)
    mock_model = MagicMock()
    mock_model.generate_content.side_effect = RuntimeError("API unavailable")
    drafter._model = mock_model
    drafter._api_key = "fake-key"
    result = drafter.draft("Charged twice.", "Billing Issue", 0.88)
    assert isinstance(result, str)
    assert len(result) > 0


def test_draft_response_public_function():
    """The module-level draft_response() function must delegate to the singleton."""
    with patch("genai.response_drafter.response_drafter_service") as mock_service:
        mock_service.draft.return_value = "Draft email body."
        from genai.response_drafter import draft_response

        result = draft_response("complaint text", "Billing Issue", 0.9)
    assert result == "Draft email body."
