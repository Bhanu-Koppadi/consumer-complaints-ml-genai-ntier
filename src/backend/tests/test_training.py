"""
Phase 13: Smoke test for ml/train_model.py — training pipeline on a tiny in-memory dataset.

Covers:
- Train on tiny 8-row CSV dataset
- Assert .pkl artifacts are created
- Clean up after test (tmp_path handles this automatically)
"""

import os
import pickle
import sys

import pandas as pd
import pytest

# Ensure backend root is on path when running tests from repo root
_backend = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _backend not in sys.path:
    sys.path.insert(0, _backend)


# ---------------------------------------------------------------------------
# Tiny in-memory dataset
# ---------------------------------------------------------------------------

_SAMPLE_DATA = {
    "complaint_text": [
        "I was charged twice for the same transaction.",
        "My bill is incorrect and shows extra fees.",
        "The product arrived damaged and broken.",
        "The screen on my new phone is cracked.",
        "Customer service was rude and unhelpful.",
        "No one answered my support call for an hour.",
        "Delivery was delayed by two weeks.",
        "Package was left in rain and got wet.",
    ],
    "category": [
        "Billing Issue",
        "Billing Issue",
        "Product Defect",
        "Product Defect",
        "Customer Support",
        "Customer Support",
        "Delivery Problem",
        "Delivery Problem",
    ],
}


# ---------------------------------------------------------------------------
# Smoke test
# ---------------------------------------------------------------------------


@pytest.mark.slow
def test_train_model_creates_artifacts(tmp_path, monkeypatch):
    """train_model() must create both .pkl artifacts without errors."""
    import config as cfg_module

    # Patch artifact output paths
    model_path = str(tmp_path / "models" / "complaint_classifier.pkl")
    vectorizer_path = str(tmp_path / "models" / "tfidf_vectorizer.pkl")

    monkeypatch.setattr(cfg_module.Config, "ML_MODEL_PATH", model_path)
    monkeypatch.setattr(cfg_module.Config, "VECTORIZER_PATH", vectorizer_path)

    import ml.train_model as train_module

    # train_model.py anchors dataset_path to __file__; the module-level patch
    # intercepts pd.read_csv so the real file is never read from disk.
    original_read_csv = pd.read_csv

    def patched_read_csv(path, **kwargs):
        if "complaints.csv" in str(path):
            return pd.DataFrame(_SAMPLE_DATA)
        return original_read_csv(path, **kwargs)

    monkeypatch.setattr("ml.train_model.pd.read_csv", patched_read_csv)

    # Run training
    train_module.train_model()

    # Assert artifacts were created
    assert os.path.exists(model_path), "complaint_classifier.pkl was not created"
    assert os.path.exists(vectorizer_path), "tfidf_vectorizer.pkl was not created"


@pytest.mark.slow
def test_train_model_artifacts_are_valid_pickles(tmp_path, monkeypatch):
    """Artifacts created by train_model() must be loadable pickles."""
    import config as cfg_module

    model_path = str(tmp_path / "models" / "complaint_classifier.pkl")
    vectorizer_path = str(tmp_path / "models" / "tfidf_vectorizer.pkl")

    monkeypatch.setattr(cfg_module.Config, "ML_MODEL_PATH", model_path)
    monkeypatch.setattr(cfg_module.Config, "VECTORIZER_PATH", vectorizer_path)

    import ml.train_model as train_module

    original_read_csv = pd.read_csv

    def patched_read_csv(path, **kwargs):
        if "complaints.csv" in str(path):
            return pd.DataFrame(_SAMPLE_DATA)
        return original_read_csv(path, **kwargs)

    monkeypatch.setattr("ml.train_model.pd.read_csv", patched_read_csv)

    train_module.train_model()

    # Load and validate model
    with open(model_path, "rb") as f:
        loaded_model = pickle.load(f)
    assert hasattr(loaded_model, "predict"), "Loaded model must have a predict method"

    # Load and validate vectorizer
    with open(vectorizer_path, "rb") as f:
        loaded_vectorizer = pickle.load(f)
    assert hasattr(loaded_vectorizer, "transform"), "Loaded vectorizer must have a transform method"
