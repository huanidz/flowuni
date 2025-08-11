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

    # Helper fields
    allow_incoming_edges: bool = True
    allow_multiple_incoming_edges: bool = False

    # Tool related
    enable_for_tool: bool = False

    @field_validator("type")
    @classmethod
    def validate_type(cls, v):
        # Check if it's a class (type object) rather than an instance
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
            # New validation: reject classes, require instances
            raise ValueError(
                f"Class {v.__name__} is not allowed for 'type' field. "
                f"Please provide an instance of the class instead (e.g., {v.__name__}()\
                instead of {v.__name__})"
            )

        # If it's not a type (class), it should be an instance
        # We can add additional validation here if needed
        return v
