from typing import Any, Optional, Type, Union

from pydantic import BaseModel, Field


class NodeOutput(BaseModel):
    """Specification for a node output with type information and metadata."""

    name: str = Field(..., description="Output name")
    type: Union[Type[Any], BaseModel] = Field(..., description="Expected output type")
    value: Optional[Any] = Field(default=None, description="Current output value")
    default: Optional[Any] = Field(default=None, description="Default output value")
    description: str = Field(default="", description="Output description")

    # Enable for tool
    enable_for_tool: bool = Field(default=False, description="Enable for tool")
