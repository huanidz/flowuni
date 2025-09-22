from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field
from src.models.parsers.LLMJudgeParser import LLMJudgeParser


class CreateLLMJudgeRequest(BaseModel):
    """Request schema for creating a new LLM judge template"""

    name: Optional[str] = Field(None, description="Name of the LLM judge template")
    description: Optional[str] = Field(
        None, description="Description of the LLM judge template"
    )
    judge_config: Optional[LLMJudgeParser] = Field(
        None, description="LLM judge configuration"
    )


class UpdateLLMJudgeRequest(BaseModel):
    """Request schema for updating an LLM judge template"""

    name: Optional[str] = Field(None, description="Name of the LLM judge template")
    description: Optional[str] = Field(
        None, description="Description of the LLM judge template"
    )
    judge_config: Optional[LLMJudgeParser] = Field(
        None, description="LLM judge configuration"
    )


class LLMJudgeResponse(BaseModel):
    """Response schema for LLM judge template operations"""

    id: int = Field(..., description="Template ID")
    user_id: int = Field(..., description="User ID who owns the template")
    type: str = Field(..., description="Type of the template")
    name: Optional[str] = Field(None, description="Name of the template")
    description: Optional[str] = Field(None, description="Description of the template")
    judge_config: Optional[LLMJudgeParser] = Field(
        None, description="LLM judge configuration"
    )
    created_at: datetime = Field(..., description="Creation timestamp")
    modified_at: datetime = Field(..., description="Last modification timestamp")


class LLMJudgeListResponse(BaseModel):
    """Response schema for listing LLM judge templates"""

    templates: List[LLMJudgeResponse] = Field(
        ..., description="List of LLM judge templates"
    )
