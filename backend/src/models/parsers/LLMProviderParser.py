from pydantic import BaseModel, Field


class LLMProviderParser(BaseModel):
    provider: str = Field(..., description="The LLM provider name.")
    model: str = Field(..., description="The LLM model name.")
    api_key: str = Field(..., description="The API key for the LLM provider.")
