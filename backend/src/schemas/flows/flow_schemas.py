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
    is_active: bool = Field(..., description="Flow status")


class Pagination(BaseModel):
    page: int = Field(..., description="Page number")
    page_size: int = Field(..., description="Number of items per page")
    total_pages: int = Field(..., description="Total number of pages")
    total_items: int = Field(..., description="Total number of items")


class GetFlowResponse(BaseModel):
    data: List[GetFlowResponseItem] = Field(..., description="List of flows")
    pagination: Pagination = Field(..., description="Pagination")
