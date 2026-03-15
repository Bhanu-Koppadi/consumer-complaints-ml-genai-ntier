import logging
import os
from datetime import timedelta
from pathlib import Path

from dotenv import load_dotenv

# Load .env from this package directory (src/backend) when present
_env_dir = Path(__file__).resolve().parent
load_dotenv(dotenv_path=_env_dir / ".env")

_log = logging.getLogger(__name__)


class Config:
    # Database Configuration
    DATABASE_URL = os.environ.get("DATABASE_URL") or "postgresql://postgres:postgres@localhost:5432/consumer_complaints"

    # GenAI Configuration
    GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
    GEMINI_MODEL = os.environ.get("GEMINI_MODEL") or "gemini-1.5-flash"

    # ML Model Configuration
    ML_MODEL_PATH = os.environ.get("ML_MODEL_PATH") or "models/complaint_classifier.pkl"
    VECTORIZER_PATH = os.environ.get("VECTORIZER_PATH") or "models/tfidf_vectorizer.pkl"
    USE_TRANSFORMER_MODEL: bool = os.environ.get("USE_TRANSFORMER_MODEL", "false").lower() == "true"

    # Application Configuration
    SECRET_KEY = os.environ.get("SECRET_KEY") or "dev-secret-key"
    DEBUG = os.environ.get("FLASK_DEBUG", "0") == "1"

    # JWT Configuration
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY") or "jwt-dev-secret-key"
    JWT_ALGORITHM = "HS256"
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)

    # CORS — comma-separated list of allowed origins; defaults to localhost dev server.
    # Falls back to the localhost origin when the env var is absent or contains only whitespace.
    _raw_origins = [o.strip() for o in os.environ.get("ALLOWED_ORIGINS", "").split(",") if o.strip()]
    ALLOWED_ORIGINS: list = _raw_origins if _raw_origins else ["http://localhost:5173"]

    @classmethod
    def warn_insecure_defaults(cls) -> None:
        """Emit warnings (or raise in production) when sensitive keys use dev fallbacks."""
        insecure_keys = []
        if not os.environ.get("JWT_SECRET_KEY"):
            insecure_keys.append("JWT_SECRET_KEY")
        if not os.environ.get("SECRET_KEY"):
            insecure_keys.append("SECRET_KEY")

        if insecure_keys:
            flask_env = os.environ.get("FLASK_ENV", "development").lower()
            if flask_env == "production":
                # Hard fail: insecure defaults must not reach production.
                raise RuntimeError(
                    "SECURITY WARNING: The following keys are using insecure dev fallbacks: %s. "
                    "Set these environment variables before deploying to production." % ", ".join(insecure_keys)
                )
            _log.warning(
                "SECURITY WARNING: The following keys are using insecure dev fallbacks: %s. "
                "Set these environment variables before deploying to production.",
                ", ".join(insecure_keys),
            )

    # Rate limiting
    RATELIMIT_STORAGE_URI = os.environ.get("RATELIMIT_STORAGE_URI") or "memory://"
    RATELIMIT_ENABLED = True

    # Default users (development only — do not enable in production)
    CREATE_DEFAULT_USERS = os.environ.get("CREATE_DEFAULT_USERS", "false").lower() in ("true", "1", "yes")
    DEFAULT_ADMIN_USERNAME = os.environ.get("DEFAULT_ADMIN_USERNAME", "admin")
    DEFAULT_ADMIN_PASSWORD = os.environ.get("DEFAULT_ADMIN_PASSWORD", "")
    DEFAULT_ADMIN_EMAIL = os.environ.get("DEFAULT_ADMIN_EMAIL", "admin@localhost")
    DEFAULT_USER_USERNAME = os.environ.get("DEFAULT_USER_USERNAME", "user")
    DEFAULT_USER_PASSWORD = os.environ.get("DEFAULT_USER_PASSWORD", "")
    DEFAULT_USER_EMAIL = os.environ.get("DEFAULT_USER_EMAIL", "user@localhost")

    # Predefined Complaint Categories
    COMPLAINT_CATEGORIES = [
        "Billing Issue",
        "Service Quality",
        "Delivery Problem",
        "Product Defect",
        "Customer Support",
        "Other",
    ]
