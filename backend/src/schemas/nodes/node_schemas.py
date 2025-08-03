from typing import Any, Dict, Optional

from pydantic import BaseModel, Field


class ResolveRequest(BaseModel):
    node_name: str
    resolver: str
    input_values: Dict[str, Any]
    parameters: Dict[str, Any] = {}


# --- Node Schemas ---


class NodeInputSchema(BaseModel):
    """Serialized schema for a node input."""

    name: str = Field(..., description="Input name")
    type_detail: Dict[str, Any] = Field(
        ..., description="Serialized input type information"
    )
    value: Optional[Any] = Field(default=None, description="Current input value")
    default: Optional[Any] = Field(default=None, description="Default input value")
    description: str = Field(default="", description="Input description")
    required: bool = Field(default=False, description="Whether input is required")


class NodeOutputSchema(BaseModel):
    """Serialized schema for a node output."""

    name: str = Field(..., description="Output name")
    type_detail: Dict[str, Any] = Field(
        ..., description="Serialized output type information"
    )
    value: Optional[Any] = Field(default=None, description="Current output value")
    default: Optional[Any] = Field(default=None, description="Default output value")
    description: str = Field(default="", description="Output description")


class NodeParameterSchema(BaseModel):
    """Serialized schema for a node parameter."""

    name: str = Field(..., description="Parameter name")
    type_detail: Dict[str, Any] = Field(
        ..., description="Serialized parameter type information"
    )
    value: Optional[Any] = Field(default=None, description="Current parameter value")
    default: Optional[Any] = Field(default=None, description="Default parameter value")
    description: str = Field(default="", description="Parameter description")
