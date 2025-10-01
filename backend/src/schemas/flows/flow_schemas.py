from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class GetFlowRequest(BaseModel):
    user_id: int = Field(..., description="User ID")
    page: int = Field(1, description="Page number")
    per_page: int = Field(10, description="Number of items per page")


class GetFlowResponseItem(BaseModel):
    flow_id: str = Field(..., description="Flow ID")
    name: str = Field(..., description="Flow name")
    description: str = Field("", description="Flow description")
    is_active: bool = Field(..., description="Flow status")
    created_at: datetime = Field(..., description="Flow creation date")


class Pagination(BaseModel):
    page: int = Field(..., description="Page number")
    page_size: int = Field(..., description="Number of items per page")
    total_pages: int = Field(..., description="Total number of pages")
    total_items: int = Field(..., description="Total number of items")


class GetFlowResponse(BaseModel):
    data: List[GetFlowResponseItem] = Field(..., description="List of flows")
    pagination: Pagination = Field(..., description="Pagination")


class GetFlowDetailResponse(BaseModel):
    flow_id: str = Field(..., description="Flow ID")
    name: str = Field(..., description="Flow name")
    description: str = Field("", description="Flow description")
    is_active: bool = Field(..., description="Flow status")
    flow_definition: Optional[Dict] = Field({}, description="Flow definition")


# --- Patching ---


class FlowPatchRequest(BaseModel):
    flow_id: str = Field(..., description="Flow ID")
    name: str = Field("", description="Flow name")
    description: str = Field("", description="Flow description")
    is_active: bool = Field(..., description="Flow status")
    flow_definition: Optional[Dict] = Field({}, description="Flow definition")


class FlowPatchResponse(BaseModel):
    flow_id: str = Field(..., description="Flow ID")
    name: str = Field(..., description="Flow name")
    description: str = Field("", description="Flow description")
    is_active: bool = Field(..., description="Flow status")
    flow_definition: Optional[Dict] = Field({}, description="Flow definition")


# --- Flow Activation/Deactivation ---


class FlowActivationRequest(BaseModel):
    flow_id: str = Field(..., description="Flow ID")
    is_active: bool = Field(..., description="Flow activation status")


class FlowActivationResponse(BaseModel):
    flow_id: str = Field(..., description="Flow ID")
    name: str = Field(..., description="Flow name")
    description: str = Field("", description="Flow description")
    is_active: bool = Field(..., description="Flow status")


# --- Flow Run ---


class FlowRunResult(BaseModel):
    """
    Represents the result of a flow execution run, including summary
    statistics about the run and detailed node-level results.
    """

    success: bool = Field(
        ..., description="Indicates whether the overall flow execution was successful."
    )
    total_nodes: int = Field(..., description="The total number of nodes in the flow.")
    completed_nodes: int = Field(
        ..., description="The number of nodes that successfully completed execution."
    )
    total_layers: int = Field(
        ..., description="The number of layers in the flow execution graph."
    )
    execution_time: float = Field(
        ..., description="Total execution time for the entire flow (in seconds)."
    )
    results: List[Dict[str, Any]] = Field(
        ...,
        description="A list of results for each executed node, including input/output values, parameters, and status.",  # noqa E501
    )

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "total_nodes": 1,
                "completed_nodes": 1,
                "total_layers": 1,
                "execution_time": 1.0015873908996582,
                "results": [
                    {
                        "node_id": "node_String Transform_1756117047108",
                        "success": True,
                        "data": {
                            "label": "String Transform",
                            "node_type": "String Transform",
                            "input_values": {"input": "sample_value"},
                            "output_values": {"output": "SAMPLE_VALUE"},
                            "parameter_values": {},
                            "mode": "NormalMode",
                            "tool_configs": {
                                "tool_name": None,
                                "tool_description": None,
                            },
                        },
                        "error": None,
                        "execution_time": 1.000974416732788,
                    }
                ],
            }
        }
