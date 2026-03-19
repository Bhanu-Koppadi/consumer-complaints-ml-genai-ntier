"""Confidence- and severity-based decision engine for automated complaint routing.

Implements the three-tier routing logic:
  - AUTO_SEND    : High confidence + non-critical → response can be sent automatically.
  - REVIEW        : Moderate confidence or medium severity → human review recommended.
  - ESCALATE      : Low confidence OR high severity → immediate human escalation.

This module is deliberately free of ML models; all thresholds are explicit
numeric constants so they can be audited, adjusted, and documented.
"""

from __future__ import annotations

from dataclasses import dataclass

# ---------------------------------------------------------------------------
# Thresholds (tune here — kept as named constants for auditability)
# ---------------------------------------------------------------------------

#: Minimum confidence required for fully automated dispatch.
AUTO_SEND_CONFIDENCE_THRESHOLD: float = 0.85

#: Minimum confidence to avoid full escalation (review zone lower bound).
REVIEW_CONFIDENCE_THRESHOLD: float = 0.60

# ---------------------------------------------------------------------------
# Result dataclass
# ---------------------------------------------------------------------------


@dataclass(frozen=True)
class DecisionResult:
    """Immutable routing decision produced by the decision engine."""

    recommended_action: str
    """One of ``"auto_send"`` | ``"review_required"`` | ``"escalate"``."""

    auto_send_eligible: bool
    """``True`` only when action is ``auto_send``."""

    routing_reason: str
    """Human-readable explanation surfaced in the API response / admin UI."""


# ---------------------------------------------------------------------------
# Public interface
# ---------------------------------------------------------------------------

ACTION_AUTO_SEND = "auto_send"
ACTION_REVIEW = "review_required"
ACTION_ESCALATE = "escalate"


def make_decision(confidence: float, severity: str) -> DecisionResult:
    """Derive the routing action from ML confidence and severity level.

    Decision matrix:
    ┌────────────────────────────┬──────────────────────────────────────────┐
    │ Condition                  │ Action                                   │
    ├────────────────────────────┼──────────────────────────────────────────┤
    │ severity == "High"          │ ESCALATE (regardless of confidence)      │
    │ confidence >= 0.85 & !High  │ AUTO_SEND                                │
    │ 0.60 <= confidence < 0.85   │ REVIEW_REQUIRED                          │
    │ confidence < 0.60           │ ESCALATE                                 │
    └────────────────────────────┴──────────────────────────────────────────┘

    Args:
        confidence: Model probability for the predicted category (0.0–1.0).
        severity:  Severity label from :func:`ml.severity_detector.detect_severity`.

    Returns:
        :class:`DecisionResult` with action, eligibility flag, and reason.
    """
    # Rule 1: High severity always overrides confidence → escalate
    if severity == "High":
        return DecisionResult(
            recommended_action=ACTION_ESCALATE,
            auto_send_eligible=False,
            routing_reason=(
                "High-severity complaint detected. Escalating to senior support "
                "team for immediate human review regardless of model confidence."
            ),
        )

    # Rule 2: High confidence + non-critical → automated dispatch
    if confidence >= AUTO_SEND_CONFIDENCE_THRESHOLD:
        pct = round(confidence * 100, 1)
        return DecisionResult(
            recommended_action=ACTION_AUTO_SEND,
            auto_send_eligible=True,
            routing_reason=(
                f"Model confidence {pct}% exceeds auto-send threshold "
                f"({int(AUTO_SEND_CONFIDENCE_THRESHOLD * 100)}%). "
                "Severity is non-critical. Response dispatched automatically."
            ),
        )

    # Rule 3: Moderate confidence → human review
    if confidence >= REVIEW_CONFIDENCE_THRESHOLD:
        pct = round(confidence * 100, 1)
        return DecisionResult(
            recommended_action=ACTION_REVIEW,
            auto_send_eligible=False,
            routing_reason=(
                f"Model confidence {pct}% is in the review zone "
                f"({int(REVIEW_CONFIDENCE_THRESHOLD * 100)}%–"
                f"{int(AUTO_SEND_CONFIDENCE_THRESHOLD * 100)}%). "
                "Human review recommended before sending response."
            ),
        )

    # Rule 4: Low confidence → escalate
    pct = round(confidence * 100, 1)
    return DecisionResult(
        recommended_action=ACTION_ESCALATE,
        auto_send_eligible=False,
        routing_reason=(
            f"Model confidence {pct}% is below the minimum threshold "
            f"({int(REVIEW_CONFIDENCE_THRESHOLD * 100)}%). "
            "Complaint escalated for manual classification and response."
        ),
    )
