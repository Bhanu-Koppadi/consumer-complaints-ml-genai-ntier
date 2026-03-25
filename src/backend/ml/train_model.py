"""
train_model.py — Training pipeline for the consumer complaints classifier.

Loads labelled complaint data (or generates a small sample dataset when none
is present), applies TF-IDF vectorisation, trains a Logistic Regression
multi-class classifier, and serialises both the model and the vectorizer to
disk as pickle artefacts consumed by :py:mod:`ml.predictor` at inference time.

Offline training pattern
------------------------
Run this module directly to (re-)train the model::

    python ml/train_model.py

Artefact paths are controlled via :py:class:`config.Config`:

- ``ML_MODEL_PATH`` — destination for the serialised classifier.
- ``VECTORIZER_PATH`` — destination for the serialised TF-IDF vectorizer.
"""

import logging
import pickle
from pathlib import Path

import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report
from sklearn.model_selection import train_test_split

from config import Config
from preprocessing.text_cleaner import clean_text

logger = logging.getLogger(__name__)

#: Maximum vocabulary size for TF-IDF feature extraction.
TFIDF_MAX_FEATURES = 10000


def train_model() -> None:
    """Train the consumer complaints classification model and save artefacts.

    Loads the raw dataset from ``dataset/raw/complaints.csv`` relative to this
    file's location (creating a small sample dataset when absent), preprocesses
    the text, trains a TF-IDF + Logistic Regression classifier, prints an
    evaluation report, and serialises both the model and the vectorizer to disk.

    Side effects:
        - Creates ``dataset/raw/complaints.csv`` if it does not exist.
        - Writes pickle files to the paths configured in :py:class:`config.Config`.
    """
    logger.info("Starting model training process...")

    # 1. Load Dataset — path anchored to this file's location, not CWD
    dataset_path = Path(__file__).resolve().parent.parent / "dataset" / "raw" / "complaints.csv"

    if not dataset_path.exists():
        logger.info("Dataset not found at %s. Creating sample data...", dataset_path)
        data = {
            "complaint_text": [
                "I was charged twice for the same transaction.",
                "The product arrived damaged and broken.",
                "Customer service was rude and unhelpful.",
                "Delivery was delayed by two weeks.",
                "My bill is incorrect and shows extra fees.",
                "The screen on my new phone is cracked.",
                "No one answered my support call for an hour.",
                "Package was left in rain and got wet.",
            ],
            "category": [
                "Billing Issue",
                "Product Defect",
                "Customer Support",
                "Delivery Problem",
                "Billing Issue",
                "Product Defect",
                "Customer Support",
                "Delivery Problem",
            ],
        }
        df = pd.DataFrame(data)
        dataset_path.parent.mkdir(parents=True, exist_ok=True)
        df.to_csv(dataset_path, index=False)
    else:
        df = pd.read_csv(dataset_path)

    if "complaint_text" not in df.columns or "category" not in df.columns:
        raise ValueError("Dataset must contain 'complaint_text' and 'category' columns.")

    logger.info("Loaded %d records.", len(df))

    # 2. Preprocess Data
    logger.info("Preprocessing text...")
    df["cleaned_text"] = df["complaint_text"].apply(clean_text)

    # 3. Feature Extraction (TF-IDF with bigrams for better context)
    logger.info("Vectorizing text...")
    # Dynamically lower min_df if training dataset is very small (e.g. during testing)
    min_df_val = 2 if len(df) > 10 else 1

    vectorizer = TfidfVectorizer(
        max_features=TFIDF_MAX_FEATURES,
        ngram_range=(1, 2),   # unigrams + bigrams capture phrases like "not delivered"
        sublinear_tf=True,    # apply log normalization to reduce impact of very common terms
        min_df=min_df_val,    # ignore terms that appear in fewer than min_df documents
        max_df=0.95,          # ignore terms that appear in more than 95% of documents
    )
    X = vectorizer.fit_transform(df["cleaned_text"])
    y = df["category"]

    # 4. Train-Test Split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # 5. Model Training (Logistic Regression with tuned regularisation)
    logger.info("Training model...")
    model = LogisticRegression(
        solver="lbfgs",
        max_iter=2000,
        C=5.0,       # higher C = less regularisation = fits data more tightly
        class_weight="balanced",  # handles any remaining class imbalance
        multi_class="multinomial",
    )
    model.fit(X_train, y_train)

    # 6. Evaluation
    y_pred = model.predict(X_test)
    logger.info("Model Evaluation:\n%s", classification_report(y_test, y_pred))

    # 7. Save Artifacts
    logger.info("Saving model and vectorizer...")
    model_path = Path(Config.ML_MODEL_PATH)
    vec_path = Path(Config.VECTORIZER_PATH)
    model_path.parent.mkdir(parents=True, exist_ok=True)
    vec_path.parent.mkdir(parents=True, exist_ok=True)

    with open(model_path, "wb") as f:
        pickle.dump(model, f)

    with open(vec_path, "wb") as f:
        pickle.dump(vectorizer, f)

    logger.info("Training complete. Artifacts saved to %s and %s.", model_path, vec_path)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
    train_model()
