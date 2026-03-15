"""
transformer_predictor.py — MiniLM-based zero-shot complaint classifier.

Uses the HuggingFace ``transformers`` zero-shot classification pipeline backed by
``cross-encoder/nli-MiniLM2-L6-H768``.  The pipeline is loaded lazily on the
first call to :py:meth:`TransformerPredictor.predict` to keep application
startup fast.

If the ``transformers`` package is not installed the module still imports
successfully; the class simply raises :py:class:`RuntimeError` at prediction
time rather than at import time.

Predicted categories are always drawn from
:py:attr:`config.Config.COMPLAINT_CATEGORIES`.
"""

from __future__ import annotations

import logging
from typing import Any

from config import Config

# Guard against missing optional dependency — the app must start normally even
# when ``transformers`` / ``torch`` are not installed.
try:
    from transformers import pipeline as hf_pipeline  # type: ignore

    _TRANSFORMERS_AVAILABLE = True
except ImportError:  # pragma: no cover
    _TRANSFORMERS_AVAILABLE = False


#: HuggingFace model identifier used for zero-shot NLI inference.
_MODEL_ID = "cross-encoder/nli-MiniLM2-L6-H768"

logger = logging.getLogger(__name__)


class TransformerPredictor:
    """Zero-shot complaint classifier powered by a HuggingFace NLI model.

    The underlying :func:`transformers.pipeline` is created lazily on the
    first invocation of :py:meth:`predict` so that the application starts
    quickly even on resource-constrained environments.

    Example:
        >>> predictor = TransformerPredictor()
        >>> result = predictor.predict("I was charged twice for the same item.")
        >>> assert "category" in result and "confidence" in result
    """

    def __init__(self) -> None:
        self._pipe: Any | None = None

    def _load_pipeline(self) -> None:
        """Initialise the zero-shot classification pipeline (CPU-only).

        Raises:
            RuntimeError: If the ``transformers`` package is not installed.
        """
        if not _TRANSFORMERS_AVAILABLE:
            raise RuntimeError(
                "The 'transformers' package is required for TransformerPredictor. "
                "Install it with: pip install transformers torch"
            )
        if self._pipe is None:
            logger.info("Loading transformer pipeline (model=%s) — this may take a moment.", _MODEL_ID)
            self._pipe = hf_pipeline(
                "zero-shot-classification",
                model=_MODEL_ID,
                device=-1,  # Force CPU inference
            )
            logger.info("Transformer pipeline loaded successfully.")

    def predict(self, text: str) -> dict[str, Any]:
        """Classify a consumer complaint using zero-shot NLI inference.

        The predicted category is always one of the labels defined in
        :py:attr:`config.Config.COMPLAINT_CATEGORIES`.  Confidence is
        normalised to a Python :class:`float` rounded to four decimal places.

        Args:
            text: Raw complaint text submitted by the consumer.

        Returns:
            A dictionary with two keys:

            - ``category`` (:class:`str`): Predicted complaint category.
            - ``confidence`` (:class:`float`): Probability estimate in
              ``[0.0, 1.0]`` rounded to four decimal places.

        Raises:
            RuntimeError: If ``transformers`` is not installed.
        """
        self._load_pipeline()

        candidate_labels = Config.COMPLAINT_CATEGORIES
        output = self._pipe(text, candidate_labels=candidate_labels)

        # ``output["labels"]`` are sorted by descending score; index 0 is best.
        category: str = output["labels"][0]
        confidence: float = float(round(output["scores"][0], 4))

        return {"category": category, "confidence": confidence}
