"""
Phase 13: Unit tests for ml/predictor.py — ComplaintPredictor / predict_complaint().

Covers:
- Returns dict with 'category' and 'confidence' keys
- 'confidence' is a float in [0.0, 1.0]
- RuntimeError raised when model files are missing
- Correct prediction when model files are present (mock via tmp_path + monkeypatch)
- Confidence rounded to 4 decimal places
"""

import os
import pickle
import sys

import pytest
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression

# Ensure backend root is on path when running tests from repo root
_backend = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _backend not in sys.path:
    sys.path.insert(0, _backend)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_TRAINING_TEXTS = [
    "I was charged twice for the same transaction.",
    "My bill is incorrect and shows extra fees.",
    "The product arrived damaged and broken.",
    "The screen on my new phone is cracked.",
    "Customer service was rude and unhelpful.",
    "No one answered my support call for an hour.",
    "Delivery was delayed by two weeks.",
    "Package was left in rain and got wet.",
]

_TRAINING_LABELS = [
    "Billing Issue",
    "Billing Issue",
    "Product Defect",
    "Product Defect",
    "Customer Support",
    "Customer Support",
    "Delivery Problem",
    "Delivery Problem",
]


def _build_mock_artifacts(tmp_path):
    """Train a tiny model and vectorizer; pickle them to tmp_path. Return paths."""
    vectorizer = TfidfVectorizer(max_features=100)
    X = vectorizer.fit_transform(_TRAINING_TEXTS)

    model = LogisticRegression(solver="lbfgs", random_state=42)
    model.fit(X, _TRAINING_LABELS)

    model_path = str(tmp_path / "complaint_classifier.pkl")
    vectorizer_path = str(tmp_path / "tfidf_vectorizer.pkl")

    with open(model_path, "wb") as f:
        pickle.dump(model, f)
    with open(vectorizer_path, "wb") as f:
        pickle.dump(vectorizer, f)

    return model_path, vectorizer_path


# ---------------------------------------------------------------------------
# Missing model — RuntimeError raised
# ---------------------------------------------------------------------------


def test_missing_model_raises_runtime_error(monkeypatch, tmp_path):
    """When model files do not exist, predict() must raise RuntimeError."""
    import importlib

    import config as cfg_module

    monkeypatch.setattr(cfg_module.Config, "ML_MODEL_PATH", str(tmp_path / "nonexistent_model.pkl"))
    monkeypatch.setattr(cfg_module.Config, "VECTORIZER_PATH", str(tmp_path / "nonexistent_vectorizer.pkl"))

    import ml.predictor as predictor_module

    importlib.reload(predictor_module)

    with pytest.raises(RuntimeError, match="ML artifacts not loaded"):
        predictor_module.predictor.predict("I need help with my bill.")


def test_missing_model_raises_on_predict_complaint(monkeypatch, tmp_path):
    """predict_complaint() must propagate RuntimeError when artifacts are missing."""
    import importlib

    import config as cfg_module
    import ml.predictor as predictor_module

    monkeypatch.setattr(cfg_module.Config, "ML_MODEL_PATH", str(tmp_path / "missing.pkl"))
    monkeypatch.setattr(cfg_module.Config, "VECTORIZER_PATH", str(tmp_path / "missing_vec.pkl"))
    importlib.reload(predictor_module)

    with pytest.raises(RuntimeError):
        predictor_module.predict_complaint("Some complaint text.")


# ---------------------------------------------------------------------------
# Model present — correct prediction
# ---------------------------------------------------------------------------


@pytest.fixture()
def loaded_predictor(tmp_path, monkeypatch):
    """Fixture: build tiny mock artifacts, patch Config, reload predictor, return module."""
    import importlib

    import config as cfg_module
    import ml.predictor as predictor_module

    model_path, vectorizer_path = _build_mock_artifacts(tmp_path)

    monkeypatch.setattr(cfg_module.Config, "ML_MODEL_PATH", model_path)
    monkeypatch.setattr(cfg_module.Config, "VECTORIZER_PATH", vectorizer_path)
    importlib.reload(predictor_module)

    return predictor_module


def test_predict_returns_dict(loaded_predictor):
    """predict_complaint() must return a dict."""
    result = loaded_predictor.predict_complaint("I was charged twice for the same transaction.")
    assert isinstance(result, dict)


def test_predict_has_required_keys(loaded_predictor):
    """Result dict must contain 'category' and 'confidence' keys."""
    result = loaded_predictor.predict_complaint("Delivery was delayed by two weeks.")
    assert "category" in result
    assert "confidence" in result


def test_predict_confidence_is_float(loaded_predictor):
    """'confidence' value must be a float."""
    result = loaded_predictor.predict_complaint("The product arrived damaged and broken.")
    assert isinstance(result["confidence"], float)


def test_predict_confidence_in_valid_range(loaded_predictor):
    """'confidence' must be between 0.0 and 1.0 inclusive."""
    result = loaded_predictor.predict_complaint("Customer service was unhelpful.")
    assert 0.0 <= result["confidence"] <= 1.0


def test_predict_confidence_rounded_to_4_decimal_places(loaded_predictor):
    """'confidence' must be rounded to at most 4 decimal places."""
    result = loaded_predictor.predict_complaint("I was billed incorrectly.")
    confidence = result["confidence"]
    assert round(confidence, 4) == confidence


def test_predict_category_is_string(loaded_predictor):
    """'category' must be a non-empty string."""
    result = loaded_predictor.predict_complaint("No one answered my support call.")
    assert isinstance(result["category"], str)
    assert len(result["category"]) > 0


def test_predict_category_is_known_label(loaded_predictor):
    """'category' must match one of the labels the mock model was trained on."""
    known_labels = set(_TRAINING_LABELS)
    result = loaded_predictor.predict_complaint("Package was left in rain and got wet.")
    assert result["category"] in known_labels


def test_predict_complaint_function_wrapper(loaded_predictor):
    """The module-level predict_complaint() convenience function must work correctly."""
    result = loaded_predictor.predict_complaint("I have a billing problem.")
    assert isinstance(result, dict)
    assert "category" in result
    assert "confidence" in result


# ---------------------------------------------------------------------------
# Confidence rounding: explicit numeric check
# ---------------------------------------------------------------------------


def test_confidence_rounding_precision(monkeypatch, tmp_path):
    """Ensure confidence is stored as round(x, 4), not more decimal places."""
    import importlib

    import config as cfg_module
    import ml.predictor as predictor_module

    model_path, vectorizer_path = _build_mock_artifacts(tmp_path)
    monkeypatch.setattr(cfg_module.Config, "ML_MODEL_PATH", model_path)
    monkeypatch.setattr(cfg_module.Config, "VECTORIZER_PATH", vectorizer_path)
    importlib.reload(predictor_module)

    result = predictor_module.predict_complaint("Billing error on my account.")
    confidence = result["confidence"]
    # Check that rounding to 4 decimal places yields the same value
    assert confidence == pytest.approx(round(confidence, 4), abs=1e-9)


# ---------------------------------------------------------------------------
# Numpy scalar — ensure native Python float is returned
# ---------------------------------------------------------------------------


def test_confidence_is_native_float_not_numpy(loaded_predictor):
    """Confidence must be a plain Python float, not a numpy scalar."""
    result = loaded_predictor.predict_complaint("I need a refund for my order.")
    assert isinstance(result["confidence"], float) and not isinstance(result["confidence"], bool)
