"""Rule-based severity detector for consumer complaint triage.

Determines severity level (High / Medium / Low) based on keyword signals
in the complaint text. No ML model is required — keyword matching is
fast, explainable, and sufficient for academic and real-world triage use.
"""

from __future__ import annotations

import re

# ---------------------------------------------------------------------------
# Keyword tiers — ordered from most to least severe
# ---------------------------------------------------------------------------

_HIGH_KEYWORDS: frozenset[str] = frozenset(
    [
        # Safety & legal
        "fraud", "fraudulent", "scam", "cheat", "cheated", "stolen", "theft",
        "illegal", "lawsuit", "sue", "attorney", "court", "police",
        "harassment", "threat", "threatened", "abuse", "abusive",
        # Physical harm
        "injury", "injured", "hospitalized", "dangerous", "hazardous",
        "electric shock", "fire", "burn", "burned",
        # Financial severity
        "unauthorized charge", "unauthorized transaction", "identity theft",
        "data breach", "account hacked", "hacked",
        # Urgency flags
        "urgent", "emergency", "immediately", "critical", "severe",
        "unacceptable", "escalate", "escalated",
    ]
)

_MEDIUM_KEYWORDS: frozenset[str] = frozenset(
    [
        "delay", "delayed", "late", "overdue",
        "incorrect", "wrong", "error", "mistake",
        "missing", "lost", "not received", "not delivered",
        "double charged", "overcharged", "refund", "broken",
        "damaged", "defective", "not working", "malfunction",
        "rude", "unprofessional", "ignored", "no response",
        "waiting", "unresolved", "disappointed", "frustrating",
    ]
)


# ---------------------------------------------------------------------------
# Public interface
# ---------------------------------------------------------------------------

# Maps numeric priority level (1 = highest) to human label
PRIORITY_MAP: dict[str, str] = {
    "High": "P1",
    "Medium": "P2",
    "Low": "P3",
}


def detect_severity(complaint_text: str) -> dict[str, str]:
    """Analyse *complaint_text* and return severity and priority metadata.

    Args:
        complaint_text: Raw complaint string from the user.

    Returns:
        dict with keys:
            - ``severity``: ``"High"`` | ``"Medium"`` | ``"Low"``
            - ``priority``: ``"P1"`` | ``"P2"`` | ``"P3"``
            - ``severity_reason``: Short human-readable explanation.
    """
    lowered = complaint_text.lower()

    # Remove punctuation for cleaner matching
    cleaned = re.sub(r"[^\w\s]", " ", lowered)
    tokens: set[str] = set(cleaned.split())

    # Also check raw lowered text for multi-word phrases
    matched_high = [kw for kw in _HIGH_KEYWORDS if kw in lowered]
    if matched_high:
        reason = f"Detected high-severity signal(s): {', '.join(matched_high[:3])}"
        return {"severity": "High", "priority": "P1", "severity_reason": reason}

    matched_medium = [kw for kw in _MEDIUM_KEYWORDS if kw in lowered]
    if matched_medium:
        reason = f"Detected medium-severity signal(s): {', '.join(matched_medium[:3])}"
        return {"severity": "Medium", "priority": "P2", "severity_reason": reason}

    return {
        "severity": "Low",
        "priority": "P3",
        "severity_reason": "No high or medium severity signals detected.",
    }
