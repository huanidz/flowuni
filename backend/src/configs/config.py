from functools import lru_cache

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Configuration settings for the application."""

    # Application settings
    APP_NAME: str = "Flowuni"
    DEBUG: bool = False
    VERSION: str = "0.0.1"

    # Environment configuration
    ENVIRONMENT: str = Field(default="development")

    # Database configuration
    DATABASE_URL: str
    ASYNC_DATABASE_URL: str

    # QUERY TIMEOUT
    QUERY_TIMEOUT: int = 30  # In seconds

    AUTH_SECRET: str

    REDIS_HOST: str
    REDIS_PORT: str
    REDIS_DB: str

    # Logging configuration
    LOG_DIR: str
    LOG_FILENAME: str
    LOG_LEVEL: str
    LOG_BACKTRACE: bool

    # Backend node catalog path
    BACKEND_GENERATED_NODE_CATALOG_JSON_PATH: str

    # Celery configuration
    CELERY_BROKER_URL: str
    CELERY_RESULT_BACKEND: str

    CELERY_MAX_RETRIES: int = 5
    CELERY_RETRY_DELAY: int = 3
    CELERY_RETRY_BACKOFF_MAX: int = 60
    CELERY_RETRY_BACKOFF: bool = True
    CELERY_RETRY_JITTER: bool = True

    LIMIT_TEST_CASE_PER_USER: int = 3
    LIMIT_TTL_TEST_CASE_SEMAPHORE_PER_USER_SECONDS: int = 60

    # Websocket
    WEBSOCKET_HEARTBEAT_SECONDS: int = 30
    WEBSOCKET_TIMEOUT_SECONDS: int = 30

    @field_validator("ENVIRONMENT")
    def validate_environment(cls, v: str) -> str:
        """Validate that the environment is valid."""
        allowed = ["development", "testing", "production"]
        if v not in allowed:
            raise ValueError(f"Environment must be one of {allowed}")
        return v

    class Config:
        """Pydantic configuration for environment variables."""

        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True
        extra = "allow"

    @property
    def is_development(self) -> bool:
        """Check if the current environment is development."""
        return self.ENVIRONMENT == "development"

    @property
    def is_production(self) -> bool:
        """Check if the current environment is production."""
        return self.ENVIRONMENT == "production"


@lru_cache()
def get_app_settings() -> Settings:
    """Get the application settings."""
    return Settings()
