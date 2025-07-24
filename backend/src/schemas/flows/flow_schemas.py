from typing import List

from pydantic import BaseModel, Field


class GetFlowRequest(BaseModel):
    user_id: int = Field(..., description="User ID")
    page: int = Field(1, description="Page number")
    per_page: int = Field(10, description="Number of items per page")


class GetFlowResponseItem(BaseModel):
    flow_id: str = Field(..., description="Flow ID")
    name: str = Field(..., description="Flow name")
    description: str = Field("", description="Flow description")
    is_active: str = Field("active", description="Flow status")


class GetFlowResponse(BaseModel):
    data: List[GetFlowResponseItem] = Field(..., description="List of flows")
