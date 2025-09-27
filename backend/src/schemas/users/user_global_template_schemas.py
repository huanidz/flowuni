from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field
from src.models.parsers.LLMProviderParser import LLMProviderParser


class CreateLLMJudgeRequest(BaseModel):
    """Request schema for creating a new LLM judge template"""

    name: Optional[str] = Field(None, description="Name of the LLM judge template")
    description: Optional[str] = Field(
        None, description="Description of the LLM judge template"
    )
    data: Optional[LLMProviderParser] = Field(
        None, description="LLM provider configuration"
    )


class UpdateLLMJudgeRequest(BaseModel):
    """Request schema for updating an LLM judge template"""

    name: Optional[str] = Field(None, description="Name of the LLM judge template")
    description: Optional[str] = Field(
        None, description="Description of the LLM judge template"
    )
    data: Optional[LLMProviderParser] = Field(
        None, description="LLM provider configuration"
    )


class LLMJudgeResponse(BaseModel):
    """Response schema for LLM judge template operations"""

    id: int = Field(..., description="Template ID")
    user_id: int = Field(..., description="User ID who owns the template")
    type: str = Field(..., description="Type of the template")
    name: Optional[str] = Field(None, description="Name of the template")
    description: Optional[str] = Field(None, description="Description of the template")
    data: Optional[LLMProviderParser] = Field(
        None, description="LLM provider configuration"
    )
    created_at: datetime = Field(..., description="Creation timestamp")
    modified_at: datetime = Field(..., description="Last modification timestamp")


class LLMJudgeListResponse(BaseModel):
    """Response schema for listing LLM judge templates"""

    templates: List[LLMJudgeResponse] = Field(
        ..., description="List of LLM judge templates"
    )


class LLMProviderConfigItemResponse(BaseModel):
    """Response schema for LLM provider configuration item"""

    provider_name: str = Field(..., description="Name of the LLM provider")
    type: str = Field(..., description="Type of the provider (predefined or http)")
    predefined_models: List[str] = Field(
        default=[], description="List of predefined models for the provider"
    )
    http_url: str = Field(default="", description="HTTP URL for fetching models")
    response_path: str = Field(
        default="", description="JSONPath to extract model IDs from HTTP response"
    )


class LLMSupportConfigResponse(BaseModel):
    """Response schema for LLM support configuration"""

    supported_providers: List[LLMProviderConfigItemResponse] = Field(
        ..., description="List of supported LLM providers"
    )
