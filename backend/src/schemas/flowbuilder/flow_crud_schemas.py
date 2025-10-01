from typing import Any, Dict, Optional

from pydantic import BaseModel, Field


class EmptyFlowCreateResponse(BaseModel):
    """Represents the response to a successful flow creation request."""

    flow_id: str


class FlowCreateRequest(BaseModel):
    """Represents the request to create a flow with optional data."""

    name: Optional[str] = Field(None, description="Flow name")
    description: Optional[str] = Field(None, description="Flow description")
    flow_definition: Optional[Dict[str, Any]] = Field(
        None, description="Flow definition"
    )

    model_config = {"extra": "allow"}


class FlowCreateResponse(BaseModel):
    """Represents the response to a successful flow creation request with data."""

    flow_id: str
    name: str
    description: str
    is_active: bool
    flow_definition: Optional[Dict[str, Any]] = None
