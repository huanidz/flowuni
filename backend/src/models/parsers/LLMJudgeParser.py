from typing import Optional

from pydantic import BaseModel, Field
from src.models.parsers.LLMProviderParser import LLMProviderParser


class LLMJudgeParser(BaseModel):
    judge_name: str = Field(..., description="The name of the LLM judge.")
    judge_description: Optional[str] = Field(
        None, description="The description of the LLM judge."
    )
    judge_llm_provider: LLMProviderParser = Field(
        ..., description="The LLM provider configuration for the judge."
    )
