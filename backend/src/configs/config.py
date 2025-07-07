from typing import Optional

from pydantic_settings import BaseSettings
from functools import lru_cache

from pydantic import Field, field_validator
import os
        
class Settings(BaseSettings):
    """Configuration settings for the application."""

    # Application settings
    APP_NAME: str = "MyFastAPI"
    DEBUG: bool = False
    VERSION: str = "1.0.0"

    # Environment configuration
    ENVIRONMENT: str = Field(default="development")

    # Database configuration
    DATABASE_URL: str

    # Logging configuration
    LOG_DIR: str
    LOG_FILENAME: str
    LOG_LEVEL: str
    LOG_BACKTRACE: bool

    # Backend node catalog path
    BACKEND_GENERATED_NODE_CATALOG_JSON_PATH: str
    
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
def get_settings() -> Settings:
    """Get the application settings."""
    return Settings()