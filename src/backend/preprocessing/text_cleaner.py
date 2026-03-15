import re

import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize

# Download necessary NLTK data (run this once or during setup).
# punkt covers NLTK ≤3.8.x (legacy pickle format); punkt_tab covers NLTK ≥3.9
# (tabular format). Both are downloaded to stay compatible across versions.
try:
    nltk.data.find("tokenizers/punkt")
except LookupError:
    nltk.download("punkt")
try:
    # NLTK 3.8.1 raises OSError instead of LookupError for point_tab path quirks;
    # catch both so punkt_tab is ensured to be present for forward compatibility.
    nltk.data.find("tokenizers/punkt_tab")
except (LookupError, OSError):
    nltk.download("punkt_tab", quiet=True)
try:
    nltk.data.find("corpora/stopwords")
except LookupError:
    nltk.download("stopwords")

# Module-level constant — built once, reused on every call to clean_text.
_STOP_WORDS = set(stopwords.words("english"))


def clean_text(text: str) -> str:
    """
    Preprocess and clean the complaint text.

    Steps:
    1. Lowercase
    2. Remove non-alphabetic characters
    3. Tokenize
    4. Remove stop words

    Args:
        text (str): Raw input text

    Returns:
        str: Cleaned text string
    """
    if not isinstance(text, str):
        return ""

    # 1. Lowercase
    text = text.lower()

    # 2. Remove punctuation and numbers (keep only letters and spaces)
    text = re.sub(r"[^a-z\s]", "", text)

    # 3. Tokenize
    tokens = word_tokenize(text)

    # 4. Remove stop words
    filtered_tokens = [word for word in tokens if word not in _STOP_WORDS]

    # Join back to string
    cleaned_text = " ".join(filtered_tokens)

    return cleaned_text
