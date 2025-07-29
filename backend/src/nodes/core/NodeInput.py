from typing import Any, Optional, Type, Union

from pydantic import BaseModel, Field


class NodeInput(BaseModel):
    """Specification for a node input with validation and metadata."""

    name: str = Field(..., description="Input name")
    type: Union[Type[Any], BaseModel] = Field(
        ..., description="Input handle class or configured instance"
    )
    value: Optional[Any] = Field(default=None, description="Current input value")
    default: Optional[Any] = Field(default=None, description="Default input value")
    description: str = Field(default="", description="Input description")
    required: bool = Field(default=False, description="Whether input is required")
