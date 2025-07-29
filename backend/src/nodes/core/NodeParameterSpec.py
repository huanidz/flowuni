from typing import Any, Type

from pydantic import BaseModel, Field


class ParameterSpec(BaseModel):
    """Specification for a node parameter with type, default value, and description."""

    name: str = Field(..., description="Parameter name")
    type: Type = Field(..., description="Expected parameter type")
    value: Any = Field(..., description="Current parameter value")
    default: Any = Field(..., description="Default parameter value")
    description: str = Field(default="", description="Parameter description")
