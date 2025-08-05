# backend/schemas/resolvers.py (FastAPI)
from typing import Any, Optional, Type

from pydantic import BaseModel, Field


class BaseResolver(BaseModel):
    # === MANDATORY FIELDS ===
    type: Type[Any] = Field(
        ...,
        description="Discriminator field - determines resolver handler",
        example="http",
    )

    cache_ttl: Optional[int] = Field(
        default=300,  # 5 minutes default
        ge=0,
        description="Cache duration in seconds (0 = no cache)",
        example=60,
    )

    timeout: int = Field(
        default=10000,  # 10 seconds
        ge=1000,
        description="Max execution time in milliseconds",
        example=5000,
    )

    # === ERROR HANDLING ===
    error_message: Optional[str] = Field(
        default="Failed to load options",
        description="User-friendly error message when resolver fails",
        example="Invalid API key - please check your credentials",
    )
