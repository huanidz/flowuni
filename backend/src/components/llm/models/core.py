from typing import Literal

from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    """Represents a chat message with role and content."""

    role: Literal["system", "user", "assistant", "model"] = Field(
        ...,
        description="The role of the message sender. Normally ('user', 'assistant', 'system' are common used, but for things like Google, 'model' is used instead of 'assistant')",  # noqa
    )
    content: str = Field(..., description="The content of the message")


class UsageMetrics(BaseModel):
    """Represents the token usage for a request."""

    prompt_tokens: int | None = Field(
        None, description="Number of tokens in the prompt"
    )
    completion_tokens: int | None = Field(
        None, description="Number of tokens in the completion"
    )
    total_tokens: int | None = Field(None, description="Total number of tokens")


class ChatResponse(BaseModel):
    """Represents the complete response from a non-streaming chat request."""

    content: str = Field(..., description="The generated content")
    # usage: UsageMetrics = Field(..., description="Token usage metrics")


class GenerationParams(BaseModel):
    """Represents the parameters for a generation request."""

    temperature: float = Field(0.7, ge=0.0, le=2.0, description="Sampling temperature")
    top_k: int = Field(40, ge=0, description="Number of top tokens to consider")
    top_p: float = Field(
        0.95, ge=0.0, le=1.0, description="Nucleus sampling probability"
    )
    max_tokens: int = Field(
        512, ge=1, description="Maximum number of tokens to generate"
    )
    presence_penalty: float = Field(
        0.0, ge=-2.0, le=2.0, description="Presence penalty"
    )
    frequency_penalty: float = Field(
        1.1, ge=-2.0, le=2.0, description="Frequency penalty"
    )


class LLMResponse(BaseModel):
    """Represents the response from a non-streaming chat request."""

    response: str = Field(..., description="The generated response")
