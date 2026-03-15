import logging
import os
import pickle

from config import Config
from preprocessing.text_cleaner import clean_text

logger = logging.getLogger(__name__)


class ComplaintPredictor:
    def __init__(self):
        self.model = None
        self.vectorizer = None
        self._load_artifacts()

    def _load_artifacts(self):
        """Load the trained ML model and vectorizer."""
        try:
            if os.path.exists(Config.ML_MODEL_PATH) and os.path.exists(Config.VECTORIZER_PATH):
                with open(Config.ML_MODEL_PATH, "rb") as f:
                    self.model = pickle.load(f)
                with open(Config.VECTORIZER_PATH, "rb") as f:
                    self.vectorizer = pickle.load(f)
                logger.info("ML artifacts loaded successfully.")
            else:
                logger.warning("ML artifacts not found. Run train_model.py to generate them.")
        except (OSError, pickle.UnpicklingError) as e:
            logger.error("Error loading ML artifacts: %s", e)

    def predict(self, text: str):
        """
        Predict the category of a consumer complaint.

        Args:
            text (str): Complaint text

        Returns:
            dict: { 'category': str, 'confidence': float }
        """
        if self.model is None or self.vectorizer is None:
            raise RuntimeError("ML artifacts not loaded. Run train_model.py first.")

        # 1. Clean Text
        cleaned = clean_text(text)

        # 2. Vectorize
        vectorized = self.vectorizer.transform([cleaned])

        # 3. Predict Category
        prediction = self.model.predict(vectorized)[0]

        # 4. Get Confidence Score
        probabilities = self.model.predict_proba(vectorized)[0]
        confidence = max(probabilities)

        return {"category": prediction, "confidence": float(round(confidence, 4))}


# Singleton instance
predictor = ComplaintPredictor()

# Transformer predictor is instantiated lazily only when USE_TRANSFORMER_MODEL is True
_transformer_predictor = None


def predict_complaint(text: str) -> dict:
    """Route a complaint text to the appropriate prediction backend.

    When :py:attr:`config.Config.USE_TRANSFORMER_MODEL` is ``True`` the
    request is forwarded to :py:class:`ml.transformer_predictor.TransformerPredictor`;
    otherwise the traditional TF-IDF + Logistic Regression path is used.

    Args:
        text: Raw complaint text submitted by the consumer.

    Returns:
        dict: ``{ 'category': str, 'confidence': float }``
    """
    global _transformer_predictor
    if Config.USE_TRANSFORMER_MODEL:
        if _transformer_predictor is None:
            from ml.transformer_predictor import TransformerPredictor  # deferred: optional heavy dep

            _transformer_predictor = TransformerPredictor()
        return _transformer_predictor.predict(text)
    return predictor.predict(text)
