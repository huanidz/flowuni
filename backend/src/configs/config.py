from pydantic_settings import BaseSettings
from functools import lru_cache

from pydantic import Field, field_validator
import os
        
class Settings(BaseSettings):
    
    APP_NAME: str = "MyFastAPI"
    DEBUG: bool = False
    VERSION: str = "1.0.0"
    
    ENVIRONMENT: str = Field(default="development")
        
    DATABASE_URL: str
        
    LOG_DIR: str
    LOG_FILENAME: str
    LOG_LEVEL: str
    LOG_BACKTRACE: bool
    
    @field_validator("ENVIRONMENT")
    def validate_environment(cls, v):
        allowed = ["development", "testing", "production"]
        if v not in allowed:
            raise ValueError(f"Environment must be one of {allowed}")
        return v

    @field_validator("VERTEX_AI_SERVICE_ACCOUNT_CREDENTIALS")
    def validate_credentials_path(cls, v):
        if not os.path.exists(v):
            raise ValueError(f"Credentials file not found at: {v}")
        return v

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True
        extra = "allow"
        
    @property
    def is_development(self) -> bool:
        return self.ENVIRONMENT == "development"
    
    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"
        
@lru_cache()
def get_settings():
    return Settings()