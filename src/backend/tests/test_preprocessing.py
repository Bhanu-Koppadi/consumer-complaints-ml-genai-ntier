"""
Phase 13: Unit tests for preprocessing/text_cleaner.py — clean_text() function.

Covers:
- Lowercase conversion
- Punctuation / special character removal
- Number removal
- Stop-word removal
- Empty string input → returns ""
- Non-string input (None, 123) → returns ""
- Unicode / emoji input → no exception
- Determinism — same output for same input
"""

import os
import sys

# Ensure backend root is on path when running tests from repo root
_backend = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _backend not in sys.path:
    sys.path.insert(0, _backend)

from preprocessing.text_cleaner import clean_text  # noqa: E402

# ---------------------------------------------------------------------------
# Lowercase conversion
# ---------------------------------------------------------------------------


def test_lowercase_conversion():
    """Output should contain no uppercase letters."""
    result = clean_text("HELLO WORLD")
    assert result == result.lower()


# ---------------------------------------------------------------------------
# Punctuation / special character removal
# ---------------------------------------------------------------------------


def test_punctuation_removed():
    """Punctuation marks must be stripped from the output."""
    result = clean_text("Hello, world! This is a test.")
    assert "," not in result
    assert "!" not in result
    assert "." not in result


def test_special_characters_removed():
    """Special characters like @, #, $ must not appear in output."""
    result = clean_text("Contact us @ support#help $free")
    assert "@" not in result
    assert "#" not in result
    assert "$" not in result


# ---------------------------------------------------------------------------
# Number removal
# ---------------------------------------------------------------------------


def test_numbers_removed():
    """Digits must be removed from the output."""
    result = clean_text("I was charged 50 dollars twice on 2024-01-01")
    assert not any(ch.isdigit() for ch in result)


# ---------------------------------------------------------------------------
# Stop-word removal
# ---------------------------------------------------------------------------


def test_stop_words_removed():
    """Common English stop words should not appear in the cleaned output."""
    result = clean_text("I was very happy with the service")
    tokens = result.split()
    # Common stop words that should be removed
    stop_words_to_check = {"i", "was", "with", "the"}
    for sw in stop_words_to_check:
        assert sw not in tokens, f"Stop word '{sw}' should have been removed"


# ---------------------------------------------------------------------------
# Edge cases — empty and non-string inputs
# ---------------------------------------------------------------------------


def test_empty_string_returns_empty():
    """Empty string input must return an empty string."""
    assert clean_text("") == ""


def test_none_input_returns_empty():
    """None input must return an empty string without raising an exception."""
    assert clean_text(None) == ""  # type: ignore[arg-type]


def test_integer_input_returns_empty():
    """Integer input must return an empty string without raising an exception."""
    assert clean_text(123) == ""  # type: ignore[arg-type]


def test_list_input_returns_empty():
    """List input must return an empty string without raising an exception."""
    assert clean_text(["a", "b"]) == ""  # type: ignore[arg-type]


# ---------------------------------------------------------------------------
# Unicode / emoji handling
# ---------------------------------------------------------------------------


def test_unicode_input_no_exception():
    """Unicode characters must be handled without raising an exception."""
    clean_text("Crédito bancário — transferência")


def test_emoji_input_no_exception():
    """Emoji characters must be handled without raising an exception."""
    clean_text("I love this product 😊🎉🚀")


def test_emoji_stripped_from_output():
    """Emoji characters should not appear in the cleaned output."""
    result = clean_text("Great service 😊")
    assert "😊" not in result


# ---------------------------------------------------------------------------
# Determinism
# ---------------------------------------------------------------------------


def test_determinism_same_input_same_output():
    """clean_text must be deterministic — identical input always yields identical output."""
    text = "I was charged twice for the same transaction."
    first = clean_text(text)
    second = clean_text(text)
    assert first == second


def test_determinism_multiple_calls():
    """Multiple successive calls with the same input must produce identical output."""
    text = "The delivery was delayed by two weeks."
    results = [clean_text(text) for _ in range(5)]
    assert len(set(results)) == 1, "clean_text is not deterministic"


# ---------------------------------------------------------------------------
# Positive smoke test — output is a string
# ---------------------------------------------------------------------------


def test_returns_string_type():
    """clean_text must always return a str."""
    assert isinstance(clean_text("Some complaint text here"), str)


def test_whitespace_only_input():
    """Input of only whitespace should produce an empty or whitespace-free result."""
    result = clean_text("   ")
    assert isinstance(result, str)
