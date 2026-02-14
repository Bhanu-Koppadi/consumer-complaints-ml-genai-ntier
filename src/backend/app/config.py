"""Configuration management for Consumer Complaints Classification System.

Uses pydantic-settings to load environment variables with validation.
All secrets must be provided via environment variables.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables.

    Attributes:
        jwt_secret_key: Secret key for JWT token signing
        jwt_algorithm: Algorithm for JWT encoding (default: HS256)
        jwt_access_token_expire_minutes: Token expiration time in minutes
        database_url: PostgreSQL connection string
    """

    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 30
    database_url: str = "postgresql://postgres:postgres@localhost:5432/consumer_complaints"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )


# Global settings instance
settings = Settings()
