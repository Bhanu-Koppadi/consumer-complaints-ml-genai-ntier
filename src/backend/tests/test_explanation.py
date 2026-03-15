"""
Unit tests for genai/explanation.py — ExplanationGenerator / generate_explanation().

Covers:
- Mock mode when GEMINI_API_KEY is absent: returns string containing the category
- Mock mode exact message format
- API success path: response.text returned verbatim
- API failure path: exception is caught; fallback string returned
- generate_explanation() convenience function returns a string
- Return type is always str regardless of path
"""

import importlib
import os
import sys
from unittest.mock import MagicMock

import pytest

# Ensure backend root is on sys.path when tests run from repo root
_backend = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _backend not in sys.path:
    sys.path.insert(0, _backend)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_COMPLAINT = "I was charged twice for the same transaction."
_CATEGORY = "Billing Issue"


def _make_no_key_generator(monkeypatch):
    """Return an ExplanationGenerator with no API key (mock mode)."""
    import config as cfg_module
    import genai.explanation as expl_module

    monkeypatch.setattr(cfg_module.Config, "GEMINI_API_KEY", None)
    importlib.reload(expl_module)
    return expl_module.ExplanationGenerator()


# ---------------------------------------------------------------------------
# Mock mode (no API key)
# ---------------------------------------------------------------------------


def test_generate_mock_returns_string(monkeypatch):
    """Without an API key, generate() must return a str."""
    gen = _make_no_key_generator(monkeypatch)
    result = gen.generate(_COMPLAINT, _CATEGORY)
    assert isinstance(result, str)


def test_generate_mock_includes_category(monkeypatch):
    """Mock response must mention the predicted category."""
    gen = _make_no_key_generator(monkeypatch)
    result = gen.generate(_COMPLAINT, _CATEGORY)
    assert _CATEGORY in result


def test_generate_mock_non_empty(monkeypatch):
    """Mock response must be a non-empty string."""
    gen = _make_no_key_generator(monkeypatch)
    result = gen.generate(_COMPLAINT, _CATEGORY)
    assert len(result.strip()) > 0


def test_generate_mock_contains_genai_marker(monkeypatch):
    """Mock response should contain the expected mock marker text."""
    gen = _make_no_key_generator(monkeypatch)
    result = gen.generate(_COMPLAINT, _CATEGORY)
    assert "GenAI Mock Explanation" in result


# ---------------------------------------------------------------------------
# API success path
# ---------------------------------------------------------------------------


def test_generate_api_success_returns_response_text(monkeypatch):
    """When API key is set and generate_content succeeds, return response.text."""
    import config as cfg_module
    import genai.explanation as expl_module

    mock_response = MagicMock()
    mock_response.text = "  This is a billing complaint because of duplicate charge.  "

    mock_model = MagicMock()
    mock_model.generate_content.return_value = mock_response

    mock_generative_model_cls = MagicMock(return_value=mock_model)

    import google.generativeai as genai_sdk

    monkeypatch.setattr(cfg_module.Config, "GEMINI_API_KEY", "fake-key-123")
    monkeypatch.setattr(genai_sdk, "configure", MagicMock())
    monkeypatch.setattr(genai_sdk, "GenerativeModel", mock_generative_model_cls)

    importlib.reload(expl_module)
    gen = expl_module.ExplanationGenerator()

    result = gen.generate(_COMPLAINT, _CATEGORY)

    assert result == mock_response.text.strip()
    mock_model.generate_content.assert_called_once()


def test_generate_api_success_returns_string_type(monkeypatch):
    """API success path must return a str."""
    import config as cfg_module
    import genai.explanation as expl_module

    mock_response = MagicMock()
    mock_response.text = "Explanation text."

    mock_model = MagicMock()
    mock_model.generate_content.return_value = mock_response

    import google.generativeai as genai_sdk

    monkeypatch.setattr(cfg_module.Config, "GEMINI_API_KEY", "fake-key-abc")
    monkeypatch.setattr(genai_sdk, "configure", MagicMock())
    monkeypatch.setattr(genai_sdk, "GenerativeModel", MagicMock(return_value=mock_model))

    importlib.reload(expl_module)
    gen = expl_module.ExplanationGenerator()

    result = gen.generate(_COMPLAINT, _CATEGORY)
    assert isinstance(result, str)


# ---------------------------------------------------------------------------
# API failure path
# ---------------------------------------------------------------------------


def test_generate_api_exception_returns_fallback(monkeypatch):
    """When generate_content raises, return fallback string containing the category."""
    import config as cfg_module
    import genai.explanation as expl_module

    mock_model = MagicMock()
    mock_model.generate_content.side_effect = Exception("network error")

    import google.generativeai as genai_sdk

    monkeypatch.setattr(cfg_module.Config, "GEMINI_API_KEY", "fake-key-err")
    monkeypatch.setattr(genai_sdk, "configure", MagicMock())
    monkeypatch.setattr(genai_sdk, "GenerativeModel", MagicMock(return_value=mock_model))

    importlib.reload(expl_module)
    gen = expl_module.ExplanationGenerator()

    result = gen.generate(_COMPLAINT, _CATEGORY)

    assert isinstance(result, str)
    assert len(result.strip()) > 0
    # Fallback message includes the category
    assert _CATEGORY in result


def test_generate_api_exception_does_not_raise(monkeypatch):
    """generate() must never propagate an exception from the GenAI SDK."""
    import config as cfg_module
    import genai.explanation as expl_module

    mock_model = MagicMock()
    mock_model.generate_content.side_effect = RuntimeError("sdk crash")

    import google.generativeai as genai_sdk

    monkeypatch.setattr(cfg_module.Config, "GEMINI_API_KEY", "fake-key-crash")
    monkeypatch.setattr(genai_sdk, "configure", MagicMock())
    monkeypatch.setattr(genai_sdk, "GenerativeModel", MagicMock(return_value=mock_model))

    importlib.reload(expl_module)
    gen = expl_module.ExplanationGenerator()

    # Must not raise
    result = gen.generate(_COMPLAINT, _CATEGORY)
    assert isinstance(result, str)


# ---------------------------------------------------------------------------
# generate_explanation() convenience function
# ---------------------------------------------------------------------------


def test_generate_explanation_returns_string(monkeypatch):
    """The module-level generate_explanation() must return a str."""
    import config as cfg_module
    import genai.explanation as expl_module

    monkeypatch.setattr(cfg_module.Config, "GEMINI_API_KEY", None)
    importlib.reload(expl_module)

    result = expl_module.generate_explanation(_COMPLAINT, _CATEGORY)
    assert isinstance(result, str)


def test_generate_explanation_includes_category(monkeypatch):
    """generate_explanation() mock result must mention the category."""
    import config as cfg_module
    import genai.explanation as expl_module

    monkeypatch.setattr(cfg_module.Config, "GEMINI_API_KEY", None)
    importlib.reload(expl_module)

    result = expl_module.generate_explanation(_COMPLAINT, _CATEGORY)
    assert _CATEGORY in result
