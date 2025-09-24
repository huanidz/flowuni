from typing import Optional

from pydantic import BaseModel, Field


class LLMProviderParser(BaseModel):
    provider: Optional[str] = Field(None, description="The LLM provider name.")
    model: Optional[str] = Field(None, description="The LLM model name.")
    api_key: Optional[str] = Field(
        None, description="The API key for the LLM provider."
    )
    system_prompt: Optional[str] = Field(None, description="System prompt")
    temperature: Optional[float] = Field(
        default=0.0, description="The temperature of the model."
    )
    max_output_tokens: Optional[int] = Field(
        default=1024, description="The max output tokens"
    )
