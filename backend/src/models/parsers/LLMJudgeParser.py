from typing import Optional

from pydantic import BaseModel, Field
from src.models.parsers.LLMProviderParser import LLMProviderParser


class LLMJudgeRuleParser(BaseModel):
    """Request schema for updating an LLM judge template"""

    name: Optional[str] = Field(None, description="Name of the LLM judge template")
    description: Optional[str] = Field(
        None, description="Description of the LLM judge template"
    )
    llm_provider: Optional[LLMProviderParser] = Field(
        None, description="LLM provider configuration"
    )
    instruction: Optional[str] = Field(None, description="LLM provider configuration")
