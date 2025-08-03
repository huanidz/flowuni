from typing import Any, Optional, Type, Union

from pydantic import BaseModel, Field, field_validator


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

    @field_validator("type")
    @classmethod
    def validate_type(cls, v):
        if isinstance(v, type):
            # List of primitive Python types to block
            primitive_types = (str, int, float, bool, list, dict, tuple, set)
            if v in primitive_types:
                raise ValueError(
                    f"Primitive type {v.__name__} is not allowed for 'type' field"
                )
            # Additional check for common built-in types
            if v.__module__ == "builtins":
                raise ValueError(
                    f"Builtin type {v.__name__} is not allowed for 'type' field"
                )
        return v
