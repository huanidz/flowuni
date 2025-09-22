from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class CreateLLMJudgeRequest(BaseModel):
    """Request schema for creating a new LLM judge template"""

    name: Optional[str] = Field(None, description="Name of the LLM judge template")
    description: Optional[str] = Field(
        None, description="Description of the LLM judge template"
    )
    data: Optional[Dict[str, Any]] = Field(
        None, description="LLM judge configuration data"
    )


class UpdateLLMJudgeRequest(BaseModel):
    """Request schema for updating an LLM judge template"""

    name: Optional[str] = Field(None, description="Name of the LLM judge template")
    description: Optional[str] = Field(
        None, description="Description of the LLM judge template"
    )
    data: Optional[Dict[str, Any]] = Field(
        None, description="LLM judge configuration data"
    )


class LLMJudgeResponse(BaseModel):
    """Response schema for LLM judge template operations"""

    id: int = Field(..., description="Template ID")
    user_id: int = Field(..., description="User ID who owns the template")
    type: str = Field(..., description="Type of the template")
    name: Optional[str] = Field(None, description="Name of the template")
    description: Optional[str] = Field(None, description="Description of the template")
    data: Optional[Dict[str, Any]] = Field(None, description="Template data")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last modification timestamp")


class LLMJudgeListResponse(BaseModel):
    """Response schema for listing LLM judge templates"""

    templates: List[LLMJudgeResponse] = Field(
        ..., description="List of LLM judge templates"
    )
