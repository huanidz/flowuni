from abc import ABC, abstractmethod
from typing import List, Literal, Optional, TypedDict, Union

from pydantic import BaseModel


class ChatMessage(TypedDict):
    role: str = Literal["system", "user", "assistant"]
    content: str


class UsageMetrics(TypedDict, total=False):
    """Represents the token usage for a request."""

    prompt_tokens: int
    completion_tokens: int
    total_tokens: int


class ChatResponse(TypedDict):
    """Represents the complete response from a non-streaming chat request."""

    content: str
    usage: UsageMetrics


class GenerationParams(TypedDict, total=False):
    """Represents the parameters for a generation request."""

    temperature: float = 0.7
    top_k: int = 40
    top_p: float = 0.95
    max_tokens: int = 512
    presence_penalty: float = 0.0
    frequency_penalty: float = 1.1


class LLMResponse(BaseModel):
    """Represents the response from a non-streaming chat request."""

    response: str


# === LLMAdapterBase ===


class LLMAdapterBase(ABC):
    @abstractmethod
    def __init__(
        self, model: str, system_prompt: str = "", api_key: Optional[str] = None
    ) -> None:
        pass

    @abstractmethod
    def chat_completion(
        self,
        messages: Union[List[ChatMessage], str],
        stream: bool = False,
        generation_parameters: GenerationParams = {},
    ) -> ChatResponse:
        pass
