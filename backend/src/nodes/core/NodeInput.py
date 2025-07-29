from typing import Any, Optional, Type

from pydantic import BaseModel, Field


class NodeInput(BaseModel):
    """Specification for a node input with validation and metadata."""

    name: str = Field(..., description="Input name")
    type: Type = Field(..., description="Expected input type")
    value: Optional[Any] = Field(default=None, description="Current input value")
    default: Optional[Any] = Field(default=None, description="Default input value")
    description: str = Field(default="", description="Input description")
    required: bool = Field(default=False, description="Whether input is required")
